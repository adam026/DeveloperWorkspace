import { Component,OnInit,inject,ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DocumentationProject, DocumentationProjectService } from '../services/documentation-project.service';
import { ProjectDocumentation, ProjectDocumentationService } from '../services/project-documentation.service';
import { MarkdownEditorComponent } from '../markdown-editor/markdown-editor';
import { Router } from '@angular/router';
import { LucideAngularModule, ArrowLeft, FolderOpen, FileText, Search, CalendarDays, Tag, AlertCircle, Plus, MoreVertical,Pencil,Trash2,Save } from 'lucide-angular';

@Component({
  selector: 'app-documentation-project-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    LucideAngularModule,
    MarkdownEditorComponent
  ],
  templateUrl: './documentation-project-details.html',
  styleUrl: './documentation-project-details.scss'
})
export class DocumentationProjectDetailsComponent implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly projectService =
    inject(DocumentationProjectService);

  private readonly documentationService =
    inject(ProjectDocumentationService);

  // Icons
  protected readonly ArrowLeft = ArrowLeft;
  protected readonly FolderOpen = FolderOpen;
  protected readonly FileText = FileText;
  protected readonly Search = Search;
  protected readonly CalendarDays = CalendarDays;
  protected readonly Tag = Tag;
  protected readonly AlertCircle = AlertCircle;
  protected readonly Plus = Plus;
  protected readonly MoreVertical = MoreVertical;
  protected readonly Pencil = Pencil;
  protected readonly Trash2 = Trash2;
  protected readonly Save = Save;

  // Project data
  project: DocumentationProject | null = null;
  projectId = '';

  // Documentation data
  documents: ProjectDocumentation[] = [];

  // Loading states
  isLoading = true;
  isSaving = false;

  // Messages
  errorMessage = '';
  successMessage = '';

  // Search and filters
  searchTerm = '';
  selectedCategory = '';
  sortOrder: 'newest' | 'oldest' = 'newest';

  // Create form
  showCreateForm = false;

  // Create document
  protected tagsInput = '';

  newDocument: ProjectDocumentation =
    this.createEmptyDocument();

  // Edit document
  editingDocumentId: string | null = null;

  editDocument: ProjectDocumentation =
    this.createEmptyDocument();

  // Delete confirmation
  deletingDocumentId: string | null = null;

  ngOnInit(): void {
    this.projectId =
      this.route.snapshot.paramMap.get('id') ?? '';

    if (!this.projectId) {
      this.errorMessage = 'Project ID is missing.';
      this.isLoading = false;
      return;
    }

    this.loadProject();
    this.loadDocuments();
  }

  // Empty document model
  private createEmptyDocument(): ProjectDocumentation {
    return {
      title: '',
      category: '',
      content: '',
      tags: []
    };
  }

  // Load project
  protected loadProject(): void {
    this.projectService.getById(this.projectId).subscribe({
      next: project => {
        this.project = project;
        this.cdr.detectChanges();
      },
      error: error => {
        console.error('Failed to load project:', error);

        this.errorMessage =
          'Failed to load the project. Please try again.';

        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Load project documentation
  protected loadDocuments(): void {
    this.documentationService
      .getByProjectId(this.projectId)
      .subscribe({
        next: documents => {
          this.documents = documents;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: error => {
          console.error('Failed to load documentation:', error);

          this.errorMessage =
            'Failed to load project documentation.';

          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  // Filter and sort documents
  protected get filteredDocuments(): ProjectDocumentation[] {
    const term = this.searchTerm.trim().toLowerCase();

    let result = this.documents.filter(document => {
      const matchesSearch =
        !term ||
        document.title.toLowerCase().includes(term) ||
        document.category.toLowerCase().includes(term) ||
        document.content.toLowerCase().includes(term) ||
        document.tags.some(tag => tag.toLowerCase().includes(term));

      const matchesCategory =
        !this.selectedCategory ||
        document.category === this.selectedCategory;

      return matchesSearch && matchesCategory;
    });

    result = [...result].sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();

      return this.sortOrder === 'newest'
        ? dateB - dateA
        : dateA - dateB;
    });

    return result;
  }

  // Available categories
  protected get documentCategories(): string[] {
    return [...new Set(
      this.documents
        .map(document => document.category)
        .filter(category => category.trim().length > 0)
    )].sort((a, b) => a.localeCompare(b));
  }

  // Preview content for document list
  protected getDocumentPreview(content: string): string {
    return content
      .replace(/```[\s\S]*?```/g, '[Code block]')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/\[([^\]]+)\]\(.*?\)/g, '$1')
      .replace(/[*_~>]/g, '')
      .replace(/^\s*[-+]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Open create form
  protected openCreateForm(): void {
    this.newDocument = this.createEmptyDocument();
    this.errorMessage = '';
    this.successMessage = '';
    this.showCreateForm = true;
  }

  // Close create form
  protected closeCreateForm(): void {
    if (this.isSaving) {
      return;
    }

    this.showCreateForm = false;
    this.errorMessage = '';
    this.newDocument = this.createEmptyDocument();
    this.tagsInput = '';
  }

  // Create document
  protected createDocument(): void {
    const title = this.newDocument.title.trim();
    const category = this.newDocument.category.trim();

    if (!title || !category) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const document: ProjectDocumentation = {
      title,
      category,
      content: this.newDocument.content.trim(),
      tags: this.tagsInput
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
    };

    this.documentationService.create(this.projectId, document).subscribe({
      next: createdDocument => {
        this.documents = [createdDocument, ...this.documents];

        this.newDocument = this.createEmptyDocument();
        this.tagsInput = '';
        this.showCreateForm = false;
        this.isSaving = false;

        this.successMessage = 'Document created successfully.';
        this.cdr.detectChanges();
      },
      error: error => {
        console.error('Failed to create document:', error);

        this.errorMessage = 'Failed to create the document. Please try again.';
        this.isSaving = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Open document
  protected openDocument(documentId: string): void {
    this.router.navigate([
      '/documentation',
      this.projectId,
      'documents',
      documentId
    ]);
  }

  // Edit document
  protected startEditing(document: ProjectDocumentation): void {
    this.editingDocumentId = document.id ?? null;

    this.editDocument = {
      title: document.title,
      category: document.category,
      content: document.content,
      tags: [...document.tags]
    };

    this.errorMessage = '';
    this.successMessage = '';
  }

  protected cancelEditing(): void {
    this.editingDocumentId = null;
    this.editDocument = this.createEmptyDocument();
    this.errorMessage = '';
  }

  protected saveDocument(documentId: string): void {
    const title = this.editDocument.title.trim();
    const category = this.editDocument.category.trim();

    if (!title || !category) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const updatedDocument: ProjectDocumentation = {
      title,
      category,
      content: this.editDocument.content.trim(),
      tags: [...this.editDocument.tags]
    };

    this.documentationService.update(
      this.projectId,
      documentId,
      updatedDocument
    ).subscribe({
      next: () => {
        const index = this.documents.findIndex(doc => doc.id === documentId);

        if (index !== -1) {
          this.documents[index] = {
            ...this.documents[index],
            ...updatedDocument,
            updatedAt: new Date().toISOString()
          };
        }

        this.cancelEditing();
        this.isSaving = false;
        this.successMessage = 'Document updated successfully.';
        this.cdr.detectChanges();
      },
      error: error => {
        console.error('Failed to update document:', error);
        this.errorMessage = 'Failed to update the document. Please try again.';
        this.isSaving = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Delete document
  protected deleteDocument(documentId: string): void {
    this.documentationService.delete(
      this.projectId,
      documentId
    ).subscribe({
      next: () => {
        this.documents = this.documents.filter(
          document => document.id !== documentId
        );

        this.deletingDocumentId = null;
        this.successMessage = 'Document deleted successfully.';
        this.cdr.detectChanges();
      },
      error: error => {
        console.error('Failed to delete document:', error);
        this.errorMessage = 'Failed to delete the document. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }

  protected confirmDelete(documentId: string): void {
    this.deletingDocumentId = documentId;
    this.errorMessage = '';
    this.successMessage = '';
  }

  protected cancelDelete(): void {
    this.deletingDocumentId = null;
  }
}
