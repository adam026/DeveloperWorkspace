import { Component, inject, ChangeDetectorRef, OnInit} from '@angular/core';
import { Router, NavigationEnd, RouterOutlet} from '@angular/router';
import { filter } from 'rxjs';
import { PromptLibrary } from './prompt-library/prompt-library';
import { MarkdownGenerator } from './markdown-generator/markdown-generator';
import { WorkspaceComponent } from './workspace/workspace';
import { DocumentsComponent } from './documents/documents';
import { DashboardComponent } from './dashboard/dashboard';

type AppPage =
  | 'dashboard'
  | 'documents'
  | 'prompts'
  | 'markdown-generator'
  | 'workspace';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    DocumentsComponent,
    MarkdownGenerator,
    PromptLibrary,
    WorkspaceComponent,
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
      workspace: 'Workspace'
    };

    return pageTitles[this.currentPage];
  }
}
