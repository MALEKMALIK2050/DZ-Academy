export async function generateCourseStructure(text) {
  // TITRE
  const titleMatch = text.match(/TITRE:\s*(.*)/i);

  // DESCRIPTION
  const descMatch = text.match(/DESCRIPTION:\s*([\s\S]*?)OBJECTIFS:/i);

  // OBJECTIFS
  const objectifsMatch = text.match(/OBJECTIFS:\s*([\s\S]*?)ANNEE:/i);

  const title = titleMatch
    ? titleMatch[1].trim()
    : "Cours sans titre";

  const description = descMatch
    ? descMatch[1].trim()
    : "";

  const objectifs = objectifsMatch
    ? objectifsMatch[1].trim()
    : "";

  // CHAPITRES
  const chapterRegex =
    /CHAPITRE\s*\d+\s*:\s*(.*?)(?=CHAPITRE\s*\d+\s*:|QUIZ SOMMATIF:|$)/gis;

  const chapters = [];

  let match;

  while ((match = chapterRegex.exec(text)) !== null) {
    const bloc = match[0];

    const chapterTitleMatch =
      bloc.match(/CHAPITRE\s*\d+\s*:\s*(.*)/i);

    const contentMatch =
      bloc.match(/SUPPORT TEXTE:\s*([\s\S]*?)(SUPPORT PDF:|SUPPORT VIDEO:|QUIZ FORMATIF:|$)/i);

    chapters.push({
      title: chapterTitleMatch
        ? chapterTitleMatch[1].trim()
        : "Chapitre",

      content: contentMatch
        ? contentMatch[1].trim()
        : "",
    });
  }

  return {
    title,
    description,
    objectifs,
    chapters,
  };
}