import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { DocumentService, Document } from '../services/document';
import { PromptService, Prompt } from '../services/prompt';
import { MarkdownDocument, MarkdownDocumentService } from '../services/markdown-document';
import { LucideAngularModule,FileText,Sparkles,Bot,FileCode,Workflow,BookOpen,ListTodo,Code2,Layers,Search,FolderOpen,ArrowRight}  from 'lucide-angular';

interface RecentWorkspaceItem {
  id: string | undefined;
  title: string;
  type: 'Document' | 'Prompt' | 'Markdown';
  subtitle: string;
  date: Date | string | undefined;
  sortDate: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, LucideAngularModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {
  // Module icons
  readonly FileText = FileText;
  readonly Sparkles = Sparkles;
  readonly Bot = Bot;
  readonly FileCode = FileCode;
  readonly Workflow = Workflow;
  readonly BookOpen = BookOpen;
  readonly ListTodo = ListTodo;
  readonly Code2 = Code2;
  readonly Layers = Layers;

  // Action icons
  readonly Search = Search;
  readonly FolderOpen = FolderOpen;
  readonly ArrowRight = ArrowRight;

  documentCount = 0;
  promptCount = 0;

  recentlyUpdatedItems: RecentWorkspaceItem[] = [];

  isLoadingDashboard = true;

  constructor(
    private documentService: DocumentService,
    private promptService: PromptService,
    private markdownDocumentService: MarkdownDocumentService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadDashboardStats();
  }

  private loadDashboardStats(): void {
    this.isLoadingDashboard = true;

    forkJoin({
      documents: this.documentService.getAll(),
      prompts: this.promptService.getAll(),
      markdownDocuments: this.markdownDocumentService.getAll()
    }).subscribe({
      next: ({ documents, prompts, markdownDocuments }) => {
        this.documentCount = documents.length;
        this.promptCount = prompts.length;

        this.updateRecentlyUpdatedItems(
          documents,
          prompts,
          markdownDocuments
        );

        this.isLoadingDashboard = false;
        this.cdr.markForCheck();
      },
      error: error => {
        console.error('Failed to load dashboard statistics.', error);
        this.isLoadingDashboard = false;
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
      const date = document.updatedAt ?? document.createdAt;

      return {
        id: document.id,
        title: document.title,
        type: 'Document',
        subtitle: document.category,
        date,
        sortDate: date ? new Date(date).getTime() : 0
      };
    });

    const promptItems: RecentWorkspaceItem[] = prompts.map(prompt => {
      const date = prompt.updatedAt ?? prompt.createdAt;

      return {
        id: prompt.id,
        title: prompt.title,
        type: 'Prompt',
        subtitle: prompt.category,
        date,
        sortDate: date ? new Date(date).getTime() : 0
      };
    });

    const markdownItems: RecentWorkspaceItem[] =
      markdownDocuments.map(document => {
        const date = document.updatedAt ?? document.createdAt;

        return {
          id: document.id,
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
