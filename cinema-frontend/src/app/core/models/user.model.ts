export type UserRole = 'CLIENT' | 'CINEMA_ADMIN' | 'ADVERTISER' | 'SYSTEM_ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export const USER_ROLE_OPTIONS: { label: string; value: UserRole }[] = [
  { label: 'Cliente', value: 'CLIENT' },
  { label: 'Anunciante', value: 'ADVERTISER' }
];
