import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location, DatePipe } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Quiz } from '../../interfaces/models';

@Component({
  selector: 'app-quiz-detail',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="container detail-container">
      <button class="btn-secondary back-btn" (click)="goBack()">&larr; Back to Quizzes</button>

      @if (isLoading) {
        <div class="loading">Loading quiz details...</div>
      } @else if (errorMsg) {
        <div class="error-msg card">{{ errorMsg }}</div>
      } @else if (quiz) {
        <div class="card detail-card">
          <h2>{{ quiz.title }}</h2>
          <div class="info-group">
            <p><strong>Category ID:</strong> {{ quiz.category }}</p>
            <p><strong>Created By User ID:</strong> {{ quiz.created_by }}</p>
            <p><strong>Created At:</strong> {{ quiz.created_at | date:'medium' }}</p>
          </div>
          
          <div class="action-bar">
            <!-- Example of another interaction -->
            <button class="btn-primary">Start Quiz</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .detail-container {
      max-width: 800px;
      margin: 2rem auto;
    }
    .back-btn {
      margin-bottom: 1.5rem;
    }
    .detail-card {
      padding: 3rem 2rem;
    }
    .detail-card h2 {
      margin-top: 0;
      color: #2c3e50;
      font-size: 2rem;
      border-bottom: 2px solid #e9ecef;
      padding-bottom: 1rem;
      margin-bottom: 1.5rem;
    }
    .info-group p {
      margin: 0.8rem 0;
      color: #495057;
      font-size: 1.1rem;
    }
    .action-bar {
      margin-top: 3rem;
      text-align: right;
    }
    .error-msg {
      background-color: #f8d7da;
      color: #721c24;
    }
  `]
})
export class QuizDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private apiService = inject(ApiService);
  private location = inject(Location);

  quiz: Quiz | null = null;
  isLoading = true;
  errorMsg = '';

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.loadQuiz(parseInt(idParam, 10));
    }
  }

  loadQuiz(id: number) {
    this.apiService.getQuiz(id).subscribe({
      next: (data) => {
        this.quiz = data;
        this.isLoading = false;
      },
      error: () => {
        this.errorMsg = 'Failed to load quiz details.';
        this.isLoading = false;
      }
    });
  }

  goBack() {
    this.location.back();
  }
}
