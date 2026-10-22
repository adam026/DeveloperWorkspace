import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ArchitectureProject, ArchitectureProjectService } from '../services/architecture-project.service';

@Component({
  selector: 'app-architecture-library',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './architecture-library.html',
  styleUrl: './architecture-library.css'
})
export class ArchitectureLibraryComponent implements OnInit {

  private readonly projectService = inject(ArchitectureProjectService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  projects: ArchitectureProject[] = [];

  loading = false;
  errorMessage = '';
  showCreateForm = false;

  newProjectName = '';
  newProjectDescription = '';

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.projectService.getAll().subscribe({
      next: (projects) => {
        this.projects = projects;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load architecture projects.', error);
        this.errorMessage =
          'Failed to load projects. Please check whether the backend is running.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  createProject(): void {
    const name = this.newProjectName.trim();

    if (!name) {
      return;
    }

    const project: ArchitectureProject = {
      name,
      description: this.newProjectDescription.trim(),
      components: [],
      connections: []
    };

    this.projectService.create(project).subscribe({
      next: (createdProject) => {
        this.projects = [createdProject, ...this.projects];
        this.newProjectName = '';
        this.newProjectDescription = '';
        this.showCreateForm = false;
        this.errorMessage = '';
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to create architecture project.', error);
        this.errorMessage = 'Failed to create the project.';
        this.cdr.detectChanges();
      }
    });
  }

  openProject(project: ArchitectureProject): void {
    if (!project.id) {
      this.errorMessage = 'Cannot open a project without an ID.';
      return;
    }

    this.router.navigate(['/architecture-projects', project.id]);
  }
}
