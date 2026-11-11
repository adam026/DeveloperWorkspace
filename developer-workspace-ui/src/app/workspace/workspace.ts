import { Component, ChangeDetectorRef, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Router } from '@angular/router';
import { DocumentService, Document } from '../services/document';
import { PromptService, Prompt } from '../services/prompt';
import { MarkdownDocumentService, MarkdownDocument } from '../services/markdown-document';
import { ArchitectureProject, ArchitectureProjectService } from '../services/architecture-project.service';
import { DocumentationProject, DocumentationProjectService } from '../services/documentation-project.service';
import { Task, TaskService } from '../services/task';
import { LucideAngularModule, Search, RefreshCw, FileText, Sparkles, FileCode, CalendarDays, FolderOpen, AlertCircle, ChevronRight, Workflow, BookOpen, ListTodo } from 'lucide-angular';

type WorkspaceItemType =
  | 'Document'
  | 'Prompt'
  | 'Markdown'
  | 'Architecture Project'
  | 'Documentation Project'
  | 'Task';

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
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    LucideAngularModule
  ],
  templateUrl: './workspace.html',
  styleUrl: './workspace.scss'
})
export class WorkspaceComponent implements OnInit {

  private readonly router = inject(Router);
  private readonly documentService = inject(DocumentService);
  private readonly promptService = inject(PromptService);
  private readonly markdownDocumentService = inject(MarkdownDocumentService);
  private readonly architectureProjectService = inject(ArchitectureProjectService);
  private readonly documentationProjectService = inject(DocumentationProjectService);
  private readonly taskService = inject(TaskService);
  private readonly cdr = inject(ChangeDetectorRef);

  // Lucide icons
  protected readonly Search = Search;
  protected readonly RefreshCw = RefreshCw;
  protected readonly FileText = FileText;
  protected readonly Sparkles = Sparkles;
  protected readonly FileCode = FileCode;
  protected readonly CalendarDays = CalendarDays;
  protected readonly FolderOpen = FolderOpen;
  protected readonly AlertCircle = AlertCircle;
  protected readonly ChevronRight = ChevronRight;
  protected readonly Workflow = Workflow;
  protected readonly BookOpen = BookOpen;
  protected readonly ListTodo = ListTodo;

  items: WorkspaceItem[] = [];

  searchTerm = '';
  selectedType = 'All';

  isLoading = true;
  errorMessage = '';

  readonly types = [
    'All',
    'Document',
    'Prompt',
    'Markdown',
    'Architecture Project',
    'Documentation Project',
    'Task'
  ];

  get filteredItems(): WorkspaceItem[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.items.filter(item => {
      const matchesType =
        this.selectedType === 'All' ||
        item.type === this.selectedType;

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

    this.router.navigate(['/documents', id], {
      queryParams: { source: 'workspace' }
    });
  }

  openItem(item: WorkspaceItem): void {
    if (!item.id) {
      return;
    }

    switch (item.type) {
      case 'Document':
        this.router.navigate(['/documents', item.id], {
          queryParams: { source: 'workspace' }
        });
        break;

      case 'Prompt':
        this.router.navigate(['/prompts', item.id], {
          queryParams: { source: 'workspace' }
        });
        break;

      case 'Markdown':
        this.router.navigate(['/markdown-documents', item.id], {
          queryParams: { source: 'workspace' }
        });
        break;

      case 'Architecture Project':
        this.router.navigate(['/architecture-projects', item.id]);
        break;

      case 'Documentation Project':
        this.router.navigate(['/documentation', item.id]);
        break;

      case 'Task':
        this.router.navigate(['/tasks']);
        break;
    }
  }

  loadItems(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      documents: this.documentService.getAll(),
      prompts: this.promptService.getAll(),
      markdownDocuments: this.markdownDocumentService.getAll(),
      architectureProjects: this.architectureProjectService.getAll(),
      documentationProjects: this.documentationProjectService.getAll(),
      tasks: this.taskService.getAll()
    }).subscribe({
      next: ({
        documents,
        prompts,
        markdownDocuments,
        architectureProjects,
        documentationProjects,
        tasks
      }) => {

        const documentItems: WorkspaceItem[] = documents.map(document => ({
          id: document.id ?? '',
          title: document.title,
          type: 'Document',
          description: document.description ?? '',
          category: document.category ?? '',
          updatedAt: document.updatedAt ?? document.createdAt ?? ''
        }));

        const promptItems: WorkspaceItem[] = prompts.map(prompt => ({
          id: prompt.id ?? '',
          title: prompt.title,
          type: 'Prompt',
          description: prompt.description ?? '',
          category: prompt.category ?? '',
          updatedAt: prompt.updatedAt ?? prompt.createdAt ?? ''
        }));

        const markdownItems: WorkspaceItem[] = markdownDocuments.map(document => ({
          id: document.id ?? '',
          title: document.name,
          type: 'Markdown',
          description: document.description ?? '',
          category: document.fileType,
          updatedAt: document.updatedAt ?? document.createdAt ?? ''
        }));

        const architectureItems: WorkspaceItem[] = architectureProjects.map(project => ({
          id: project.id ?? '',
          title: project.name,
          type: 'Architecture Project',
          description: project.description ?? '',
          category: 'Architecture Library',
          updatedAt: project.updatedAt ?? project.createdAt ?? ''
        }));

        const documentationItems: WorkspaceItem[] = documentationProjects.map(project => ({
          id: project.id ?? '',
          title: project.name,
          type: 'Documentation Project',
          description: project.description ?? '',
          category: project.technologies?.join(', ') ?? '',
          updatedAt: project.updatedAt ?? project.createdAt ?? ''
        }));

        const taskItems: WorkspaceItem[] = tasks.map(task => ({
          id: task.id ?? '',
          title: task.title,
          type: 'Task',
          description: task.description ?? '',
          category: `${task.status} · ${task.priority}`,
          updatedAt: task.updatedAt ?? task.createdAt ?? ''
        }));

        this.items = [
          ...documentItems,
          ...promptItems,
          ...markdownItems,
          ...architectureItems,
          ...documentationItems,
          ...taskItems
        ].sort((a, b) => {
          const dateA = a.updatedAt
            ? new Date(a.updatedAt).getTime()
            : 0;

          const dateB = b.updatedAt
            ? new Date(b.updatedAt).getTime()
            : 0;

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
