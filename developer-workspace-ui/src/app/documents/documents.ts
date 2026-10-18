import { ChangeDetectorRef,Component,inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  Document,
  DocumentService
} from '../services/document';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './documents.html',
  styleUrl: './documents.css'
})
export class DocumentsComponent {
  private readonly documentService = inject(DocumentService);
  private readonly cdr = inject(ChangeDetectorRef);

  documents: Document[] = [];

  searchTerm = '';
  selectedCategory = '';

  sortOrder: 'newest' | 'oldest' | 'titleAsc' | 'titleDesc' = 'newest';

  loading = false;
  errorMessage = '';

  editingDocumentId: string | null = null;
  deletingDocumentId: string | null = null;

  showCreateForm = false;
  saving = false;
  deleting = false;

  newDocument = {
    title: '',
    description: '',
    category: ''
  };

  editDocument = {
    title: '',
    description: '',
    category: ''
  };

  constructor() {
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.loading = true;
    this.errorMessage = '';

    this.documentService.getAll().subscribe({
      next: documents => {
        this.documents = documents;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: error => {
        console.error('Failed to load documents:', error);
        this.errorMessage = 'Failed to load documents.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  openCreateForm(): void {
    this.errorMessage = '';
    this.showCreateForm = true;
  }

  closeCreateForm(): void {
    this.showCreateForm = false;
    this.newDocument = {
      title: '',
      description: '',
      category: ''
    };
  }

  createDocument(): void {
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
        this.closeCreateForm();
        this.loadDocuments();
        this.cdr.markForCheck();
      },
      error: error => {
        console.error('Failed to create document:', error);
        this.errorMessage = 'Failed to save the document.';
        this.saving = false;
        this.cdr.markForCheck();
      }
    });
  }

  startEditing(document: Document): void {
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

  cancelEditing(): void {
    this.editingDocumentId = null;
    this.editDocument = {
      title: '',
      description: '',
      category: ''
    };
  }

  updateDocument(): void {
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
          console.error('Failed to update document:', error);
          this.errorMessage = 'Failed to update the document.';
          this.saving = false;
          this.cdr.markForCheck();
        }
      });
  }

  deleteDocument(id: string): void {
    if (this.deletingDocumentId !== id || this.deleting) {
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
        console.error('Failed to delete document:', error);
        this.errorMessage = 'Failed to delete the document.';
        this.deleting = false;
        this.deletingDocumentId = null;
        this.cdr.markForCheck();
      }
    });
  }

  get categories(): string[] {
    return [...new Set(
      this.documents
        .map(document => document.category?.trim())
        .filter((category): category is string => !!category)
    )].sort((a, b) => a.localeCompare(b));
  }

  get filteredDocuments(): Document[] {
    const term = this.searchTerm.trim().toLocaleLowerCase();

    const filtered = this.documents.filter(document => {
      const matchesSearch =
        !term ||
        document.title.toLocaleLowerCase().includes(term) ||
        (document.description ?? '').toLocaleLowerCase().includes(term) ||
        (document.category ?? '').toLocaleLowerCase().includes(term);

      const matchesCategory =
        !this.selectedCategory ||
        (document.category ?? '').trim() === this.selectedCategory;

      return matchesSearch && matchesCategory;
    });

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
