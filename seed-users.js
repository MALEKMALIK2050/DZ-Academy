const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du seed...\n');

  try {
    // Supprimer les utilisateurs existants
    console.log('🗑️  Suppression des utilisateurs existants...');
    await prisma.user.deleteMany();
    console.log('✅ Utilisateurs supprimés\n');

    // Créer l'ADMIN
    console.log('👤 Création de l\'ADMIN...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await prisma.user.create({
      data: {
        nom: 'admin',
        prenom: 'Super',
        email: 'admin@academy.com',
        password: adminPassword,
        role: 'ADMIN',
        active: true,
      },
    });
    console.log('✅ ADMIN créé:');
    console.log(`   Email: admin@academy.com`);
    console.log(`   Password: admin123`);
    console.log(`   Role: ADMIN\n`);

    // Créer le DESIGNER
    console.log('👤 Création du DESIGNER...');
    const designerPassword = await bcrypt.hash('designer123', 10);
    
    const designer = await prisma.user.create({
      data: {
        nom: 'designer',
        prenom: 'Test',
        email: 'designer@academy.com',
        password: designerPassword,
        role: 'DESIGNER',
        active: true,
      },
    });
    console.log('✅ DESIGNER créé:');
    console.log(`   Email: designer@academy.com`);
    console.log(`   Password: designer123`);
    console.log(`   Role: DESIGNER\n`);

    console.log('🎉 Seed terminé avec succès!\n');
    console.log('📝 Identifiants de connexion:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('ADMIN:');
    console.log('  Email: admin@academy.com');
    console.log('  Password: admin123');
    console.log('');
    console.log('DESIGNER (pour l\'import):');
    console.log('  Email: designer@academy.com');
    console.log('  Password: designer123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Erreur lors du seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();