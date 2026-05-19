import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { ToolbarModule } from 'primeng/toolbar';
import { SharedCardComponent } from './components/shared-card/shared-card.component';
import { SharedFormComponent } from './components/shared-form/shared-form.component';
import { SharedModalComponent } from './components/shared-modal/shared-modal.component';
import { SharedNavbarComponent } from './components/shared-navbar/shared-navbar.component';
import { SharedTableComponent } from './components/shared-table/shared-table.component';

@NgModule({
  declarations: [
    SharedTableComponent,
    SharedFormComponent,
    SharedModalComponent,
    SharedNavbarComponent,
    SharedCardComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    TableModule,
    InputTextModule,
    ButtonModule,
    IconFieldModule,
    InputIconModule,
    DialogModule,
    CardModule,
    SelectModule,
    TextareaModule,
    InputNumberModule,
    DatePickerModule,
    PasswordModule,
    ToolbarModule
  ],
  exports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    SharedTableComponent,
    SharedFormComponent,
    SharedModalComponent,
    SharedNavbarComponent,
    SharedCardComponent
  ]
})
export class SharedModule {}
