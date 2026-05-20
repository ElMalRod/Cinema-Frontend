import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { InputTextModule } from 'primeng/inputtext';
import { SharedModule } from '../../../shared/shared.module';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [SharedModule, RouterLink, InputTextModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent {
  loading = false;
  success = false;
  error = '';
  readonly form: FormGroup;
  private readonly token: string;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    this.form = this.formBuilder.group({
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  submit(): void {
    this.error = '';

    if (!this.token) {
      this.error = 'El enlace de recuperación no es válido.';
      return;
    }

    if (this.form.invalid || !this.passwordsMatch()) {
      this.form.markAllAsTouched();
      return;
    }

    const newPassword = this.form.controls['newPassword']?.value ?? '';
    this.loading = true;

    this.authService.resetPassword({ token: this.token, newPassword }).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
        setTimeout(() => this.router.navigate(['/login']), 1200);
      },
      error: () => {
        this.loading = false;
        this.error = 'No se pudo restablecer la contraseña. Verifica el enlace e inténtalo de nuevo.';
      }
    });
  }

  passwordsMatch(): boolean {
    const password = this.form.controls['newPassword']?.value ?? '';
    const confirm = this.form.controls['confirmPassword']?.value ?? '';
    return password === confirm;
  }
}
