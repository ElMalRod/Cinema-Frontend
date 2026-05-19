import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-shared-card',
  standalone: false,
  templateUrl: './shared-card.component.html',
  styleUrl: './shared-card.component.scss'
})
export class SharedCardComponent {
  @Input() title = '';
  @Input() footer = '';
}
