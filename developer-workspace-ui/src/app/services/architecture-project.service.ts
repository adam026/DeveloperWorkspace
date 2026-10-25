import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ArchitectureComponent {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  properties: Record<string, string>;
}

export interface ArchitectureConnection {
  id: string;
  sourceComponentId: string;
  targetComponentId: string;
  type: string;
  label?: string;
  direction?: 'forward' | 'backward' | 'both';
}

export interface ArchitectureProject {
  id?: string;
  name: string;
  description: string;
  components: ArchitectureComponent[];
  connections: ArchitectureConnection[];
  createdAt?: string;
  updatedAt?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ArchitectureProjectService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    'https://localhost:7102/api/architectureprojects';

  getAll(): Observable<ArchitectureProject[]> {
    return this.http.get<ArchitectureProject[]>(this.apiUrl);
  }

  getById(id: string): Observable<ArchitectureProject> {
    return this.http.get<ArchitectureProject>(
      `${this.apiUrl}/${id}`
    );
  }

  create(
    project: ArchitectureProject
  ): Observable<ArchitectureProject> {
    return this.http.post<ArchitectureProject>(
      this.apiUrl,
      project
    );
  }

  update(
    id: string,
    project: ArchitectureProject
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
