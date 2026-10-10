
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
  protected editingDocumentId: string | null = null;
  protected editDocument = {
    title: '',
    description: '',
    category: ''
  };
  protected deletingDocumentId: string | null = null;
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

  protected updateDocument(): void {
    if (!this.editingDocumentId || !this.editDocument.title.trim() || this.saving) {
      return;
    }

    this.saving = true;
    this.errorMessage = '';

    const documentToUpdate: Document = {
      title: this.editDocument.title.trim(),
      description: this.editDocument.description.trim(),
      category: this.editDocument.category.trim()
    };

    this.documentService.update(this.editingDocumentId, documentToUpdate).subscribe({
      next: () => {
        this.saving = false;
        this.cancelEditing();
        this.loadDocuments();
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Hiba a dokumentum frissítésekor:', error);
        this.errorMessage = 'Nem sikerült frissíteni a dokumentumot.';
        this.saving = false;
        this.cdr.markForCheck();
      }
    });
  }


  protected deleteDocument(id: string): void {
    if (this.deletingDocumentId !== id) {
      return;
    }

    this.errorMessage = '';
    this.saving = true;

    this.documentService.delete(id).subscribe({
      next: () => {
        this.saving = false;
        this.deletingDocumentId = null;
        this.loadDocuments();
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.saving = false;
        console.error('Hiba a dokumentum törlésekor:', error);
        this.errorMessage = 'Nem sikerült törölni a dokumentumot.';
        this.deletingDocumentId = null;
        this.cdr.markForCheck();
      }
    });
  }

}
