import { Component,OnInit,inject,ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule, ArrowLeft, CalendarDays, FileText, Pencil, Trash2, Save, X, AlertCircle, Download, Sparkles, WandSparkles } from 'lucide-angular';
import { ProjectDocumentation,ProjectDocumentationService } from '../services/project-documentation.service';
import { DocumentationProject, DocumentationProjectService } from '../services/documentation-project.service';
import { MarkdownEditorComponent } from '../markdown-editor/markdown-editor';
import { MarkdownHtmlPipe } from '../pipes/markdown-html.pipe';

@Component({
  selector: 'app-documentation-document-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    LucideAngularModule,
    MarkdownEditorComponent,
    MarkdownHtmlPipe
  ],
  templateUrl: './documentation-document-details.html',
  styleUrl: './documentation-document-details.scss'
})
export class DocumentationDocumentDetailsComponent implements OnInit {

  // Dependency injections
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly documentationService = inject(ProjectDocumentationService);
  private readonly projectService = inject(DocumentationProjectService);

  protected projectId = '';
  protected documentId = '';

  protected project: DocumentationProject | null = null;
  protected document: ProjectDocumentation | null = null;

  protected isLoading = true;
  protected isSaving = false;
  protected isDeleting = false;

  protected isEditing = false;
  protected showDeleteConfirmation = false;

  protected errorMessage = '';
  protected successMessage = '';

  // AI related states
  protected isGeneratingDocumentation = false;
  protected isImprovingDocumentation = false;
  protected isGeneratingSummary = false;

  protected showAiInstructions = false;
  protected aiInstructions = '';

  protected aiSummary = '';

  protected editDocument: ProjectDocumentation =
    this.createEmptyDocument();

  // Icons 
  protected readonly ArrowLeft = ArrowLeft;
  protected readonly CalendarDays = CalendarDays;
  protected readonly FileText = FileText;
  protected readonly Pencil = Pencil;
  protected readonly Trash2 = Trash2;
  protected readonly Save = Save;
  protected readonly X = X;
  protected readonly AlertCircle = AlertCircle;
  protected readonly Download = Download;
  protected readonly Sparkles = Sparkles;
  protected readonly WandSparkles = WandSparkles;

  ngOnInit(): void {
    this.projectId =
      this.route.snapshot.paramMap.get('projectId') ?? '';

    this.documentId =
      this.route.snapshot.paramMap.get('documentId') ?? '';

    if (!this.projectId || !this.documentId) {
      this.errorMessage = 'Document information is missing.';
      this.isLoading = false;
      return;
    }

    this.loadData();
  }

  private createEmptyDocument(): ProjectDocumentation {
    return {
      title: '',
      category: '',
      content: '',
      tags: []
    };
  }

  protected loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.projectService.getById(this.projectId).subscribe({
      next: project => {
        this.project = project;

        this.documentationService
          .getById(this.projectId, this.documentId)
          .subscribe({
            next: document => {
              this.document = document;
              this.editDocument = this.copyDocument(document);
              this.isLoading = false;
              this.cdr.detectChanges();
            },
            error: error => {
              console.error('Failed to load document:', error);
              this.errorMessage = 'Failed to load the document.';
              this.isLoading = false;
              this.cdr.detectChanges();
            }
          });
      },
      error: error => {
        console.error('Failed to load project:', error);
        this.errorMessage = 'Failed to load the project.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private copyDocument(
    document: ProjectDocumentation
  ): ProjectDocumentation {
    return {
      ...document,
      tags: [...(document.tags ?? [])]
    };
  }

  protected startEditing(): void {
    if (!this.document) {
      return;
    }

    this.editDocument = this.copyDocument(this.document);
    this.isEditing = true;
    this.showDeleteConfirmation = false;
    this.errorMessage = '';
    this.successMessage = '';
  }

  protected cancelEditing(): void {
    if (this.isSaving) {
      return;
    }

    if (this.document) {
      this.editDocument = this.copyDocument(this.document);
    }

    this.isEditing = false;
    this.errorMessage = '';
  }

  protected saveDocument(): void {
    if (!this.document) {
      return;
    }

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
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
    };

    this.documentationService.update(
      this.projectId,
      this.documentId,
      updatedDocument
    ).subscribe({
      next: () => {
        if (this.document) {
          this.document = {
            ...this.document,
            ...updatedDocument,
            updatedAt: new Date().toISOString()
          };
        }

        this.editDocument = this.copyDocument(this.document!);
        this.isEditing = false;
        this.isSaving = false;
        this.successMessage = 'Document updated successfully.';
        this.cdr.detectChanges();
      },
      error: error => {
        console.error('Failed to update document:', error);
        this.errorMessage = 'Failed to update the document.';
        this.isSaving = false;
        this.cdr.detectChanges();
      }
    });
  }

  protected downloadMarkdown(): void {
    if (!this.document) {
      return;
    }

    const content = this.document.content || '';

    const fileName = this.document.title
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'document';

    const blob = new Blob(
      [content],
      { type: 'text/markdown;charset=utf-8' }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.md`;

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  protected confirmDelete(): void {
    this.showDeleteConfirmation = true;
    this.isEditing = false;
    this.errorMessage = '';
  }

  protected cancelDelete(): void {
    this.showDeleteConfirmation = false;
  }

  protected deleteDocument(): void {
    if (this.isDeleting) {
      return;
    }

    this.isDeleting = true;
    this.errorMessage = '';

    this.documentationService.delete(
      this.projectId,
      this.documentId
    ).subscribe({
      next: () => {
        void this.router.navigate([
          '/documentation',
          this.projectId
        ]);
      },
      error: error => {
        console.error('Failed to delete document:', error);
        this.errorMessage = 'Failed to delete the document.';
        this.isDeleting = false;
        this.cdr.detectChanges(); 
      }
    });
  }

  // AI related methods
  protected generateDocumentation(): void {
    if (!this.project || !this.document) {
      return;
    }

    this.isGeneratingDocumentation = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.documentationService.generateDocumentation({
      projectName: this.project.name,
      category: this.document.category,
      description: this.project.description,
      technologies: this.project.technologies.join(', '),
      additionalContext: this.aiInstructions
    }).subscribe({
      next: response => {
        this.editDocument.content = response.content;
        this.isEditing = true;
        this.isGeneratingDocumentation = false;
        this.aiInstructions = '';
        this.showAiInstructions = false;
        this.successMessage = 'Documentation generated successfully. Review it before saving.';
        this.cdr.detectChanges();
      },
      error: error => {
        console.error('Failed to generate documentation:', error);
        this.errorMessage = 'Failed to generate documentation. Please check the AI service.';
        this.isGeneratingDocumentation = false;
        this.cdr.detectChanges();
      }
    });
  }

  protected improveDocumentation(): void {
    if (!this.editDocument.content.trim()) {
      this.errorMessage = 'There is no documentation content to improve.';
      return;
    }

    this.isImprovingDocumentation = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.documentationService.improveDocumentation({
      content: this.editDocument.content,
      additionalInstructions: this.aiInstructions
    }).subscribe({
      next: response => {
        this.editDocument.content = response.content;
        this.isEditing = true;
        this.isImprovingDocumentation = false;
        this.aiInstructions = '';
        this.showAiInstructions = false;
        this.successMessage = 'Documentation improved successfully. Review it before saving.';
        this.cdr.detectChanges();
      },
      error: error => {
        console.error('Failed to improve documentation:', error);
        this.errorMessage = 'Failed to improve documentation. Please check the AI service.';
        this.isImprovingDocumentation = false;
        this.cdr.detectChanges();
      }
    });
  }

  protected generateSummary(): void {
    const content = this.isEditing
      ? this.editDocument.content
      : this.document?.content ?? '';

    if (!content.trim()) {
      this.errorMessage = 'There is no documentation content to summarize.';
      return;
    }

    this.isGeneratingSummary = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.aiSummary = '';

    this.documentationService.summarizeDocumentation({
      content
    }).subscribe({
      next: response => {
        this.aiSummary = response.summary;
        this.isGeneratingSummary = false;
        this.cdr.detectChanges();
      },
      error: error => {
        console.error('Failed to generate summary:', error);
        this.errorMessage = 'Failed to generate summary. Please check the AI service.';
        this.isGeneratingSummary = false;
        this.cdr.detectChanges();
      }
    });
  }
}
