import 'dotenv/config'
import path from 'node:path'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
    earlyAccess: true,
    schema: path.join(__dirname, 'server', 'prisma', 'schema.prisma'),
    datasource: {
        url: env('DATABASE_URL', 'postgresql://postgres:postgres_password@localhost:5433/business_hub?schema=public'),
    },
})
