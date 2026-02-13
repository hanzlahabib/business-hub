/**
 * Seed Henderson EV contractor leads, board, tasks, and call scripts
 * from db.json into PostgreSQL using direct pg queries.
 *
 * Usage: node server/scripts/seed-henderson-ev.js
 */
import pg from 'pg'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { randomBytes } from 'crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dbJson = JSON.parse(readFileSync(resolve(__dirname, '../../db.json'), 'utf-8'))

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres_password@localhost:5433/business_hub?schema=public'
const USER_ID = 'cmlfn3x2z0000rfu4i9vn205w'

function cuid() {
  return 'c' + randomBytes(12).toString('hex').slice(0, 24)
}

async function main() {
  const client = new pg.Client({ connectionString: DATABASE_URL })
  await client.connect()
  console.log('🔌 Connected to PostgreSQL')

  // 1. Clean up old data if exists
  const existingBoard = await client.query(
    'SELECT id FROM "TaskBoard" WHERE name = $1 AND "userId" = $2',
    ['Henderson EV - Contractor Outreach', USER_ID]
  )

  if (existingBoard.rows.length > 0) {
    const boardId = existingBoard.rows[0].id
    console.log('⚠️  Board already exists. Cleaning up...')
    await client.query('DELETE FROM "Task" WHERE "boardId" = $1', [boardId])
    await client.query('DELETE FROM "Lead" WHERE "linkedBoardId" = $1 AND "userId" = $2', [boardId, USER_ID])
    await client.query('DELETE FROM "CallScript" WHERE industry = $1 AND "userId" = $2', ['henderson-ev-outreach', USER_ID])
    await client.query('DELETE FROM "TaskBoard" WHERE id = $1', [boardId])
    console.log('🗑️  Old data cleaned up')
  }

  // 2. Create TaskBoard
  const board = dbJson.taskBoards.find(b => b.id === 'board-henderson-ev-outreach')
  const boardId = cuid()
  await client.query(
    `INSERT INTO "TaskBoard" (id, name, columns, "leadId", "userId", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
    [boardId, board.name, JSON.stringify(board.columns), null, USER_ID]
  )
  console.log(`✅ Board created: ${board.name} (${boardId})`)

  // 3. Create Leads
  const leads = dbJson.leads.filter(l => l.linkedBoardId === 'board-henderson-ev-outreach')
  console.log(`📋 Seeding ${leads.length} contractor leads...`)

  const leadIdMap = {}

  for (const lead of leads) {
    const newId = cuid()
    leadIdMap[lead.id] = newId
    await client.query(
      `INSERT INTO "Lead" (id, name, company, "contactPerson", email, phone, status, source, industry, website, "websiteIssues", tags, "linkedBoardId", notes, "userId", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW(),NOW())`,
      [
        newId,
        lead.name,
        lead.name,
        lead.contactPerson || null,
        lead.email || null,
        lead.phone || null,
        lead.status || 'new',
        lead.source || 'web-scrape',
        lead.industry || 'electrician',
        lead.website || null,
        JSON.stringify(lead.websiteIssues || []),
        JSON.stringify(lead.tags || []),
        boardId,
        lead.notes || null,
        USER_ID,
      ]
    )
    console.log(`  ✅ ${lead.name} (${lead.phone || 'no phone'})`)
  }

  // 4. Create Call Script
  const scriptId = cuid()
  await client.query(
    `INSERT INTO "CallScript" (id, name, purpose, industry, "openingLine", "talkingPoints", "objectionHandlers", "closingStrategy", "rateRange", "isActive", "usageCount", "userId", "createdAt", "updatedAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),NOW())`,
    [
      scriptId,
      'Henderson EV - Contractor Discovery Call',
      'discovery',
      'henderson-ev-outreach',
      "Hi [NAME], my name is [Agent]. I run a local lead generation service for EV charger installers in Henderson, NV. I have a website — hendersonevcharger.com — that's ranking on Google and generating leads from homeowners looking for EV charger installation. Right now these leads are going unanswered. I'm looking for one reliable, licensed electrician in Henderson to send these leads to. Would you be interested in receiving free EV charger installation leads for your business?",
      JSON.stringify([
        { topic: 'Lead Quality', script: 'Pre-qualified homeowner leads in Henderson/Las Vegas area actively searching Google for EV charger installation.', fallback: 'We can show you examples of the types of inquiries we get.' },
        { topic: 'No Upfront Cost', script: 'No upfront cost — we can start with a trial period. You only pay for leads that convert.', fallback: "Think of it as risk-free. If the leads don't work, you owe nothing." },
        { topic: 'Volume', script: 'We can start with just 2-3 leads per week and scale up based on your capacity.', fallback: 'You control the volume — we adjust to your schedule.' },
        { topic: 'Pricing', script: 'Most contractors pay $50-150 per qualified lead. But we can discuss pricing after the trial.', fallback: "Let's start with the trial and we can work out fair pricing based on conversion rates." },
      ]),
      JSON.stringify([
        { objection: 'How much?', response: 'We can discuss pricing after the trial. Most contractors pay $50-150 per qualified lead.' },
        { objection: 'Too busy', response: "That's great — means you have demand. We can start with just 2-3 leads per week." },
        { objection: 'Not interested in EV', response: 'EV charger installation is the fastest-growing segment. Average ticket is $500-900 with minimal parts cost.' },
        { objection: 'Already have marketing', response: "This isn't marketing — these are ready-to-buy leads calling you directly. No ad spend on your end." },
        { objection: 'Sounds too good to be true', response: "I understand the skepticism. That's why we offer a free trial — you can see the quality before committing." },
      ]),
      "So here's what I'd like to suggest — let me send you a few leads this week at no cost. You handle them like normal jobs. If the quality is good and you're happy, we can talk about a monthly arrangement. Sound fair?",
      JSON.stringify({ min: 50, max: 150, target: 100, currency: 'USD' }),
      true,
      0,
      USER_ID,
    ]
  )
  console.log(`✅ Call script created: Henderson EV - Contractor Discovery Call (${scriptId})`)

  // 5. Create Tasks
  const tasks = dbJson.tasks.filter(t => t.boardId === 'board-henderson-ev-outreach')
  console.log(`📋 Seeding ${tasks.length} outreach tasks...`)

  for (const task of tasks) {
    const taskId = cuid()
    const newLeadId = leadIdMap[task.leadId] || null
    await client.query(
      `INSERT INTO "Task" (id, title, description, status, priority, "columnId", position, "leadId", subtasks, tags, "boardId", "userId", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),NOW())`,
      [
        taskId,
        task.title,
        task.description || null,
        task.status || null,
        task.priority || 'medium',
        task.columnId || 'prospects',
        task.position || 0,
        newLeadId,
        JSON.stringify(task.subtasks || []),
        JSON.stringify(task.tags || []),
        boardId,
        USER_ID,
      ]
    )
    console.log(`  ✅ ${task.title}`)
  }

  // Summary
  const leadCount = await client.query('SELECT count(*) FROM "Lead" WHERE "linkedBoardId" = $1', [boardId])
  const taskCount = await client.query('SELECT count(*) FROM "Task" WHERE "boardId" = $1', [boardId])
  const scriptCount = await client.query('SELECT count(*) FROM "CallScript" WHERE industry = $1', ['henderson-ev-outreach'])

  console.log('\n🎉 Seed complete!')
  console.log(`   📊 ${leadCount.rows[0].count} leads`)
  console.log(`   📋 ${taskCount.rows[0].count} tasks`)
  console.log(`   📝 ${scriptCount.rows[0].count} call scripts`)
  console.log(`   🗂️  1 task board: ${board.name}`)

  await client.end()
}

main().catch(e => {
  console.error('❌ Seed failed:', e)
  process.exit(1)
})
