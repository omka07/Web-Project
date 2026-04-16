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

export interface Quiz {
  id: number;
  title: string;
  category: number; // Foreign key to Category
  created_by?: number; // Read-only from API
  created_at?: string;
}

export interface QuizStatistics {
  total_quizzes: number;
  total_attempts: number;
}

export interface UserScore {
  username: string;
  total_score: number;
}
