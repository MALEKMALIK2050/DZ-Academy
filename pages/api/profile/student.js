import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId requis' });
  }

  if (req.method === 'GET') {
    try {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          role: true,
          dateNaissance: true,
          lieuNaissance: true,
          ecole: true,
          adresse: true,
          ville: true,
          photo: true,
          profilComplet: true,
        }
      });

      if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
      return res.status(200).json(user);

    } catch (error) {
      console.error('❌ Erreur GET profil student:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'PUT') {
    const { dateNaissance, lieuNaissance, ecole, adresse, ville } = req.body;

    try {
      console.log('👤 Mise à jour profil STUDENT:', userId);

      const user = await prisma.user.update({
        where: { id: parseInt(userId) },
        data: {
          dateNaissance: dateNaissance || undefined,
          lieuNaissance: lieuNaissance || undefined,
          ecole: ecole || undefined,
          adresse: adresse || undefined,
          ville: ville || undefined,
          profilComplet: !!(dateNaissance && lieuNaissance && ecole && adresse && ville),
        },
      });

      console.log('✅ Profil STUDENT mis à jour');

      return res.status(200).json({
        success: true,
        message: '✅ Profil étudiant mis à jour avec succès',
        user: {
          id: user.id,
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          dateNaissance: user.dateNaissance,
          lieuNaissance: user.lieuNaissance,
          ecole: user.ecole,
          adresse: user.adresse,
          ville: user.ville,
          profilComplet: user.profilComplet,
        },
      });

    } catch (error) {
      console.error('❌ Erreur mise à jour profil STUDENT:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}