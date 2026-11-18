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

  await backfillStockFromVariants()
}

async function backfillStockFromVariants() {
  const products = await prisma.product.findMany({
    select: { id: true, variants: { select: { stock: true } } },
  })

  let updated = 0
  for (const product of products) {
    if (product.variants.length === 0) continue
    const stock = product.variants.reduce((sum, v) => sum + v.stock, 0)
    await prisma.product.update({ where: { id: product.id }, data: { stock } })
    updated++
  }

  if (updated > 0) {
    console.log(`Synced product stock from variants for ${updated} product(s)`)
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
