import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { UserProfileResponse, UsersApiService } from '../../../core/services/users-api.service';
import { SharedModule } from '../../../shared/shared.module';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  loadingPassword = false;
  loadingProfile = false;
  profile: UserProfileResponse | null = null;
  profileError = '';
  passwordError = '';
  passwordSuccess = '';

  constructor(
    private readonly authService: AuthService,
    private readonly usersApiService: UsersApiService
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  requestPasswordChange(): void {
    const email = (this.profile?.email?.trim() || this.authService.getCurrentUser()?.email || '').trim();
    this.passwordError = '';
    this.passwordSuccess = '';

    if (!email) {
      this.passwordError = 'No se pudo obtener el correo del usuario actual.';
      return;
    }

    this.loadingPassword = true;
    this.authService.forgotPassword({ email }).subscribe({
      next: () => {
        this.loadingPassword = false;
        this.passwordSuccess = 'Si el correo existe, enviamos un enlace para cambiar la contraseña.';
      },
      error: () => {
        this.loadingPassword = false;
        this.passwordSuccess = 'Si el correo existe, enviamos un enlace para cambiar la contraseña.';
      }
    });
  }

  private loadProfile(): void {
    this.loadingProfile = true;
    this.profileError = '';
    this.usersApiService.getProfile().subscribe({
      next: (profile) => {
        this.loadingProfile = false;
        this.profile = profile;
      },
      error: () => {
        this.loadingProfile = false;
        this.profileError = 'No se pudo cargar el perfil.';
      }
    });
  }
}

