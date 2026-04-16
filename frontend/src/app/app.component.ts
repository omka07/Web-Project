import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { LoginService } from './services/login.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <nav class="navbar">
      <div class="nav-brand" routerLink="/">
        🎓 Quiz Master
      </div>
      <div class="nav-links">
        @if (loginService.isAuthenticated()) {
          <a routerLink="/quizzes" class="nav-link">Quizzes</a>
          <!-- API call #4 -->
          <button class="btn-logout" (click)="onLogout()">Logout</button>
        } @else {
          <a routerLink="/login" class="nav-link">Login</a>
        }
      </div>
    </nav>
    <main class="main-content">
      <router-outlet></router-outlet>
    </main>
  `,
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'frontend';
  loginService = inject(LoginService);
  private router = inject(Router);

  onLogout() {
    this.loginService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']) // Still navigate on error
    });
  }
}
