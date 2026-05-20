import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, map, of, tap } from 'rxjs';
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

interface BackendLoginResponse {
  token: string;
  userId: string;
  email: string;
  role: UserRole;
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
      map((response) => {
        const user = this.mapUser(response);
        return { token: response.token, user };
      }),
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

  logout(): Observable<boolean> {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    return of(true);
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

  private mapUser(response: BackendLoginResponse): User {
    return {
      id: response.userId,
      name: this.resolveName(response.email),
      email: response.email,
      role: response.role
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
}
