import { Component, OnInit } from '@angular/core';
import { FormField } from '../../../../shared/components/shared-form/shared-form.component';
import { UserRole } from '../../../../core/models/user.model';
import { AdminUserResponse, UsersApiService } from '../../../../core/services/users-api.service';
import { SharedModule } from '../../../../shared/shared.module';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class AdminUsersComponent implements OnInit {
  loading = false;
  creating = false;
  togglingUserId: string | null = null;
  users: AdminUserResponse[] = [];
  errorMessage = '';
  successMessage = '';

  readonly fields: FormField[] = [
    { name: 'name', label: 'Nombre completo', type: 'text', required: true },
    { name: 'phone', label: 'Teléfono (opcional)', type: 'text' },
    { name: 'email', label: 'Correo', type: 'email', required: true },
    {
      name: 'role',
      label: 'Rol',
      type: 'select',
      required: true,
      options: [
        { label: 'Cliente', value: 'CLIENT' },
        { label: 'Admin de cine', value: 'CINEMA_ADMIN' },
        { label: 'Anunciante', value: 'ADVERTISER' },
        { label: 'System admin', value: 'SYSTEM_ADMIN' }
      ]
    }
  ];

  constructor(private readonly usersApiService: UsersApiService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  createUser(value: Record<string, unknown>): void {
    this.creating = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.usersApiService
      .createUserByAdmin({
        name: String(value['name'] ?? '').trim(),
        phone: String(value['phone'] ?? '').trim() || undefined,
        email: String(value['email'] ?? '').trim(),
        role: String(value['role'] ?? 'CLIENT') as UserRole
      })
      .subscribe({
        next: () => {
          this.creating = false;
          this.successMessage = 'Usuario creado correctamente. Se enviaron credenciales por correo.';
          this.loadUsers();
        },
        error: () => {
          this.creating = false;
          this.errorMessage = 'No se pudo crear el usuario. Verifica permisos y correo.';
        }
      });
  }

  toggleStatus(user: AdminUserResponse): void {
    this.togglingUserId = user.userId;
    this.errorMessage = '';
    this.successMessage = '';

    const request$ = user.active
      ? this.usersApiService.deactivateUser(user.userId)
      : this.usersApiService.activateUser(user.userId);

    request$.subscribe({
      next: () => {
        this.togglingUserId = null;
        this.successMessage = user.active ? 'Usuario desactivado.' : 'Usuario activado.';
        this.loadUsers();
      },
      error: () => {
        this.togglingUserId = null;
        this.errorMessage = 'No se pudo actualizar el estado del usuario.';
      }
    });
  }

  formatAmount(value: number): string {
    return new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(value);
  }

  private loadUsers(): void {
    this.loading = true;
    this.usersApiService.listAdminUsers().subscribe({
      next: (users) => {
        this.loading = false;
        this.users = users;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'No se pudo cargar el listado de usuarios.';
      }
    });
  }
}


