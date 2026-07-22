import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const p = await prisma.project.findUnique({
    where: { id: '6ec589fd-a073-4ba4-815d-df2971b0cc9d' }
  })
  console.log("DB NAME IS:", p?.dbName)
}

main().catch(console.error)
