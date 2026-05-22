import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserRole } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';

interface NavLink {
  label: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-shared-navbar',
  standalone: false,
  templateUrl: './shared-navbar.component.html',
  styleUrl: './shared-navbar.component.scss'
})
export class SharedNavbarComponent implements OnInit {
  isAuthenticated = false;

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
      { label: 'Reportes', path: '/dashboard/cinema/reports', icon: 'pi pi-chart-line' }
    ],
    ADVERTISER: [
      { label: 'Anuncios', path: '/dashboard/advertiser/ads', icon: 'pi pi-megaphone' },
      { label: 'Cartera', path: '/dashboard/advertiser/wallet', icon: 'pi pi-wallet' }
    ],
    SYSTEM_ADMIN: [
      { label: 'Usuarios', path: '/dashboard/admin/users', icon: 'pi pi-users' },
      { label: 'Películas', path: '/dashboard/admin/movies', icon: 'pi pi-video' },
      { label: 'Precios', path: '/dashboard/admin/prices', icon: 'pi pi-dollar' },
      { label: 'Costos', path: '/dashboard/admin/costs', icon: 'pi pi-calculator' },
      { label: 'Reportes', path: '/dashboard/admin/reports', icon: 'pi pi-chart-bar' }
    ]
  };

  roleLinksCurrent: NavLink[] = [];

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.isAuthenticated = this.authService.isAuthenticated();

    this.authService.currentUser$.subscribe((user) => {
      this.isAuthenticated = !!user || this.authService.isAuthenticated();
      this.roleLinksCurrent = user ? this.roleLinks[user.role] ?? [] : [];
    });
  }

  navigateTo(path: string): void {
    this.router.navigateByUrl(path);
  }

  goToProfile(): void {
    this.router.navigate(['/dashboard/profile']);
  }

  logout(): void {
    this.authService.logout().subscribe(() => this.router.navigate(['/login']));
  }
}
