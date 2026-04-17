import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { PlayerService } from '../../services/player.service';
import { Quiz, Question, Choice } from '../../interfaces/models';

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
              <span class="player-badge">Playing as: <strong>{{ nickname }}</strong></span>
            }
          </div>
          <p>Question {{ currentQuestionIndex + 1 }} of {{ quiz.questions?.length || 0 }}</p>
          
          @if (quiz.questions && quiz.questions.length > 0 && currentQuestionIndex < quiz.questions.length) {
            <div class="question-container">
              <h3>{{ quiz.questions[currentQuestionIndex].text }}</h3>
              
              <div class="choices">
                @for (choice of quiz.questions[currentQuestionIndex].choices; track choice.id) {
                  <label class="choice-label">
                    <input 
                      type="radio" 
                      name="question{{quiz.questions[currentQuestionIndex].id}}" 
                      [value]="choice.id"
                      [(ngModel)]="selectedChoiceId"
                    >
                    {{ choice.text }}
                  </label>
                }
              </div>
              
              <div class="actions">
                <button class="btn-primary" (click)="nextQuestion()" [disabled]="!selectedChoiceId">
                  {{ isLastQuestion ? 'Finish Quiz' : 'Next Question' }}
                </button>
              </div>
            </div>
          } @else {
            <div class="finished-container">
              <h3>Quiz Finished!</h3>
              <p>Your score is: {{ score }} / {{ quiz.questions?.length }}</p>
              <button class="btn-primary" (click)="goBack()">Back to Quizzes</button>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .take-quiz-container { max-width: 600px; margin: 2rem auto; }
    .quiz-header { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #eee; padding-bottom: 1rem; margin-bottom: 1rem; }
    .quiz-header h2 { margin: 0; }
    .player-badge { background-color: #e9ecef; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.9rem; color: #495057; }
    .question-container { margin-top: 2rem; }
    .choices { display: flex; flex-direction: column; gap: 1rem; margin: 1.5rem 0; }
    .choice-label { padding: 1rem; border: 1px solid #dee2e6; border-radius: 4px; cursor: pointer; }
    .choice-label:hover { background-color: #f8f9fa; }
    .actions { margin-top: 2rem; text-align: right; }
    .finished-container { text-align: center; padding: 2rem; }
    .finished-container h3 { color: #28a745; margin-bottom: 1rem; }
  `]
})
export class TakeQuizComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(ApiService);
  private playerService = inject(PlayerService);
  private location = inject(Location);

  quiz: Quiz | null = null;
  isLoading = true;
  errorMsg = '';
  
  currentQuestionIndex = 0;
  selectedChoiceId: number | null = null;
  score = 0;
  nickname = '';

  ngOnInit() {
    this.nickname = this.playerService.nickname() || '';
    
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
        if (!this.quiz.questions || this.quiz.questions.length === 0) {
          this.errorMsg = 'This quiz has no questions yet.';
        }
      },
      error: () => {
        this.errorMsg = 'Failed to load quiz for taking.';
        this.isLoading = false;
      }
    });
  }

  get isLastQuestion(): boolean {
    if (!this.quiz?.questions) return true;
    return this.currentQuestionIndex === this.quiz.questions.length - 1;
  }

  nextQuestion() {
    if (!this.quiz?.questions) return;
    
    // Check if correct
    const currentQ = this.quiz.questions[this.currentQuestionIndex];
    const selectedChoice = currentQ.choices.find(c => c.id === this.selectedChoiceId);
    
    if (selectedChoice && selectedChoice.is_correct) {
      this.score++;
    }

    this.selectedChoiceId = null;
    
    if (this.isLastQuestion) {
      // Submit attempt
      this.apiService.submitAttempt(this.quiz.id, this.score, this.nickname).subscribe({
        next: () => {
          this.currentQuestionIndex++; // Move past the last question to show finish screen
        },
        error: (err) => {
          console.error('Failed to submit attempt', err);
          this.currentQuestionIndex++; // Still show finish screen even if error
        }
      });
    } else {
      this.currentQuestionIndex++;
    }
  }

  goBack() {
    this.router.navigate(['/quizzes']);
  }
}
