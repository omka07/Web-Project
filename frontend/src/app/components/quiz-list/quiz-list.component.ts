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
        <div>
          <h2>Your quizzes</h2>
          <p class="sub">Your quizzes.</p>
        </div>
        <button class="btn-primary" (click)="joinRoom()">Join a room</button>
      </div>

      @if (errorMessage) {
        <div class="error-banner">{{ errorMessage }}</div>
      }

      @if (copiedCode) {
        <div class="toast">Code {{ copiedCode }} copied to clipboard</div>
      }

      <div class="card create-quiz-section">
        <h3>Create new quiz</h3>
        <div class="form-row">
          <div class="form-group">
            <label for="new-title">Title</label>
            <input id="new-title" type="text" [(ngModel)]="newQuizTitle" placeholder="e.g. General Knowledge">
          </div>
          <div class="form-group">
            <label for="new-cat">Category</label>
            <select id="new-cat" [(ngModel)]="newQuizCategory" [disabled]="categories.length === 0">
              @if (categories.length === 0) {
                <option [ngValue]="null" disabled selected>No categories yet</option>
              } @else {
                <option [ngValue]="null" disabled selected>Pick a category…</option>
                @for (c of categories; track c.id) {
                  <option [ngValue]="c.id">{{ c.name }}</option>
                }
              }
            </select>
          </div>
          <div class="form-group submit-group">
            <button class="btn-primary" (click)="onCreateQuiz()" [disabled]="isCreating || !canCreate()">
              @if (isCreating) {
                <span class="spinner inline"></span>Creating…
              } @else {
                Create
              }
            </button>
          </div>
        </div>
      </div>

      @if (isLoading) {
        <div class="loading"><div class="spinner"></div> Loading quizzes…</div>
      } @else {
        <div class="quiz-grid">
          @for (quiz of quizzes; track quiz.id) {
            <div class="card quiz-card">
              <div class="card-header">
                <h3>{{ quiz.title }}</h3>
                @if (quiz.room_code) {
                  <button
                    class="room-code-badge"
                    type="button"
                    (click)="copyCode(quiz.room_code!)"
                    title="Click to copy"
                  >
                    <span class="code-label">Code</span>
                    <strong>{{ quiz.room_code }}</strong>
                  </button>
                }
              </div>
              <p class="meta">
                <span>{{ categoryName(quiz.category) }}</span>
                <span class="dot">·</span>
                <span>{{ questionCount(quiz) }} question{{ questionCount(quiz) === 1 ? '' : 's' }}</span>
              </p>
              <div class="actions">
                <button class="btn-ghost" (click)="viewQuiz(quiz.id)">View</button>
                <button class="btn-primary" (click)="playQuiz(quiz.id)">Play</button>
                <button class="btn-danger" (click)="onDeleteQuiz(quiz.id)">Delete</button>
              </div>
            </div>
          } @empty {
            <div class="empty-state card">
              <h3>No quizzes yet</h3>
              <p>Create your first quiz above, then share its code so players can join.</p>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .container { max-width: 1100px; margin: 0 auto; }

    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .header-section h2 { margin: 0; }
    .sub {
      margin: 0.25rem 0 0;
      color: var(--color-text-muted);
      font-size: var(--text-sm);
    }

    .error-banner {
      background: #fee2e2;
      color: #991b1b;
      border: 1px solid #fecaca;
      padding: 0.75rem 1rem;
      border-radius: var(--radius-sm);
      margin-bottom: 1rem;
    }

    .toast {
      position: fixed;
      right: 1.25rem;
      bottom: 1.25rem;
      background: var(--color-text);
      color: white;
      padding: 0.65rem 1rem;
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      font-size: var(--text-sm);
      z-index: 1000;
      animation: fade-in 0.2s ease;
    }
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(4px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .create-quiz-section {
      margin-bottom: 2rem;
    }
    .create-quiz-section h3 {
      margin-bottom: 1rem;
    }
    .form-row {
      display: grid;
      grid-template-columns: 2fr 1fr auto;
      gap: 1rem;
      align-items: end;
    }
    .form-row .form-group { margin-bottom: 0; }
    .submit-group {
      align-self: end;
    }
    .submit-group button { width: 100%; }

    @media (max-width: 640px) {
      .form-row { grid-template-columns: 1fr; }
    }

    .quiz-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.25rem;
    }
    .quiz-card {
      display: flex;
      flex-direction: column;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }
    .card-header h3 {
      margin: 0;
    }
    .room-code-badge {
      display: inline-flex;
      align-items: baseline;
      gap: 0.4rem;
      background: var(--color-bg);
      color: var(--color-text);
      padding: 0.35rem 0.7rem;
      border: 1px dashed var(--color-border-strong);
      border-radius: var(--radius-sm);
      font-size: var(--text-sm);
      cursor: pointer;
      transition: background-color var(--transition-fast), border-color var(--transition-fast);
    }
    .room-code-badge:hover {
      background: #eef2f7;
      border-color: var(--color-primary);
    }
    .room-code-badge .code-label {
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: var(--text-xs);
    }
    .room-code-badge strong {
      font-family: "SF Mono", Menlo, Consolas, monospace;
      font-size: var(--text-base);
      letter-spacing: 0.1em;
    }

    .quiz-card .meta {
      color: var(--color-text-muted);
      font-size: var(--text-sm);
      margin: 0 0 1.25rem;
      flex-grow: 1;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      flex-wrap: wrap;
    }
    .meta .dot { opacity: 0.5; }

    .actions {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
    }
    .actions .btn-ghost {
      padding: 0.5rem 0.9rem;
    }
    .actions .btn-primary,
    .actions .btn-danger {
      padding: 0.5rem 0.9rem;
      font-size: var(--text-sm);
    }

    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 3rem 2rem;
      color: var(--color-text-muted);
    }
    .empty-state h3 {
      margin-bottom: 0.5rem;
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
  copiedCode: string | null = null;
  private copiedTimeout: ReturnType<typeof setTimeout> | null = null;

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

  categoryName(id: number): string {
    const cat = this.categories.find(c => c.id === id);
    return cat ? cat.name : `Category #${id}`;
  }

  questionCount(quiz: Quiz): number {
    return quiz.questions?.length ?? 0;
  }

  canCreate(): boolean {
    return this.newQuizTitle.trim().length > 0 && this.newQuizCategory != null;
  }

  onCreateQuiz() {
    if (!this.canCreate()) return;
    this.isCreating = true;
    const quizData = {
      title: this.newQuizTitle.trim(),
      category: this.newQuizCategory!,
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
    if (!confirm('Delete this quiz? This cannot be undone.')) return;
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

  viewQuiz(id: number) {
    this.router.navigate(['/quiz', id]);
  }

  playQuiz(id: number) {
    this.router.navigate(['/quiz', id, 'take']);
  }

  joinRoom() {
    this.router.navigate(['/join']);
  }

  copyCode(code: string) {
    navigator.clipboard.writeText(code).then(() => this.showCopiedToast(code));
  }

  private showCopiedToast(code: string) {
    this.copiedCode = code;
    if (this.copiedTimeout) clearTimeout(this.copiedTimeout);
    this.copiedTimeout = setTimeout(() => (this.copiedCode = null), 1800);
  }
}
