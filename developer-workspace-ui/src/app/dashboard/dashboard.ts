import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { DocumentService, Document } from '../services/document';
import { PromptService, Prompt } from '../services/prompt';
import { MarkdownDocument, MarkdownDocumentService } from '../services/markdown-document';
import { ArchitectureProject, ArchitectureProjectService } from '../services/architecture-project.service';
import { DocumentationProject, DocumentationProjectService } from '../services/documentation-project.service';
import { Task, TaskService } from '../services/task';
import { LucideAngularModule,FileText,Sparkles,Bot,FileCode,Workflow,BookOpen,ListTodo,Code2,Layers,Search,FolderOpen,ArrowRight}  from 'lucide-angular';

interface RecentWorkspaceItem {
  id: string | undefined;
  title: string;
  type: 'Document' | 'Prompt' | 'Markdown' | 'Architecture Project' | 'Documentation Project' | 'Task';
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
  markdownDocumentCount = 0;
  architectureProjectCount = 0;
  documentationProjectCount = 0;
  taskCount = 0;
  todoTaskCount = 0;
  inProgressTaskCount = 0;
  completedTaskCount = 0;

  recentlyUpdatedItems: RecentWorkspaceItem[] = [];

  isLoadingDashboard = true;

  constructor(
    private documentService: DocumentService,
    private promptService: PromptService,
    private markdownDocumentService: MarkdownDocumentService,
    private architectureProjectService: ArchitectureProjectService,
    private documentationProjectService: DocumentationProjectService,
    private taskService: TaskService,
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
      markdownDocuments: this.markdownDocumentService.getAll(),
      architectureProjects: this.architectureProjectService.getAll(),
      documentationProjects: this.documentationProjectService.getAll(),
      tasks: this.taskService.getAll()
    }).subscribe({
      next: ({ documents, prompts, markdownDocuments, architectureProjects, documentationProjects, tasks }) => {
        this.documentCount = documents.length;
        this.promptCount = prompts.length;
        this.markdownDocumentCount = markdownDocuments.length;
        this.architectureProjectCount = architectureProjects.length;
        this.documentationProjectCount = documentationProjects.length;
        this.taskCount = tasks.length;
        this.todoTaskCount = tasks.filter(t => t.status === 'To Do').length;
        this.inProgressTaskCount = tasks.filter(t => t.status === 'In Progress').length;
        this.completedTaskCount = tasks.filter(t => t.status === 'Done').length;

        this.updateRecentlyUpdatedItems(
          documents,
          prompts,
          markdownDocuments,
          architectureProjects,
          documentationProjects,
          tasks
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
    markdownDocuments: MarkdownDocument[],
    architectureProjects: ArchitectureProject[],
    documentationProjects: DocumentationProject[],
    tasks: Task[]
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

    const architectureItems: RecentWorkspaceItem[] =
      architectureProjects.map(project => {
        const date = project.updatedAt ?? project.createdAt;

        return {
          id: project.id,
          title: project.name,
          type: 'Architecture Project',
          subtitle: 'Architecture Library',
          date,
          sortDate: date ? new Date(date).getTime() : 0
        };
      });

    const documentationProjectItems: RecentWorkspaceItem[] =
      documentationProjects.map(project => {
        const date = project.updatedAt ?? project.createdAt;

        return {
          id: project.id,
          title: project.name,
          type: 'Documentation Project',
          subtitle: 'Documentation',
          date,
          sortDate: date ? new Date(date).getTime() : 0
        };
      });

    const taskItems: RecentWorkspaceItem[] = tasks.map(task => {
      const date = task.updatedAt ?? task.createdAt;

      return {
        id: task.id,
        title: task.title,
        type: 'Task',
        subtitle: `${task.status} · ${task.priority}`,
        date,
        sortDate: date ? new Date(date).getTime() : 0
      };
    });

    this.recentlyUpdatedItems = [
      ...documentItems,
      ...promptItems,
      ...markdownItems,
      ...architectureItems,
      ...documentationProjectItems,
      ...taskItems
    ]
      .sort((a, b) => b.sortDate - a.sortDate)
      .slice(0, 5);
  }
}
