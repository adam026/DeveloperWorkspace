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

export interface GenerateDocumentationRequest {
  projectName: string;
  category: string;
  description?: string;
  technologies?: string;
  additionalContext?: string;
}

export interface ImproveDocumentationRequest {
  content: string;
  additionalInstructions?: string;
}

export interface DocumentationAiResponse {
  content: string;
}

export interface DocumentationSummaryRequest {
  content: string;
}

export interface DocumentationSummaryResponse {
  summary: string;
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

  generateDocumentation(
    request: GenerateDocumentationRequest
  ): Observable<DocumentationAiResponse> {
    return this.http.post<DocumentationAiResponse>(
      'http://localhost:8080/api/ai/documentation/generate',
      request
    );
  }

  improveDocumentation(
    request: ImproveDocumentationRequest
  ): Observable<DocumentationAiResponse> {
    return this.http.post<DocumentationAiResponse>(
      'http://localhost:8080/api/ai/documentation/improve',
      request
    );
  }

  summarizeDocumentation(
    request: DocumentationSummaryRequest
  ): Observable<DocumentationSummaryResponse> {
    return this.http.post<DocumentationSummaryResponse>(
      'http://localhost:8080/api/ai/documentation/summarize',
      request
    );
  }
}
