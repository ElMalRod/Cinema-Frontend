import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { UserRole } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';

interface NavLink {
  label: string;
  path?: string;
  icon: string;
  items?: MenuItem[];
}

@Component({
  selector: 'app-shared-navbar',
  standalone: false,
  templateUrl: './shared-navbar.component.html',
  styleUrl: './shared-navbar.component.scss'
})
export class SharedNavbarComponent implements OnInit {
  isAuthenticated = false;
  currentRole: UserRole | null = null;
  roleLinksCurrent: NavLink[] = [];

  readonly publicLinks: NavLink[] = [
    { label: 'Inicio', path: '/', icon: 'pi pi-home' },
    { label: 'Películas', path: '/movies', icon: 'pi pi-video' },
    { label: 'Cines', path: '/cinemas', icon: 'pi pi-building' }
  ];

  readonly roleLinks: Record<UserRole, NavLink[]> = {
    CLIENT: [
      { label: 'Boletos', path: '/dashboard/client/tickets', icon: 'pi pi-ticket' },
      { label: 'Cartera', path: '/dashboard/client/wallet', icon: 'pi pi-wallet' },
      { label: 'Comentarios', path: '/dashboard/client/comments', icon: 'pi pi-comments' }
    ],
    CINEMA_ADMIN: [
      { label: 'Salas', path: '/dashboard/cinema/rooms', icon: 'pi pi-building-columns' },
      { label: 'Horarios', path: '/dashboard/cinema/schedules', icon: 'pi pi-calendar' },
      { label: 'Reportes', path: '/dashboard/cinema/reports', icon: 'pi pi-chart-line' },
      { label: 'Bloqueo de anuncios', path: '/dashboard/cinema/ads-block', icon: 'pi pi-megaphone' }
    ],
    ADVERTISER: [
      { label: 'Anuncios', path: '/dashboard/advertiser/ads', icon: 'pi pi-megaphone' },
      { label: 'Cartera', path: '/dashboard/advertiser/wallet', icon: 'pi pi-wallet' }
    ],
    SYSTEM_ADMIN: [
      { label: 'Usuarios', path: '/dashboard/admin/users', icon: 'pi pi-users' },
      { label: 'Empresas y sucursales', path: '/dashboard/admin/users', icon: 'pi pi-building' },
      {
        label: 'Películas',
        icon: 'pi pi-video',
        items: [
          { label: 'Administrar Películas', icon: 'pi pi-play-circle', command: () => this.router.navigate(['/dashboard/admin/movies']) },
          { label: 'Gestión Recursos', icon: 'pi pi-database', command: () => this.router.navigate(['/dashboard/cinema/resources']) }
        ]
      },
      { label: 'Anunciantes', path: '/dashboard/admin/advertisers', icon: 'pi pi-megaphone' },
      { label: 'Precios', path: '/dashboard/admin/prices', icon: 'pi pi-dollar' },
      { label: 'Costos', path: '/dashboard/admin/costs', icon: 'pi pi-calculator' },
      { label: 'Reportes', path: '/dashboard/admin/reports', icon: 'pi pi-chart-bar' }
    ]
  };

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.refreshNavigationState(this.authService.getCurrentUser()?.role ?? this.authService.getRole());

    this.authService.currentUser$.subscribe((user) => {
      this.refreshNavigationState(user?.role ?? this.authService.getRole());
    });
  }

  get displayLinks(): NavLink[] {
    return this.isAuthenticated ? [...this.publicLinks, ...this.roleLinksCurrent] : this.publicLinks;
  }

  get roleBadge(): string {
    switch (this.currentRole) {
      case 'SYSTEM_ADMIN':
        return 'Modo admin';
      case 'CINEMA_ADMIN':
        return 'Modo cine';
      case 'ADVERTISER':
        return 'Modo anunciante';
      case 'CLIENT':
        return 'Modo cliente';
      default:
        return 'Explorar';
    }
  }

  goToProfile(): void {
    this.router.navigate(['/dashboard/profile']);
  }

  logout(): void {
    this.authService.logout().subscribe(() => this.router.navigate(['/login']));
  }

  private refreshNavigationState(role: UserRole | null): void {
    this.currentRole = role;
    this.isAuthenticated = !!role && this.authService.isAuthenticated();
    this.roleLinksCurrent = role ? this.roleLinks[role] ?? [] : [];
  }
}
