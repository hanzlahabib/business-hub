import path from 'node:path'
import { defineConfig } from 'prisma/config'

export default defineConfig({
    earlyAccess: true,
    schema: path.join(__dirname, 'server', 'prisma', 'schema.prisma'),
    migrate: {
        async url() {
            return process.env.DATABASE_URL || 'postgresql://postgres:postgres_password@localhost:5433/business_hub?schema=public'
        }
    },
    studio: {
        async url() {
            return process.env.DATABASE_URL || 'postgresql://postgres:postgres_password@localhost:5433/business_hub?schema=public'
        }
    },
    async url() {
        return process.env.DATABASE_URL || 'postgresql://postgres:postgres_password@localhost:5432/business_hub?schema=public'
    }
})
