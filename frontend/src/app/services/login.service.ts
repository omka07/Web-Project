import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

interface JwtPair {
  access: string;
  refresh: string;
}

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private http = inject(HttpClient);
  private authUrl = `${environment.apiBaseUrl}/auth`;
  private readonly ACCESS_KEY = 'auth_access';
  private readonly REFRESH_KEY = 'auth_refresh';

  isAuthenticated = signal<boolean>(this.hasToken());

  private hasToken(): boolean {
    return !!localStorage.getItem(this.ACCESS_KEY);
  }

  login(credentials: { username: string; password: string }): Observable<JwtPair> {
    return this.http.post<JwtPair>(`${this.authUrl}/login/`, credentials).pipe(
      tap(res => {
        localStorage.setItem(this.ACCESS_KEY, res.access);
        localStorage.setItem(this.REFRESH_KEY, res.refresh);
        this.isAuthenticated.set(true);
      })
    );
  }

  logout(): Observable<any> {
    const refresh = localStorage.getItem(this.REFRESH_KEY);
    return this.http.post(`${this.authUrl}/logout/`, { refresh }).pipe(
      tap({
        next: () => this.clearToken(),
        error: () => this.clearToken(), // still log out locally on server error
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.ACCESS_KEY);
  }

  /**
   * Local-only logout: drops both tokens and flips the signal without hitting
   * the backend. Used by the HTTP interceptor on 401 so it can't recurse.
   */
  clearToken() {
    localStorage.removeItem(this.ACCESS_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    this.isAuthenticated.set(false);
  }
}
