import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type MarkdownFileType =
  | 'Agent'
  | 'Domain'
  | 'HowTo'
  | 'Rule'
  | 'Skill'
  | 'CopilotInstructions';

export interface MarkdownDocument {
  id?: string;
  name: string;
  fileType: MarkdownFileType;
  description: string;
  content: string;
  filePath: string;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface GenerateMarkdownRequest {
  fileType: MarkdownFileType;
  name: string;
  description: string;
  requirements: string;
  filePath: string;
}

@Injectable({ providedIn: 'root' })
export class MarkdownDocumentService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    'https://localhost:7102/api/markdown-documents';

  getAll(): Observable<MarkdownDocument[]> {
    return this.http.get<MarkdownDocument[]>(this.apiUrl);
  }

  getById(id: string): Observable<MarkdownDocument> {
    return this.http.get<MarkdownDocument>(
      `${this.apiUrl}/${id}`
    );
  }

  generate(
    request: GenerateMarkdownRequest
  ): Observable<MarkdownDocument> {
    return this.http.post<MarkdownDocument>(
      `${this.apiUrl}/generate`,
      request
    );
  }

  update(
    id: string,
    document: MarkdownDocument
  ): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/${id}`,
      document
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );
  }
}
