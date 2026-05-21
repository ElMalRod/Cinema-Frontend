import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

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

    if (!role) {
      this.authService.logout().subscribe(() => {
        this.router.navigateByUrl('/login');
      });
      return;
    }

    this.router.navigateByUrl(this.authService.getDashboardRoute(role));
  }
}
