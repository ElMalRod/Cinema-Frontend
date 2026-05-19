import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';

interface RoleOption {
  label: string;
  value: 'CLIENT' | 'CINEMA_ADMIN';
}

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, RouterLink, CardModule, InputTextModule, PasswordModule, SelectModule, ButtonModule],
  templateUrl: './register-page.component.html',
  styleUrl: './register-page.component.scss'
})
export class RegisterPage {
  readonly title = 'Crear cuenta';
  readonly subtitle = 'Registro público disponible para Cliente y Administrador de Cine';

  readonly roleOptions: RoleOption[] = [
    { label: 'Cliente', value: 'CLIENT' },
    { label: 'Administrador de Cine', value: 'CINEMA_ADMIN' }
  ];
}
