import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { FormField } from '../../../../shared/components/shared-form/shared-form.component';
import { UserRole } from '../../../../core/models/user.model';
import { STATIC_COUNTRIES } from '../../../../core/services/movies-api.service';
import {
  AdminUserResponse,
  CinemaSummaryResponse,
  CompanyResponse,
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
  loadingCompanies = false;
  loadingUnassigned = false;
  creating = false;
  creatingCompany = false;
  creatingCinema = false;
  togglingUserId: string | null = null;
  assigningUserId: string | null = null;

  showCreateUserModal = false;
  showCreateCompanyModal = false;
  showCreateCinemaModal = false;

  users: AdminUserResponse[] = [];
  unassignedCinemaAdmins: AdminUserResponse[] = [];
  cinemas: CinemaSummaryResponse[] = [];
  companies: CompanyResponse[] = [];

  errorMessage = '';
  successMessage = '';

  userFields: FormField[] = [];
  companyFields: FormField[] = [];
  cinemaFields: FormField[] = [];

  private readonly assignmentControls = new Map<string, FormControl<string | null>>();

  constructor(private readonly usersApiService: UsersApiService) {}

  ngOnInit(): void {
    this.buildCompanyFields();
    this.buildUserFields();
    this.buildCinemaFields();

    this.loadCompanies();
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

  openCreateCompanyModal(): void {
    this.showCreateCompanyModal = true;
  }

  closeCreateCompanyModal(): void {
    if (!this.creatingCompany) {
      this.showCreateCompanyModal = false;
    }
  }

  openCreateCinemaModal(): void {
    this.showCreateCinemaModal = true;
  }

  closeCreateCinemaModal(): void {
    if (!this.creatingCinema) {
      this.showCreateCinemaModal = false;
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

  createCompany(value: Record<string, unknown>): void {
    const name = String(value['name'] ?? '').trim();

    if (!name) {
      this.errorMessage = 'El nombre de la empresa es obligatorio.';
      this.successMessage = '';
      return;
    }

    this.creatingCompany = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.usersApiService.createCompany({ name }).subscribe({
      next: () => {
        this.creatingCompany = false;
        this.showCreateCompanyModal = false;
        this.successMessage = 'Empresa creada correctamente.';
        this.loadCompanies();
      },
      error: () => {
        this.creatingCompany = false;
        this.errorMessage = 'No se pudo crear la empresa. Verifica si ya existe.';
      }
    });
  }

  createCinema(value: Record<string, unknown>): void {
    const companyId = String(value['companyId'] ?? '').trim();
    const countryId = String(value['countryId'] ?? '').trim();
    const name = String(value['name'] ?? '').trim();

    if (!companyId || !countryId || !name) {
      this.errorMessage = 'Completa empresa, país y nombre de sucursal.';
      this.successMessage = '';
      return;
    }

    this.creatingCinema = true;
    this.errorMessage = '';
    this.successMessage = '';

    const adminCinemaId = String(value['adminCinemaId'] ?? '').trim() || undefined;

    this.usersApiService
      .createCinema({
        companyId,
        adminCinemaId,
        countryId,
        name,
        address: String(value['address'] ?? '').trim() || undefined,
        phone: String(value['phone'] ?? '').trim() || undefined,
        email: String(value['email'] ?? '').trim() || undefined,
        effectiveFrom: this.getTodayDate()
      })
      .subscribe({
        next: () => {
          this.creatingCinema = false;
          this.showCreateCinemaModal = false;
          this.successMessage = 'Sucursal creada correctamente.';
          this.loadCinemas();
          this.loadUnassignedCinemaAdmins();
          this.loadUsers();
        },
        error: () => {
          this.creatingCinema = false;
          this.errorMessage = 'No se pudo crear la sucursal. Revisa los datos ingresados.';
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
      this.errorMessage = 'Selecciona una sucursal para asignar al administrador.';
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
        this.errorMessage = 'No se pudo asignar la sucursal al administrador.';
      }
    });
  }

  getCinemaOptions(): SelectOption[] {
    return this.cinemas.map((cinema) => ({
      label: cinema.companyName ? `${cinema.companyName} - ${cinema.name}` : cinema.name,
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

  get totalUsers(): number {
    return this.users.length;
  }

  get activeUsers(): number {
    return this.users.filter((user) => user.active).length;
  }

  get inactiveUsers(): number {
    return this.users.filter((user) => !user.active).length;
  }

  private buildUserFields(): void {
    this.userFields = [
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
        label: 'Sucursal a asignar (solo para administrador de cine)',
        type: 'select',
        options: [{ label: 'Sin asignar por ahora', value: '' }, ...this.getCinemaOptions()]
      }
    ];
  }

  private buildCompanyFields(): void {
    this.companyFields = [
      {
        name: 'name',
        label: 'Nombre de la empresa de cine',
        type: 'text',
        required: true,
        placeholder: 'Ejemplo: Cinepolis'
      }
    ];
  }

  private buildCinemaFields(): void {
    this.cinemaFields = [
      {
        name: 'companyId',
        label: 'Empresa',
        type: 'select',
        required: true,
        options: this.companies.map((company) => ({ label: company.name, value: company.id })),
        placeholder: 'Selecciona una empresa'
      },
      {
        name: 'countryId',
        label: 'País',
        type: 'select',
        required: true,
        options: STATIC_COUNTRIES.map((country) => ({ label: country.name, value: country.id })),
        placeholder: 'Selecciona un país'
      },
      {
        name: 'name',
        label: 'Nombre de la sucursal',
        type: 'text',
        required: true,
        placeholder: 'Ejemplo: Cinepolis Xela'
      },
      {
        name: 'adminCinemaId',
        label: 'Administrador de cine (opcional)',
        type: 'select',
        options: [
          { label: 'Asignar después', value: '' },
          ...this.unassignedCinemaAdmins.map((admin) => ({
            label: `${admin.name || 'Sin nombre'} (${admin.email})`,
            value: admin.userId
          }))
        ],
        placeholder: 'Selecciona un administrador'
      },
      { name: 'address', label: 'Dirección (opcional)', type: 'text' },
      { name: 'phone', label: 'Teléfono (opcional)', type: 'text' },
      { name: 'email', label: 'Correo (opcional)', type: 'email' }
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

  private loadCompanies(): void {
    this.loadingCompanies = true;
    this.usersApiService.listCompanies().subscribe({
      next: (companies) => {
        this.loadingCompanies = false;
        this.companies = companies;
        this.buildCinemaFields();
      },
      error: () => {
        this.loadingCompanies = false;
        this.errorMessage = 'No se pudo cargar el listado de empresas.';
      }
    });
  }

  private loadCinemas(): void {
    this.loadingCinemas = true;
    this.usersApiService.listCinemas().subscribe({
      next: (cinemas) => {
        this.loadingCinemas = false;
        this.cinemas = cinemas;
        this.buildUserFields();
      },
      error: () => {
        this.loadingCinemas = false;
        this.errorMessage = 'No se pudo cargar el listado de sucursales.';
      }
    });
  }

  private loadUnassignedCinemaAdmins(): void {
    this.loadingUnassigned = true;
    this.usersApiService.listUnassignedCinemaAdmins().subscribe({
      next: (users) => {
        this.loadingUnassigned = false;
        this.unassignedCinemaAdmins = users;
        this.buildCinemaFields();

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

  private getTodayDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
