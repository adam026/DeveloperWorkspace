import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard')
        .then(m => m.DashboardComponent)
  },
  {
    path: 'documents',
    loadComponent: () =>
      import('./documents/documents')
        .then(m => m.DocumentsComponent)
  },
  {
    path: 'prompts',
    loadComponent: () =>
      import('./prompt-library/prompt-library')
        .then(m => m.PromptLibrary)
  },
  {
    path: 'markdown-generator',
    loadComponent: () =>
      import('./markdown-generator/markdown-generator')
        .then(m => m.MarkdownGenerator)
  },
  {
    path: 'workspace',
    loadComponent: () =>
      import('./workspace/workspace')
        .then(m => m.WorkspaceComponent)
  },
  {
    path: 'architecture-library',
    loadComponent: () =>
      import('./architecture-library/architecture-library')
        .then(m => m.ArchitectureLibraryComponent)
  },
  {
    path: 'architecture-projects/:id',
    loadComponent: () =>
      import('./architecture-editor/architecture-editor')
        .then(m => m.ArchitectureEditorComponent)
  },
  {
    path: 'documents/:id',
    loadComponent: () =>
      import('./document-detail/document-detail')
        .then(m => m.DocumentDetail)
  },
  {
    path: 'prompts/:id',
    loadComponent: () =>
      import('./prompt-detail/prompt-detail')
        .then(m => m.PromptDetail)
  },
  {
    path: 'markdown-documents/:id',
    loadComponent: () =>
      import('./markdown-detail/markdown-detail')
        .then(m => m.MarkdownDetail)
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
