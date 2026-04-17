import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Category, Quiz } from '../../interfaces/models';

@Component({
  selector: 'app-quiz-list',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="container">
      <div class="header-section">
        <h2>Available Quizzes</h2>
        <button class="btn-primary" (click)="joinRoom()">Join a room</button>
      </div>

      @if (errorMessage) {
        <div class="error-msg card" style="margin-bottom: 1rem; color: #dc3545; background-color: #f8d7da;">
          {{ errorMessage }}
        </div>
      }

      <div class="card create-quiz-section">
        <h3>Create New Quiz</h3>
        <div class="form-row">
          <div class="form-group">
            <input type="text" [(ngModel)]="newQuizTitle" placeholder="Quiz Title">
          </div>
          <div class="form-group">
            <select [(ngModel)]="newQuizCategory" [disabled]="categories.length === 0">
              @if (categories.length === 0) {
                <option [ngValue]="null" disabled selected>
                  No categories yet — add one in Django admin
                </option>
              } @else {
                <option [ngValue]="null" disabled selected>Pick a category…</option>
                @for (c of categories; track c.id) {
                  <option [ngValue]="c.id">{{ c.name }}</option>
                }
              }
            </select>
          </div>
          <!-- API call #2 -->
          <button class="btn-primary" (click)="onCreateQuiz()" [disabled]="isCreating">
            @if (isCreating) { Creating... } @else { Create }
          </button>
        </div>
      </div>

      @if (isLoading) {
        <div class="loading">Loading quizzes...</div>
      } @else {
        <div class="quiz-grid">
          @for (quiz of quizzes; track quiz.id) {
            <div class="card quiz-card">
              <div class="card-header">
                <h3>{{ quiz.title }}</h3>
                @if (quiz.room_code) {
                  <span class="room-code-badge" (click)="copyCode(quiz.room_code)" title="Click to copy">
                    Code: <strong>{{ quiz.room_code }}</strong>
                  </span>
                }
              </div>
              <p class="meta">Category ID: {{ quiz.category }}</p>
              <div class="actions">
                <button class="btn-secondary" (click)="viewQuiz(quiz.id)">View Details</button>
                <!-- API call #3 -->
                <button class="btn-danger" (click)="onDeleteQuiz(quiz.id)">Delete</button>
              </div>
            </div>
          } @empty {
            <div class="empty-state card">
              <p>No quizzes available yet.</p>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }
    .create-quiz-section {
      margin-bottom: 2rem;
      background: #f8f9fa;
    }
    .form-row {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }
    .form-row .form-group {
      flex: 1;
      margin-bottom: 0;
    }
    .quiz-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }
    .quiz-card {
      display: flex;
      flex-direction: column;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
    }
    .card-header h3 {
      margin-top: 0;
      margin-bottom: 0.5rem;
    }
    .room-code-badge {
      background-color: #e9ecef;
      color: #495057;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    .room-code-badge:hover {
      background-color: #ced4da;
    }
    .quiz-card .meta {
      color: #6c757d;
      font-size: 0.9rem;
      margin-bottom: 1.5rem;
      flex-grow: 1;
    }
    .actions {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
    }
    .empty-state {
      text-align: center;
      padding: 3rem;
      color: #6c757d;
    }
  `]
})
export class QuizListComponent implements OnInit {
  private apiService = inject(ApiService);
  private router = inject(Router);

  quizzes: Quiz[] = [];
  categories: Category[] = [];
  isLoading = true;
  isCreating = false;
  errorMessage = '';

  newQuizTitle = '';
  newQuizCategory: number | null = null;

  ngOnInit() {
    this.loadQuizzes();
    this.loadCategories();
  }

  loadCategories() {
    this.apiService.getCategories().subscribe({
      next: (data) => (this.categories = data),
      error: () => (this.categories = []),
    });
  }

  loadQuizzes() {
    this.isLoading = true;
    this.apiService.getQuizzes().subscribe({
      next: (data) => {
        this.quizzes = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  onCreateQuiz() {
    if (!this.newQuizTitle || !this.newQuizCategory) return;
    
    this.isCreating = true;
    const quizData = {
      title: this.newQuizTitle,
      category: this.newQuizCategory
    };

    this.apiService.createQuiz(quizData).subscribe({
      next: (newQuiz) => {
        this.quizzes.push(newQuiz);
        this.newQuizTitle = '';
        this.newQuizCategory = null;
        this.isCreating = false;
        this.errorMessage = '';
      },
      error: (err) => {
        this.isCreating = false;
        if (err.status === 0 || err.status >= 500) {
          this.errorMessage = 'Server error while creating quiz.';
        } else {
          this.errorMessage = 'Failed to create quiz.';
        }
      }
    });
  }

  onDeleteQuiz(id: number) {
    if (confirm('Are you sure you want to delete this quiz?')) {
      this.apiService.deleteQuiz(id).subscribe({
        next: () => {
          this.quizzes = this.quizzes.filter(q => q.id !== id);
          this.errorMessage = '';
        },
        error: (err) => {
          if (err.status === 0 || err.status >= 500) {
            this.errorMessage = 'Server error while deleting quiz.';
          } else {
            this.errorMessage = 'Failed to delete quiz. You might not have permission.';
          }
        }
      });
    }
  }

  viewQuiz(id: number) {
    this.router.navigate(['/quiz', id]);
  }

  joinRoom() {
    this.router.navigate(['/join']);
  }

  copyCode(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      // Optional: Add a small toast or visual feedback here
      console.log('Room code copied to clipboard');
    }).catch(err => {
      console.error('Could not copy text: ', err);
    });
  }
}
