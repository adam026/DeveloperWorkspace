
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SummarizeResponse {
  summary: string;
}

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://localhost:7102/api/ai';

  summarize(text: string): Observable<SummarizeResponse> {
    return this.http.post<SummarizeResponse>(
      `${this.apiUrl}/summarize`,
      { text }
    );
  }

  summarizeDocument(id: string): Observable<SummarizeResponse> {
    return this.http.post<SummarizeResponse>(
      `${this.apiUrl}/documents/${id}/summarize`,
      {}
    );
  }
}
