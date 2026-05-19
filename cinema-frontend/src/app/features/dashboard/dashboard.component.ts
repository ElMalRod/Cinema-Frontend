import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../../core/models/user.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: ''
})
export class DashboardComponent implements OnInit {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    const role = this.authService.getRole();
    const target = this.resolveRouteByRole(role);
    this.router.navigateByUrl(target);
  }

  private resolveRouteByRole(role: UserRole | null): string {
    switch (role) {
      case 'CLIENT':
        return '/dashboard/client/tickets';
      case 'CINEMA_ADMIN':
        return '/dashboard/cinema/rooms';
      case 'ADVERTISER':
        return '/dashboard/advertiser/ads';
      case 'SYSTEM_ADMIN':
        return '/dashboard/admin/movies';
      default:
        return '/login';
    }
  }
}
