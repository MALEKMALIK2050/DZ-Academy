const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  
  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        matieres: user.matiere ? [user.matiere] : [],
        niveaux:  user.niveau  ? [user.niveau]  : [],
      },
    });
    console.log('Migré:', user.prenom, user.nom, '→', user.matiere, user.niveau);
  }
  
  console.log('✅ Migration terminée !');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
  });