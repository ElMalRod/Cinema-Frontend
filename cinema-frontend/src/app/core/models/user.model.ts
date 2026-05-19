export type UserRole = 'CLIENT' | 'CINEMA_ADMIN' | 'ADVERTISER' | 'SYSTEM_ADMIN';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export const USER_ROLE_OPTIONS: { label: string; value: UserRole }[] = [
  { label: 'Cliente', value: 'CLIENT' },
  { label: 'Administrador de Cine', value: 'CINEMA_ADMIN' },
  { label: 'Anunciante', value: 'ADVERTISER' },
  { label: 'Administrador del Sistema', value: 'SYSTEM_ADMIN' }
];
