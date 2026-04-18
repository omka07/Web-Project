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
