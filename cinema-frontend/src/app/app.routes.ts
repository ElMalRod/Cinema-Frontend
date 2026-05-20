import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/public/home-page/home-page.component').then((m) => m.HomePageComponent)
  },
  {
    path: 'movies',
    loadComponent: () => import('./features/public/movies-page/movies-page.component').then((m) => m.MoviesPage)
  },
  {
    path: 'movies/:id',
    loadComponent: () => import('./features/public/movie-detail-page/movie-detail-page.component').then((m) => m.MovieDetailPage)
  },
  {
    path: 'cinemas',
    loadComponent: () => import('./features/public/cinemas-page/cinemas-page.component').then((m) => m.CinemasPage)
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then((m) => m.RegisterComponent)
  },
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent)
  },
  {
    path: 'dashboard/client/tickets',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['CLIENT'] },
    loadComponent: () => import('./features/dashboard/client/tickets/tickets.component').then((m) => m.TicketsComponent)
  },
  {
    path: 'dashboard/client/wallet',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['CLIENT'] },
    loadComponent: () => import('./features/dashboard/client/wallet/wallet.component').then((m) => m.ClientWalletComponent)
  },
  {
    path: 'dashboard/client/comments',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['CLIENT'] },
    loadComponent: () => import('./features/dashboard/client/comments/comments.component').then((m) => m.CommentsComponent)
  },
  {
    path: 'dashboard/cinema/rooms',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['CINEMA_ADMIN'] },
    loadComponent: () => import('./features/dashboard/cinema/rooms/rooms.component').then((m) => m.RoomsComponent)
  },
  {
    path: 'dashboard/cinema/schedules',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['CINEMA_ADMIN'] },
    loadComponent: () => import('./features/dashboard/cinema/schedules/schedules.component').then((m) => m.SchedulesComponent)
  },
  {
    path: 'dashboard/cinema/reports',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['CINEMA_ADMIN'] },
    loadComponent: () => import('./features/dashboard/cinema/reports/reports.component').then((m) => m.CinemaReportsComponent)
  },
  {
    path: 'dashboard/cinema/ads-block',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['CINEMA_ADMIN'] },
    loadComponent: () => import('./features/dashboard/cinema/ads-block/ads-block.component').then((m) => m.AdsBlockComponent)
  },
  {
    path: 'dashboard/advertiser/ads',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADVERTISER'] },
    loadComponent: () => import('./features/dashboard/advertiser/ads/ads.component').then((m) => m.AdvertiserAdsComponent)
  },
  {
    path: 'dashboard/advertiser/wallet',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADVERTISER'] },
    loadComponent: () => import('./features/dashboard/advertiser/wallet/wallet.component').then((m) => m.AdvertiserWalletComponent)
  },
  {
    path: 'dashboard/admin/movies',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['SYSTEM_ADMIN'] },
    loadComponent: () => import('./features/dashboard/admin/movies/movies.component').then((m) => m.AdminMoviesComponent)
  },
  {
    path: 'dashboard/admin/prices',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['SYSTEM_ADMIN'] },
    loadComponent: () => import('./features/dashboard/admin/prices/prices.component').then((m) => m.PricesComponent)
  },
  {
    path: 'dashboard/admin/costs',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['SYSTEM_ADMIN'] },
    loadComponent: () => import('./features/dashboard/admin/costs/costs.component').then((m) => m.CostsComponent)
  },
  {
    path: 'dashboard/admin/reports',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['SYSTEM_ADMIN'] },
    loadComponent: () => import('./features/dashboard/admin/reports/reports.component').then((m) => m.AdminReportsComponent)
  },
  { path: '**', redirectTo: '' }
];
