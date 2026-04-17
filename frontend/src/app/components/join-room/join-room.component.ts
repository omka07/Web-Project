import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { PlayerService } from '../../services/player.service';

@Component({
  selector: 'app-join-room',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="card join-card">
      <h2>Join a Room</h2>
      <p class="hint">Enter the 6-character code and your nickname.</p>

      @if (errorMessage) {
        <div class="error-msg">{{ errorMessage }}</div>
      }

      <div class="form-group">
        <label for="room-code">Room code</label>
        <input
          id="room-code"
          type="text"
          maxlength="6"
          autocomplete="off"
          [(ngModel)]="code"
          (input)="onInput()"
          placeholder="ABCDEF"
        >
      </div>

      <div class="form-group">
        <label for="nickname">Nickname</label>
        <input
          id="nickname"
          type="text"
          maxlength="16"
          autocomplete="off"
          [(ngModel)]="nickname"
          (keydown.enter)="onJoin()"
          placeholder="Your name"
        >
      </div>

      <button class="btn-primary" (click)="onJoin()" [disabled]="!isValid() || isLoading">
        @if (isLoading) { Joining... } @else { Join }
      </button>
    </div>
  `,
  styles: [`
    .join-card {
      max-width: 400px;
      margin: 2rem auto;
      padding: 2rem;
    }
    .hint {
      color: #6c757d;
      margin-top: -0.5rem;
      margin-bottom: 1rem;
    }
    .error-msg {
      color: #dc3545;
      margin-bottom: 1rem;
      padding: 0.5rem;
      background: #f8d7da;
      border-radius: 4px;
    }
    #room-code {
      letter-spacing: 0.25rem;
      font-size: 1.5rem;
      text-align: center;
      text-transform: uppercase;
    }
  `]
})
export class JoinRoomComponent {
  private router = inject(Router);
  private apiService = inject(ApiService);
  private playerService = inject(PlayerService);

  code = '';
  nickname = '';
  errorMessage = '';
  isLoading = false;

  onInput() {
    this.code = this.code.toUpperCase().slice(0, 6);
    if (this.errorMessage) {
      this.errorMessage = '';
    }
  }

  isValid(): boolean {
    return this.code.length === 6 && this.nickname.trim().length >= 2;
  }

  onJoin() {
    if (!this.isValid()) {
      this.errorMessage = 'Enter a valid 6-character code and a nickname.';
      return;
    }
    
    this.isLoading = true;
    this.apiService.joinRoom(this.code).subscribe({
      next: (response) => {
        this.isLoading = false;
        // Save nickname locally using PlayerService
        this.playerService.setNickname(this.nickname.trim());
        // Navigate to the take quiz page
        this.router.navigate(['/quiz', response.quiz_id, 'take']);
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 404) {
          this.errorMessage = 'Invalid Room Code';
        } else {
          this.errorMessage = 'An error occurred while joining.';
        }
      }
    });
  }
}
