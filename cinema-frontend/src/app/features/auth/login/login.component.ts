import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SharedModule } from '../../../shared/shared.module';
import { FormField } from '../../../shared/components/shared-form/shared-form.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [SharedModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  loading = false;
  errorMessage = '';

  readonly fields: FormField[] = [
    { name: 'email', label: 'Correo', type: 'email', required: true, placeholder: 'usuario@correo.com' },
    { name: 'password', label: 'Contraseña', type: 'password', required: true }
  ];

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  onSubmit(value: Record<string, unknown>): void {
    this.loading = true;
    this.errorMessage = '';

    this.authService
      .login({
        email: String(value['email'] ?? ''),
        password: String(value['password'] ?? '')
      })
      .subscribe({
        next: ({ user }) => {
          this.loading = false;
          this.router.navigateByUrl(this.authService.getDashboardRoute(user.role));
        },
        error: (error: HttpErrorResponse) => {
          this.loading = false;
          this.errorMessage = this.resolveError(error);
        }
      });
  }

  private resolveError(error: HttpErrorResponse): string {
    if (error.status === 401) {
      return 'Credenciales inválidas o usuario inactivo.';
    }
    if (error.status === 423) {
      return 'Tu cuenta está bloqueada temporalmente.';
    }
    return 'No se pudo iniciar sesión. Intenta nuevamente.';
  }
}

