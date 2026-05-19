import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

type SelectOption = {
  label: string;
  value: string | number;
};

export type FormField = {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'select' | 'textarea' | 'number' | 'date';
  placeholder?: string;
  required?: boolean;
  options?: SelectOption[];
  min?: number;
  max?: number;
};

@Component({
  selector: 'app-shared-form',
  standalone: false,
  templateUrl: './shared-form.component.html',
  styleUrl: './shared-form.component.scss'
})
export class SharedFormComponent implements OnChanges {
  @Input() fields: FormField[] = [];
  @Input() submitLabel = 'Guardar';
  @Input() loading = false;

  @Output() onSubmit = new EventEmitter<Record<string, unknown>>();

  form: FormGroup;

  constructor(private readonly fb: FormBuilder) {
    this.form = this.fb.group({});
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fields']) {
      this.buildForm();
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.onSubmit.emit(this.form.value as Record<string, unknown>);
  }

  isInvalid(fieldName: string): boolean {
    const control = this.form.get(fieldName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  fieldControl(name: string): FormControl {
    return this.form.get(name) as FormControl;
  }

  private buildForm(): void {
    const group: Record<string, FormControl> = {};

    for (const field of this.fields) {
      const validators = [];
      if (field.required) {
        validators.push(Validators.required);
      }
      if (field.type === 'email') {
        validators.push(Validators.email);
      }
      group[field.name] = this.fb.control(null, validators);
    }

    this.form = this.fb.group(group);
  }
}
