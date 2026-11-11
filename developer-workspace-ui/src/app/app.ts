import { Component, inject } from '@angular/core';
import { LucideAngularModule,House,FileText,Sparkles,Bot,Workflow,BookOpen,ListTodo,Layers } from 'lucide-angular';
import { Router,RouterOutlet,RouterLink,RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    LucideAngularModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly router = inject(Router);

  // Navigation icons
  readonly House = House;
  readonly FileText = FileText;
  readonly Sparkles = Sparkles;
  readonly Bot = Bot;
  readonly Workflow = Workflow;
  readonly BookOpen = BookOpen;
  readonly ListTodo = ListTodo;
  readonly Layers = Layers;

  get currentPageTitle(): string {
    const url = this.router.url;

    if (url.startsWith('/documents')) {
      return 'Documents';
    }

    if (url.startsWith('/prompts')) {
      return 'Prompt Library';
    }

    if (url.startsWith('/markdown-generator')) {
      return 'Agent & Markdown Generator';
    }

    if (url.startsWith('/workspace')) {
      return 'Workspace';
    }

    if (
      url.startsWith('/architecture-library') ||
      url.startsWith('/architecture-projects')
    ) {
      return 'Architecture Library';
    }

    if (url.startsWith('/dashboard')) {
      return 'Dashboard';
    }

    if (url.startsWith('/markdown-documents')) {
      return 'Markdown Document';
    }

    if (url.startsWith('/documentation')) {
      return 'Documentation';
    }

    return 'Dashboard';
  }
}
