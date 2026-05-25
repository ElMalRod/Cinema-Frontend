import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';
import { UserRole } from '../models/user.model';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    const allowedRoles = route.data['roles'] as UserRole[] | undefined;
    const role = this.authService.getRole();

    if (!allowedRoles || allowedRoles.length === 0) {
      return true;
    }

    if (!role) {
      return this.router.parseUrl('/login');
    }

    if (allowedRoles.includes(role)) {
      return true;
    }

    return this.router.parseUrl('/dashboard');
  }
}
