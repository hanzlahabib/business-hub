/**
 * Complete data migration from db.json to PostgreSQL
 * Maps ALL fields from db.json to the updated Prisma schema
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import fs from 'fs'
import path from 'path'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const dbPath = path.join(process.cwd(), 'db.json')
const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'))

const TARGET_EMAIL = process.env.TARGET_EMAIL || 'hanzla.dev@gmail.com'

async function migrate() {
    console.log('🚀 Starting complete data migration...\n')

    // 1. Find or create user
    let user = await prisma.user.findUnique({ where: { email: TARGET_EMAIL } })
    if (!user) {
        user = await prisma.user.create({
            data: {
                email: TARGET_EMAIL,
                name: 'Main User',
                passwordHash: 'password123'
            }
        })
        console.log('✓ Created user:', user.id)
    } else {
        console.log('✓ Found existing user:', user.id)
    }
    const userId = user.id

    // 2. Migrate Contents (35 items)
    const contents = data.contents || []
    console.log(`\n📝 Migrating ${contents.length} contents...`)
    for (const c of contents) {
        try {
            await prisma.content.create({
                data: {
                    title: c.title || 'Untitled',
                    type: c.type || null,
                    status: c.status || null,
                    topic: c.topic || null,
                    hook: c.hook || null,
                    notes: c.notes || null,
                    scheduledDate: c.scheduledDate || null,
                    publishedDate: c.publishedDate || null,
                    presentationReady: c.presentationReady || false,
                    sourceVideoId: c.sourceVideoId || null,
                    slideDetails: c.slideDetails || null,
                    comments: c.comments || null,
                    urls: c.urls || null,
                    createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
                    userId
                }
            })
        } catch (e: any) {
            console.error(`  ✗ Content "${c.title}": ${e.message}`)
        }
    }
    console.log(`  ✓ Contents migrated`)

    // 3. Migrate Leads (140 items)
    const leads = data.leads || []
    console.log(`\n👥 Migrating ${leads.length} leads...`)
    for (const l of leads) {
        try {
            await prisma.lead.create({
                data: {
                    name: l.name || 'Unknown',
                    company: l.company || null,
                    contactPerson: l.contactPerson || null,
                    email: l.email || null,
                    phone: l.phone || null,
                    status: l.status || 'new',
                    source: l.source || null,
                    industry: l.industry || null,
                    website: l.website || null,
                    websiteIssues: l.websiteIssues || null,
                    tags: l.tags || null,
                    linkedBoardId: l.linkedBoardId || null,
                    notes: l.notes || null,
                    lastContactedAt: l.lastContactedAt ? new Date(l.lastContactedAt) : null,
                    createdAt: l.createdAt ? new Date(l.createdAt) : new Date(),
                    userId
                }
            })
        } catch (e: any) {
            console.error(`  ✗ Lead "${l.name}": ${e.message}`)
        }
    }
    console.log(`  ✓ Leads migrated`)

    // 4. Migrate Jobs (23 items)
    const jobs = data.jobs || []
    console.log(`\n💼 Migrating ${jobs.length} jobs...`)
    for (const j of jobs) {
        try {
            await prisma.job.create({
                data: {
                    title: j.title || j.role || null,
                    role: j.role || null,
                    company: j.company || 'Unknown',
                    location: j.location || null,
                    locationType: j.locationType || null,
                    status: j.status || null,
                    description: j.description || null,
                    contactPerson: j.contactPerson || null,
                    contactEmail: j.contactEmail || null,
                    experienceLevel: j.experienceLevel || null,
                    priority: j.priority || null,
                    notes: j.notes || null,
                    source: j.source || null,
                    sourceUrl: j.sourceUrl || null,
                    requirements: j.requirements || null,
                    skills: j.skills || null,
                    salaryCurrency: j.salaryCurrency || null,
                    salaryMin: j.salaryMin || null,
                    salaryMax: j.salaryMax || null,
                    appliedAt: j.appliedAt ? new Date(j.appliedAt) : null,
                    interviewDates: j.interviewDates || null,
                    createdAt: j.createdAt ? new Date(j.createdAt) : new Date(),
                    updatedAt: j.updatedAt ? new Date(j.updatedAt) : new Date(),
                    userId
                }
            })
        } catch (e: any) {
            console.error(`  ✗ Job "${j.company}": ${e.message}`)
        }
    }
    console.log(`  ✓ Jobs migrated`)

    // 5. Migrate TaskBoards
    // db.json has 0 taskboards, but tasks reference boardId
    // Collect unique boardIds from tasks to create boards
    const tasks = data.tasks || []
    const boardIds = [...new Set(tasks.map((t: any) => t.boardId).filter(Boolean))] as string[]
    console.log(`\n📋 Creating ${boardIds.length} task boards from task references...`)

    // Default columns for boards
    const defaultColumns = [
        { id: 'todo', name: 'To Do', color: '#6B7280' },
        { id: 'inprogress', name: 'In Progress', color: '#3B82F6' },
        { id: 'review', name: 'Review', color: '#F59E0B' },
        { id: 'done', name: 'Done', color: '#10B981' }
    ]

    const boardMap: Record<string, string> = {} // old boardId -> new prisma id
    for (const boardId of boardIds) {
        try {
            // Derive a name from the boardId
            const name = boardId
                .replace('board-', '')
                .replace(/-/g, ' ')
                .split(' ')
                .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ')

            const board = await prisma.taskBoard.create({
                data: {
                    name: name || boardId,
                    columns: defaultColumns,
                    userId
                }
            })
            boardMap[boardId] = board.id
        } catch (e: any) {
            console.error(`  ✗ Board "${boardId}": ${e.message}`)
        }
    }
    console.log(`  ✓ Task boards created`)

    // 6. Migrate Tasks (110 items)
    console.log(`\n✅ Migrating ${tasks.length} tasks...`)
    for (const t of tasks) {
        try {
            await prisma.task.create({
                data: {
                    title: t.title || 'Untitled',
                    description: t.description || null,
                    status: t.status || null,
                    priority: t.priority || null,
                    columnId: t.columnId || null,
                    position: t.position || 0,
                    assignee: t.assignee || null,
                    leadId: t.leadId || null,
                    subtasks: t.subtasks || null,
                    tags: t.tags || null,
                    dueDate: t.dueDate ? new Date(t.dueDate) : null,
                    boardId: t.boardId ? (boardMap[t.boardId] || null) : null,
                    createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
                    userId
                }
            })
        } catch (e: any) {
            console.error(`  ✗ Task "${t.title}": ${e.message}`)
        }
    }
    console.log(`  ✓ Tasks migrated`)

    // 7. Migrate Template Folders (from unique folderIds in templates)
    const templates = data.templates || []
    const folderIds = [...new Set(templates.map((t: any) => t.folderId).filter(Boolean))] as string[]
    console.log(`\n📁 Creating ${folderIds.length} template folders...`)

    const folderMap: Record<string, string> = {}
    for (const folderId of folderIds) {
        try {
            const name = folderId
                .replace('folder-', '')
                .split('-')
                .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ')

            const folder = await prisma.templateFolder.create({
                data: {
                    name: name || folderId,
                    userId
                }
            })
            folderMap[folderId] = folder.id
        } catch (e: any) {
            console.error(`  ✗ Folder "${folderId}": ${e.message}`)
        }
    }
    console.log(`  ✓ Template folders created`)

    // 8. Migrate Templates (43 items)
    console.log(`\n📄 Migrating ${templates.length} templates...`)
    for (const t of templates) {
        try {
            await prisma.template.create({
                data: {
                    name: t.name || 'Untitled',
                    category: t.category || null,
                    description: t.description || null,
                    icon: t.icon || null,
                    coverImage: t.coverImage || null,
                    content: t.content || null,
                    rawMarkdown: t.rawMarkdown || null,
                    subject: t.subject || null,
                    status: t.status || 'draft',
                    tags: t.tags || null,
                    variables: t.variables || null,
                    isFavorite: t.isFavorite || false,
                    isPinned: t.isPinned || false,
                    isLocked: t.isLocked || false,
                    lockedBy: t.lockedBy || null,
                    lastUsedAt: t.lastUsedAt ? new Date(t.lastUsedAt) : null,
                    usageCount: t.usageCount || 0,
                    version: t.version || 1,
                    permissions: t.permissions || null,
                    createdBy: t.createdBy || null,
                    updatedBy: t.updatedBy || null,
                    folderId: t.folderId ? (folderMap[t.folderId] || null) : null,
                    createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
                    updatedAt: t.updatedAt ? new Date(t.updatedAt) : new Date(),
                    userId
                }
            })
        } catch (e: any) {
            console.error(`  ✗ Template "${t.name}": ${e.message}`)
        }
    }
    console.log(`  ✓ Templates migrated`)

    // 9. Migrate Messages
    const messages = data.messages || []
    console.log(`\n💬 Migrating ${messages.length} messages...`)
    for (const m of messages) {
        try {
            await prisma.message.create({
                data: {
                    type: m.type || 'sent',
                    channel: m.channel || 'email',
                    subject: m.subject || null,
                    body: m.body || null,
                    templateId: m.templateId || null,
                    status: m.status || null,
                    createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
                    userId
                }
            })
        } catch (e: any) {
            console.error(`  ✗ Message: ${e.message}`)
        }
    }
    console.log(`  ✓ Messages migrated`)

    // Summary
    console.log('\n' + '='.repeat(50))
    console.log('📊 Migration Summary:')
    console.log(`  Contents:  ${contents.length}`)
    console.log(`  Leads:     ${leads.length}`)
    console.log(`  Jobs:      ${jobs.length}`)
    console.log(`  Boards:    ${boardIds.length}`)
    console.log(`  Tasks:     ${tasks.length}`)
    console.log(`  Folders:   ${folderIds.length}`)
    console.log(`  Templates: ${templates.length}`)
    console.log(`  Messages:  ${messages.length}`)
    console.log('='.repeat(50))
    console.log('\n✅ Migration complete!')
}

migrate()
    .catch((e: any) => {
        console.error('\n❌ Migration failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
        await pool.end()
    })
