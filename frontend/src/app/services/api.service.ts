import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Quiz, QuizStatistics, UserScore } from '../interfaces/models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8000/api';

  // --- Quizzes ---

  getQuizzes(): Observable<Quiz[]> {
    return this.http.get<Quiz[]>(`${this.baseUrl}/quizzes/`);
  }

  createQuiz(quiz: Partial<Quiz>): Observable<Quiz> {
    return this.http.post<Quiz>(`${this.baseUrl}/quizzes/`, quiz);
  }

  getQuiz(id: number): Observable<Quiz> {
    return this.http.get<Quiz>(`${this.baseUrl}/quizzes/${id}/`);
  }

  updateQuiz(id: number, quiz: Partial<Quiz>): Observable<Quiz> {
    return this.http.put<Quiz>(`${this.baseUrl}/quizzes/${id}/`, quiz);
  }

  deleteQuiz(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/quizzes/${id}/`);
  }

  joinRoom(room_code: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/quizzes/join/`, { room_code });
  }

  submitAttempt(quizId: number, score: number, nickname: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/quizzes/${quizId}/attempt/`, { score, nickname });
  }

  // --- Stats and Score ---

  getQuizStats(): Observable<QuizStatistics> {
    return this.http.get<QuizStatistics>(`${this.baseUrl}/quizzes/stats/`);
  }

  getUserScore(): Observable<UserScore> {
    return this.http.get<UserScore>(`${this.baseUrl}/user/score/`);
  }
}
