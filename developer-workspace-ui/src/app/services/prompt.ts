
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Prompt {
  id?: string;
  title: string;
  description: string;
  category: string;
  content: string;
  createdAt?: string;
  updatedAt?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class PromptService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://localhost:7102/api/prompts';

  getAll(): Observable<Prompt[]> {
    return this.http.get<Prompt[]>(this.apiUrl);
  }

  getById(id: string): Observable<Prompt> {
    return this.http.get<Prompt>(`${this.apiUrl}/${id}`);
  }

  create(prompt: Prompt): Observable<Prompt> {
    return this.http.post<Prompt>(this.apiUrl, prompt);
  }

  update(id: string, prompt: Prompt): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, prompt);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
