import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { LoginService } from '../../services/login.service';
import { PlayerService } from '../../services/player.service';
import { AnswerSubmission, AttemptResult, Quiz } from '../../interfaces/models';
import { LeaderboardComponent } from '../leaderboard/leaderboard.component';

const QUESTION_SECONDS = 20;
const ANSWER_SHAPES = ['▲', '◆', '●', '■'];
const TIMER_CIRCUMFERENCE = 2 * Math.PI * 45; // r=45 in the SVG

@Component({
  selector: 'app-take-quiz',
  standalone: true,
  imports: [FormsModule, RouterLink, LeaderboardComponent],
  template: `
    <div class="take-quiz-wrapper">
      @if (isLoading) {
        <div class="loading"><div class="spinner"></div> Loading quiz…</div>
      } @else if (errorMsg) {
        <div class="card error-card">
          <p class="error-msg">{{ errorMsg }}</p>
          <button class="btn-secondary" (click)="goBack()">Go Back</button>
        </div>
      } @else if (quiz) {
        @if (!isFinished()) {
          <div class="quiz-header-bar">
            <div class="progress-pill">
              Question {{ currentQuestionIndex + 1 }} / {{ questionCount() }}
            </div>
            <div class="timer-wrapper" [class.warning]="timeLeft <= 5">
              <svg class="timer-ring" viewBox="0 0 100 100" aria-hidden="true">
                <circle class="timer-ring-bg" cx="50" cy="50" r="45" />
                <circle
                  class="timer-ring-fg"
                  cx="50" cy="50" r="45"
                  [attr.stroke-dasharray]="dashArray"
                  [attr.stroke-dashoffset]="timerDashOffset()"
                />
              </svg>
              <span class="timer-label">{{ timeLeft }}</span>
            </div>
          </div>

          <div class="card question-card">
            <div class="question-meta">
              @if (nickname) {
                <span class="player-badge">Playing as <strong>{{ nickname }}</strong></span>
              }
            </div>
            <h2 class="question-text">{{ currentQuestion()?.text }}</h2>
          </div>

          <div class="answer-grid" role="radiogroup" aria-label="Answer choices">
            @for (choice of currentQuestion()?.choices; track choice.id; let i = $index) {
              <button
                class="answer"
                [attr.data-shape]="i"
                [attr.aria-pressed]="selectedChoiceId === choice.id"
                (click)="selectChoice(choice.id)"
              >
                <span class="answer-icon" aria-hidden="true">{{ shapes[i] }}</span>
                <span class="answer-text">{{ choice.text }}</span>
              </button>
            }
          </div>

          <div class="action-bar">
            <button
              class="btn-primary btn-large"
              (click)="nextQuestion()"
              [disabled]="!selectedChoiceId || isSubmitting"
            >
              @if (isSubmitting) {
                <span class="spinner inline"></span>Submitting…
              } @else {
                {{ isLastQuestion ? 'Finish quiz' : 'Next →' }}
              }
            </button>
          </div>
        } @else {
          <div class="card finished-card">
            <h2 class="finished-title">Quiz finished!</h2>
            @if (result) {
              <div class="score-display">
                <div class="big-score">{{ result.score }}</div>
                <div class="score-unit">points</div>
              </div>
              <p class="score-meta">
                {{ result.correct_count }} correct out of {{ result.total }}
              </p>

              <div class="leaderboard-embed">
                <app-leaderboard [quizId]="quiz.id" [limit]="5" [showBackLink]="false" />
                <a class="full-link" [routerLink]="['/quiz', quiz.id, 'leaderboard']">
                  View full leaderboard &rarr;
                </a>
              </div>
            } @else {
              <p class="score-meta error-msg">Your score couldn't be saved to the server.</p>
            }

            <div class="action-bar">
              <button class="btn-primary btn-large" (click)="goBack()">
                {{ backLabel() }}
              </button>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .take-quiz-wrapper {
      max-width: 760px;
      margin: 2rem auto;
      padding: 0 1rem;
    }

    .error-card {
      text-align: center;
    }
    .error-msg {
      color: var(--color-danger);
      margin-bottom: 1rem;
    }

    /* Header bar: progress + timer */
    .quiz-header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .progress-pill {
      background: var(--color-surface);
      padding: 0.5rem 1rem;
      border-radius: var(--radius-pill);
      font-weight: 600;
      color: var(--color-text-muted);
      font-size: var(--text-sm);
      box-shadow: var(--shadow-sm);
    }

    /* Timer ring */
    .timer-wrapper {
      position: relative;
      width: 64px;
      height: 64px;
      flex-shrink: 0;
    }
    .timer-ring {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }
    .timer-ring-bg {
      fill: none;
      stroke: var(--color-border);
      stroke-width: 8;
    }
    .timer-ring-fg {
      fill: none;
      stroke: var(--color-primary);
      stroke-width: 8;
      stroke-linecap: round;
      transition: stroke-dashoffset 1s linear, stroke 0.25s;
    }
    .timer-label {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--color-text);
    }
    .timer-wrapper.warning .timer-ring-fg { stroke: var(--color-danger); }
    .timer-wrapper.warning .timer-label { color: var(--color-danger); }

    /* Question card */
    .question-card {
      padding: 2.5rem 2rem;
      text-align: center;
      margin-bottom: 1.5rem;
    }
    .question-meta {
      min-height: 1.75rem;
      margin-bottom: 0.75rem;
    }
    .player-badge {
      background: var(--color-bg);
      color: var(--color-text-muted);
      padding: 0.35rem 0.85rem;
      border-radius: var(--radius-pill);
      font-size: var(--text-sm);
    }
    .question-text {
      margin: 0;
      font-size: var(--text-2xl);
      line-height: 1.35;
    }

    /* Answer grid (Kahoot-style) */
    .answer-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .answer {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem 1.25rem;
      color: white;
      font-size: 1.05rem;
      font-weight: 500;
      text-align: left;
      min-height: 96px;
      cursor: pointer;
      border: 3px solid transparent;
      border-radius: var(--radius-lg);
      transition:
        transform var(--transition-fast),
        filter var(--transition-fast),
        box-shadow var(--transition-base),
        border-color var(--transition-base);
    }
    .answer:hover:not(:disabled) {
      transform: translateY(-2px);
      filter: brightness(1.08);
    }
    .answer[aria-pressed="true"] {
      border-color: white;
      transform: translateY(-2px);
      box-shadow: 0 0 0 3px var(--color-primary), var(--shadow-lg);
    }
    .answer[data-shape="0"] { background: var(--answer-0); }
    .answer[data-shape="1"] { background: var(--answer-1); }
    .answer[data-shape="2"] { background: var(--answer-2); }
    .answer[data-shape="3"] { background: var(--answer-3); }

    .answer-icon {
      font-size: 1.65rem;
      flex-shrink: 0;
      width: 2.25rem;
      height: 2.25rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0.2);
      border-radius: var(--radius-md);
    }
    .answer-text {
      flex: 1;
    }

    @media (max-width: 640px) {
      .answer-grid { grid-template-columns: 1fr; }
      .question-text { font-size: var(--text-xl); }
      .question-card { padding: 2rem 1.25rem; }
    }

    /* Action bar below answers */
    .action-bar {
      margin-top: 1.5rem;
      display: flex;
      justify-content: flex-end;
    }

    /* Finish screen */
    .finished-card {
      text-align: center;
      padding: 2.5rem 2rem;
    }
    .finished-title {
      color: var(--color-success);
      margin-bottom: 1rem;
    }
    .score-display {
      margin: 1rem 0 0.25rem;
    }
    .big-score {
      font-size: 4rem;
      font-weight: 800;
      color: var(--color-primary);
      letter-spacing: -0.02em;
      line-height: 1;
    }
    .score-unit {
      color: var(--color-text-muted);
      font-size: var(--text-sm);
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .score-meta {
      color: var(--color-text-muted);
      margin: 1rem 0 1.5rem;
    }
    .leaderboard-embed {
      margin: 1.5rem auto 0;
      max-width: 460px;
    }
    .full-link {
      display: block;
      margin-top: 0.75rem;
      color: var(--color-primary);
      text-decoration: none;
      font-size: 0.95rem;
    }
    .full-link:hover { text-decoration: underline; }
    .finished-card .action-bar { justify-content: center; margin-top: 2rem; }
  `]
})
export class TakeQuizComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(ApiService);
  private playerService = inject(PlayerService);
  private loginService = inject(LoginService);

  quiz: Quiz | null = null;
  isLoading = true;
  errorMsg = '';

  currentQuestionIndex = 0;
  selectedChoiceId: number | null = null;
  nickname = '';

  readonly shapes = ANSWER_SHAPES;
  readonly dashArray = TIMER_CIRCUMFERENCE;

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
        this.errorMsg = 'Failed to load quiz.';
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

  /** Offset for the SVG progress ring. 0 = full ring; circumference = empty. */
  timerDashOffset(): number {
    const ratio = Math.max(0, this.timeLeft / QUESTION_SECONDS);
    return TIMER_CIRCUMFERENCE * (1 - ratio);
  }

  selectChoice(id: number) {
    if (this.isSubmitting) return;
    this.selectedChoiceId = id;
  }

  nextQuestion() {
    if (!this.quiz?.questions || this.isSubmitting) return;
    this.recordAnswer(this.selectedChoiceId);
    this.selectedChoiceId = null;
    this.advance();
  }

  goBack() {
    if (this.loginService.isAuthenticated()) {
      this.router.navigate(['/quizzes']);
    } else {
      this.router.navigate(['/join']);
    }
  }

  backLabel(): string {
    return this.loginService.isAuthenticated() ? 'Back to Quizzes' : 'Join another room';
  }

  private startTimerForCurrent() {
    this.clearTimer();
    this.timeLeft = QUESTION_SECONDS;
    this.questionStartMs = Date.now();
    this.timerId = setInterval(() => {
      this.timeLeft -= 1;
      if (this.timeLeft <= 0) {
        this.clearTimer();
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
