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
    this.authService
      .login({
        email: String(value['email'] ?? ''),
        password: String(value['password'] ?? '')
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/dashboard']);
        },
        error: () => {
          this.loading = false;
        }
      });
  }
}
