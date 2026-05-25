import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UserRole, USER_ROLE_OPTIONS } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';
import { SharedModule } from '../../../shared/shared.module';
import { FormField } from '../../../shared/components/shared-form/shared-form.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [SharedModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  loading = false;
  errorMessage = '';

  readonly fields: FormField[] = [
    { name: 'name', label: 'Nombre completo', type: 'text', required: true },
    { name: 'phone', label: 'Teléfono (opcional)', type: 'text' },
    { name: 'email', label: 'Correo', type: 'email', required: true },
    {
      name: 'role',
      label: 'Rol',
      type: 'select',
      required: true,
      options: USER_ROLE_OPTIONS
    },
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
      .register({
        name: String(value['name'] ?? '').trim(),
        phone: String(value['phone'] ?? '').trim() || undefined,
        email: String(value['email'] ?? '').trim(),
        role: String(value['role'] ?? 'CLIENT') as UserRole,
        password: String(value['password'] ?? '')
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/login']);
        },
        error: (error: HttpErrorResponse) => {
          this.loading = false;
          this.errorMessage = this.resolveError(error);
        }
      });
  }

  private resolveError(error: HttpErrorResponse): string {
    if (error.status === 403) {
      return 'Solo se permite registro publico para CLIENT y ADVERTISER.';
    }
    if (error.status === 409) {
      return 'El correo ya está registrado.';
    }
    if (error.status === 400) {
      return 'Datos inválidos. Verifica el formulario.';
    }
    return 'No se pudo registrar el usuario. Intenta de nuevo.';
  }
}



