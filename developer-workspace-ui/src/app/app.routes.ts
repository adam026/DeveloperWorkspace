import { Routes } from '@angular/router';

export const routes: Routes = [
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
  }
];

