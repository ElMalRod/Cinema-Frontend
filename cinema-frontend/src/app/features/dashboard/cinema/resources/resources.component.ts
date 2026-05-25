import { Component, OnInit, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TabsModule } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { MoviesApiService, STATIC_COUNTRIES } from '../../../../core/services/movies-api.service';
import { ActorOption, CategoryOption, ClassificationOption, PeopleOption } from '../../../../core/models/movie.model';

@Component({
  selector: 'app-cinema-resources',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    TabsModule,
    TableModule,
    ToastModule,
    TagModule,
    TooltipModule,
    ProgressSpinnerModule,
  ],
  providers: [MessageService],
  templateUrl: './resources.component.html',
  styleUrl: './resources.component.scss',
})
export class CinemaResourcesComponent implements OnInit {
  private readonly api = inject(MoviesApiService);
  private readonly msg = inject(MessageService);
  private readonly countryId = STATIC_COUNTRIES[0].id;

  activeTab = '0';

  // ── Actors ──────────────────────────────────────────────────────────────────
  actors: ActorOption[] = [];
  loadingActors = false;
  showActorDialog = false;
  savingActor = false;
  editingActorId: string | null = null;
  actorName = '';
  actorUrlImage = '';

  // ── People ──────────────────────────────────────────────────────────────────
  people: PeopleOption[] = [];
  loadingPeople = false;
  showPeopleDialog = false;
  savingPerson = false;
  editingPersonId: string | null = null;
  personName = '';

  // ── Categories ───────────────────────────────────────────────────────────────
  categories: CategoryOption[] = [];
  loadingCategories = false;
  showCategoryDialog = false;
  savingCategory = false;
  editingCategoryId: string | null = null;
  categoryName = '';

  // ── Classifications ──────────────────────────────────────────────────────────
  classifications: ClassificationOption[] = [];
  loadingClassifications = false;
  showClassificationDialog = false;
  savingClassification = false;
  editingClassificationId: string | null = null;
  classificationName = '';
  classificationAgeLimit: number | null = null;

  ngOnInit(): void {
    this.loadActors();
    this.loadPeople();
    this.loadCategories();
    this.loadClassifications();
  }

  // ── Actors ──────────────────────────────────────────────────────────────────

  loadActors(): void {
    this.loadingActors = true;
    this.api.getActors().subscribe({
      next: (data) => { this.actors = data; this.loadingActors = false; },
      error: () => { this.loadingActors = false; },
    });
  }

  openActorDialog(actor?: ActorOption): void {
    this.editingActorId = actor?.id ?? null;
    this.actorName = actor?.name ?? '';
    this.actorUrlImage = actor?.urlImage ?? '';
    this.showActorDialog = true;
  }

  saveActor(): void {
    if (!this.actorName.trim()) return;
    this.savingActor = true;
    const urlImage = this.actorUrlImage.trim() || null;
    const obs$ = this.editingActorId
      ? this.api.updateActor(this.editingActorId, this.actorName.trim(), urlImage)
      : this.api.createActor(this.actorName.trim(), urlImage);

    obs$.subscribe({
      next: () => {
        this.msg.add({ severity: 'success', summary: 'Éxito', detail: this.editingActorId ? 'Actor actualizado' : 'Actor creado' });
        this.showActorDialog = false;
        this.savingActor = false;
        this.loadActors();
      },
      error: (err: HttpErrorResponse) => {
        this.msg.add({ severity: 'error', summary: 'Error', detail: this.extractError(err, 'No se pudo guardar el actor') });
        this.savingActor = false;
      },
    });
  }

  toggleActor(actor: ActorOption): void {
    this.api.toggleActor(actor.id).subscribe({
      next: () => { this.loadActors(); },
      error: (err: HttpErrorResponse) => {
        this.msg.add({ severity: 'error', summary: 'Error', detail: this.extractError(err, 'No se pudo cambiar el estado') });
      },
    });
  }

  // ── People ──────────────────────────────────────────────────────────────────

  loadPeople(): void {
    this.loadingPeople = true;
    this.api.getPeople().subscribe({
      next: (data) => { this.people = data; this.loadingPeople = false; },
      error: () => { this.loadingPeople = false; },
    });
  }

  openPersonDialog(person?: PeopleOption): void {
    this.editingPersonId = person?.id ?? null;
    this.personName = person?.name ?? '';
    this.showPeopleDialog = true;
  }

  savePerson(): void {
    if (!this.personName.trim()) return;
    this.savingPerson = true;
    const obs$ = this.editingPersonId
      ? this.api.updatePerson(this.editingPersonId, this.personName.trim())
      : this.api.createPerson(this.personName.trim());

    obs$.subscribe({
      next: () => {
        this.msg.add({ severity: 'success', summary: 'Éxito', detail: this.editingPersonId ? 'Persona actualizada' : 'Persona creada' });
        this.showPeopleDialog = false;
        this.savingPerson = false;
        this.loadPeople();
      },
      error: (err: HttpErrorResponse) => {
        this.msg.add({ severity: 'error', summary: 'Error', detail: this.extractError(err, 'No se pudo guardar la persona') });
        this.savingPerson = false;
      },
    });
  }

  togglePerson(person: PeopleOption): void {
    this.api.togglePerson(person.id).subscribe({
      next: () => { this.loadPeople(); },
      error: (err: HttpErrorResponse) => {
        this.msg.add({ severity: 'error', summary: 'Error', detail: this.extractError(err, 'No se pudo cambiar el estado') });
      },
    });
  }

  // ── Categories ───────────────────────────────────────────────────────────────

  loadCategories(): void {
    this.loadingCategories = true;
    this.api.adminGetAllCategories().subscribe({
      next: (data) => { this.categories = data; this.loadingCategories = false; },
      error: () => { this.loadingCategories = false; },
    });
  }

  openCategoryDialog(category?: CategoryOption): void {
    this.editingCategoryId = category?.id ?? null;
    this.categoryName = category?.name ?? '';
    this.showCategoryDialog = true;
  }

  saveCategory(): void {
    if (!this.categoryName.trim()) return;
    this.savingCategory = true;
    const obs$ = this.editingCategoryId
      ? this.api.adminUpdateCategory(this.editingCategoryId, this.categoryName.trim())
      : this.api.adminCreateCategory(this.categoryName.trim());

    obs$.subscribe({
      next: () => {
        this.msg.add({ severity: 'success', summary: 'Éxito', detail: this.editingCategoryId ? 'Categoría actualizada' : 'Categoría creada' });
        this.showCategoryDialog = false;
        this.savingCategory = false;
        this.loadCategories();
      },
      error: (err: HttpErrorResponse) => {
        this.msg.add({ severity: 'error', summary: 'Error', detail: this.extractError(err, 'No se pudo guardar la categoría') });
        this.savingCategory = false;
      },
    });
  }

  toggleCategory(category: CategoryOption): void {
    this.api.adminToggleCategory(category.id).subscribe({
      next: () => { this.loadCategories(); },
      error: (err: HttpErrorResponse) => {
        this.msg.add({ severity: 'error', summary: 'Error', detail: this.extractError(err, 'No se pudo cambiar el estado') });
      },
    });
  }

  // ── Classifications ──────────────────────────────────────────────────────────

  loadClassifications(): void {
    this.loadingClassifications = true;
    this.api.adminGetAllClassifications(this.countryId).subscribe({
      next: (data) => { this.classifications = data; this.loadingClassifications = false; },
      error: () => { this.loadingClassifications = false; },
    });
  }

  openClassificationDialog(classification?: ClassificationOption): void {
    this.editingClassificationId = classification?.id ?? null;
    this.classificationName = classification?.name ?? '';
    this.classificationAgeLimit = classification?.ageLimit ?? null;
    this.showClassificationDialog = true;
  }

  saveClassification(): void {
    if (!this.classificationName.trim() || this.classificationAgeLimit === null) return;
    this.savingClassification = true;
    const obs$ = this.editingClassificationId
      ? this.api.updateClassification(this.countryId, this.editingClassificationId, this.classificationName.trim(), this.classificationAgeLimit)
      : this.api.createClassification(this.countryId, this.classificationName.trim(), this.classificationAgeLimit);

    obs$.subscribe({
      next: () => {
        this.msg.add({ severity: 'success', summary: 'Éxito', detail: this.editingClassificationId ? 'Clasificación actualizada' : 'Clasificación creada' });
        this.showClassificationDialog = false;
        this.savingClassification = false;
        this.loadClassifications();
      },
      error: (err: HttpErrorResponse) => {
        this.msg.add({ severity: 'error', summary: 'Error', detail: this.extractError(err, 'No se pudo guardar la clasificación') });
        this.savingClassification = false;
      },
    });
  }

  toggleClassification(classification: ClassificationOption): void {
    this.api.toggleClassification(this.countryId, classification.id).subscribe({
      next: () => { this.loadClassifications(); },
      error: (err: HttpErrorResponse) => {
        this.msg.add({ severity: 'error', summary: 'Error', detail: this.extractError(err, 'No se pudo cambiar el estado') });
      },
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private extractError(err: HttpErrorResponse, fallback: string): string {
    if (!err?.error) return fallback;
    if (typeof err.error === 'string' && err.error.trim()) return err.error;
    return err.error?.message || err.error?.error || fallback;
  }
}
