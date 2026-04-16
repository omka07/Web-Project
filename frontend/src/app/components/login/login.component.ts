import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginService } from '../../services/login.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="card login-card">
      <h2>Login to Quiz System</h2>
      
      @if (errorMessage) {
        <div class="error-msg">{{ errorMessage }}</div>
      }
      
      <div class="form-group">
        <label>Username</label>
        <input type="text" [(ngModel)]="username" placeholder="Enter username">
      </div>
      
      <div class="form-group">
        <label>Password</label>
        <input type="password" [(ngModel)]="password" placeholder="Enter password">
      </div>
      
      <!-- API call #1 -->
      <button (click)="onLogin()" [disabled]="isLoading">
        @if (isLoading) {
          Loading...
        } @else {
          Login
        }
      </button>
    </div>
  `,
  styles: [`
    .login-card {
      max-width: 400px;
      margin: 2rem auto;
      padding: 2rem;
    }
    .error-msg {
      color: #dc3545;
      margin-bottom: 1rem;
      padding: 0.5rem;
      background: #f8d7da;
      border-radius: 4px;
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
    if (!this.username || !this.password) return;
    
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
