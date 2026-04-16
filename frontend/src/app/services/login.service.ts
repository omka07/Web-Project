import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private http = inject(HttpClient);
  private authUrl = 'http://localhost:8000/api/auth';
  private readonly TOKEN_KEY = 'auth_token';

  // Using Angular 16+ signals for reactive state
  isAuthenticated = signal<boolean>(this.hasToken());

  private hasToken(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  login(credentials: { username: string; password: string }): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.authUrl}/login/`, credentials).pipe(
      tap(response => {
        localStorage.setItem(this.TOKEN_KEY, response.token);
        this.isAuthenticated.set(true);
      })
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.authUrl}/logout/`, {}).pipe(
      tap(() => {
        localStorage.removeItem(this.TOKEN_KEY);
        this.isAuthenticated.set(false);
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }
}
