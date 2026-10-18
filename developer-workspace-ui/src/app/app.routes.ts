import { Routes } from '@angular/router';

export const routes: Routes = [
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
