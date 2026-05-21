# Manual Técnico - Cinema Frontend

## 📋 Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Arquitectura del Proyecto](#arquitectura-del-proyecto)
3. [Estructura de Carpetas](#estructura-de-carpetas)
4. [Configuración y Dependencias](#configuración-y-dependencias)
5. [Módulos Core](#módulos-core)
6. [Módulos de Features](#módulos-de-features)
7. [Rutas y Navegación](#rutas-y-navegación)
8. [Roles de Usuario](#roles-de-usuario)
9. [Flujo de Autenticación](#flujo-de-autenticación)
10. [Guías de Desarrollo](#guías-de-desarrollo)

---

## 🎬 Descripción General

**Cinema Frontend** es una aplicación web moderna desarrollada con **Angular 19+** utilizando arquitectura standalone y lazy loading. El proyecto implementa un sistema de gestión integral para una plataforma de cines que incluye:

- **Gestión de películas y cartelera**
- **Reserva y venta de tickets**
- **Administración de cines y salas**
- **Sistema de publicidad con precios dinámicos**
- **Wallets virtuales para usuarios**
- **Reportes y analytics**
- **Perfiles de usuario diferenciados**

### Stack Tecnológico

- **Framework**: Angular 19.2.26
- **TypeScript**: v5+
- **UI Components**: PrimeNG
- **HTTP Client**: Angular HttpClient con RxJS
- **Autenticación**: JWT Token-based
- **Routing**: Angular Router con Lazy Loading
- **Build Tool**: Vite + Angular CLI
- **Estilos**: SCSS

---

## 🏗️ Arquitectura del Proyecto

### Patrón Arquitectónico

El proyecto sigue una arquitectura **modular escalable** con separación clara de responsabilidades:

```
┌─────────────────────────────────────┐
│     Angular Standalone Components   │
├─────────────────────────────────────┤
│         Shared Module & Services    │
├─────────────────────────────────────┤
│     Core Guards, Interceptors       │
├─────────────────────────────────────┤
│        Feature Modules (Lazy)       │
├─────────────────────────────────────┤
│         HTTP API Client             │
├─────────────────────────────────────┤
│      Backend API (localhost:8080)   │
└─────────────────────────────────────┘
```

### Principios de Diseño

- ✅ **Lazy Loading**: Los módulos se cargan bajo demanda
- ✅ **Standalone Components**: Componentes independientes sin NgModule
- ✅ **Reusable Shared Module**: Componentes y utilities compartidas
- ✅ **Type Safety**: Tipado fuerte en TypeScript
- ✅ **Reactive Patterns**: RxJS Observables para flujos asincronos
- ✅ **Route Guards**: Protección de rutas por autenticación y roles

---

## 📁 Estructura de Carpetas

```
cinema-frontend/
├── src/
│   ├── app/
│   │   ├── core/                          # Servicios, guardias, interceptores
│   │   │   ├── config/
│   │   │   │   └── feature-modules.config.ts
│   │   │   ├── guards/
│   │   │   │   ├── auth.guard.ts         # Protege rutas autenticadas
│   │   │   │   ├── guest.guard.ts        # Protege rutas públicas
│   │   │   │   └── role.guard.ts         # Protege por rol de usuario
│   │   │   ├── interceptors/
│   │   │   │   └── jwt.interceptor.ts    # Inyecta token JWT en peticiones
│   │   │   ├── models/
│   │   │   │   └── user.model.ts         # Interfaces de usuario
│   │   │   └── services/
│   │   │       ├── auth.service.ts       # Autenticación y sesión
│   │   │       ├── feature-data.service.ts
│   │   │       └── navigation.service.ts # Gestión de navegación
│   │   │
│   │   ├── features/                     # Módulos de funcionalidades
│   │   │   ├── auth/                     # Autenticación
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   ├── forgot-password/
│   │   │   │   └── reset-password/
│   │   │   │
│   │   │   ├── public/                   # Vistas públicas
│   │   │   │   ├── home-page/
│   │   │   │   ├── movies-page/
│   │   │   │   ├── movie-detail-page/
│   │   │   │   ├── cinemas-page/
│   │   │   │   ├── login-page/
│   │   │   │   └── register-page/
│   │   │   │
│   │   │   ├── dashboard/                # Panel de usuario
│   │   │   │   ├── admin/
│   │   │   │   │   ├── movies/           # Gestión de películas
│   │   │   │   │   ├── prices/           # Gestión de precios de anuncios
│   │   │   │   │   ├── costs/
│   │   │   │   │   └── reports/
│   │   │   │   ├── advertiser/           # Módulo publicista
│   │   │   │   │   ├── ads/
│   │   │   │   │   └── wallet/
│   │   │   │   ├── cinema/               # Módulo admin de cine
│   │   │   │   │   ├── rooms/
│   │   │   │   │   ├── schedules/
│   │   │   │   │   ├── reports/
│   │   │   │   │   └── ads-block/
│   │   │   │   ├── client/               # Módulo cliente
│   │   │   │   │   ├── tickets/
│   │   │   │   │   ├── wallet/
│   │   │   │   │   └── comments/
│   │   │   │   └── profile/
│   │   │   │
│   │   │   ├── ads/                      # Módulo de publicidad
│   │   │   │
│   │   │   ├── menu/                     # Menú principal
│   │   │   ├── movies/
│   │   │   ├── cinemas/
│   │   │   ├── tickets/
│   │   │   └── reports/
│   │   │
│   │   ├── shared/                       # Módulo compartido
│   │   │   ├── shared.module.ts          # Exporta componentes comunes
│   │   │   ├── components/
│   │   │   │   ├── shared-card/
│   │   │   │   ├── shared-form/
│   │   │   │   ├── shared-modal/
│   │   │   │   ├── shared-navbar/
│   │   │   │   └── shared-table/         # Tabla reutilizable
│   │   │   └── models/
│   │   │       └── table-column.model.ts
│   │   │
│   │   ├── app.component.ts              # Componente raíz
│   │   ├── app.routes.ts                 # Definición de rutas
│   │   └── app.config.ts                 # Configuración de la app
│   │
│   ├── environments/                     # Configuración por entorno
│   │   ├── environment.ts                # Desarrollo
│   │   └── environment.prod.ts           # Producción
│   │
│   ├── main.ts                           # Entry point
│   ├── index.html
│   └── styles.scss                       # Estilos globales
│
├── package.json                          # Dependencias
├── angular.json                          # Config de Angular CLI
├── tsconfig.json                         # Config de TypeScript
├── tsconfig.app.json
├── proxy.conf.json                       # Proxy para API local
└── README.md
```

---

## ⚙️ Configuración y Dependencias

### Versiones Principales

```json
{
  "@angular/core": "^19.2.26",
  "@angular/platform-browser": "^19.2.26",
  "@angular/router": "^19.2.26",
  "@angular/forms": "^19.2.26",
  "primeng": "^19.x",
  "rxjs": "^7.x",
  "typescript": "^5.6.x"
}
```

### Variables de Entorno

**`environment.ts` (Desarrollo)**:
```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8080'
};
```

**`environment.prod.ts` (Producción)**:
```typescript
export const environment = {
  production: true,
  apiBaseUrl: 'https://api.cinema.com'
};
```

### Proxy Configuration

**`proxy.conf.json`**: Redirige llamadas API a `localhost:8080` durante desarrollo

```json
{
  "/api/*": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true
  }
}
```

---

## 🔐 Módulos Core

### 1. **Auth Service** (`core/services/auth.service.ts`)

Gestiona toda la lógica de autenticación y sesión del usuario.

#### Métodos Principales:

```typescript
// Login
login(payload: LoginRequest): Observable<AuthResponse>

// Registro de usuario
register(payload: RegisterRequest): Observable<unknown>

// Recuperación de contraseña
forgotPassword(payload: ForgotPasswordRequest): Observable<void>
resetPassword(payload: ResetPasswordRequest): Observable<void>
changePassword(payload: ChangePasswordRequest): Observable<void>

// Información de usuario
getMe(): Observable<MeResponse>
getCurrentUser(): User | null
getRole(): UserRole | null
getToken(): string | null

// Estados
isAuthenticated(): boolean
logout(): Observable<boolean>
```

#### Interfaces:

```typescript
interface BackendLoginResponse {
  token: string;
  userId: string;
  email: string;
  role: UserRole;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

type UserRole = 'CLIENT' | 'CINEMA_ADMIN' | 'ADVERTISER' | 'SYSTEM_ADMIN';
```

### 2. **JWT Interceptor** (`core/interceptors/jwt.interceptor.ts`)

Intercepta todas las peticiones HTTP para inyectar el token JWT.

```typescript
// Automáticamente agrega el header Authorization
Authorization: `Bearer ${token}`
```

### 3. **Guards** (`core/guards/`)

#### AuthGuard
- Protege rutas que requieren autenticación
- Redirige a `/login` si no está autenticado

#### GuestGuard
- Protege rutas públicas (login, register)
- Redirige a `/dashboard` si ya está autenticado

#### RoleGuard
- Valida que el usuario tenga el rol requerido
- Redirige a `/menu` si no tiene permisos

---

## 🎯 Módulos de Features

### 1. **Auth Module** (`features/auth/`)

Gestiona autenticación de usuarios:
- Login
- Registro
- Recuperación de contraseña
- Reset de contraseña

### 2. **Public Module** (`features/public/`)

Vistas accesibles sin autenticación:
- Home page
- Catálogo de películas
- Detalle de película
- Catálogo de cines
- Landing pages

### 3. **Dashboard Module** (`features/dashboard/`)

Panel de usuario con roles específicos:

#### **Admin Dashboard** (`admin/`)
- **Movies**: Gestión de películas en cartelera
- **Prices**: Gestión de precios de anuncios ⭐ **NUEVO**
- **Costs**: Configuración de costos
- **Reports**: Reportes y analytics

#### **Advertiser Dashboard** (`advertiser/`)
- **Ads**: Gestión de campañas publicitarias
- **Wallet**: Gestión de presupuesto

#### **Cinema Admin Dashboard** (`cinema/`)
- **Rooms**: Gestión de salas
- **Schedules**: Funciones y horarios
- **Reports**: Reportes del cine
- **Ads Block**: Espacios publicitarios

#### **Client Dashboard** (`client/`)
- **Tickets**: Mis entradas/reservas
- **Wallet**: Cartera virtual
- **Comments**: Reseñas y comentarios

### 5. **Shared Module** (`shared/`)

Componentes reutilizables en toda la aplicación:

- **SharedCard**: Tarjeta para mostrar módulos
- **SharedForm**: Formulario base reutilizable
- **SharedModal**: Modal genérico
- **SharedNavbar**: Barra de navegación
- **SharedTable**: Tabla dinámica con columnas configurables

---

## 🛣️ Rutas y Navegación

### Estructura de Rutas

```typescript
// RUTAS PÚBLICAS (sin autenticación requerida)
'' → Home Page
'movies' → Catálogo de películas
'movies/:id' → Detalle de película
'cinemas' → Catálogo de cines
'login' → Login (GuestGuard)
'register' → Registro (GuestGuard)
'forgot-password' → Recuperar contraseña
'reset-password' → Resetear contraseña

// RUTAS PROTEGIDAS (AuthGuard)
'dashboard' → Redirecciona según rol del usuario
'dashboard/profile' → Perfil de usuario

// RUTAS ADMIN (SYSTEM_ADMIN)
'dashboard/admin/movies' → Gestión de películas
'dashboard/admin/prices' → Gestión de precios de anuncios ⭐
'dashboard/admin/costs' → Gestión de costos
'dashboard/admin/reports' → Reportes

// RUTAS PUBLICISTA (ADVERTISER)
'dashboard/advertiser/ads' → Mis campañas
'dashboard/advertiser/wallet' → Mi cartera

// RUTAS ADMIN DE CINE (CINEMA_ADMIN)
'dashboard/cinema/rooms' → Gestión de salas
'dashboard/cinema/schedules' → Funciones
'dashboard/cinema/reports' → Reportes del cine
'dashboard/cinema/ads-block' → Espacios publicitarios

// RUTAS CLIENTE (CLIENT)
'dashboard/client/tickets' → Mis entradas
'dashboard/client/wallet' → Mi cartera
'dashboard/client/comments' → Mis reseñas
```

### Lazy Loading

Todas las rutas de features utilizan lazy loading:

```typescript
{
  path: 'dashboard/admin/prices',
  canActivate: [AuthGuard, RoleGuard],
  data: { roles: ['SYSTEM_ADMIN'] },
  loadComponent: () => import('./features/ads/ads-prices/ads-prices-container.component')
    .then(m => m.AdsPricesContainerComponent),
  children: [/* sub-routes */]
}
```

---

## 👥 Roles de Usuario

### Tipos de Roles

```typescript
type UserRole = 'CLIENT' | 'CINEMA_ADMIN' | 'ADVERTISER' | 'SYSTEM_ADMIN';
```

### Permisos por Rol

| Rol | Dashboard | Permisos |
|-----|-----------|----------|
| **CLIENT** | `dashboard/client/*` | Ver tickets, cartera, reseñas |
| **CINEMA_ADMIN** | `dashboard/cinema/*` | Gestionar salas, funciones, reportes |
| **ADVERTISER** | `dashboard/advertiser/*` | Crear campañas, gestionar cartera |
| **SYSTEM_ADMIN** | `dashboard/admin/*` | Gestionar películas, precios, costos, reportes |

### Configuración de Roles

Se define en `core/config/feature-modules.config.ts`:

```typescript
export const FEATURE_MODULES: FeatureModuleConfig[] = [
  {
    key: 'ad-prices',
    label: 'Precios de Anuncios',
    path: '/dashboard/admin/prices',
    icon: 'pi pi-dollar',
    roles: ['SYSTEM_ADMIN']
  }
];
```

---

## 🔐 Flujo de Autenticación

### 1. Login

```
Usuario ingresa credenciales
         ↓
POST /auth/login (email, password)
         ↓
Backend valida y retorna JWT
         ↓
AuthService guarda token + user en localStorage
         ↓
CurrentUser$ Observable se actualiza
         ↓
Router redirige a dashboard según rol
```

### 2. Protección de Rutas

```
Usuario navega a ruta protegida
         ↓
AuthGuard verifica si existe token
         ↓
¿Token válido?
  ├─ Sí → Continúa
  └─ No → Redirige a /login
         ↓
¿Requiere rol específico?
  ├─ Sí → RoleGuard valida rol
  │        ├─ Rol coincide → Continúa
  │        └─ Rol no coincide → Redirige a /menu
  └─ No → Continúa
```

### 3. Inyección de Token

```
AuthService obtiene token de localStorage
         ↓
JWTInterceptor intercepta petición HTTP
         ↓
Agrega header Authorization: Bearer {token}
         ↓
Petición se envía al backend con autenticación
```

### 4. Logout

```
Usuario hace clic en Logout
         ↓
POST /auth/logout
         ↓
AuthService limpia localStorage
         ↓
CurrentUser$ se actualiza a null
         ↓
Router redirige a /login
```

---

## 📊 Modelos de Datos Principales

### User Model

```typescript
export type UserRole = 'CLIENT' | 'CINEMA_ADMIN' | 'ADVERTISER' | 'SYSTEM_ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}
```

### TableColumn Model

```typescript
export interface TableColumn {
  field: string;      // Propiedad del objeto a mostrar
  header: string;     // Título de la columna
}
```

---

## 🛠️ Guías de Desarrollo

### Instalación y Setup

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run start

# Build para producción
npm run build

# Ejecutar tests
npm run test

# Linter
npm run lint
```

### Crear un Nuevo Componente Standalone

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared.module';

@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SharedModule],
  templateUrl: './my-component.component.html',
  styleUrls: ['./my-component.component.scss']
})
export class MyComponent {
  // Componente
}
```

### Agregar una Nueva Ruta

En `app.routes.ts`:

```typescript
{
  path: 'nueva-ruta',
  canActivate: [AuthGuard, RoleGuard],
  data: { roles: ['ROL_REQUERIDO'] },
  loadComponent: () => import('./features/module/component.component')
    .then(m => m.ComponentClass)
}
```

### Usar AuthService para Obtener Usuario Actual

```typescript
constructor(private authService: AuthService) {}

ngOnInit() {
  this.currentUser$ = this.authService.currentUser$;
  
  // O acceso directo:
  const user = this.authService.getCurrentUser();
  const role = this.authService.getRole();
}
```

### Utilizar SharedTable

```typescript
export class MyListComponent {
  data: Item[] = [];
  columns: TableColumn[] = [
    { field: 'id', header: 'ID' },
    { field: 'name', header: 'Nombre' },
    { field: 'status', header: 'Estado' }
  ];
}
```

```html
<app-shared-table [data]="data" [columns]="columns"></app-shared-table>
```

### Hacer Peticiones HTTP con AuthService

```typescript
constructor(private http: HttpClient, private auth: AuthService) {}

getItems(): Observable<Item[]> {
  // El JWTInterceptor automáticamente inyecta el token
  return this.http.get<Item[]>('/api/items');
}
```

---

## 🔄 Ciclo de Desarrollo típico

### Crear una Nueva Feature

1. **Crear estructura de carpetas** en `features/`
2. **Definir modelos** en `core/models/` o local
3. **Crear servicio** en `core/services/` si es compartido
4. **Crear componentes standalone** con imports necesarios
5. **Agregar rutas** en `app.routes.ts`
6. **Agregar guards** si requiere protección
7. **Actualizar navegación** en `feature-modules.config.ts`

---

## 📝 Convenciones de Código

### Naming Conventions

- **Componentes**: `MyComponentComponent`
- **Servicios**: `MyService`
- **Módelos**: `MyModel` (interfaces/types)
- **Variables privadas**: `private _variable`
- **Observables**: `$` al final: `currentUser$`

### Estructura de Componentes

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
// ... otros imports

@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [CommonModule, /* otros */],
  templateUrl: './my-component.component.html',
  styleUrls: ['./my-component.component.scss']
})
export class MyComponent implements OnInit {
  // 1. Propiedades públicas
  public data: any[] = [];
  
  // 2. Observables públicos (con $)
  public data$: Observable<any[]>;
  
  // 3. Propiedades privadas
  private _internalState: any;
  
  constructor(private service: MyService) {}
  
  ngOnInit(): void {
    this.loadData();
  }
  
  // 4. Métodos públicos
  public loadData(): void { }
  
  // 5. Métodos privados
  private processData(): void { }
}
```

---

## 🚀 Deployment

### Build para Producción

```bash
npm run build
# Genera archivos optimizados en dist/
```

### Configuración para Producción

1. Actualizar `environment.prod.ts` con URLs reales
2. Configurar variables de entorno en servidor
3. Usar `--configuration production` en CLI

```bash
ng build --configuration production
```

---

## 📚 Recursos Útiles

- [Documentación Angular](https://angular.io/docs)
- [RxJS Documentation](https://rxjs.dev)
- [PrimeNG Components](https://primeng.org)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)




RUTAS PARA LA ADS PRICE SERVICE

ruta: http://localhost:8080/ads/prices
tipo: POST (SYSTEM_ADMIN)


Descripción: Registro del precio de una publicidad
Entrada:
{
    "adType": "TEXT_IMAGE",
    "adPeriod": "THREE_DAYS",
    "price": 150.00
}
Salida:
{
    "id": "17711a97-75b9-4023-9f78-567dc8980381",
    "adType": "TEXT_IMAGE",
    "adPeriod": "THREE_DAYS",
    "price": 150.00,
    "createdAt": "2026-05-01T00:56:15.3289155",
    "updatedBy": "550e8400-e29b-41d4-a716-446655440000"
}

public enum AdType {
    TEXT,
    TEXT_IMAGE,
    VIDEO_TEXT
}

@Getter
public enum AdPeriod {
    ONE_DAY(1),
    THREE_DAYS(3),
    ONE_WEEK(7),
    TWO_WEEKS(14);

    private final int days;

    AdPeriod(int days) { this.days = days; }

}

Solo esta permitido el registro de un precio por cada combinación de adType y adPeriod. Si se intenta registrar un precio para una combinación ya existente, se debe retornar un error indicando que el precio ya existe.

ruta: http://localhost:8080/ads/prices
tipo: GET (SYSTEM_ADMIN, ADVERTISER)
Descripción: Obtiene todos los precios de la publicidad
Entrada:
Salida:
[
    {
        "id": "17711a97-75b9-4023-9f78-567dc8980381",
        "adType": "TEXT_IMAGE",
        "adPeriod": "THREE_DAYS",
        "price": 150.00,
        "createdAt": "2026-05-01T00:56:15.328916",
        "updatedBy": "550e8400-e29b-41d4-a716-446655440000"
    }
]


ruta: http://localhost:8080/ads/prices/UUID-PRICE
tipo: PUT (SYSTEM_ADMIN)
Descripción: Actualiza el precio del costo de publicidad
Entrada:
{
    "price": 500.00
}
Salida:
{
    "id": "4e9ed68d-9c28-4a3f-a2d8-91cb9524ba6a",
    "adType": "VIDEO_TEXT",
    "adPeriod": "THREE_DAYS",
    "price": 500.00,
    "createdAt": "2026-05-01T01:02:43.122002",
    "updatedBy": "550e8400-e29b-41d4-a716-446655440000"
}

ruta: http://localhost:8080/ads/prices/UUID-PRICE
tipo: DELETE (SYSTEM_ADMIN)
Descripción: Elimina un precio de publicidad
Entrada:
Salida:
204No Content 
