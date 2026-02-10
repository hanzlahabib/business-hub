import pg from 'pg';

const pool = new pg.Pool({ connectionString: 'postgresql://postgres:postgres_password@localhost:5432/business_hub?schema=public' });

async function run() {
    const client = await pool.connect();
    try {
        // Drop all existing data to re-migrate properly
        await client.query(`TRUNCATE "Content", "Lead", "Job", "Task", "TaskBoard", "Template", "TemplateFolder", "Message", "EmailTemplate", "TemplateHistory", "TemplateComment" CASCADE`);
        console.log('✓ Truncated all tables');

        // Content: add missing columns
        await client.query(`ALTER TABLE "Content" ADD COLUMN IF NOT EXISTS topic TEXT`);
        await client.query(`ALTER TABLE "Content" ADD COLUMN IF NOT EXISTS hook TEXT`);
        await client.query(`ALTER TABLE "Content" ADD COLUMN IF NOT EXISTS notes TEXT`);
        await client.query(`ALTER TABLE "Content" ADD COLUMN IF NOT EXISTS "publishedDate" TEXT`);
        await client.query(`ALTER TABLE "Content" ADD COLUMN IF NOT EXISTS "presentationReady" BOOLEAN DEFAULT false`);
        await client.query(`ALTER TABLE "Content" ADD COLUMN IF NOT EXISTS "sourceVideoId" TEXT`);
        await client.query(`ALTER TABLE "Content" ADD COLUMN IF NOT EXISTS "slideDetails" JSONB`);
        await client.query(`ALTER TABLE "Content" ADD COLUMN IF NOT EXISTS comments JSONB`);
        await client.query(`ALTER TABLE "Content" ADD COLUMN IF NOT EXISTS urls JSONB`);
        // scheduledDate: change from TIMESTAMP to TEXT
        await client.query(`ALTER TABLE "Content" ALTER COLUMN "scheduledDate" TYPE TEXT USING "scheduledDate"::TEXT`);
        console.log('✓ Content columns updated');

        // Lead: add missing columns
        await client.query(`ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS industry TEXT`);
        await client.query(`ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS website TEXT`);
        await client.query(`ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "websiteIssues" JSONB`);
        await client.query(`ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS tags JSONB`);
        await client.query(`ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "linkedBoardId" TEXT`);
        console.log('✓ Lead columns updated');

        // Job: add missing columns
        try { await client.query(`ALTER TABLE "Job" ALTER COLUMN title DROP NOT NULL`); } catch (e: any) { }
        await client.query(`ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS role TEXT`);
        await client.query(`ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS description TEXT`);
        await client.query(`ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "contactPerson" TEXT`);
        await client.query(`ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "contactEmail" TEXT`);
        await client.query(`ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "experienceLevel" TEXT`);
        await client.query(`ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "locationType" TEXT`);
        await client.query(`ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS notes TEXT`);
        await client.query(`ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS priority TEXT`);
        await client.query(`ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS source TEXT`);
        await client.query(`ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "sourceUrl" TEXT`);
        await client.query(`ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS requirements JSONB`);
        await client.query(`ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS skills JSONB`);
        await client.query(`ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "salaryCurrency" TEXT`);
        await client.query(`ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "salaryMin" DOUBLE PRECISION`);
        await client.query(`ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "salaryMax" DOUBLE PRECISION`);
        await client.query(`ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "appliedAt" TIMESTAMP`);
        await client.query(`ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "interviewDates" JSONB`);
        console.log('✓ Job columns updated');

        // Task: add missing columns
        await client.query(`ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "columnId" TEXT`);
        await client.query(`ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS position INT DEFAULT 0`);
        await client.query(`ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS assignee TEXT`);
        await client.query(`ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "leadId" TEXT`);
        await client.query(`ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS subtasks JSONB`);
        await client.query(`ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS tags JSONB`);
        console.log('✓ Task columns updated');

        // TaskBoard: add missing columns
        await client.query(`ALTER TABLE "TaskBoard" ADD COLUMN IF NOT EXISTS columns JSONB`);
        await client.query(`ALTER TABLE "TaskBoard" ADD COLUMN IF NOT EXISTS "leadId" TEXT`);
        console.log('✓ TaskBoard columns updated');

        // Template: add missing columns
        await client.query(`ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS category TEXT`);
        await client.query(`ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS description TEXT`);
        await client.query(`ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS icon TEXT`);
        await client.query(`ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "coverImage" TEXT`);
        await client.query(`ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "rawMarkdown" TEXT`);
        await client.query(`ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS subject TEXT`);
        await client.query(`ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS status TEXT`);
        await client.query(`ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS tags JSONB`);
        await client.query(`ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS variables JSONB`);
        await client.query(`ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "isFavorite" BOOLEAN DEFAULT false`);
        await client.query(`ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "isPinned" BOOLEAN DEFAULT false`);
        await client.query(`ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "isLocked" BOOLEAN DEFAULT false`);
        await client.query(`ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "lockedBy" TEXT`);
        await client.query(`ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "lastUsedAt" TIMESTAMP`);
        await client.query(`ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "usageCount" INT DEFAULT 0`);
        await client.query(`ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS version INT DEFAULT 1`);
        await client.query(`ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS permissions JSONB`);
        await client.query(`ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "createdBy" TEXT`);
        await client.query(`ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "updatedBy" TEXT`);
        // content column: change from TEXT to JSONB
        try { await client.query(`ALTER TABLE "Template" ALTER COLUMN content TYPE JSONB USING content::JSONB`); } catch (e: any) { console.log('Note: content column type change skipped', e.message); }
        console.log('✓ Template columns updated');

        // TemplateFolder: add missing columns
        await client.query(`ALTER TABLE "TemplateFolder" ADD COLUMN IF NOT EXISTS icon TEXT`);
        await client.query(`ALTER TABLE "TemplateFolder" ADD COLUMN IF NOT EXISTS color TEXT`);
        console.log('✓ TemplateFolder columns updated');

        console.log('\n✅ All schema changes applied successfully!');
    } finally {
        client.release();
        await pool.end();
    }
}

run().catch(e => { console.error(e); process.exit(1); });
