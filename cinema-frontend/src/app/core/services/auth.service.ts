import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, UserRole } from '../models/user.model';

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  name: string;
  phone?: string;
  email: string;
  password: string;
  role: UserRole;
}

interface ForgotPasswordRequest {
  email: string;
}

interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

interface BackendLoginResponse {
  token: string;
  type?: string;
  userId?: string;
  email?: string;
  role?: UserRole;
}

export interface MeResponse {
  userId: string;
  email: string;
  role: UserRole;
  active: boolean;
}

interface AuthResponse {
  token: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly currentUserSubject = new BehaviorSubject<User | null>(this.readStoredUser());

  readonly currentUser$ = this.currentUserSubject.asObservable();

  login(payload: LoginRequest): Observable<AuthResponse> {
    return this.http.post<BackendLoginResponse>(`${environment.apiBaseUrl}/auth/login`, payload).pipe(
      tap((response) => localStorage.setItem('token', response.token)),
      switchMap((response) =>
        this.getMe().pipe(
          map((me) => ({ token: response.token, user: this.mapUserFromMe(me) })),
          catchError(() => of({ token: response.token, user: this.mapUserFromLogin(response, payload.email) }))
        )
      ),
      tap(({ token, user }) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  register(payload: RegisterRequest): Observable<unknown> {
    return this.http.post(`${environment.apiBaseUrl}/auth/register`, payload);
  }

  forgotPassword(payload: ForgotPasswordRequest): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseUrl}/auth/forgot-password`, payload);
  }

  resetPassword(payload: ResetPasswordRequest): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseUrl}/auth/reset-password`, payload);
  }

  changePassword(payload: ChangePasswordRequest): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseUrl}/auth/change-password`, payload);
  }

  getMe(): Observable<MeResponse> {
    return this.http.get<MeResponse>(`${environment.apiBaseUrl}/auth/me`);
  }

  logout(): Observable<boolean> {
    return this.http.post<void>(`${environment.apiBaseUrl}/auth/logout`, {}).pipe(
      map(() => true),
      catchError(() => of(false)),
      tap(() => this.clearSession())
    );
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getRole(): UserRole | null {
    return this.currentUserSubject.value?.role ?? null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  hasValidSession(): boolean {
    return !!this.getToken() && !!this.getCurrentUser();
  }

  getDashboardRoute(role: UserRole | null = this.getRole()): string {
    switch (role) {
      case 'CLIENT':
        return '/dashboard/client/tickets';
      case 'CINEMA_ADMIN':
        return '/dashboard/cinema/rooms';
      case 'ADVERTISER':
        return '/dashboard/advertiser/ads';
      case 'SYSTEM_ADMIN':
        return '/dashboard/admin/users';
      default:
        return '/login';
    }
  }

  private mapUserFromMe(response: MeResponse): User {
    return {
      id: response.userId,
      email: response.email,
      role: response.role,
      name: this.resolveName(response.email)
    };
  }

  private mapUserFromLogin(response: BackendLoginResponse, fallbackEmail: string): User {
    const email = response.email ?? fallbackEmail;
    return {
      id: response.userId ?? this.currentUserSubject.value?.id ?? '',
      email,
      role: response.role ?? this.currentUserSubject.value?.role ?? 'CLIENT',
      name: this.resolveName(email)
    };
  }

  private resolveName(email: string): string {
    const [local] = email.split('@');
    return local || 'Usuario';
  }

  private readStoredUser(): User | null {
    const rawUser = localStorage.getItem('user');
    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser) as User;
    } catch {
      return null;
    }
  }

  private clearSession(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }
}
