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
  // `is_correct` is intentionally absent: the backend no longer exposes it
  // to clients so players can't peek at the answer.
}

export interface AnswerSubmission {
  question_id: number;
  choice_id: number | null;
  response_time_ms: number;
}

export interface AttemptResult {
  id: number;
  score: number;
  correct_count: number;
  total: number;
}

export interface LeaderboardEntry {
  id: number;
  nickname: string;
  score: number;
  completed_at: string;
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
