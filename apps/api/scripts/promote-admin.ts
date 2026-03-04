import { PrismaClient } from "@prisma/client";

const email = process.argv[2];

if (!email) {
  console.error("Usage: pnpm admin:promote <email>");
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({ where: { email } });

  if (!user) {
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }

  if (user.role === "admin") {
    console.log(`${email} is already an admin.`);
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { role: "admin" },
  });

  console.log(`Promoted ${email} to admin.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
