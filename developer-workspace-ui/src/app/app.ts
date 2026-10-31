import { Component, inject } from '@angular/core';
import {
  Router,
  RouterOutlet,
  RouterLink,
  RouterLinkActive
} from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly router = inject(Router);

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

    if (url.startsWith('/architecture-library')
      || url.startsWith('/architecture-projects')) {
      return 'Architecture Library';
    }

    if (url.startsWith('/dashboard')) {
      return 'Dashboard';
    }

    if (url.startsWith('/markdown-documents')) {
      return 'Markdown Document';
    }

    return 'Dashboard';
  }
}
