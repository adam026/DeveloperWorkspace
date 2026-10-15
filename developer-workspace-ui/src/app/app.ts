
import {Component,signal,inject,ChangeDetectorRef,OnInit} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {Router,NavigationEnd,RouterLink,RouterOutlet} from '@angular/router';
import { filter } from 'rxjs';
import { DocumentService, Document } from './services/document';
import { PromptLibrary } from './prompt-library/prompt-library';
import { MarkdownGenerator } from './markdown-generator/markdown-generator';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    FormsModule,
    MarkdownGenerator,
    PromptLibrary
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {

  // =========================================================
  // 1. Alkalmazás és navigáció
  // =========================================================

  protected readonly title = signal('developer-workspace-ui');

  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  protected currentRouteIsHome = true;

  // A négy jelenleg támogatott fő nézet.
  currentPage:
    | 'dashboard'
    | 'documents'
    | 'prompts'
    | 'markdown-generator' = 'dashboard';

  ngOnInit(): void {
    this.currentRouteIsHome = this.router.url === '/';

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(event => {
        if (event instanceof NavigationEnd) {
          this.currentRouteIsHome =
            event.urlAfterRedirects === '/';

          this.cdr.markForCheck();
        }
      });
  }

  // Fő nézetek közötti váltás.
  protected navigateTo(
    page: 'dashboard' | 'documents' | 'prompts' | 'markdown-generator'
  ): void {
    this.currentPage = page;

    // Dokumentumok betöltése, amikor megnyitjuk ezt a nézetet.
    if (page === 'documents') {
      this.loadDocuments();
    }

    // A promptok betöltését a PromptLibrary komponens végzi.
    this.cdr.markForCheck();
  }


  // =========================================================
  // 2. Dokumentumok – adatok és állapotok
  // =========================================================

  private readonly documentService = inject(DocumentService);

  protected documents: Document[] = [];

  protected searchTerm = '';
  protected selectedCategory = '';

  protected sortOrder:
    | 'newest'
    | 'oldest'
    | 'titleAsc'
    | 'titleDesc' = 'newest';

  protected loading = false;
  protected errorMessage = '';

  protected editingDocumentId: string | null = null;

  protected editDocument = {
    title: '',
    description: '',
    category: ''
  };

  protected deletingDocumentId: string | null = null;
  protected showCreateForm = false;
  protected saving = false;
  protected deleting = false;

  protected newDocument = {
    title: '',
    description: '',
    category: ''
  };


  // =========================================================
  // 3. Dokumentumok – betöltés
  // =========================================================

  protected loadDocuments(): void {
    this.loading = true;
    this.errorMessage = '';

    this.documentService.getAll().subscribe({
      next: documents => {
        this.documents = documents;
        this.loading = false;

        this.cdr.markForCheck();
      },
      error: error => {
        console.error(
          'Hiba a dokumentumok lekérésekor:',
          error
        );

        this.errorMessage =
          'Nem sikerült lekérni a dokumentumokat.';

        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }


  // =========================================================
  // 4. Dokumentumok – új dokumentum létrehozása
  // =========================================================

  protected openCreateForm(): void {
    this.errorMessage = '';
    this.showCreateForm = true;
  }

  protected closeCreateForm(): void {
    this.showCreateForm = false;
  }

  protected createDocument(): void {
    if (!this.newDocument.title.trim() || this.saving) {
      return;
    }

    this.saving = true;
    this.errorMessage = '';

    const documentToCreate: Document = {
      title: this.newDocument.title.trim(),
      description: this.newDocument.description.trim(),
      category: this.newDocument.category.trim()
    };

    this.documentService.create(documentToCreate).subscribe({
      next: () => {
        this.saving = false;

        this.newDocument = {
          title: '',
          description: '',
          category: ''
        };

        this.showCreateForm = false;
        this.loadDocuments();
        this.cdr.markForCheck();
      },
      error: error => {
        console.error(
          'Hiba a dokumentum mentésekor:',
          error
        );

        this.errorMessage =
          'Nem sikerült elmenteni a dokumentumot.';

        this.saving = false;
        this.cdr.markForCheck();
      }
    });
  }


  // =========================================================
  // 5. Dokumentumok – szerkesztés és frissítés
  // =========================================================

  protected startEditing(document: Document): void {
    if (!document.id) {
      return;
    }

    this.editingDocumentId = document.id;

    this.editDocument = {
      title: document.title,
      description: document.description,
      category: document.category
    };
  }

  protected cancelEditing(): void {
    this.editingDocumentId = null;

    this.editDocument = {
      title: '',
      description: '',
      category: ''
    };
  }

  protected updateDocument(): void {
    if (
      !this.editingDocumentId ||
      !this.editDocument.title.trim() ||
      this.saving
    ) {
      return;
    }

    this.saving = true;
    this.errorMessage = '';

    const documentToUpdate: Document = {
      title: this.editDocument.title.trim(),
      description: this.editDocument.description.trim(),
      category: this.editDocument.category.trim()
    };

    this.documentService
      .update(this.editingDocumentId, documentToUpdate)
      .subscribe({
        next: () => {
          this.saving = false;
          this.cancelEditing();
          this.loadDocuments();
          this.cdr.markForCheck();
        },
        error: error => {
          console.error(
            'Hiba a dokumentum frissítésekor:',
            error
          );

          this.errorMessage =
            'Nem sikerült frissíteni a dokumentumot.';

          this.saving = false;
          this.cdr.markForCheck();
        }
      });
  }


  // =========================================================
  // 6. Dokumentumok – törlés
  // =========================================================

  protected deleteDocument(id: string): void {
    if (
      this.deletingDocumentId !== id ||
      this.deleting
    ) {
      return;
    }

    this.errorMessage = '';
    this.deleting = true;

    this.documentService.delete(id).subscribe({
      next: () => {
        this.deleting = false;
        this.deletingDocumentId = null;

        this.loadDocuments();
        this.cdr.markForCheck();
      },
      error: error => {
        console.error(
          'Hiba a dokumentum törlésekor:',
          error
        );

        this.errorMessage =
          'Nem sikerült törölni a dokumentumot.';

        this.deleting = false;
        this.deletingDocumentId = null;
        this.cdr.markForCheck();
      }
    });
  }


  // =========================================================
  // 7. Dokumentumok – kategóriák és szűrés
  // =========================================================

  protected get categories(): string[] {
    return [...new Set(
      this.documents
        .map(document => document.category?.trim())
        .filter((category): category is string => !!category)
    )].sort((a, b) => a.localeCompare(b));
  }

  protected get filteredDocuments(): Document[] {
    const term = this.searchTerm
      .trim()
      .toLocaleLowerCase();

    const filtered = this.documents.filter(document => {
      const matchesSearch =
        !term ||
        document.title.toLocaleLowerCase().includes(term) ||
        (document.description ?? '')
          .toLocaleLowerCase()
          .includes(term) ||
        (document.category ?? '')
          .toLocaleLowerCase()
          .includes(term);

      const matchesCategory =
        !this.selectedCategory ||
        (document.category ?? '').trim() ===
        this.selectedCategory;

      return matchesSearch && matchesCategory;
    });

    // A szűrés után a kiválasztott rendezést alkalmazzuk.
    return [...filtered].sort((a, b) => {
      switch (this.sortOrder) {
        case 'oldest':
          return new Date(a.createdAt ?? 0).getTime()
            - new Date(b.createdAt ?? 0).getTime();

        case 'titleAsc':
          return a.title.localeCompare(b.title);

        case 'titleDesc':
          return b.title.localeCompare(a.title);

        case 'newest':
        default:
          return new Date(b.createdAt ?? 0).getTime()
            - new Date(a.createdAt ?? 0).getTime();
      }
    });
  }
}
