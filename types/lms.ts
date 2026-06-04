// =============================================
// TYPES PARTAGÉS — LMS
// =============================================

export type BlockType = 'text' | 'pdf' | 'scorm' | 'qcm' | 'wiki' | 'forum';

export interface Block {
  id: string;
  type: BlockType;
  html?: string;
  file?: string | null;
  question?: string;
  opts?: string[];
  correct?: number;
  qtype?: 'single' | 'multi';
  title?: string;
  body?: string;
  tags?: string[];
  prompt?: string;
  scormVersion?: string;
  scormMinScore?: number;
  scormMaxAttempts?: number;
}

export interface Module {
  id: string;
  courseId: string;
  order: number;
  title: string;
  blocks: Block[];
}

export interface Course {
  id: string;
  emoji: string;
  color: string;
  tag: string;
  title: string;
  description?: string;
  moduleCount: number;
  duration: string;
  progress: number;
  instructor: string;
  level?: 'Débutant' | 'Intermédiaire' | 'Avancé';
  hasCertificate?: boolean;
}

export interface PretestQuestion {
  id: string;
  q: string;
  opts: string[];
}

export interface QuizQuestion {
  id: string;
  q: string;
  opts: string[];
  correct: number;
}

export interface ForumThread {
  id: string;
  author: string;
  initials: string;
  bg: string;
  col: string;
  title: string;
  preview: string;
  replies: number;
  time: string;
  likes: number;
}

export interface ForumPost {
  id: string;
  author: string;
  initials: string;
  bg: string;
  col: string;
  text: string;
  time: string;
}

export type ViewMode = 'editor' | 'split' | 'preview';
export type UserRole = 'designer' | 'learner' | 'admin';