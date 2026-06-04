export function parseCourse(text) {
  const get = (regex) => text.match(regex)?.[1]?.trim() || "";

  const course = {
    title: get(/COURSE_TITLE:\s*(.*)/i),
    description: get(/DESCRIPTION:\s*(.*)/i),
    objectifs: get(/OBJECTIFS:\s*([\s\S]*?)CHAPTER_START:/i),
    chapters: [],
  };

  const chapterRegex =
    /CHAPTER_START:\s*(\d+)[\s\S]*?CHAPTER_TITLE:\s*(.*?)[\s\S]*?CONTENT_TEXT:\s*([\s\S]*?)(?=CHAPTER_END)/gi;

  let match;

  while ((match = chapterRegex.exec(text)) !== null) {
    const chapterText = match[0];

    const chapter = {
      title: match[2].trim(),
      content: match[3].trim(),

      supports: extractSupports(chapterText),
      quiz: extractQuiz(chapterText),
      devoir: extractDevoir(chapterText),
    };

    course.chapters.push(chapter);
  }

  course.quizSommatif = extractSommatif(text);

  return course;
}

/* ===================== SUPPORTS ===================== */

function extractSupports(text) {
  const supports = [];

  const video = text.match(/SUPPORT_VIDEO:\s*(.*)/i)?.[1];
  if (video) supports.push({ type: "VIDEO", url: video });

  const image = text.match(/SUPPORT_IMAGE:\s*(.*)/i)?.[1];
  if (image) supports.push({ type: "IMAGE", url: image });

  const pdf = text.match(/SUPPORT_PDF:\s*(.*)/i)?.[1];
  if (pdf) supports.push({ type: "PDF", url: pdf });

  const content = text.match(/CONTENT_TEXT:\s*([\s\S]*?)SUPPORT_/i)?.[1];
  if (content) supports.push({ type: "TEXTE", content });

  return supports;
}

/* ===================== QUIZ ===================== */

function extractQuiz(text) {
  const block = text.match(/QUIZ_FORMATIF:\s*([\s\S]*?)(DEVOIR:|CHAPTER_END)/i)?.[1];

  if (!block) return null;

  return {
    type: "FORMATIF",
    question: block.match(/Q:\s*(.*)/i)?.[1],
    choices: block.match(/[A-D]:\s*(.*)/gi)?.map(c => c.split(":")[1].trim()) || [],
    answer: block.match(/ANSWER:\s*(.*)/i)?.[1],
  };
}

/* ===================== DEVOIR ===================== */

function extractDevoir(text) {
  return text.match(/DEVOIR:\s*([\s\S]*?)(CHAPTER_END|CHAPTER_START|QUIZ_SOMMATIF)/i)?.[1] || null;
}

/* ===================== SOMMATIF ===================== */

function extractSommatif(text) {
  const block = text.match(/QUIZ_SOMMATIF:\s*([\s\S]*)/i)?.[1];

  if (!block) return null;

  return {
    type: "SOMMATIF",
    question: block.match(/Q:\s*(.*)/i)?.[1],
    choices: block.match(/[A-D]:\s*(.*)/gi)?.map(c => c.split(":")[1].trim()) || [],
    answer: block.match(/ANSWER:\s*(.*)/i)?.[1],
  };
}