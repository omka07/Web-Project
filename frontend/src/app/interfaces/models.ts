export interface User {
  id: number;
  username: string;
  email?: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface Choice {
  id: number;
  text: string;
  is_correct: boolean;
}

export interface Question {
  id: number;
  text: string;
  choices: Choice[];
}

export interface Quiz {
  id: number;
  title: string;
  room_code?: string;
  category: number; // Foreign key to Category
  created_by?: number; // Read-only from API
  created_at?: string;
  questions?: Question[];
}

export interface QuizStatistics {
  total_quizzes: number;
  total_attempts: number;
}

export interface UserScore {
  username: string;
  total_score: number;
}
