import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ProjectDocumentation {
  id?: string;
  projectId?: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
  createdAt?: string;
  updatedAt?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectDocumentationService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    'http://localhost:8080/api/documentationprojects';

  getByProjectId(projectId: string): Observable<ProjectDocumentation[]> {
    return this.http.get<ProjectDocumentation[]>(
      `${this.apiUrl}/${projectId}/documents`
    );
  }

  getById(
    projectId: string,
    documentId: string
  ): Observable<ProjectDocumentation> {
    return this.http.get<ProjectDocumentation>(
      `${this.apiUrl}/${projectId}/documents/${documentId}`
    );
  }

  create(
    projectId: string,
    document: ProjectDocumentation
  ): Observable<ProjectDocumentation> {
    return this.http.post<ProjectDocumentation>(
      `${this.apiUrl}/${projectId}/documents`,
      document
    );
  }

  update(
    projectId: string,
    documentId: string,
    document: ProjectDocumentation
  ): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/${projectId}/documents/${documentId}`,
      document
    );
  }

  delete(
    projectId: string,
    documentId: string
  ): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${projectId}/documents/${documentId}`
    );
  }
}
