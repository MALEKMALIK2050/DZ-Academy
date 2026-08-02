import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {

  // 🔥 ADMIN
  await prisma.user.upsert({
    where: { email: "admin@dzacademy.com" },
    update: {},
    create: {
      nom: "admin",
      prenom: "Super",
      email: "admin@dzacademy.com",
      password: await bcrypt.hash("123456", 10),
      role: "ADMIN",
    },
  });

  // 👇 USERS
  await prisma.user.createMany({
    data: [
      {
        nom: "Ali",
        prenom: "Ali",
        email: "ali@test.com",
        password: await bcrypt.hash("1234", 10),
        role: "STUDENT",
      },
      {
        nom: "Sara",
        prenom: "Sara",
        email: "sara@test.com",
        password: await bcrypt.hash("1234", 10),
        role: "STUDENT",
      },
      {
        nom: "Karim",
        prenom: "Karim",
        email: "karim@test.com",
        password: await bcrypt.hash("1234", 10),
        role: "TEACHER",
      },
      {
        nom: "Malek",
        prenom: "Malik",
        email: "malek@test.com",
        password: await bcrypt.hash("1234", 10),
        role: "DESIGNER",
      }
    ],
    skipDuplicates: true,
  });

  console.log("✅ Admin + Users prêts !");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());