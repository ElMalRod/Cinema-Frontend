import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FeatureModuleConfig } from '../../core/config/feature-modules.config';
import { NavigationService } from '../../core/services/navigation.service';
import { AuthService } from '../../core/services/auth.service';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [SharedModule, RouterLink],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent implements OnInit {
  modules: FeatureModuleConfig[] = [];
  userName = 'Usuario';

  constructor(
    private readonly authService: AuthService,
    private readonly navigationService: NavigationService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.userName = user?.name ?? 'Usuario';
    this.modules = this.navigationService.getModulesForRole(user?.role);
  }
}
