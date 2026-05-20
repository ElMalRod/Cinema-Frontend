import { Component, OnInit } from '@angular/core';
import { AuthService, MeResponse } from '../../../core/services/auth.service';
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
  profile: MeResponse | null = null;
  passwordError = '';
  passwordSuccess = '';

  constructor(private readonly authService: AuthService) {}

  ngOnInit(): void {
    this.authService.getMe().subscribe({
      next: (me) => {
        this.profile = me;
      }
    });
  }

  requestPasswordChange(): void {
    const email = this.profile?.email?.trim() ?? '';
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
}
