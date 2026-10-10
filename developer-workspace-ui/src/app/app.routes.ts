
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'documents/:id',
    loadComponent: () =>
      import('./document-detail/document-detail')
        .then(m => m.DocumentDetail)
  }
];

