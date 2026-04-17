import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

const ROOM_CODE_PATTERN = /^\d{6}$/;

@Component({
  selector: 'app-join-room',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="card join-card">
      <h2>Join a Room</h2>
      <p class="hint">Enter the 6-digit code shown by the host.</p>

      @if (errorMessage) {
        <div class="error-msg">{{ errorMessage }}</div>
      }

      <div class="form-group">
        <label for="room-code">Room code</label>
        <input
          id="room-code"
          type="text"
          inputmode="numeric"
          maxlength="6"
          autocomplete="off"
          [(ngModel)]="code"
          (input)="onInput()"
          (keydown.enter)="onJoin()"
          placeholder="123456"
        >
      </div>

      <button (click)="onJoin()" [disabled]="!isValid()">
        Join
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
    input {
      letter-spacing: 0.25rem;
      font-size: 1.5rem;
      text-align: center;
    }
  `]
})
export class JoinRoomComponent {
  private router = inject(Router);

  code = '';
  errorMessage = '';

  onInput() {
    this.code = this.code.replace(/\D/g, '').slice(0, 6);
    if (this.errorMessage) {
      this.errorMessage = '';
    }
  }

  isValid(): boolean {
    return ROOM_CODE_PATTERN.test(this.code);
  }

  onJoin() {
    if (!this.isValid()) {
      this.errorMessage = 'Room code must be exactly 6 digits.';
      return;
    }
    this.router.navigate(['/room', this.code]);
  }
}
