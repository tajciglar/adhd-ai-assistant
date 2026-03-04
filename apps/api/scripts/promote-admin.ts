/// <reference types="node" />
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error("Usage: pnpm admin:promote <email>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.error(`User with email "${email}" not found.`);
    process.exit(1);
  }

  if (user.role === "admin") {
    console.log(`User "${email}" is already an admin.`);
    return;
  }

  await prisma.user.update({
    where: { email },
    data: { role: "admin" },
  });

  console.log(`✓ User "${email}" promoted to admin.`);
}

main()
  .catch((err) => {
    console.error("Error:", err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
