/**
 * Batch Call Henderson EV Contractors
 *
 * Calls contractors from the Henderson EV outreach board.
 * Creates Call records in DB, uses Twilio adapter via callService.
 *
 * Usage:
 *   node server/scripts/batch-call-henderson.js              # Call all with phone numbers
 *   node server/scripts/batch-call-henderson.js --tier 1      # Call tier-1 only
 *   node server/scripts/batch-call-henderson.js --dry-run     # Preview without calling
 *   node server/scripts/batch-call-henderson.js --limit 3     # Call first 3 only
 *   node server/scripts/batch-call-henderson.js --delay 30    # 30s delay between calls
 */

import dotenv from 'dotenv'
dotenv.config()

import pg from 'pg'

const DATABASE_URL = (process.env.DATABASE_URL || 'postgresql://postgres:postgres_password@localhost:5433/business_hub?schema=public')
    .replace('?schema=public', '')
const USER_ID = 'cmlfn3x2z0000rfu4i9vn205w'

const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')
const tierFlag = args.indexOf('--tier') !== -1 ? args[args.indexOf('--tier') + 1] : null
const limitFlag = args.indexOf('--limit') !== -1 ? parseInt(args[args.indexOf('--limit') + 1]) : null
const delaySeconds = args.indexOf('--delay') !== -1 ? parseInt(args[args.indexOf('--delay') + 1]) : 15

async function main() {
    const client = new pg.Client({ connectionString: DATABASE_URL })
    await client.connect()

    // Get board ID
    const boardRes = await client.query(
        "SELECT id FROM \"TaskBoard\" WHERE name LIKE 'Henderson EV%' AND \"userId\" = $1 LIMIT 1",
        [USER_ID]
    )
    if (!boardRes.rows.length) {
        console.error('No Henderson EV board found')
        process.exit(1)
    }
    const boardId = boardRes.rows[0].id

    // Get call script
    const scriptRes = await client.query(
        "SELECT id, name FROM \"CallScript\" WHERE industry = 'henderson-ev-outreach' AND \"userId\" = $1 LIMIT 1",
        [USER_ID]
    )
    const scriptId = scriptRes.rows[0]?.id
    console.log(`📝 Script: ${scriptRes.rows[0]?.name || 'None'} (${scriptId})`)

    // Get leads with phone numbers
    let query = `SELECT id, name, "contactPerson", phone, status, tags
                 FROM "Lead" WHERE "linkedBoardId" = $1 AND "userId" = $2 AND phone IS NOT NULL AND phone != ''`
    const params = [boardId, USER_ID]

    if (tierFlag) {
        query += ` AND tags::text LIKE $3`
        params.push(`%tier-${tierFlag}%`)
    }

    // Skip already contacted
    query += ` AND (status IS NULL OR status IN ('new'))`
    query += ` ORDER BY tags::text ASC`

    const leadsRes = await client.query(query, params)
    let leads = leadsRes.rows

    if (limitFlag) {
        leads = leads.slice(0, limitFlag)
    }

    console.log(`\n📋 Found ${leads.length} contractors to call:`)
    leads.forEach((l, i) => {
        const tier = (l.tags || []).find(t => t.startsWith('tier-')) || 'unknown'
        console.log(`  ${i + 1}. ${l.name} (${l.contactPerson || 'Unknown'}) — ${l.phone} [${tier}]`)
    })

    if (isDryRun) {
        console.log('\n🔍 DRY RUN — no calls made')
        await client.end()
        return
    }

    if (leads.length === 0) {
        console.log('\n⚠️  No leads to call. All may have been contacted already.')
        await client.end()
        return
    }

    // Import adapter factory + DNC check (uses TELEPHONY_PROVIDER from .env — vapi or twilio)
    const { getAdapters } = await import('../adapters/index.js')
    const { telephony: adapter } = getAdapters()
    const { dncService } = await import('../services/dncService.js')

    // Filter out DNC numbers
    const preDncCount = leads.length
    const filteredLeads = []
    for (const lead of leads) {
        const blocked = await dncService.isBlocked(lead.phone)
        if (blocked) {
            console.log(`  🚫 Skipping ${lead.name} — on DNC list`)
        } else {
            filteredLeads.push(lead)
        }
    }
    leads = filteredLeads
    if (preDncCount !== leads.length) {
        console.log(`\n🚫 DNC filtered: ${preDncCount - leads.length} leads removed`)
    }

    console.log(`\n📞 Starting batch calls (${delaySeconds}s delay between calls)...\n`)

    const results = []

    for (let i = 0; i < leads.length; i++) {
        const lead = leads[i]
        console.log(`[${i + 1}/${leads.length}] Calling ${lead.name} (${lead.contactPerson}) at ${lead.phone}...`)

        try {
            // Create Call record in DB
            const callId = 'c' + [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')
            await client.query(
                `INSERT INTO "Call" (id, "leadId", direction, status, "scriptId", "userId", "createdAt", "updatedAt")
                 VALUES ($1, $2, 'outbound', 'queued', $3, $4, NOW(), NOW())`,
                [callId, lead.id, scriptId, USER_ID]
            )

            // Initiate call (Vapi uses assistantConfig for AI greeting, Twilio uses TwiML)
            const result = await adapter.initiateCall({
                phoneNumber: lead.phone,
                leadId: lead.id,
                scriptId: scriptId,
                assistantConfig: {
                    contractorName: lead.contactPerson?.split(' ')[0] || 'there'
                }
            })

            // Update Call with provider ID
            await client.query(
                `UPDATE "Call" SET "providerCallId" = $1, status = $2 WHERE id = $3`,
                [result.providerCallId, result.status || 'ringing', callId]
            )

            // Update lead as contacted
            await client.query(
                `UPDATE "Lead" SET status = 'contacted', "lastContactedAt" = NOW(), "updatedAt" = NOW() WHERE id = $1`,
                [lead.id]
            )

            console.log(`  ✅ Call SID: ${result.providerCallId} — ${result.status}`)
            results.push({ lead: lead.name, success: true, callSid: result.providerCallId })

            // Delay between calls
            if (i < leads.length - 1) {
                console.log(`  ⏱️  Waiting ${delaySeconds}s before next call...`)
                await new Promise(r => setTimeout(r, delaySeconds * 1000))
            }
        } catch (err) {
            console.log(`  ❌ Failed: ${err.message}`)
            results.push({ lead: lead.name, success: false, error: err.message })
        }
    }

    // Summary
    const succeeded = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    console.log('\n' + '='.repeat(50))
    console.log('📊 BATCH CALL SUMMARY')
    console.log('='.repeat(50))
    console.log(`  Total: ${results.length}`)
    console.log(`  ✅ Succeeded: ${succeeded}`)
    console.log(`  ❌ Failed: ${failed}`)
    console.log('='.repeat(50))

    if (failed > 0) {
        console.log('\nFailed calls:')
        results.filter(r => !r.success).forEach(r => {
            console.log(`  - ${r.lead}: ${r.error}`)
        })
    }

    await client.end()
}

main().catch(e => {
    console.error('Batch call error:', e)
    process.exit(1)
})
