import { prisma } from "./prisma"
import { hashPassword } from "./auth"

export async function seed() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@ecomm.com"
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123"

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } })
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: await hashPassword(adminPassword),
        name: "Admin",
        role: "ADMIN",
      },
    })
  }

  const cats = await prisma.category.findMany()
  if (cats.length === 0) {
    const electronics = await prisma.category.create({
      data: { name: "Electronics", slug: "electronics" },
    })
    const clothing = await prisma.category.create({
      data: { name: "Clothing", slug: "clothing" },
    })
    const home = await prisma.category.create({
      data: { name: "Home & Living", slug: "home-living" },
    })

    await prisma.product.createMany({
      data: [
        {
          name: "Wireless Headphones",
          slug: "wireless-headphones",
          description: "Noise-cancelling wireless headphones",
          price: "2500.00",
          stock: 12,
          imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
          categoryId: electronics.id,
          isActive: true,
          relatedIds: [],
        },
        {
          name: "Smart Watch",
          slug: "smart-watch",
          description: "Fitness tracking smart watch",
          price: "1800.00",
          stock: 8,
          imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
          categoryId: electronics.id,
          isActive: true,
          relatedIds: [],
        },
        {
          name: "Cotton T-Shirt",
          slug: "cotton-t-shirt",
          description: "Comfortable cotton t-shirt",
          price: "350.00",
          stock: 40,
          imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
          categoryId: clothing.id,
          isActive: true,
          relatedIds: [],
        },
        {
          name: "Denim Jeans",
          slug: "denim-jeans",
          description: "Classic fit denim jeans",
          price: "900.00",
          stock: 25,
          imageUrl: "https://images.unsplash.com/photo-1542272692-729fbeab40f7?w=400",
          categoryId: clothing.id,
          isActive: true,
          relatedIds: [],
        },
        {
          name: "Ceramic Coffee Mug",
          slug: "ceramic-coffee-mug",
          description: "Handmade ceramic coffee mug",
          price: "180.00",
          stock: 60,
          imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400",
          categoryId: home.id,
          isActive: true,
          relatedIds: [],
        },
        {
          name: "Wooden Bookshelf",
          slug: "wooden-bookshelf",
          description: "5-tier wooden bookshelf",
          price: "3200.00",
          stock: 6,
          imageUrl: "https://images.unsplash.com/photo-1513476531047-c4b8b3643f5b?w=400",
          categoryId: home.id,
          isActive: true,
          relatedIds: [],
        },
      ],
    })
  }

  return { seeded: true }
}
