import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserRole } from '../models/user.model';

export interface UserProfileResponse {
  userId: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  role: UserRole;
}

export interface WalletTransactionResponse {
  amount: number;
  type: string;
  description: string | null;
  transactionDate: string;
}

export interface WalletResponse {
  balance: number;
  transactions: WalletTransactionResponse[];
}

export interface AdminCreateUserRequest {
  name: string;
  phone?: string;
  email: string;
  role: UserRole;
  cinemaId?: string;
}

export interface AdminUserResponse {
  userId: string;
  name: string | null;
  phone: string | null;
  email: string;
  role: UserRole;
  active: boolean;
  balance: number;
}

export interface CinemaSummaryResponse {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
}

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  private readonly http = inject(HttpClient);

  getProfile(): Observable<UserProfileResponse> {
    return this.http.get<UserProfileResponse>(environment.apiBaseUrl + '/users/profile');
  }

  updateProfile(name: string, phone?: string): Observable<UserProfileResponse> {
    return this.http.patch<UserProfileResponse>(environment.apiBaseUrl + '/users/profile', {
      name,
      phone: phone?.trim() || null
    });
  }

  getWallet(): Observable<WalletResponse> {
    return this.http.get<WalletResponse>(environment.apiBaseUrl + '/users/wallet');
  }

  rechargeWallet(amount: number): Observable<WalletResponse> {
    return this.http.post<WalletResponse>(environment.apiBaseUrl + '/users/wallet/recharge', { amount });
  }

  createUserByAdmin(payload: AdminCreateUserRequest): Observable<AdminUserResponse> {
    return this.http.post<AdminUserResponse>(environment.apiBaseUrl + '/users/admin/create', payload);
  }

  listAdminUsers(): Observable<AdminUserResponse[]> {
    return this.http.get<AdminUserResponse[]>(environment.apiBaseUrl + '/users/admin/list');
  }

  listUnassignedCinemaAdmins(): Observable<AdminUserResponse[]> {
    return this.http.get<AdminUserResponse[]>(environment.apiBaseUrl + '/users/admin/cinema-admins/unassigned');
  }

  assignCinemaAdmin(userId: string, cinemaId: string): Observable<void> {
    return this.http.patch<void>(environment.apiBaseUrl + '/users/admin/cinema-admins/' + userId + '/assign', { cinemaId });
  }

  listCinemas(): Observable<CinemaSummaryResponse[]> {
    return this.http.get<CinemaSummaryResponse[]>(environment.apiBaseUrl + '/cinemas/v1/cinemas');
  }

  deactivateUser(userId: string): Observable<void> {
    return this.http.patch<void>(environment.apiBaseUrl + '/users/admin/' + userId + '/deactivate', {});
  }

  activateUser(userId: string): Observable<void> {
    return this.http.patch<void>(environment.apiBaseUrl + '/users/admin/' + userId + '/activate', {});
  }
}
