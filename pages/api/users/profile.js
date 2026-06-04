import prisma from '@/lib/prisma';

/**
 * PUT /api/users/profile?userId=X
 * Met à jour le profil selon le rôle de l'utilisateur
 */
export default async function handler(req, res) {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });

  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId requis' });

  try {
    // Récupérer le rôle de l'utilisateur
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: { id: true, role: true },
    });

    if (!existingUser) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    const role = existingUser.role;
    const body = req.body;

    // Champs communs à tous les rôles
    const updateData = {
      telephone: body.telephone || undefined,
    };

    if (role === 'STUDENT') {
      // Champs spécifiques étudiant
      if (body.dateNaissance !== undefined) updateData.dateNaissance = body.dateNaissance || null;
      if (body.lieuNaissance !== undefined) updateData.lieuNaissance = body.lieuNaissance || null;
      if (body.village !== undefined) updateData.village = body.village || null;
      if (body.adresse !== undefined) updateData.adresse = body.adresse || null;
      if (body.codePostal !== undefined) updateData.codePostal = body.codePostal || null;
      if (body.ville !== undefined) updateData.ville = body.ville || null;
      if (body.pays !== undefined) updateData.pays = body.pays || 'Algérie';
      if (body.ecole !== undefined) updateData.ecole = body.ecole || null;
      if (body.niveauScolaire !== undefined) updateData.niveauScolaire = body.niveauScolaire || null;

      // Calculer si profil complet
      updateData.profilComplet = !!(
        (body.dateNaissance || existingUser.dateNaissance) &&
        (body.adresse || existingUser.adresse) &&
        (body.ville || existingUser.ville) &&
        (body.ecole || existingUser.ecole)
      );

    } else if (role === 'TEACHER' || role === 'DESIGNER') {
      // Champs spécifiques enseignant / concepteur
      if (body.specialite !== undefined) updateData.specialite = body.specialite || null;
      if (body.biographie !== undefined) updateData.biographie = body.biographie || null;
      if (body.diplome !== undefined) updateData.diplome = body.diplome || null;
      if (body.universite !== undefined) updateData.universite = body.universite || null;
      if (body.niveau !== undefined) updateData.niveau = body.niveau || null;
      if (body.annee !== undefined) updateData.annee = body.annee || null;
      if (body.adresse !== undefined) updateData.adresse = body.adresse || null;
      if (body.ville !== undefined) updateData.ville = body.ville || null;
      if (body.pays !== undefined) updateData.pays = body.pays || 'Algérie';
    }

    console.log(`👤 Mise à jour profil [${role}] userId=${userId}`, updateData);

    const user = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: updateData,
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        photo: true,
        role: true,
        telephone: true,
        // Adresse
        adresse: true,
        codePostal: true,
        ville: true,
        pays: true,
        // Personnel
        dateNaissance: true,
        lieuNaissance: true,
        village: true,
        // Scolarité
        ecole: true,
        niveauScolaire: true,
        niveau: true,
        annee: true,
        // Professionnel
        specialite: true,
        biographie: true,
        diplome: true,
        universite: true,
        // Statut
        profilComplet: true,
        pourcentageCompletion: true,
        statutProfil: true,
      },
    });

    console.log('✅ Profil mis à jour');

    return res.status(200).json({
      success: true,
      message: '✅ Profil mis à jour avec succès',
      user,
    });

  } catch (error) {
    console.error('❌ Erreur mise à jour profil:', error);
    return res.status(500).json({ error: `Erreur: ${error.message}` });
  }
}