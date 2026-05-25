import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

type FeatureHighlight = {
  icon: string;
  title: string;
  description: string;
};

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent {
  readonly highlights: FeatureHighlight[] = [
    {
      icon: 'pi pi-video',
      title: 'Cartelera actualizada',
      description: 'Consulta estrenos y funciones con una vista clara y ordenada.'
    },
    {
      icon: 'pi pi-building',
      title: 'Cines por ciudad',
      description: 'Encuentra sucursales, servicios disponibles y horarios principales.'
    },
    {
      icon: 'pi pi-shield',
      title: 'Cuenta segura',
      description: 'Administra tu perfil, comentarios y operaciones con acceso autenticado.'
    }
  ];
}
