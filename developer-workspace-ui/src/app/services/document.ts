
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Document {
  id?: string;
  title: string;
  description: string;
  category: string;
  createdAt?: string;
  updatedAt?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = 'https://localhost:7102/api/Documents';

  getAll(): Observable<Document[]> {
    return this.http.get<Document[]>(this.apiUrl);
  }

  create(document: Document): Observable<Document> {
    return this.http.post<Document>(this.apiUrl, document);
  }

  update(id: string, document: Document): Observable<Document> {
    return this.http.put<Document>(`${this.apiUrl}/${id}`, document);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
