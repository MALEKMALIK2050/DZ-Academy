-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'DESIGNER', 'TEACHER', 'STUDENT');

-- CreateEnum
CREATE TYPE "NiveauScolaire" AS ENUM ('PRIMAIRE', 'CEM', 'LYCEE', 'BAC', 'LICENCE', 'MASTER', 'DOCTORAT');

-- CreateEnum
CREATE TYPE "StatutProfil" AS ENUM ('INCOMPLET', 'PARTIELLEMENT_COMPLET', 'COMPLET');

-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SupportType" AS ENUM ('PDF', 'VIDEO', 'IMAGE', 'PPT', 'SCORM', 'ARTICULATE', 'TEXTE', 'FORUM');

-- CreateEnum
CREATE TYPE "QuizType" AS ENUM ('FORMATIF', 'SOMMATIF');

-- CreateEnum
CREATE TYPE "ForumType" AS ENUM ('OPEN', 'QA', 'DEBATE', 'BRAINSTORM');

-- CreateEnum
CREATE TYPE "ForumPosition" AS ENUM ('START', 'AFTER_VIDEO', 'AFTER_IMAGE', 'AFTER_TEXT', 'AFTER_QCM', 'AFTER_DEVOIR', 'END');

-- CreateEnum
CREATE TYPE "ForumStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "niveau" TEXT,
    "annee" TEXT,
    "classe" TEXT,
    "niveauScolaire" "NiveauScolaire",
    "matieres" TEXT[],
    "niveaux" TEXT[],
    "ecole" TEXT,
    "tuteurNom" TEXT,
    "tuteurPrenom" TEXT,
    "tuteurTelephone" TEXT,
    "adresse" TEXT,
    "codePostal" TEXT,
    "ville" TEXT,
    "pays" TEXT DEFAULT 'Algérie',
    "telephone" TEXT,
    "dateNaissance" TEXT,
    "lieuNaissance" TEXT,
    "photo" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "profilComplet" BOOLEAN NOT NULL DEFAULT false,
    "statutProfil" "StatutProfil" NOT NULL DEFAULT 'INCOMPLET',
    "pourcentageCompletion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "designerId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "coverImage" TEXT,
    "objectifs" TEXT,
    "status" "CourseStatus" NOT NULL DEFAULT 'DRAFT',
    "annee" TEXT,
    "matiere" TEXT,
    "niveau" TEXT,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chapter" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "courseId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "objectifs" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Devoir" (
    "id" SERIAL NOT NULL,
    "titre" TEXT NOT NULL,
    "consigne" TEXT NOT NULL,
    "dateLimit" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chapterId" INTEGER NOT NULL,

    CONSTRAINT "Devoir_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DevoirRendu" (
    "id" SERIAL NOT NULL,
    "fichierUrl" TEXT NOT NULL,
    "fichierNom" TEXT NOT NULL,
    "fichierType" TEXT NOT NULL,
    "commentaire" TEXT,
    "note" DOUBLE PRECISION,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "devoirId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,

    CONSTRAINT "DevoirRendu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Support" (
    "id" SERIAL NOT NULL,
    "type" "SupportType" NOT NULL,
    "url" TEXT,
    "nom" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "chapterId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contenu" TEXT,
    "forumId" INTEGER,
    "videoId" TEXT,

    CONSTRAINT "Support_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoProgress" (
    "id" SERIAL NOT NULL,
    "progression" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "events" JSONB NOT NULL DEFAULT '[]',
    "lastPosition" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "studentId" INTEGER NOT NULL,
    "supportId" INTEGER NOT NULL,

    CONSTRAINT "VideoProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quiz" (
    "id" SERIAL NOT NULL,
    "type" "QuizType" NOT NULL,
    "chapterId" INTEGER,
    "courseId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" SERIAL NOT NULL,
    "texte" TEXT NOT NULL,
    "choix" TEXT[],
    "reponse" TEXT NOT NULL,
    "quizId" INTEGER NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 1,
    "type" TEXT NOT NULL DEFAULT 'QCM',

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizResult" (
    "id" SERIAL NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "reponses" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "studentId" INTEGER NOT NULL,
    "quizId" INTEGER NOT NULL,
    "tentatives" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "QuizResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" SERIAL NOT NULL,
    "progression" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "studentId" INTEGER NOT NULL,
    "courseId" INTEGER NOT NULL,
    "note" TEXT,
    "prixPaye" DOUBLE PRECISION,
    "statut" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    "typePaiement" TEXT,
    "valideAt" TIMESTAMP(3),
    "validePar" INTEGER,
    "progress" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChapterProgress" (
    "id" SERIAL NOT NULL,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "luAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "studentId" INTEGER NOT NULL,
    "chapterId" INTEGER NOT NULL,

    CONSTRAINT "ChapterProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "senderId" INTEGER NOT NULL,
    "receiverId" INTEGER,
    "lu" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupMessage" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "groupType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "senderId" INTEGER NOT NULL,

    CONSTRAINT "GroupMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Forum" (
    "id" SERIAL NOT NULL,
    "courseId" INTEGER,
    "allowAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "chapitreId" INTEGER NOT NULL,
    "closeAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" INTEGER NOT NULL,
    "description" TEXT,
    "isModerated" BOOLEAN NOT NULL DEFAULT false,
    "isPeerReview" BOOLEAN NOT NULL DEFAULT false,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "notifyTeacher" BOOLEAN NOT NULL DEFAULT true,
    "openAt" TIMESTAMP(3),
    "position" "ForumPosition" NOT NULL DEFAULT 'END',
    "status" "ForumStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "type" "ForumType" NOT NULL DEFAULT 'OPEN',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Forum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumPost" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "forumId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "depth" INTEGER NOT NULL DEFAULT 0,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "isApproved" BOOLEAN NOT NULL DEFAULT true,
    "isFeedback" BOOLEAN NOT NULL DEFAULT false,
    "parentId" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "feedback" TEXT,
    "grade" INTEGER,
    "gradedAt" TIMESTAMP(3),
    "gradedById" INTEGER,

    CONSTRAINT "ForumPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumPostLike" (
    "id" SERIAL NOT NULL,
    "postId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForumPostLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseIntroduction" (
    "id" SERIAL NOT NULL,
    "contenu" TEXT NOT NULL,
    "courseId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseIntroduction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pretest" (
    "id" SERIAL NOT NULL,
    "courseId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pretest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PretestQuestion" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'QCM',
    "texte" TEXT NOT NULL,
    "choix" TEXT[],
    "reponse" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 1,
    "pretestId" INTEGER NOT NULL,

    CONSTRAINT "PretestQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PretestResult" (
    "id" SERIAL NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "pourcentage" DOUBLE PRECISION NOT NULL,
    "reponses" JSONB NOT NULL,
    "studentId" INTEGER NOT NULL,
    "courseId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PretestResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Paragraphe" (
    "id" SERIAL NOT NULL,
    "titre" TEXT,
    "contenu" TEXT NOT NULL,
    "imageUrl" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "chapterId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Paragraphe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseImport" (
    "id" SERIAL NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROCESSING',
    "rawText" TEXT,
    "resultJson" JSONB,
    "courseId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" SERIAL NOT NULL,
    "courseId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "chaptersStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "pretestStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "formativeStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "summativeStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "chaptersError" TEXT,
    "pretestError" TEXT,
    "formativeError" TEXT,
    "summativeError" TEXT,
    "chaptersCreated" INTEGER NOT NULL DEFAULT 0,
    "pretestCreated" INTEGER NOT NULL DEFAULT 0,
    "formativeCreated" INTEGER NOT NULL DEFAULT 0,
    "summativeCreated" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Remediation" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "quizId" INTEGER NOT NULL,
    "courseId" INTEGER NOT NULL,
    "teacherId" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "messageEtudiant" TEXT NOT NULL,
    "reponseEnseignant" TEXT,
    "erreursDetail" JSONB NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    "debloqueLe" TIMESTAMP(3),
    "debloqueParId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Remediation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "lien" TEXT,
    "remediationId" INTEGER,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "contenu" TEXT,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_TeacherCourses" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_active_idx" ON "User"("active");

-- CreateIndex
CREATE INDEX "User_niveauScolaire_idx" ON "User"("niveauScolaire");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DevoirRendu_devoirId_studentId_key" ON "DevoirRendu"("devoirId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "VideoProgress_studentId_supportId_key" ON "VideoProgress"("studentId", "supportId");

-- CreateIndex
CREATE UNIQUE INDEX "Quiz_chapterId_key" ON "Quiz"("chapterId");

-- CreateIndex
CREATE UNIQUE INDEX "Quiz_courseId_key" ON "Quiz"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "QuizResult_studentId_quizId_key" ON "QuizResult"("studentId", "quizId");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_studentId_courseId_key" ON "Enrollment"("studentId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "ChapterProgress_studentId_chapterId_key" ON "ChapterProgress"("studentId", "chapterId");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

-- CreateIndex
CREATE INDEX "Message_receiverId_idx" ON "Message"("receiverId");

-- CreateIndex
CREATE INDEX "idx_forum_chapitre" ON "Forum"("chapitreId");

-- CreateIndex
CREATE INDEX "idx_forum_createdBy" ON "Forum"("createdById");

-- CreateIndex
CREATE INDEX "Forum_chapitreId_idx" ON "Forum"("chapitreId");

-- CreateIndex
CREATE INDEX "Forum_createdById_idx" ON "Forum"("createdById");

-- CreateIndex
CREATE INDEX "ForumPost_forumId_idx" ON "ForumPost"("forumId");

-- CreateIndex
CREATE INDEX "ForumPost_parentId_idx" ON "ForumPost"("parentId");

-- CreateIndex
CREATE INDEX "ForumPost_authorId_idx" ON "ForumPost"("authorId");

-- CreateIndex
CREATE INDEX "ForumPostLike_postId_idx" ON "ForumPostLike"("postId");

-- CreateIndex
CREATE INDEX "ForumPostLike_userId_idx" ON "ForumPostLike"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ForumPostLike_postId_userId_key" ON "ForumPostLike"("postId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseIntroduction_courseId_key" ON "CourseIntroduction"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "Pretest_courseId_key" ON "Pretest"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "PretestResult_studentId_courseId_key" ON "PretestResult"("studentId", "courseId");

-- CreateIndex
CREATE INDEX "Paragraphe_chapterId_idx" ON "Paragraphe"("chapterId");

-- CreateIndex
CREATE INDEX "Remediation_studentId_quizId_idx" ON "Remediation"("studentId", "quizId");

-- CreateIndex
CREATE INDEX "Remediation_teacherId_statut_idx" ON "Remediation"("teacherId", "statut");

-- CreateIndex
CREATE INDEX "Remediation_courseId_idx" ON "Remediation"("courseId");

-- CreateIndex
CREATE INDEX "Notification_userId_lu_idx" ON "Notification"("userId", "lu");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "_TeacherCourses_AB_unique" ON "_TeacherCourses"("A", "B");

-- CreateIndex
CREATE INDEX "_TeacherCourses_B_index" ON "_TeacherCourses"("B");

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_designerId_fkey" FOREIGN KEY ("designerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Devoir" ADD CONSTRAINT "Devoir_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevoirRendu" ADD CONSTRAINT "DevoirRendu_devoirId_fkey" FOREIGN KEY ("devoirId") REFERENCES "Devoir"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevoirRendu" ADD CONSTRAINT "DevoirRendu_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Support" ADD CONSTRAINT "Support_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Support" ADD CONSTRAINT "Support_forumId_fkey" FOREIGN KEY ("forumId") REFERENCES "Forum"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoProgress" ADD CONSTRAINT "VideoProgress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoProgress" ADD CONSTRAINT "VideoProgress_supportId_fkey" FOREIGN KEY ("supportId") REFERENCES "Support"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizResult" ADD CONSTRAINT "QuizResult_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizResult" ADD CONSTRAINT "QuizResult_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterProgress" ADD CONSTRAINT "ChapterProgress_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterProgress" ADD CONSTRAINT "ChapterProgress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMessage" ADD CONSTRAINT "GroupMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Forum" ADD CONSTRAINT "Forum_chapitreId_fkey" FOREIGN KEY ("chapitreId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Forum" ADD CONSTRAINT "Forum_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Forum" ADD CONSTRAINT "Forum_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumPost" ADD CONSTRAINT "ForumPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumPost" ADD CONSTRAINT "ForumPost_forumId_fkey" FOREIGN KEY ("forumId") REFERENCES "Forum"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumPost" ADD CONSTRAINT "ForumPost_gradedById_fkey" FOREIGN KEY ("gradedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumPost" ADD CONSTRAINT "ForumPost_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ForumPost"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ForumPostLike" ADD CONSTRAINT "ForumPostLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ForumPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumPostLike" ADD CONSTRAINT "ForumPostLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseIntroduction" ADD CONSTRAINT "CourseIntroduction_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pretest" ADD CONSTRAINT "Pretest_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PretestQuestion" ADD CONSTRAINT "PretestQuestion_pretestId_fkey" FOREIGN KEY ("pretestId") REFERENCES "Pretest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PretestResult" ADD CONSTRAINT "PretestResult_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PretestResult" ADD CONSTRAINT "PretestResult_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paragraphe" ADD CONSTRAINT "Paragraphe_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Remediation" ADD CONSTRAINT "Remediation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Remediation" ADD CONSTRAINT "Remediation_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Remediation" ADD CONSTRAINT "Remediation_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Remediation" ADD CONSTRAINT "Remediation_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TeacherCourses" ADD CONSTRAINT "_TeacherCourses_A_fkey" FOREIGN KEY ("A") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TeacherCourses" ADD CONSTRAINT "_TeacherCourses_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
