just fucking cant you keep post were i write post update then will chekc why the fuck diff ts js file cant you do iimport { PrismaClient } from '@prisma/client'
import mysql from 'mysql2/promise'

const prisma = new PrismaClient()

async function main() {
  const p = await prisma.project.findUnique({
    where: { id: '6ec589fd-a073-4ba4-815d-df2971b0cc9d' }
  })
  const dbName = p?.dbName
  if (!dbName) {
    console.error("Project not found")
    return
  }
  
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'vorebase_root_pass',
  })
  
  await connection.query(`CREATE TABLE IF NOT EXISTS ${dbName}.posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`)
  
  console.log("Table 'posts' created successfully in " + dbName)
  await connection.end()
}

main().catch(console.error)
