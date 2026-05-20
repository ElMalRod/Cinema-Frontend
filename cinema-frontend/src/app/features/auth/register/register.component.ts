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

  readonly fields: FormField[] = [
    { name: 'name', label: 'Nombre', type: 'text', required: true },
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
    this.authService
      .register({
        name: String(value['name'] ?? ''),
        email: String(value['email'] ?? ''),
        role: String(value['role'] ?? 'CLIENT') as UserRole,
        password: String(value['password'] ?? '')
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/login']);
        },
        error: () => {
          this.loading = false;
        }
      });
  }
}
