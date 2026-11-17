const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient()

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@ecomm.com"
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123"

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } })

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: await bcrypt.hash(adminPassword, 12),
        name: "Admin",
        role: "ADMIN",
      },
    })
    console.log(`Created admin user: ${adminEmail}`)
  } else if (existingAdmin.role !== "ADMIN") {
    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: "ADMIN" },
    })
    console.log(`Promoted existing user to ADMIN: ${adminEmail}`)
  } else {
    console.log(`Admin user already exists: ${adminEmail}`)
  }
}

main()
  .then(() => {
    return prisma.$disconnect()
  })
  .catch((e) => {
    console.error("Seed failed:", e)
    return prisma.$disconnect().then(() => process.exit(1))
  })
