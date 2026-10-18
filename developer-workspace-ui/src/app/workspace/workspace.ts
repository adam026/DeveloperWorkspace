import { Component, ChangeDetectorRef, inject, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Router } from '@angular/router';

import { DocumentService, Document } from '../services/document';
import { PromptService, Prompt } from '../services/prompt';
import { MarkdownDocumentService,MarkdownDocument } from '../services/markdown-document';

type WorkspaceItemType = 'Document' | 'Prompt' | 'Markdown';

interface WorkspaceItem {
  id: string;
  title: string;
  type: WorkspaceItemType;
  description: string;
  category: string;
  updatedAt: string;
}

@Component({
  selector: 'app-workspace',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './workspace.html',
  styleUrl: './workspace.css'
})
export class WorkspaceComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly documentService = inject(DocumentService);
  private readonly promptService = inject(PromptService);
  private readonly markdownDocumentService = inject(MarkdownDocumentService);
  private readonly cdr = inject(ChangeDetectorRef);

  @Output() navigateToPage = new EventEmitter<'prompts' | 'markdown-generator'>();

  items: WorkspaceItem[] = [];
  searchTerm = '';
  selectedType = 'All';
  isLoading = true;
  errorMessage = '';

  readonly types = ['All', 'Document', 'Prompt', 'Markdown'];

  get filteredItems(): WorkspaceItem[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.items.filter(item => {
      const matchesType =
        this.selectedType === 'All' || item.type === this.selectedType;

      const matchesSearch =
        !search ||
        item.title.toLowerCase().includes(search) ||
        item.description.toLowerCase().includes(search) ||
        item.category.toLowerCase().includes(search);

      return matchesType && matchesSearch;
    });
  }

  ngOnInit(): void {
    this.loadItems();
  }


  openDocument(id: string): void {
    if (!id) {
      return;
    }

    this.router.navigate(['/documents', id]);
  }



  openItem(item: WorkspaceItem): void {
    if (!item.id) {
      return;
    }

    switch (item.type) {
      case 'Document':
        this.router.navigate(['/documents', item.id]);
        break;

      case 'Prompt':
        this.router.navigate(['/prompts', item.id]);
        break;

      case 'Markdown':
        this.router.navigate(['/markdown-documents', item.id]);
        break;
    }
  }


  loadItems(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      documents: this.documentService.getAll(),
      prompts: this.promptService.getAll(),
      markdownDocuments: this.markdownDocumentService.getAll()
    }).subscribe({
      next: ({ documents, prompts, markdownDocuments }) => {
        const documentItems: WorkspaceItem[] = documents.map(
          (document: Document) => ({
            id: document.id ?? '',
            title: document.title,
            type: 'Document',
            description: document.description ?? '',
            category: document.category ?? '',
            updatedAt: document.updatedAt ?? document.createdAt ?? ''
          })
        );

        const promptItems: WorkspaceItem[] = prompts.map(
          (prompt: Prompt) => ({
            id: prompt.id ?? '',
            title: prompt.title,
            type: 'Prompt',
            description: prompt.description ?? '',
            category: prompt.category ?? '',
            updatedAt: prompt.updatedAt ?? prompt.createdAt ?? ''
          })
        );

        const markdownItems: WorkspaceItem[] = markdownDocuments.map(
          (document: MarkdownDocument) => ({
            id: document.id ?? '',
            title: document.name,
            type: 'Markdown',
            description: document.description ?? '',
            category: document.fileType,
            updatedAt: document.updatedAt ?? document.createdAt ?? ''
          })
        );

        this.items = [
          ...documentItems,
          ...promptItems,
          ...markdownItems
        ].sort((a, b) => {
          const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          return dateB - dateA;
        });

        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: error => {
        console.error('Failed to load workspace items:', error);
        this.errorMessage =
          'Failed to load workspace items. Please try again.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }
}
