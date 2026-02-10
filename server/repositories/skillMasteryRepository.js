import prisma from '../config/prisma.js'

// Note: SkillMastery is stored as raw JSON, not via Prisma model
// We use raw pg queries since Prisma client may not have this model yet
import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

export const skillMasteryRepository = {
    async findByUserId(userId) {
        const client = await pool.connect()
        try {
            const result = await client.query(
                'SELECT * FROM "SkillMastery" WHERE "userId" = $1',
                [userId]
            )
            return result.rows[0] || null
        } finally {
            client.release()
        }
    },

    async upsert(userId, data) {
        const client = await pool.connect()
        try {
            const result = await client.query(
                `INSERT INTO "SkillMastery" (id, data, "userId", "updatedAt")
                 VALUES (gen_random_uuid()::text, $1, $2, NOW())
                 ON CONFLICT ("userId") DO UPDATE SET data = $1, "updatedAt" = NOW()
                 RETURNING *`,
                [JSON.stringify(data), userId]
            )
            return result.rows[0]
        } finally {
            client.release()
        }
    }
}

export default skillMasteryRepository
