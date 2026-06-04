import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

function getUser(req) {
  try {
    const token = req.cookies?.token;
    if (!token) return null;
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Non autorisé" });
  if (user.role !== "DESIGNER") return res.status(403).json({ error: "Accès refusé" });
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });

  try {
    const { batchId } = req.body;

    if (!batchId) {
      return res.status(400).json({ error: "batchId manquant" });
    }

    const batch = await prisma.importBatch.findUnique({
      where: { id: parseInt(batchId) },
    });

    if (!batch) {
      return res.status(404).json({ error: "Batch non trouvé" });
    }

    // Identifier les modules échoués
    const failedModules = [];
    if (batch.chaptersStatus === "FAILED") failedModules.push("chapters");
    if (batch.pretestStatus === "FAILED") failedModules.push("pretest");
    if (batch.formativeStatus === "FAILED") failedModules.push("formative");
    if (batch.summativeStatus === "FAILED") failedModules.push("summative");

    if (failedModules.length === 0) {
      return res.status(400).json({
        error: "Aucun module échoué à retry",
        failedModules: [],
      });
    }

    // Réinitialiser le statut des modules échoués
    const updateData = {
      status: "IN_PROGRESS",
    };

    failedModules.forEach((module) => {
      updateData[`${module}Status`] = "PENDING";
      updateData[`${module}Error`] = null;
    });

    await prisma.importBatch.update({
      where: { id: parseInt(batchId) },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      batchId,
      failedModules,
      message: `${failedModules.length} module(s) prêt(s) pour retry`,
    });

  } catch (error) {
    console.error("BATCH RETRY ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
}
