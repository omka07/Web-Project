import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LoginService } from '../../services/login.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="card login-card">
      <h2>Sign in</h2>
      <p class="sub">Log in to manage quizzes.</p>

      @if (errorMessage) {
        <div class="error-msg">{{ errorMessage }}</div>
      }

      <div class="form-group">
        <label for="login-username">Username</label>
        <input
          id="login-username"
          type="text"
          [(ngModel)]="username"
          (keydown.enter)="onLogin()"
          placeholder="Your username"
          autocomplete="username"
        >
      </div>

      <div class="form-group">
        <label for="login-password">Password</label>
        <input
          id="login-password"
          type="password"
          [(ngModel)]="password"
          (keydown.enter)="onLogin()"
          placeholder="••••••••"
          autocomplete="current-password"
        >
      </div>

      <button class="btn-primary full-width" (click)="onLogin()" [disabled]="isLoading">
        @if (isLoading) {
          <span class="spinner inline"></span>Signing in…
        } @else {
          Sign in
        }
      </button>

      <div class="divider"><span>or</span></div>

      <a routerLink="/join" class="player-link">
        Join a room as a player &rarr;
      </a>
    </div>
  `,
  styles: [`
    .login-card {
      max-width: 400px;
      margin: 3rem auto;
      padding: 2rem;
    }
    h2 { margin-bottom: 0.25rem; }
    .sub {
      color: var(--color-text-muted);
      margin: 0 0 1.5rem;
    }
    .error-msg {
      color: var(--color-danger);
      margin-bottom: 1rem;
      padding: 0.6rem 0.75rem;
      background: #fee2e2;
      border: 1px solid #fecaca;
      border-radius: var(--radius-sm);
      font-size: var(--text-sm);
    }
    .full-width { width: 100%; }

    .divider {
      display: flex;
      align-items: center;
      text-align: center;
      margin: 1.5rem 0 1rem;
      color: var(--color-text-muted);
      font-size: var(--text-xs);
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .divider::before,
    .divider::after {
      content: "";
      flex: 1;
      border-bottom: 1px solid var(--color-border);
    }
    .divider span { padding: 0 0.75rem; }

    .player-link {
      display: block;
      text-align: center;
      color: var(--color-primary);
      text-decoration: none;
      font-weight: 500;
      padding: 0.5rem;
      border-radius: var(--radius-sm);
      transition: background-color var(--transition-fast);
    }
    .player-link:hover {
      background-color: var(--color-primary-ring);
      text-decoration: none;
    }
  `]
})
export class LoginComponent {
  private loginService = inject(LoginService);
  private router = inject(Router);

  username = '';
  password = '';
  isLoading = false;
  errorMessage = '';

  onLogin() {
    if (!this.username || !this.password || this.isLoading) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.loginService.login({ username: this.username, password: this.password }).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/quizzes']);
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 0 || err.status >= 500) {
          this.errorMessage = 'Server error. Please try again later.';
        } else {
          this.errorMessage = 'Invalid username or password.';
        }
      }
    });
  }
}
