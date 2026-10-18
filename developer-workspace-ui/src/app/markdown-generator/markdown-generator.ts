import { CommonModule } from '@angular/common';
import { Component, ChangeDetectorRef, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  MarkdownDocument,
  MarkdownFileType,
  MarkdownDocumentService
} from '../services/markdown-document';

@Component({
  selector: 'app-markdown-generator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './markdown-generator.html',
  styleUrl: './markdown-generator.css'
})
export class MarkdownGenerator implements OnInit {
  private readonly markdownService = inject(MarkdownDocumentService);
  private readonly cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.loadSavedDocuments();
  }

  protected readonly fileTypes: {
    value: MarkdownFileType;
    label: string;
    defaultPath: string;
  }[] = [
      {
        value: 'Agent',
        label: 'Agent',
        defaultPath: '.github/agents/my-agent.agent.md'
      },
      {
        value: 'Domain',
        label: 'Domain knowledge',
        defaultPath: 'docs/domain-knowledge.md'
      },
      {
        value: 'HowTo',
        label: 'How-to guide',
        defaultPath: 'docs/how-to.md'
      },
      {
        value: 'Rule',
        label: 'Instruction rule',
        defaultPath: '.github/instructions/my-rule.instructions.md'
      },
      {
        value: 'Skill',
        label: 'Skill',
        defaultPath: '.github/skills/my-skill/SKILL.md'
      },
      {
        value: 'CopilotInstructions',
        label: 'Copilot instructions',
        defaultPath: '.github/copilot-instructions.md'
      }
    ];

  protected selectedType: MarkdownFileType = 'Agent';
  protected name = '';
  protected description = '';
  protected requirements = '';
  protected filePath = this.fileTypes[0].defaultPath;

  // State management
  protected isGenerating = false;
  protected isSaving = false;
  protected errorMessage = '';
  protected successMessage = '';
  protected generatedDocument: MarkdownDocument | null = null;

  // Form visibility
  protected showGeneratorForm = false;

  // Saved documents
  protected savedDocuments: MarkdownDocument[] = [];
  protected isLoadingDocuments = false;
  protected selectedDocumentId = '';

  // Search and filter
  protected searchTerm = '';
  protected selectedFileType = 'All';

  protected onFileTypeChange(): void {
    const selected = this.fileTypes.find(
      type => type.value === this.selectedType
    );

    this.filePath = selected?.defaultPath ?? '';
    this.generatedDocument = null;
    this.errorMessage = '';
    this.successMessage = '';
  }

  protected startNewDocument(): void {
    this.showGeneratorForm = true;
    this.generatedDocument = null;
    this.selectedDocumentId = '';

    this.selectedType = 'Agent';
    this.name = '';
    this.description = '';
    this.requirements = '';
    this.filePath = this.fileTypes[0].defaultPath;

    this.errorMessage = '';
    this.successMessage = '';
  }

  protected cancelGeneration(): void {
    this.showGeneratorForm = false;
    this.errorMessage = '';
    this.successMessage = '';
  }

  protected generate(): void {
    if (
      this.isGenerating ||
      !this.name.trim() ||
      this.requirements.trim().length < 10
    ) {
      return;
    }

    this.isGenerating = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.generatedDocument = null;

    this.markdownService.generate({
      fileType: this.selectedType,
      name: this.name.trim(),
      description: this.description.trim(),
      requirements: this.requirements.trim(),
      filePath: this.filePath.trim()
    }).subscribe({
      next: document => {
        this.generatedDocument = document;
        this.selectedDocumentId = document.id ?? '';
        this.showGeneratorForm = false;

        this.isGenerating = false;
        this.successMessage = 'Markdown file generated and saved successfully.';

        this.loadSavedDocuments();
        this.cdr.detectChanges();
      },
      error: error => {
        console.error('Markdown generation failed:', error);
        this.errorMessage =
          'Failed to generate the Markdown file. Check the API and Ollama service.';
        this.isGenerating = false;
        this.cdr.detectChanges();
      }
    });
  }


  protected saveChanges(): void {
    const document = this.generatedDocument;

    if (!document?.id || this.isSaving) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.markdownService.update(document.id, document).subscribe({
      next: () => {
        this.isSaving = false;
        this.successMessage = 'Changes saved successfully.';
        this.loadSavedDocuments();
        this.cdr.detectChanges();
      },
      error: error => {
        console.error('Markdown save failed:', error);
        this.isSaving = false;
        this.errorMessage = 'Failed to save changes. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }


  protected downloadMarkdown(): void {
    const document = this.generatedDocument;

    if (!document) {
      return;
    }

    const blob = new Blob(
      [document.content],
      { type: 'text/markdown;charset=utf-8' }
    );

    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');

    link.href = url;
    link.download = this.getDownloadFileName(document);
    link.click();

    URL.revokeObjectURL(url);
  }

  private getDownloadFileName(
    document: MarkdownDocument
  ): string {
    const fileName = document.filePath
      .replace(/\\/g, '/')
      .split('/')
      .pop()
      ?.trim();

    if (fileName?.endsWith('.md')) {
      return fileName;
    }

    const safeName = document.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return `${safeName || 'generated-document'}.md`;
  }


  protected loadSavedDocuments(): void {
    this.isLoadingDocuments = true;
    this.errorMessage = '';

    this.markdownService.getAll().subscribe({
      next: documents => {
        this.savedDocuments = documents;
        this.isLoadingDocuments = false;
        this.cdr.detectChanges();
      },
      error: error => {
        console.error('Failed to load Markdown documents:', error);
        this.errorMessage = 'Failed to load saved Markdown files.';
        this.isLoadingDocuments = false;
        this.cdr.detectChanges();
      }
    });
  }

  protected openSavedDocument(id: string): void {
    if (!id) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.markdownService.getById(id).subscribe({
      next: document => {
        this.generatedDocument = document;
        this.showGeneratorForm = false;
        this.selectedDocumentId = document.id ?? '';
        this.selectedType = document.fileType;
        this.name = document.name;
        this.description = document.description;
        this.filePath = document.filePath;
        this.successMessage = 'Saved Markdown document loaded successfully.';
        this.cdr.detectChanges();
      },
      error: error => {
        console.error('Loading Markdown document failed:', error);
        this.errorMessage = 'Failed to load the selected Markdown document.';
        this.cdr.detectChanges();
      }
    });
  }


  protected deleteSavedDocument(document: MarkdownDocument): void {
    if (!document.id) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${document.name}"?`
    );

    if (!confirmed) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.markdownService.delete(document.id).subscribe({
      next: () => {
        this.savedDocuments = this.savedDocuments.filter(
          item => item.id !== document.id
        );

        if (this.generatedDocument?.id === document.id) {
          this.generatedDocument = null;
          this.selectedDocumentId = '';
        }

        this.successMessage = 'Markdown document deleted successfully.';
        this.cdr.detectChanges();
      },
      error: error => {
        console.error('Deleting Markdown document failed:', error);
        this.errorMessage = 'Failed to delete the Markdown document.';
        this.cdr.detectChanges();
      }
    });
  }

  protected get filteredDocuments(): MarkdownDocument[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.savedDocuments.filter(document => {
      const matchesSearch =
        !search ||
        document.name.toLowerCase().includes(search) ||
        document.description.toLowerCase().includes(search) ||
        document.filePath.toLowerCase().includes(search);

      const matchesType =
        this.selectedFileType === 'All' ||
        document.fileType === this.selectedFileType;

      return matchesSearch && matchesType;
    });
  }

  protected get availableFileTypes(): string[] {
    return [
      'All',
      ...new Set(this.savedDocuments.map(document => document.fileType))
    ];
  }

}

