import { Component, inject, ChangeDetectorRef, OnInit} from '@angular/core';
import { Router, NavigationEnd, RouterOutlet} from '@angular/router';
import { filter } from 'rxjs';
import { PromptLibrary } from './prompt-library/prompt-library';
import { ArchitectureLibraryComponent } from './architecture-library/architecture-library';
import { MarkdownGenerator } from './markdown-generator/markdown-generator';
import { WorkspaceComponent } from './workspace/workspace';
import { DocumentsComponent } from './documents/documents';
import { DashboardComponent } from './dashboard/dashboard';

type AppPage =
  | 'dashboard'
  | 'documents'
  | 'prompts'
  | 'markdown-generator'
  | 'workspace'
  | 'architecture-library';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    DocumentsComponent,
    MarkdownGenerator,
    PromptLibrary,
    WorkspaceComponent,
    ArchitectureLibraryComponent,
    DashboardComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  protected currentRouteIsHome = true;

  currentPage: AppPage = 'dashboard';

  ngOnInit(): void {
    this.currentRouteIsHome = this.router.url === '/';
    if (this.router.url === '/') {
      this.currentPage = 'architecture-library';
    }

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(event => {
        if (event instanceof NavigationEnd) {
          this.currentRouteIsHome =
            event.urlAfterRedirects === '/';

          this.cdr.markForCheck();
        }
      });
  }

  protected navigateTo(page: AppPage): void {
    this.currentPage = page;
    this.cdr.markForCheck();
  }

  protected returnToWorkspace(): void {
    this.currentPage = 'workspace';
    this.cdr.markForCheck();
  }

  get currentPageTitle(): string {
    const pageTitles: Record<AppPage, string> = {
      dashboard: 'Dashboard',
      documents: 'Documents',
      prompts: 'Prompt Library',
      'markdown-generator': 'Agent & Markdown Generator',
      workspace: 'Workspace',
      'architecture-library': 'Architecture Library'
    };

    return pageTitles[this.currentPage];
  }
}
