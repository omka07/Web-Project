import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { LoginService } from '../services/login.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const loginService = inject(LoginService);
  const token = loginService.getToken();

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // Only react to 401 when we actually sent a token. 401 on the login
      // endpoint itself shouldn't log us out (we aren't logged in there yet).
      const isAuthCall =
        req.url.includes('/auth/login/') || req.url.includes('/auth/refresh/');
      if (err.status === 401 && token && !isAuthCall) {
        loginService.clearToken();
        router.navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
};
