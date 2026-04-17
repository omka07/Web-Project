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
          <div class="header-row">
            <h2>{{ quiz.title }}</h2>
            @if (quiz.room_code) {
              <div class="room-code-box" (click)="copyCode(quiz.room_code)" title="Click to copy">
                <span class="label">Room Code</span>
                <span class="code">{{ quiz.room_code }}</span>
                <span class="copy-hint" [class.copied]="copied">{{ copied ? 'Copied!' : 'Click to copy' }}</span>
              </div>
            }
          </div>
          <div class="info-group">
            <p><strong>Category ID:</strong> {{ quiz.category }}</p>
            <p><strong>Created By User ID:</strong> {{ quiz.created_by }}</p>
            <p><strong>Created At:</strong> {{ quiz.created_at | date:'medium' }}</p>
          </div>
          
          <div class="action-bar">
            <!-- Example of another interaction -->
            <button class="btn-primary" (click)="startQuiz()">Start Quiz</button>
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
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #e9ecef;
      padding-bottom: 1rem;
      margin-bottom: 1.5rem;
    }
    .header-row h2 {
      margin-top: 0;
      color: #2c3e50;
      font-size: 2rem;
      border: none;
      padding: 0;
      margin-bottom: 0;
    }
    .room-code-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      background-color: #f8f9fa;
      border: 2px dashed #dee2e6;
      border-radius: 8px;
      padding: 0.75rem 1.5rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .room-code-box:hover {
      background-color: #e9ecef;
      border-color: #adb5bd;
    }
    .room-code-box .label {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #6c757d;
      margin-bottom: 0.25rem;
    }
    .room-code-box .code {
      font-size: 2rem;
      font-weight: 700;
      color: #007bff;
      letter-spacing: 0.25rem;
    }
    .room-code-box .copy-hint {
      font-size: 0.75rem;
      color: #adb5bd;
      margin-top: 0.25rem;
    }
    .room-code-box .copy-hint.copied {
      color: #28a745;
      font-weight: bold;
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
  private router = inject(Router);
  private apiService = inject(ApiService);
  private location = inject(Location);

  quiz: Quiz | null = null;
  isLoading = true;
  errorMsg = '';
  copied = false;

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

  copyCode(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      this.copied = true;
      setTimeout(() => this.copied = false, 2000);
    }).catch(err => {
      console.error('Could not copy text: ', err);
    });
  }

  startQuiz() {
    if (this.quiz) {
      this.router.navigate(['/quiz', this.quiz.id, 'take']);
    }
  }

  goBack() {
    this.location.back();
  }
}
