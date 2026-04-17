import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { PlayerService } from '../../services/player.service';
import { AnswerSubmission, AttemptResult, Quiz } from '../../interfaces/models';

const QUESTION_SECONDS = 20;

@Component({
  selector: 'app-take-quiz',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="container take-quiz-container">
      @if (isLoading) {
        <div class="loading">Loading quiz...</div>
      } @else if (errorMsg) {
        <div class="error-msg card">{{ errorMsg }}</div>
        <button class="btn-secondary" (click)="goBack()">Go Back</button>
      } @else if (quiz) {
        <div class="card quiz-card">
          <div class="quiz-header">
            <h2>{{ quiz.title }}</h2>
            @if (nickname) {
              <span class="player-badge">
                Playing as: <strong>{{ nickname }}</strong>
              </span>
            }
          </div>

          @if (!isFinished()) {
            <div class="progress-row">
              <span>
                Question {{ currentQuestionIndex + 1 }} of {{ questionCount() }}
              </span>
              <span class="timer" [class.warning]="timeLeft <= 5">
                {{ timeLeft }}s
              </span>
            </div>

            <div class="question-container">
              <h3>{{ currentQuestion()?.text }}</h3>

              <div class="choices">
                @for (choice of currentQuestion()?.choices; track choice.id) {
                  <label class="choice-label">
                    <input
                      type="radio"
                      [name]="'q' + (currentQuestion()?.id)"
                      [value]="choice.id"
                      [(ngModel)]="selectedChoiceId"
                    >
                    {{ choice.text }}
                  </label>
                }
              </div>

              <div class="actions">
                <button
                  class="btn-primary"
                  (click)="nextQuestion()"
                  [disabled]="!selectedChoiceId || isSubmitting"
                >
                  @if (isSubmitting) {
                    Submitting...
                  } @else {
                    {{ isLastQuestion ? 'Finish Quiz' : 'Next Question' }}
                  }
                </button>
              </div>
            </div>
          } @else {
            <div class="finished-container">
              <h3>Quiz Finished!</h3>
              @if (result) {
                <p class="big-score">{{ result.score }}</p>
                <p class="hint">points</p>
                <p class="meta">
                  {{ result.correct_count }} correct out of {{ result.total }}
                </p>
              } @else {
                <p class="meta">Your score couldn't be saved to the server.</p>
              }
              <button class="btn-primary" (click)="goBack()">Back to Quizzes</button>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .take-quiz-container { max-width: 600px; margin: 2rem auto; }
    .quiz-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      border-bottom: 1px solid #eee;
      padding-bottom: 1rem;
      margin-bottom: 1rem;
    }
    .quiz-header h2 { margin: 0; }
    .player-badge {
      background-color: #e9ecef;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.9rem;
      color: #495057;
    }
    .progress-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 1rem;
    }
    .timer {
      font-size: 2rem;
      font-weight: bold;
      color: #2c3e50;
      transition: color 0.2s;
    }
    .timer.warning { color: #e74c3c; }
    .question-container { margin-top: 1rem; }
    .choices {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin: 1.5rem 0;
    }
    .choice-label {
      padding: 1rem;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      cursor: pointer;
    }
    .choice-label:hover { background-color: #f8f9fa; }
    .actions { margin-top: 2rem; text-align: right; }
    .finished-container { text-align: center; padding: 2rem; }
    .finished-container h3 { color: #28a745; margin-bottom: 1rem; }
    .big-score {
      font-size: 4rem;
      font-weight: bold;
      color: #3498db;
      margin: 0.5rem 0;
    }
    .hint, .meta { color: #6c757d; margin: 0.25rem 0; }
  `]
})
export class TakeQuizComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(ApiService);
  private playerService = inject(PlayerService);

  quiz: Quiz | null = null;
  isLoading = true;
  errorMsg = '';

  currentQuestionIndex = 0;
  selectedChoiceId: number | null = null;
  nickname = '';

  timeLeft = QUESTION_SECONDS;
  isSubmitting = false;
  result: AttemptResult | null = null;

  private questionStartMs = 0;
  private answers: AnswerSubmission[] = [];
  private timerId: ReturnType<typeof setInterval> | null = null;
  private finished = false;

  ngOnInit() {
    this.nickname = this.playerService.nickname() || '';
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.loadQuiz(parseInt(idParam, 10));
    }
  }

  ngOnDestroy() {
    this.clearTimer();
  }

  loadQuiz(id: number) {
    this.apiService.getQuiz(id).subscribe({
      next: (data) => {
        this.quiz = data;
        this.isLoading = false;
        if (!this.quiz.questions || this.quiz.questions.length === 0) {
          this.errorMsg = 'This quiz has no questions yet.';
          return;
        }
        this.startTimerForCurrent();
      },
      error: () => {
        this.errorMsg = 'Failed to load quiz for taking.';
        this.isLoading = false;
      }
    });
  }

  questionCount(): number {
    return this.quiz?.questions?.length ?? 0;
  }

  currentQuestion() {
    return this.quiz?.questions?.[this.currentQuestionIndex];
  }

  get isLastQuestion(): boolean {
    return this.currentQuestionIndex === this.questionCount() - 1;
  }

  isFinished(): boolean {
    return this.finished;
  }

  nextQuestion() {
    if (!this.quiz?.questions || this.isSubmitting) return;
    this.recordAnswer(this.selectedChoiceId);
    this.selectedChoiceId = null;
    this.advance();
  }

  goBack() {
    this.router.navigate(['/quizzes']);
  }

  private startTimerForCurrent() {
    this.clearTimer();
    this.timeLeft = QUESTION_SECONDS;
    this.questionStartMs = Date.now();
    this.timerId = setInterval(() => {
      this.timeLeft -= 1;
      if (this.timeLeft <= 0) {
        this.clearTimer();
        // Time's up — record no answer and move on.
        this.recordAnswer(null);
        this.selectedChoiceId = null;
        this.advance();
      }
    }, 1000);
  }

  private clearTimer() {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private recordAnswer(choiceId: number | null) {
    const q = this.currentQuestion();
    if (!q) return;
    const elapsed = Date.now() - this.questionStartMs;
    this.answers.push({
      question_id: q.id,
      choice_id: choiceId,
      response_time_ms: Math.min(elapsed, QUESTION_SECONDS * 1000),
    });
  }

  private advance() {
    this.clearTimer();
    if (!this.quiz?.questions) return;
    if (this.currentQuestionIndex + 1 >= this.quiz.questions.length) {
      this.submitAll();
      return;
    }
    this.currentQuestionIndex += 1;
    this.startTimerForCurrent();
  }

  private submitAll() {
    if (!this.quiz) return;
    this.isSubmitting = true;
    this.apiService.submitAnswers(this.quiz.id, this.nickname, this.answers).subscribe({
      next: (res) => {
        this.result = res;
        this.finished = true;
        this.isSubmitting = false;
      },
      error: (err) => {
        console.error('Failed to submit attempt', err);
        this.result = null;
        this.finished = true;
        this.isSubmitting = false;
      }
    });
  }
}
