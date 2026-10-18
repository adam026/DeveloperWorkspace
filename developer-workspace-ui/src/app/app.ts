import { Component,signal,inject,ChangeDetectorRef,OnInit}  from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router,NavigationEnd,RouterLink,RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { DocumentService, Document } from './services/document';
import { PromptService, Prompt } from './services/prompt';
import { PromptLibrary } from './prompt-library/prompt-library';
import { MarkdownGenerator } from './markdown-generator/markdown-generator';
import { MarkdownDocument, MarkdownDocumentService } from './services/markdown-document';
import { DatePipe } from '@angular/common';
import { forkJoin } from 'rxjs';

type RecentWorkspaceItem = {
  id: string;
  title: string;
  type: 'Document' | 'Prompt' | 'Markdown';
  subtitle: string;
  date: string;
  sortDate: number;
};

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    FormsModule,
    DatePipe,
    MarkdownGenerator,
    PromptLibrary
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {

  // =========================================================
  // 1. Application state and navigation
  // =========================================================

  protected readonly title = signal('developer-workspace-ui');

  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  protected currentRouteIsHome = true;

  // View states
  currentPage:
    | 'dashboard'
    | 'documents'
    | 'prompts'
    | 'markdown-generator' = 'dashboard';

  ngOnInit(): void {
    this.currentRouteIsHome = this.router.url === '/';

    if (this.currentRouteIsHome) {
      this.loadDashboardStats();
    }

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

  // View state management
  protected navigateTo(
    page: 'dashboard' | 'documents' | 'prompts' | 'markdown-generator'
  ): void {
    this.currentPage = page;

    if (page === 'documents') {
      this.loadDocuments();
    }

    if (page === 'dashboard') {
      this.loadDashboardStats();
    }

    // A promptok betöltését a PromptLibrary komponens végzi.
    this.cdr.markForCheck();
  }

  // Service injections
  private readonly documentService = inject(DocumentService);
  private readonly promptService = inject(PromptService);
  private readonly markdownDocumentService =inject(MarkdownDocumentService);

  protected documents: Document[] = [];
  protected recentlyUpdatedDocuments: MarkdownDocument[] = [];

  protected dashboardDocumentCount = 0;
  protected dashboardPromptCount = 0;
  protected dashboardAgentCount = 0;
  protected dashboardLoading = false;
  protected dashboardError = '';

  protected recentlyUpdatedItems: RecentWorkspaceItem[] =[];

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


  protected loadDashboardStats(): void {
    this.dashboardLoading = true;
    this.dashboardError = '';

    forkJoin({
      documents: this.documentService.getAll(),
      prompts: this.promptService.getAll(),
      markdownDocuments: this.markdownDocumentService.getAll()
    }).subscribe({
      next: ({ documents, prompts, markdownDocuments }) => {
        this.dashboardDocumentCount = documents.length;
        this.dashboardPromptCount = prompts.length;

        this.dashboardAgentCount = markdownDocuments.filter(
          document => document.fileType === 'Agent'
        ).length;

        this.updateRecentlyUpdatedItems(
          documents,
          prompts,
          markdownDocuments
        );

        this.dashboardLoading = false;
        this.cdr.markForCheck();
      },
      error: error => {
        console.error('Failed to load dashboard statistics:', error);
        this.dashboardError =
          'Some dashboard statistics could not be loaded.';
        this.dashboardLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private updateRecentlyUpdatedItems(
    documents: Document[],
    prompts: Prompt[],
    markdownDocuments: MarkdownDocument[]
  ): void {
    const documentItems: RecentWorkspaceItem[] = documents.map(document => {
      const date = document.updatedAt ?? document.createdAt ?? '';

      return {
        id: document.id ?? document.title,
        title: document.title,
        type: 'Document',
        subtitle: document.category,
        date,
        sortDate: date ? new Date(date).getTime() : 0
      };
    });

    const promptItems: RecentWorkspaceItem[] = prompts.map(prompt => {
      const date = prompt.updatedAt ?? prompt.createdAt ?? '';

      return {
        id: prompt.id ?? prompt.title,
        title: prompt.title,
        type: 'Prompt',
        subtitle: prompt.category,
        date,
        sortDate: date ? new Date(date).getTime() : 0
      };
    });

    const markdownItems: RecentWorkspaceItem[] =
      markdownDocuments.map(document => {
        const date = document.updatedAt ?? document.createdAt ?? '';

        return {
          id: document.id ?? document.name,
          title: document.name,
          type: 'Markdown',
          subtitle: document.fileType,
          date,
          sortDate: date ? new Date(date).getTime() : 0
        };
      });

    this.recentlyUpdatedItems = [
      ...documentItems,
      ...promptItems,
      ...markdownItems
    ]
      .sort((a, b) => b.sortDate - a.sortDate)
      .slice(0, 5);
  }
}
