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

interface AdminCinemaResponse {
  id: string;
  countryId: string;
  name: string;
  phone: string | null;
  email: string | null;
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

  constructor() {
    this.bootstrapSession();
  }

  login(payload: LoginRequest): Observable<AuthResponse> {
    return this.http.post<BackendLoginResponse>(`${environment.apiBaseUrl}/auth/login`, payload).pipe(
      // 1. Guardamos el token inicial
      tap((response) => localStorage.setItem('token', response.token)),
      
      // 2. Obtenemos los datos del usuario (rol, email, id)
      switchMap((response) =>
        this.getMe().pipe(
          map((me) => ({ token: response.token, user: this.mapUserFromMe(me) })),
          catchError(() => of({ token: response.token, user: this.mapUserFromLogin(response, payload.email) }))
        )
      ),

      // 3. LA INTERCEPCIÓN DEL ADMIN
      switchMap(({ token, user }) => {
        // Si el que se esta logueando es un administrador de cine
        if (user.role === 'CINEMA_ADMIN') {
          // .llamamos al endpoint usando el ID del usuario
          return this.fetchCinemaId(user.id).pipe(
            map((cinemaId) => {
              // Si el endpoint nos devolvio el ID del cine exitosamente, lo guardamos
              if (cinemaId) {
                localStorage.setItem('cinemaId', cinemaId);
              }
              // Continuamos con el flujo pasando el token y el user intactos
              return { token, user };
            })
          );
        }
        // Si es un CLIENT o un SYSTEM_ADMIN, ignoramos esto y continuamos
        return of({ token, user });
      }),

      // 4. Finalizamos el login guardando la sesión principal
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
    return this.currentUserSubject.value?.role ?? this.getRoleFromToken();
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  hasValidSession(): boolean {
    return this.isAuthenticated();
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

  private bootstrapSession(): void {
    if (!this.isAuthenticated() || this.currentUserSubject.value) {
      return;
    }

    this.getMe()
      .pipe(
        map((me) => this.mapUserFromMe(me)),
        catchError(() => {
          this.clearSession();
          return of(null);
        })
      )
      .subscribe((user) => {
        if (!user) {
          return;
        }
        localStorage.setItem('user', JSON.stringify(user));
        this.currentUserSubject.next(user);
      });
  }

  private getRoleFromToken(): UserRole | null {
    const payload = this.decodeTokenPayload(this.getToken());
    const role = payload?.['role'];

    if (role === 'CLIENT' || role === 'CINEMA_ADMIN' || role === 'ADVERTISER' || role === 'SYSTEM_ADMIN') {
      return role;
    }

    return null;
  }

  private decodeTokenPayload(token: string | null): Record<string, unknown> | null {
    if (!token) {
      return null;
    }

    const parts = token.split('.');
    if (parts.length < 2) {
      return null;
    }

    try {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
      return JSON.parse(atob(padded)) as Record<string, unknown>;
    } catch {
      return null;
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
    localStorage.removeItem('cinemaId');
    this.currentUserSubject.next(null);
  }

  private fetchCinemaId(adminUserId: string): Observable<string | null> {
    return this.http.get<AdminCinemaResponse>(`${environment.apiBaseUrl}/cinemas/v1/cinemas/admin/${adminUserId}`).pipe(
      map((response) => response.id), 
      // Si el usuario no tiene cine asignado o hay error, no rompemos la app, devolvemos null
      catchError(() => of(null)) 
    );
  }

  getCinemaId(): string | null {
    return localStorage.getItem('cinemaId');
  }
  
}
