import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-shared-modal',
  standalone: false,
  templateUrl: './shared-modal.component.html'
})
export class SharedModalComponent {
  @Input() title = '';
  @Input() visible = false;
  @Input() width = '38rem';

  @Output() onClose = new EventEmitter<void>();

  close(): void {
    this.onClose.emit();
  }
}
