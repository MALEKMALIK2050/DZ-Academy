const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Updating SupportType enum in DZAcademy database...");
  await prisma.$executeRawUnsafe(`ALTER TYPE "SupportType" ADD VALUE IF NOT EXISTS 'WORD';`);
  await prisma.$executeRawUnsafe(`ALTER TYPE "SupportType" ADD VALUE IF NOT EXISTS 'QCM';`);
  console.log("✅ Successfully added 'WORD' and 'QCM' to SupportType enum in DZAcademy database!");
}

main()
  .catch((e) => {
    console.error("❌ Error updating enum:", e.message);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
