// lib/pedagogicalParser.js

export function pedagogicalParser(text) {
  const lines = text.split("\n");

  const data = {
    title: "",
    matiere: "",
    niveau: "",
    annee: "",
    description: "",
    objectifs: [],
    chapters: [],
    quizSommatif: null,
  };

  let currentChapter = null;

  for (let raw of lines) {
    const line = raw.trim();

    if (!line) continue;

    if (line.startsWith("TITRE:")) {
      data.title = value(line);
    }

    else if (line.startsWith("MATIERE:")) {
      data.matiere = value(line);
    }

    else if (line.startsWith("NIVEAU:")) {
      data.niveau = value(line);
    }

    else if (line.startsWith("ANNEE:")) {
      data.annee = value(line);
    }

    else if (line.startsWith("DESCRIPTION:")) {
      data.description = value(line);
    }

    else if (line.startsWith("- ")) {
      data.objectifs.push(line.replace("- ", ""));
    }

    else if (line.startsWith("CHAPITRE:")) {
      if (currentChapter) {
        data.chapters.push(currentChapter);
      }

      currentChapter = {
        title: value(line),
        content: "",
        supports: [],
        quiz: null,
        devoir: "",
      };
    }

    else if (line.startsWith("CONTENU:")) {
      if (currentChapter) {
        currentChapter.content += value(line) + "\n";
      }
    }

    else if (line.startsWith("SUPPORT_VIDEO:")) {
      currentChapter?.supports.push({
        type: "VIDEO",
        url: value(line),
      });
    }

    else if (line.startsWith("SUPPORT_PDF:")) {
      currentChapter?.supports.push({
        type: "PDF",
        url: value(line),
      });
    }

    else if (line.startsWith("SUPPORT_IMAGE:")) {
      currentChapter?.supports.push({
        type: "IMAGE",
        url: value(line),
      });
    }

    else if (line.startsWith("SUPPORT_SCORM:")) {
      currentChapter?.supports.push({
        type: "SCORM",
        url: value(line),
      });
    }

    else if (line.startsWith("SUPPORT_ARTICULATE:")) {
      currentChapter?.supports.push({
        type: "ARTICULATE",
        url: value(line),
      });
    }

    else if (line.startsWith("SUPPORT_FORUM:")) {
      currentChapter?.supports.push({
        type: "FORUM",
        content: value(line),
      });
    }

    else if (line.startsWith("SUPPORT_TEXTE:")) {
      currentChapter?.supports.push({
        type: "TEXT",
        content: value(line),
      });
    }

    else if (line.startsWith("QUIZ_FORMATIF:")) {
      currentChapter.quiz = {
        question: "",
        choices: [],
        answer: "",
      };
    }

    else if (line.startsWith("QUESTION:")) {
      if (currentChapter?.quiz && !currentChapter.quiz.question) {
        currentChapter.quiz.question = value(line);
      } else {
        data.quizSommatif = {
          question: value(line),
          choices: [],
          answer: "",
        };
      }
    }

    else if (line.startsWith("CHOIX:")) {
      continue;
    }

    else if (line.startsWith("REPONSE:")) {
      if (currentChapter?.quiz && !currentChapter.quiz.answer) {
        currentChapter.quiz.answer = value(line);
      } else if (data.quizSommatif) {
        data.quizSommatif.answer = value(line);
      }
    }

    else if (line.startsWith("QUIZ_SOMMATIF:")) {
      data.quizSommatif = {
        question: "",
        choices: [],
        answer: "",
      };
    }

    else if (line.startsWith("DEVOIR:")) {
      if (currentChapter) {
        currentChapter.devoir = value(line);
      }
    }

    else if (line.startsWith("-")) {
      const choice = line.replace("-", "").trim();

      if (currentChapter?.quiz && !currentChapter.quiz.answer) {
        currentChapter.quiz.choices.push(choice);
      } else if (data.quizSommatif) {
        data.quizSommatif.choices.push(choice);
      }
    }

    else {
      if (currentChapter) {
        currentChapter.content += line + "\n";
      }
    }
  }

  if (currentChapter) {
    data.chapters.push(currentChapter);
  }

  return data;
}

function value(line) {
  return line.split(":").slice(1).join(":").trim();
}