import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { FormField } from '../../../../shared/components/shared-form/shared-form.component';
import { UserRole } from '../../../../core/models/user.model';
import {
  AdminUserResponse,
  CinemaSummaryResponse,
  UsersApiService
} from '../../../../core/services/users-api.service';
import { SharedModule } from '../../../../shared/shared.module';

type SelectOption = {
  label: string;
  value: string;
};

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class AdminUsersComponent implements OnInit {
  loading = false;
  loadingCinemas = false;
  loadingUnassigned = false;
  creating = false;
  togglingUserId: string | null = null;
  assigningUserId: string | null = null;

  showCreateUserModal = false;

  users: AdminUserResponse[] = [];
  unassignedCinemaAdmins: AdminUserResponse[] = [];
  cinemas: CinemaSummaryResponse[] = [];

  errorMessage = '';
  successMessage = '';

  fields: FormField[] = [];

  private readonly assignmentControls = new Map<string, FormControl<string | null>>();

  constructor(private readonly usersApiService: UsersApiService) {}

  ngOnInit(): void {
    this.buildFormFields();
    this.loadCinemas();
    this.loadUsers();
    this.loadUnassignedCinemaAdmins();
  }

  openCreateUserModal(): void {
    this.showCreateUserModal = true;
  }

  closeCreateUserModal(): void {
    if (!this.creating) {
      this.showCreateUserModal = false;
    }
  }

  createUser(value: Record<string, unknown>): void {
    this.creating = true;
    this.errorMessage = '';
    this.successMessage = '';

    const role = String(value['role'] ?? 'CLIENT') as UserRole;
    const cinemaId = String(value['cinemaId'] ?? '').trim() || undefined;

    this.usersApiService
      .createUserByAdmin({
        name: String(value['name'] ?? '').trim(),
        phone: String(value['phone'] ?? '').trim() || undefined,
        email: String(value['email'] ?? '').trim(),
        role,
        cinemaId: role === 'CINEMA_ADMIN' ? cinemaId : undefined
      })
      .subscribe({
        next: () => {
          this.creating = false;
          this.showCreateUserModal = false;
          this.successMessage = 'Usuario creado correctamente. Se enviaron credenciales por correo.';
          this.loadUsers();
          this.loadUnassignedCinemaAdmins();
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
        this.loadUnassignedCinemaAdmins();
      },
      error: () => {
        this.togglingUserId = null;
        this.errorMessage = 'No se pudo actualizar el estado del usuario.';
      }
    });
  }

  assignCinema(user: AdminUserResponse): void {
    const control = this.getAssignmentControl(user.userId);
    const cinemaId = control.value;

    if (!cinemaId) {
      this.errorMessage = 'Selecciona un cine para asignar al administrador.';
      this.successMessage = '';
      return;
    }

    this.assigningUserId = user.userId;
    this.errorMessage = '';
    this.successMessage = '';

    this.usersApiService.assignCinemaAdmin(user.userId, cinemaId).subscribe({
      next: () => {
        this.assigningUserId = null;
        this.successMessage = 'Administrador de cine asignado correctamente.';
        this.loadUsers();
        this.loadUnassignedCinemaAdmins();
      },
      error: () => {
        this.assigningUserId = null;
        this.errorMessage = 'No se pudo asignar el cine al administrador.';
      }
    });
  }

  getCinemaOptions(): SelectOption[] {
    return this.cinemas.map((cinema) => ({
      label: cinema.name,
      value: cinema.id
    }));
  }

  getAssignmentControl(userId: string): FormControl<string | null> {
    let control = this.assignmentControls.get(userId);

    if (!control) {
      control = new FormControl<string | null>(null);
      this.assignmentControls.set(userId, control);
    }

    return control;
  }

  formatAmount(value: number): string {
    return new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(value);
  }

  private buildFormFields(): void {
    this.fields = [
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
          { label: 'Administrador de cine', value: 'CINEMA_ADMIN' },
          { label: 'Anunciante', value: 'ADVERTISER' },
          { label: 'Administrador del sistema', value: 'SYSTEM_ADMIN' }
        ]
      },
      {
        name: 'cinemaId',
        label: 'Cine a asignar (solo para administrador de cine)',
        type: 'select',
        options: [{ label: 'Sin asignar por ahora', value: '' }, ...this.getCinemaOptions()]
      }
    ];
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

  private loadCinemas(): void {
    this.loadingCinemas = true;
    this.usersApiService.listCinemas().subscribe({
      next: (cinemas) => {
        this.loadingCinemas = false;
        this.cinemas = cinemas;
        this.buildFormFields();
      },
      error: () => {
        this.loadingCinemas = false;
        this.errorMessage = 'No se pudo cargar el listado de cines.';
      }
    });
  }

  private loadUnassignedCinemaAdmins(): void {
    this.loadingUnassigned = true;
    this.usersApiService.listUnassignedCinemaAdmins().subscribe({
      next: (users) => {
        this.loadingUnassigned = false;
        this.unassignedCinemaAdmins = users;

        const validIds = new Set(users.map((user) => user.userId));
        for (const key of this.assignmentControls.keys()) {
          if (!validIds.has(key)) {
            this.assignmentControls.delete(key);
          }
        }
      },
      error: () => {
        this.loadingUnassigned = false;
        this.errorMessage = 'No se pudo cargar administradores de cine sin asignar.';
      }
    });
  }
}
