import prisma from "@/lib/prisma";
import { promises as fs } from "fs";
import path from "path";

function calculateProfileCompletion(user) {
  let completed = 0;
  let total = 8;

  if (user.adresse) completed++;
  if (user.codePostal) completed++;
  if (user.ville) completed++;
  if (user.pays) completed++;
  if (user.telephone) completed++;
  if (user.dateNaissance) completed++;
  if (user.lieuNaissance) completed++;
  if (user.photo) completed++;

  const percentage = Math.round((completed / total) * 100);

  let status = "INCOMPLET";
  if (percentage >= 100) status = "COMPLET";
  else if (percentage >= 50) status = "PARTIELLEMENT_COMPLET";

  return { percentage, status };
}

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Récupérer l'ID depuis le header X-User-ID
    const userId = req.headers["x-user-id"];

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized - No user ID" });
    }

    const userIdInt = parseInt(userId);

    if (isNaN(userIdInt)) {
      return res.status(401).json({ error: "Unauthorized - Invalid user ID" });
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userIdInt },
    });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Récupérer les données du body (JSON)
    const {
      adresse,
      codePostal,
      ville,
      pays = "Algérie",
      telephone,
      dateNaissance,
      lieuNaissance,
      ecole,
      niveauScolaire,
      photo,
    } = req.body;

    // Préparer les données de mise à jour
    const updateData = {
      adresse: adresse || undefined,
      codePostal: codePostal || undefined,
      ville: ville || undefined,
      pays: pays || "Algérie",
      telephone: telephone || undefined,
      dateNaissance: dateNaissance || undefined,
      lieuNaissance: lieuNaissance || undefined,
      ecole: ecole || undefined,
      niveauScolaire: niveauScolaire || undefined,
    };

    // Traiter l'upload de photo (base64)
    if (photo && photo.startsWith("data:image")) {
      try {
        const uploadDir = path.join(process.cwd(), "public/uploads/profiles");
        await fs.mkdir(uploadDir, { recursive: true });

        // Convertir base64 en buffer
        const base64Data = photo.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");

        const extension = photo.split(";")[0].split("/")[1] || "jpg";
        const fileName = `${userIdInt}-${Date.now()}.${extension}`;
        const filePath = path.join(uploadDir, fileName);

        await fs.writeFile(filePath, buffer);
        updateData.photo = `/uploads/profiles/${fileName}`;
      } catch (err) {
        console.error("Erreur upload photo:", err);
        // Continuer même si l'upload échoue
      }
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: userIdInt },
      data: updateData,
    });

    // Calculer le pourcentage de complétude
    const { percentage, status } = calculateProfileCompletion(updatedUser);

    // Mettre à jour le pourcentage et le statut
    const finalUser = await prisma.user.update({
      where: { id: userIdInt },
      data: {
        pourcentageCompletion: percentage,
        statutProfil: status,
      },
      select: {
        id: true,
        prenom: true,
        nom: true,
        email: true,
        photo: true,
        adresse: true,
        codePostal: true,
        ville: true,
        pays: true,
        telephone: true,
        dateNaissance: true,
        lieuNaissance: true,
        ecole: true,
        niveauScolaire: true,
        pourcentageCompletion: true,
        statutProfil: true,
      },
    });

    return res.status(200).json({
      message: "Profil mis à jour avec succès",
      user: finalUser,
      pourcentageCompletion: percentage,
      statutProfil: status,
    });
  } catch (error) {
    console.error("Erreur PUT /api/profile/update:", error);
    return res.status(500).json({ error: "Erreur lors de la mise à jour du profil" });
  }
}
