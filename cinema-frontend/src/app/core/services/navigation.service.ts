import { Injectable } from '@angular/core';
import { FEATURE_MODULES, FeatureModuleConfig } from '../config/feature-modules.config';
import { UserRole } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  getModulesForRole(role: UserRole | null | undefined): FeatureModuleConfig[] {
    if (!role) {
      return [];
    }

    return FEATURE_MODULES.filter((module) => module.roles.includes(role));
  }

  getDefaultPathForRole(role: UserRole | null | undefined): string {
    return this.getModulesForRole(role)[0]?.path ?? '/menu';
  }
}
