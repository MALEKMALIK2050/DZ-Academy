const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const hash = bcrypt.hashSync("admin123", 10);

  await prisma.user.update({
    where: { email: "admin@academy.com" },
    data: { password: hash },
  });

  console.log("ADMIN RESET OK");
}

main()
  .finally(() => prisma.$disconnect());