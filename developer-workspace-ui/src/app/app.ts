
import { Component, signal, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { DocumentService, Document } from './services/document';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('developer-workspace-ui');

  private readonly documentService = inject(DocumentService);
  private readonly cdr = inject(ChangeDetectorRef);

  protected documents: Document[] = [];
  protected loading = false;
  protected errorMessage = '';
  protected showCreateForm = false;
  protected saving = false;
  protected newDocument = {
    title: '',
    description: '',
    category: ''
  };
  protected currentPage: 'dashboard' | 'documents' = 'dashboard';

  protected navigateTo(page: 'dashboard' | 'documents'): void {
    this.currentPage = page;

    if (page === 'documents') {
      this.loading = true;
      this.loadDocuments();
    }
  }

  protected loadDocuments(): void {
    this.loading = true;
    this.errorMessage = '';

    this.documentService.getAll().subscribe({
      next: (documents) => {
        this.documents = documents;
        this.loading = false;
        console.log('Lekért dokumentumok:', documents);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Hiba a dokumentumok lekérésekor:', error);
        this.errorMessage = 'Nem sikerült lekérni a dokumentumokat.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  protected openCreateForm(): void {
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
      error: (error) => {
        console.error('Hiba a dokumentum mentésekor:', error);
        this.errorMessage = 'Nem sikerült elmenteni a dokumentumot.';
        this.saving = false;
        this.cdr.markForCheck();
      }
    });
  }
}
