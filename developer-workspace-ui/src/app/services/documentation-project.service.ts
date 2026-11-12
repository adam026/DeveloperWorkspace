import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DocumentationProject {
  id?: string;
  name: string;
  description: string;
  technologies: string[];
  createdAt?: string;
  updatedAt?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentationProjectService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    '/api/documentationprojects';

  getAll(): Observable<DocumentationProject[]> {
    return this.http.get<DocumentationProject[]>(this.apiUrl);
  }

  getById(id: string): Observable<DocumentationProject> {
    return this.http.get<DocumentationProject>(
      `${this.apiUrl}/${id}`
    );
  }

  create(project: DocumentationProject): Observable<DocumentationProject> {
    return this.http.post<DocumentationProject>(
      this.apiUrl,
      project
    );
  }

  update(
    id: string,
    project: DocumentationProject
  ): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/${id}`,
      project
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );
  }
}
