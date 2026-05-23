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

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onClose = new EventEmitter<void>();

  onVisibleChange(nextVisible: boolean): void {
    this.visible = nextVisible;
    this.visibleChange.emit(nextVisible);

    if (!nextVisible) {
      this.onClose.emit();
    }
  }
}
