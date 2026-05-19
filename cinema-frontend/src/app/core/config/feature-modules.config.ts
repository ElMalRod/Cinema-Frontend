import { UserRole } from '../models/user.model';
import { TableColumn } from '../../shared/models/table-column.model';

export type FeatureKey = 'movies' | 'cinemas' | 'tickets' | 'ads' | 'reports';

export interface FeatureModuleConfig {
  key: FeatureKey;
  label: string;
  path: string;
  icon: string;
  description: string;
  endpoint: string;
  columns: TableColumn[];
  roles: UserRole[];
}

export const FEATURE_MODULES: FeatureModuleConfig[] = [
  {
    key: 'movies',
    label: 'Películas',
    path: '/movies',
    icon: 'pi pi-video',
    description: 'Catálogo y gestión de cartelera.',
    endpoint: '/movies',
    columns: [
      { field: 'id', header: 'ID' },
      { field: 'title', header: 'Título' },
      { field: 'genre', header: 'Género' },
      { field: 'durationMinutes', header: 'Duración (min)' },
      { field: 'status', header: 'Estado' }
    ],
    roles: ['ADMIN', 'MANAGER', 'CUSTOMER']
  },
  {
    key: 'cinemas',
    label: 'Cines',
    path: '/cinemas',
    icon: 'pi pi-building',
    description: 'Sucursales, salas y capacidades.',
    endpoint: '/cinemas',
    columns: [
      { field: 'id', header: 'ID' },
      { field: 'name', header: 'Nombre' },
      { field: 'address', header: 'Dirección' },
      { field: 'city', header: 'Ciudad' },
      { field: 'status', header: 'Estado' }
    ],
    roles: ['ADMIN', 'MANAGER']
  },
  {
    key: 'tickets',
    label: 'Tickets',
    path: '/tickets',
    icon: 'pi pi-ticket',
    description: 'Ventas, reservas y validación de boletos.',
    endpoint: '/tickets',
    columns: [
      { field: 'id', header: 'ID' },
      { field: 'movieTitle', header: 'Película' },
      { field: 'cinemaName', header: 'Cine' },
      { field: 'showtime', header: 'Función' },
      { field: 'status', header: 'Estado' }
    ],
    roles: ['ADMIN', 'CASHIER']
  },
  {
    key: 'ads',
    label: 'Publicidad',
    path: '/ads',
    icon: 'pi pi-megaphone',
    description: 'Campañas y promociones activas.',
    endpoint: '/ads',
    columns: [
      { field: 'id', header: 'ID' },
      { field: 'name', header: 'Campaña' },
      { field: 'startDate', header: 'Inicio' },
      { field: 'endDate', header: 'Fin' },
      { field: 'status', header: 'Estado' }
    ],
    roles: ['ADMIN', 'MANAGER']
  },
  {
    key: 'reports',
    label: 'Reportes',
    path: '/reports',
    icon: 'pi pi-chart-line',
    description: 'Resumen financiero y de operaciones.',
    endpoint: '/reports',
    columns: [
      { field: 'metric', header: 'Métrica' },
      { field: 'value', header: 'Valor' },
      { field: 'period', header: 'Período' },
      { field: 'updatedAt', header: 'Actualizado' }
    ],
    roles: ['ADMIN', 'MANAGER']
  }
];

export const FEATURE_MODULES_MAP: Record<FeatureKey, FeatureModuleConfig> = {
  movies: FEATURE_MODULES[0],
  cinemas: FEATURE_MODULES[1],
  tickets: FEATURE_MODULES[2],
  ads: FEATURE_MODULES[3],
  reports: FEATURE_MODULES[4]
};
