import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create a default admin user
  const admin = await prisma.user.upsert({
    where: { email: "admin@ugrp.dev" },
    update: {},
    create: {
      email: "admin@ugrp.dev",
      name: "Admin User",
      passwordHash:
        "$2a$10$EblZqNptyYvcLm/VwDCVAuBjzZOI7khzdyGPBr08PpIi0na624b8.", // "password123"
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });
  console.log("Seeded admin user:", admin.email);

  // Create a regular user
  const user = await prisma.user.upsert({
    where: { email: "user@ugrp.dev" },
    update: {},
    create: {
      email: "user@ugrp.dev",
      name: "Test User",
      passwordHash:
        "$2a$10$EblZqNptyYvcLm/VwDCVAuBjzZOI7khzdyGPBr08PpIi0na624b8.",
      role: "USER",
      emailVerified: new Date(),
    },
  });
  console.log("Seeded regular user:", user.email);

  // Create sample posts
  for (const title of [
    "Welcome to UGRP",
    "Getting Started Guide",
    "Architecture Overview",
  ]) {
    await prisma.post.create({
      data: {
        title,
        content: `This is the content for "${title}".`,
        published: true,
        authorId: user.id,
      },
    });
  }
  console.log("Seeded posts");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
