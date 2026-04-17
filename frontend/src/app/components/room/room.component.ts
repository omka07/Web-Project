import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PlayerService } from '../../services/player.service';

@Component({
  selector: 'app-room',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="card room-card">
      <h2>Room {{ code }}</h2>

      @if (!playerService.nickname()) {
        <p class="hint">Pick a nickname to join the room.</p>

        @if (errorMessage) {
          <div class="error-msg">{{ errorMessage }}</div>
        }

        <div class="form-group">
          <label for="nickname">Nickname</label>
          <input
            id="nickname"
            type="text"
            maxlength="16"
            autocomplete="off"
            [(ngModel)]="nicknameInput"
            (keydown.enter)="onSetNickname()"
            placeholder="Your name"
          >
        </div>

        <button class="btn-primary" (click)="onSetNickname()" [disabled]="!isValid()">
          Enter room
        </button>
      } @else {
        <p class="hint">
          You are in room {{ code }} as <strong>{{ playerService.nickname() }}</strong>.
        </p>
        <p class="hint">Lobby and gameplay coming soon.</p>
        <button class="btn-secondary" (click)="onChangeNickname()">Change nickname</button>
      }
    </div>
  `,
  styles: [`
    .room-card {
      max-width: 400px;
      margin: 2rem auto;
      padding: 2rem;
      text-align: center;
    }
    .hint {
      color: #6c757d;
    }
    .error-msg {
      color: #dc3545;
      margin-bottom: 1rem;
      padding: 0.5rem;
      background: #f8d7da;
      border-radius: 4px;
    }
    input {
      text-align: center;
    }
  `]
})
export class RoomComponent {
  private route = inject(ActivatedRoute);
  playerService = inject(PlayerService);

  code = this.route.snapshot.paramMap.get('code') ?? '';
  nicknameInput = '';
  errorMessage = '';

  isValid(): boolean {
    const trimmed = this.nicknameInput.trim();
    return trimmed.length >= 2 && trimmed.length <= 16;
  }

  onSetNickname() {
    if (!this.isValid()) {
      this.errorMessage = 'Nickname must be 2–16 characters.';
      return;
    }
    this.playerService.setNickname(this.nicknameInput);
    this.errorMessage = '';
  }

  onChangeNickname() {
    this.nicknameInput = this.playerService.nickname() ?? '';
    this.playerService.clearNickname();
  }
}
