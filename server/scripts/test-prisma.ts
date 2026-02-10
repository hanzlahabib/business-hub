import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

console.log('DATABASE_URL:', process.env.DATABASE_URL)

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    try {
        const users = await prisma.user.findMany()
        console.log('Success! Users:', users.length)
    } catch (err) {
        console.error('Failed:', err)
    } finally {
        await prisma.$disconnect()
    }
}

main()
