import { Component, OnInit, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { DrawerModule } from 'primeng/drawer';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { MessageService } from 'primeng/api';
import { forkJoin } from 'rxjs';
import {
  ActorOption,
  CastItem,
  CategoryOption,
  ClassificationOption,
  MovieAdminDetail,
  MovieCountryInfoItem,
  MoviePeopleItem,
  MovieSummary,
  PeopleOption,
  PosterItem,
  UpdateMoviePayload
} from '../../../../core/models/movie.model';
import {
  MoviesApiService,
  STATIC_COUNTRIES
} from '../../../../core/services/movies-api.service';
import { SharedModule } from '../../../../shared/shared.module';

/** Valida que classUS tenga valor */
function atLeastOneClassification(control: AbstractControl): ValidationErrors | null {
  const us = control.get('classUS')?.value;
  return us ? null : { classificationRequired: true };
}

const ROLE_OPTIONS = [
  { label: 'Director', value: 'DIRECTOR' },
  { label: 'Guionista', value: 'WRITER' },
  { label: 'Productor', value: 'PRODUCER' }
];

const [US_ID, MX_ID, ES_ID] = STATIC_COUNTRIES.map(c => c.id);

@Component({
  selector: 'app-admin-movies',
  standalone: true,
  imports: [
    SharedModule,
    FormsModule,
    InputTextModule,
    TextareaModule,
    InputNumberModule,
    DatePickerModule,
    SelectModule,
    MultiSelectModule,
    ProgressSpinnerModule,
    DialogModule,
    ToastModule,
    DrawerModule,
    TabsModule,
    TagModule,
    ToggleSwitchModule
  ],
  providers: [MessageService],
  templateUrl: './movies.component.html',
  styleUrl: './movies.component.scss'
})
export class AdminMoviesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly moviesApiService = inject(MoviesApiService);
  private readonly messageService = inject(MessageService);
  private readonly sanitizer = inject(DomSanitizer);

  loading = false;
  submitting = false;
  submitted = false;
  showPostersModal = false;
  showPeopleModal = false;
  showActorsModal = false;

  // ──── EDIT DRAWER ────────────────────────────────────────────────────────
  showEditDrawer = false;
  editMovieId: string | null = null;
  editLoading = false;
  submittingBasicInfo = false;
  submittingEditSection = false;
  editActiveTab = '0';

  // ──── FILTROS ────────────────────────────────────────────────────────────
  filterTitle = '';
  filterCategoryId: string | null = null;
  filterClassificationId: string | null = null;

  editBasicForm: FormGroup = this.buildEditBasicForm();
  private editOriginalReleaseDate: string | null = null;

  editCountryInfo: MovieCountryInfoItem[] = [];
  editCategories: CategoryOption[] = [];
  editPosters: PosterItem[] = [];
  editPeople: MoviePeopleItem[] = [];
  editCast: CastItem[] = [];

  editPeopleRols: Record<string, string> = {};
  editCastChars: Record<string, string> = {};

  editAddClassUSCtrl = new FormControl<string | null>(null);
  editAddClassMXCtrl = new FormControl<string | null>(null);
  editAddClassESCtrl = new FormControl<string | null>(null);
  editAddCategoryCtrl = new FormControl<string | null>(null);
  editAddPersonCtrl = new FormControl<string | null>(null);
  editAddPersonRolCtrl = new FormControl<string | null>(null);
  editAddActorCtrl = new FormControl<string | null>(null);
  editAddPosterUrl = '';
  editAddPosterIsMain = false;
  editAddCharacterName = '';

  movies: MovieSummary[] = [];
  categories: CategoryOption[] = [];
  peopleOptions: PeopleOption[] = [];
  actorOptions: ActorOption[] = [];
  classificationsByCountry: Record<string, ClassificationOption[]> = {};
  countries = STATIC_COUNTRIES;
  roleOptions = ROLE_OPTIONS;
  today = new Date();

  form: FormGroup = this.buildForm();

  get postersArray(): FormArray {
    return this.form.get('posters') as FormArray;
  }

  get peopleFormArray(): FormArray {
    return this.form.get('people') as FormArray;
  }

  get actorsFormArray(): FormArray {
    return this.form.get('actors') as FormArray;
  }

  get classificationOptionsUS() {
    return (this.classificationsByCountry[US_ID] ?? []).map(c => ({
      label: `${c.name} (${c.ageLimit}+)`,
      value: c.id
    }));
  }

  get classificationError(): boolean {
    return this.submitted && this.form.hasError('classificationRequired');
  }

  get categoryOptions() {
    return this.categories
      .filter(c => c.active)
      .map(c => ({ label: c.name, value: c.id }));
  }

  get peopleSelectOptions() {
    return this.peopleOptions.map(p => ({ label: p.name, value: p.id }));
  }

  get actorSelectOptions() {
    return this.actorOptions.map(a => ({ label: a.name, value: a.id }));
  }

  getActorImage(i: number): string | null {
    const actorId = (this.actorsFormArray.at(i) as FormGroup).get('actorId')?.value as string | null;
    if (!actorId) return null;
    return this.actorOptions.find(a => a.id === actorId)?.urlImage ?? null;
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  addPoster(): void {
    const isFirst = this.postersArray.length === 0;
    this.postersArray.push(
      this.fb.group({
        urlImagen: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
        isMain: [isFirst]
      })
    );
    if (isFirst) {
      this.showInfo('El primer póster se marcó automáticamente como principal.');
    }
  }

  removePoster(i: number): void {
    const wasMain = (this.postersArray.at(i) as FormGroup).get('isMain')?.value as boolean;
    this.postersArray.removeAt(i);
    if (wasMain && this.postersArray.length > 0) {
      (this.postersArray.at(0) as FormGroup).get('isMain')?.setValue(true);
      this.showInfo('El póster principal fue reasignado automáticamente al primero disponible.');
    }
  }

  /** Comportamiento radio: solo un póster puede ser principal */
  setMainPoster(i: number, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (isChecked) {
      this.postersArray.controls.forEach((ctrl, idx) => {
        if (idx !== i) {
          (ctrl as FormGroup).get('isMain')?.setValue(false, { emitEvent: false });
        }
      });
    }
  }

  addPerson(): void {
    this.peopleFormArray.push(
      this.fb.group({
        peopleId: [null, Validators.required],
        rol: [null, Validators.required]
      })
    );
  }

  removePerson(i: number): void {
    this.peopleFormArray.removeAt(i);
  }

  addActor(): void {
    this.actorsFormArray.push(
      this.fb.group({
        actorId: [null, Validators.required],
        characterName: ['', Validators.required]
      })
    );
  }

  removeActor(i: number): void {
    this.actorsFormArray.removeAt(i);
  }

  isActorFieldInvalid(i: number, field: string): boolean {
    const c = (this.actorsFormArray.at(i) as FormGroup).get(field);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  submit(): void {
    this.submitted = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const fields = this.getInvalidFieldNames();
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario incompleto',
        detail: `Revisa los siguientes campos: ${fields.join(' • ')}`,
        life: 7000
      });
      return;
    }

    this.submitting = true;

    const v = this.form.value;
    const classificationIds = ([v['classUS']] as (string | null)[])
      .filter((id): id is string => !!id);

    const payload = {
      title: String(v['title']).trim(),
      synopsis: String(v['synopsis']).trim(),
      duration: v['duration'] as number,
      originalLanguage: String(v['originalLanguage']).trim(),
      trailerLink: v['trailerLink']?.trim() || null,
      releaseDate: this.formatDate(v['releaseDate'] as Date),
      classificationIds,
      categories: (v['categories'] as string[]) ?? [],
      posters: (v['posters'] as { urlImagen: string; isMain: boolean }[]).map(p => ({
        urlImagen: p.urlImagen.trim(),
        isMain: p.isMain
      })),
      people: (v['people'] as { peopleId: string; rol: string }[]).map(p => ({
        peopleId: p.peopleId,
        rol: p.rol
      })),
      actors: (v['actors'] as { actorId: string; characterName: string }[]).map(a => ({
        actorId: a.actorId,
        characterName: a.characterName?.trim() || null
      }))
    };

    this.moviesApiService.createMovie(payload).subscribe({
      next: () => {
        this.submitting = false;
        this.submitted = false;
        this.showSuccess('Película creada exitosamente.');
        this.resetForm();
        this.loadMovies();
      },
      error: (err: HttpErrorResponse) => {
        this.submitting = false;
        this.showError(this.extractError(err, 'No se pudo crear la película. Verifica los campos e intenta de nuevo.'));
      }
    });
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  isPosterFieldInvalid(i: number, field: string): boolean {
    const c = (this.postersArray.at(i) as FormGroup).get(field);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  isPersonFieldInvalid(i: number, field: string): boolean {
    const c = (this.peopleFormArray.at(i) as FormGroup).get(field);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  getClassificationsText(movie: MovieSummary): string {
    return movie.classifications.map(c => c.name).join(', ') || '—';
  }

  get editTrailerEmbedUrl(): SafeResourceUrl | null {
    const raw = (this.editBasicForm.get('trailerLink')?.value as string | null | undefined) ?? '';
    if (!raw?.trim()) return null;
    let videoId: string | null = null;
    try {
      const url = new URL(raw.trim());
      if (url.hostname === 'youtu.be') {
        videoId = url.pathname.slice(1);
      } else if (url.hostname.includes('youtube.com')) {
        videoId = url.searchParams.get('v');
      }
    } catch { return null; }
    if (!videoId) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube.com/embed/${videoId}`
    );
  }

  // ──── EDIT DRAWER ─────────────────────────────────────────────────────────

  get editAvailableCategoryOptions() {
    const assignedIds = new Set(this.editCategories.map(c => c.id));
    return this.categories
      .filter(c => c.active && !assignedIds.has(c.id))
      .map(c => ({ label: c.name, value: c.id }));
  }

  get editAvailableActorOptions() {
    const assignedIds = new Set(this.editCast.map(c => c.actorId));
    return this.actorOptions
      .filter(a => !assignedIds.has(a.id))
      .map(a => ({ label: a.name, value: a.id }));
  }

  editClassForCountry(countryId: string): MovieCountryInfoItem | undefined {
    return this.editCountryInfo.find(c => c.countryId === countryId);
  }

  getEditClassCtrl(countryId: string): FormControl<string | null> {
    return this.editAddClassUSCtrl;
  }

  isEditFieldInvalid(field: string): boolean {
    const c = this.editBasicForm.get(field);
    return !!c && c.invalid && c.touched;
  }

  openEditDrawer(movie: MovieSummary): void {
    this.editMovieId = movie.id;
    this.editActiveTab = '0';
    this.showEditDrawer = true;
    this.editBasicForm.reset();
    this.editCountryInfo = [];
    this.editCategories = [];
    this.editPosters = [];
    this.editPeople = [];
    this.editCast = [];
    this.loadEditData();
  }

  private loadEditData(): void {
    if (!this.editMovieId) return;
    this.editLoading = true;
    forkJoin({
      admin: this.moviesApiService.getMovieAdmin(this.editMovieId),
      countryInfo: this.moviesApiService.getMovieCountryInfo(this.editMovieId),
      categories: this.moviesApiService.getMovieCategories(this.editMovieId),
      posters: this.moviesApiService.getMoviePosters(this.editMovieId),
      people: this.moviesApiService.getMoviePeople(this.editMovieId),
      cast: this.moviesApiService.getMovieCast(this.editMovieId)
    }).subscribe({
      next: ({ admin, countryInfo, categories, posters, people, cast }) => {
        this.editOriginalReleaseDate = admin.releaseDate;
        this.editBasicForm.patchValue({
          title: admin.title,
          synopsis: admin.synopsis,
          duration: admin.duration,
          originalLanguage: admin.originalLanguage,
          trailerLink: admin.trailerLink ?? '',
          releaseDate: new Date(admin.releaseDate + 'T00:00:00'),
          allowComments: admin.allowComments,
          allowRatings: admin.allowRatings
        });
        this.editCountryInfo = countryInfo;
        this.editCategories = categories;
        this.editPosters = posters;
        this.editPeople = people;
        this.editCast = cast;
        this.editPeopleRols = {};
        people.forEach(p => { this.editPeopleRols[p.moviePeopleId] = p.rol; });
        this.editCastChars = {};
        cast.forEach(c => { this.editCastChars[c.castId] = c.characterName ?? ''; });
        this.editLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.editLoading = false;
        this.showError(this.extractError(err, 'Error al cargar los datos de la película.'));
      }
    });
  }

  saveBasicInfo(): void {
    this.editBasicForm.markAllAsTouched();
    if (this.editBasicForm.invalid || !this.editMovieId) return;
    this.submittingBasicInfo = true;
    const v = this.editBasicForm.value;
    const formDate = v['releaseDate'] as Date | null;
    const formDateStr = formDate ? this.formatDate(formDate) : null;
    const payload: UpdateMoviePayload = {
      title: String(v['title']).trim(),
      synopsis: String(v['synopsis']).trim(),
      duration: v['duration'] as number,
      originalLanguage: String(v['originalLanguage']).trim(),
      trailerLink: v['trailerLink']?.trim() || null,
      allowComments: v['allowComments'] as boolean,
      allowRatings: v['allowRatings'] as boolean
    };
    if (formDateStr && formDateStr !== this.editOriginalReleaseDate) {
      payload.releaseDate = formDateStr;
    }
    this.moviesApiService.updateMovie(this.editMovieId, payload).subscribe({
      next: () => {
        this.submittingBasicInfo = false;
        this.showSuccess('Información básica actualizada.');
        this.loadMovies();
      },
      error: (err: HttpErrorResponse) => {
        this.submittingBasicInfo = false;
        this.showError(this.extractError(err, 'Error al actualizar la información.'));
      }
    });
  }

  editAddClassification(ctrl: FormControl<string | null>, countryId: string): void {
    const classificationId = ctrl.value;
    if (!classificationId || !this.editMovieId) return;
    this.submittingEditSection = true;
    this.moviesApiService.addMovieClassification(this.editMovieId, classificationId).subscribe({
      next: data => {
        this.editCountryInfo = data;
        ctrl.setValue(null);
        this.submittingEditSection = false;
      },
      error: (err: HttpErrorResponse) => {
        this.submittingEditSection = false;
        this.showError(this.extractError(err, 'Error al agregar clasificación.'));
      }
    });
  }

  editToggleClassification(movieCountryInfoId: string): void {
    if (!this.editMovieId) return;
    this.moviesApiService.toggleMovieClassification(this.editMovieId, movieCountryInfoId).subscribe({
      next: updated => {
        this.editCountryInfo = this.editCountryInfo.map(c =>
          c.movieCountryInfoId === movieCountryInfoId ? { ...c, active: updated.active } : c
        );
      },
      error: (err: HttpErrorResponse) => this.showError(this.extractError(err, 'Error al cambiar estado de clasificación.'))
    });
  }

  editRemoveClassification(movieCountryInfoId: string): void {
    if (!this.editMovieId) return;
    this.moviesApiService.removeMovieClassification(this.editMovieId, movieCountryInfoId).subscribe({
      next: data => { this.editCountryInfo = data; },
      error: (err: HttpErrorResponse) => this.showError(this.extractError(err, 'Error al eliminar clasificación.'))
    });
  }

  editAddCategory(): void {
    const categoryId = this.editAddCategoryCtrl.value;
    if (!categoryId || !this.editMovieId) return;
    this.submittingEditSection = true;
    this.moviesApiService.addMovieCategory(this.editMovieId, categoryId).subscribe({
      next: data => {
        this.editCategories = data;
        this.editAddCategoryCtrl.setValue(null);
        this.submittingEditSection = false;
      },
      error: (err: HttpErrorResponse) => {
        this.submittingEditSection = false;
        this.showError(this.extractError(err, 'Error al agregar categoría.'));
      }
    });
  }

  editRemoveCategory(categoryId: string): void {
    if (!this.editMovieId) return;
    this.moviesApiService.removeMovieCategory(this.editMovieId, categoryId).subscribe({
      next: data => { this.editCategories = data; },
      error: (err: HttpErrorResponse) => this.showError(this.extractError(err, 'Error al quitar categoría.'))
    });
  }

  editAddPoster(): void {
    const url = this.editAddPosterUrl.trim();
    if (!url || !this.editMovieId) return;
    this.submittingEditSection = true;
    this.moviesApiService.addMoviePoster(this.editMovieId, url, this.editAddPosterIsMain).subscribe({
      next: data => {
        this.editPosters = data;
        this.editAddPosterUrl = '';
        this.editAddPosterIsMain = false;
        this.submittingEditSection = false;
      },
      error: (err: HttpErrorResponse) => {
        this.submittingEditSection = false;
        this.showError(this.extractError(err, 'Error al agregar póster.'));
      }
    });
  }

  editSetMainPoster(posterId: string): void {
    if (!this.editMovieId) return;
    this.moviesApiService.setMainMoviePoster(this.editMovieId, posterId).subscribe({
      next: data => { this.editPosters = data; },
      error: (err: HttpErrorResponse) => this.showError(this.extractError(err, 'Error al cambiar póster principal.'))
    });
  }

  editDeletePoster(posterId: string): void {
    if (!this.editMovieId) return;
    this.moviesApiService.deleteMoviePoster(this.editMovieId, posterId).subscribe({
      next: data => { this.editPosters = data; },
      error: (err: HttpErrorResponse) => this.showError(this.extractError(err, 'Error al eliminar póster.'))
    });
  }

  editAddPerson(): void {
    const peopleId = this.editAddPersonCtrl.value;
    const rol = this.editAddPersonRolCtrl.value;
    if (!peopleId || !rol || !this.editMovieId) return;
    this.submittingEditSection = true;
    this.moviesApiService.addMoviePerson(this.editMovieId, peopleId, rol).subscribe({
      next: data => {
        this.editPeople = data;
        data.forEach(p => { this.editPeopleRols[p.moviePeopleId] = p.rol; });
        this.editAddPersonCtrl.setValue(null);
        this.editAddPersonRolCtrl.setValue(null);
        this.submittingEditSection = false;
      },
      error: (err: HttpErrorResponse) => {
        this.submittingEditSection = false;
        this.showError(this.extractError(err, 'Error al agregar persona.'));
      }
    });
  }

  editUpdatePersonRol(moviePeopleId: string): void {
    const rol = this.editPeopleRols[moviePeopleId];
    if (!rol || !this.editMovieId) return;
    this.moviesApiService.updateMoviePersonRol(this.editMovieId, moviePeopleId, rol).subscribe({
      next: data => {
        this.editPeople = data;
        data.forEach(p => { this.editPeopleRols[p.moviePeopleId] = p.rol; });
        this.showSuccess('Rol actualizado.');
      },
      error: (err: HttpErrorResponse) => this.showError(this.extractError(err, 'Error al actualizar rol.'))
    });
  }

  editRemovePerson(moviePeopleId: string): void {
    if (!this.editMovieId) return;
    this.moviesApiService.removeMoviePerson(this.editMovieId, moviePeopleId).subscribe({
      next: data => { this.editPeople = data; },
      error: (err: HttpErrorResponse) => this.showError(this.extractError(err, 'Error al quitar persona.'))
    });
  }

  editAddActor(): void {
    const actorId = this.editAddActorCtrl.value;
    const characterName = this.editAddCharacterName.trim();
    if (!actorId || !characterName || !this.editMovieId) return;
    this.submittingEditSection = true;
    this.moviesApiService.addMovieActor(this.editMovieId, actorId, characterName).subscribe({
      next: data => {
        this.editCast = data;
        data.forEach(c => { this.editCastChars[c.castId] = c.characterName ?? ''; });
        this.editAddActorCtrl.setValue(null);
        this.editAddCharacterName = '';
        this.submittingEditSection = false;
      },
      error: (err: HttpErrorResponse) => {
        this.submittingEditSection = false;
        this.showError(this.extractError(err, 'Error al agregar actor.'));
      }
    });
  }

  editUpdateCharacterName(castId: string): void {
    const characterName = this.editCastChars[castId];
    if (!characterName?.trim() || !this.editMovieId) return;
    this.moviesApiService.updateCastCharacterName(this.editMovieId, castId, characterName.trim()).subscribe({
      next: updated => {
        this.editCast = this.editCast.map(c =>
          c.castId === castId ? { ...c, characterName: updated.characterName } : c
        );
        this.showSuccess('Personaje actualizado.');
      },
      error: (err: HttpErrorResponse) => this.showError(this.extractError(err, 'Error al actualizar nombre de personaje.'))
    });
  }

  editRemoveActor(castId: string): void {
    if (!this.editMovieId) return;
    this.moviesApiService.removeMovieActor(this.editMovieId, castId).subscribe({
      next: data => { this.editCast = data; },
      error: (err: HttpErrorResponse) => this.showError(this.extractError(err, 'Error al quitar actor.'))
    });
  }

  private buildEditBasicForm(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(75)]],
      synopsis: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(255)]],
      duration: [null, [Validators.required, Validators.min(1)]],
      originalLanguage: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      trailerLink: [''],
      releaseDate: [null],
      allowComments: [true],
      allowRatings: [true]
    });
  }

  private buildForm(): FormGroup {
    return this.fb.group(
      {
        title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(75)]],
        synopsis: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(255)]],
        duration: [null, [Validators.required, Validators.min(1)]],
        originalLanguage: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
        trailerLink: [''],
        releaseDate: [null, Validators.required],
        classUS: [null],
        categories: [[]],
        posters: this.fb.array([]),
        people: this.fb.array([]),
        actors: this.fb.array([])
      },
      { validators: [atLeastOneClassification] }
    );
  }

  private loadInitialData(): void {
    this.loading = true;
    forkJoin({
      categories: this.moviesApiService.getCategories(),
      people: this.moviesApiService.getPeople(),
      actors: this.moviesApiService.getActors(),
      clUS: this.moviesApiService.getClassificationsByCountry(US_ID)
    }).subscribe({
      next: ({ categories, people, actors, clUS }) => {
        this.categories = categories;
        this.peopleOptions = people;
        this.actorOptions = actors;
        this.classificationsByCountry = { [US_ID]: clUS };
        this.loading = false;
        this.loadMovies();
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.loadMovies();
  }

  clearFilters(): void {
    this.filterTitle = '';
    this.filterCategoryId = null;
    this.filterClassificationId = null;
    this.loadMovies();
  }

  get hasActiveFilters(): boolean {
    return !!(this.filterTitle.trim() || this.filterCategoryId || this.filterClassificationId);
  }

  private loadMovies(): void {
    this.moviesApiService.getMovies(US_ID, {
      title:            this.filterTitle || undefined,
      categoryId:       this.filterCategoryId ?? undefined,
      classificationId: this.filterClassificationId ?? undefined
    }).subscribe({
      next: data => { this.movies = data; },
      error: () => { this.movies = []; }
    });
  }

  private resetForm(): void {
    this.form.reset({ classUS: null, categories: [] });
    this.postersArray.clear();
    this.peopleFormArray.clear();
    this.actorsFormArray.clear();
  }

  private formatDate(date: Date | string): string {
    if (typeof date === 'string') return date;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private getInvalidFieldNames(): string[] {
    const names: string[] = [];
    const f = this.form;
    if (f.get('title')?.invalid)            names.push('Título');
    if (f.get('synopsis')?.invalid)         names.push('Sinopsis');
    if (f.get('duration')?.invalid)         names.push('Duración');
    if (f.get('originalLanguage')?.invalid) names.push('Idioma original');
    if (f.get('releaseDate')?.invalid)      names.push('Fecha de estreno');
    if (f.hasError('classificationRequired')) names.push('Clasificación (mín. 1 país)');
    if (this.postersArray.controls.some(c => c.invalid)) names.push('Pósters (URL inválida)');
    if (this.peopleFormArray.controls.some(c => c.invalid)) names.push('Equipo (campos incompletos)');
    if (this.actorsFormArray.controls.some(c => c.invalid)) names.push('Reparto (campos incompletos)');
    return names;
  }

  private showSuccess(msg: string): void {
    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: msg, life: 4000 });
  }

  private showError(msg: string): void {
    this.messageService.add({ severity: 'error', summary: 'Error', detail: msg, life: 5000 });
  }

  private showInfo(msg: string): void {
    this.messageService.add({ severity: 'info', summary: 'Info', detail: msg, life: 3500 });
  }

  private extractError(err: HttpErrorResponse, fallback: string): string {
    if (!err?.error) return fallback;
    if (typeof err.error === 'string' && err.error.trim()) return err.error;
    return err.error?.message || err.error?.error || fallback;
  }
}
