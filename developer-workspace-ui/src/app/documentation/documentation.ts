import { Component,OnInit,inject,ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DocumentationProject, DocumentationProjectService } from '../services/documentation-project.service';
import { LucideAngularModule,Plus,AlertCircle,FolderOpen,CalendarDays,Trash2,CheckCircle, Search } from 'lucide-angular';

@Component({
  selector: 'app-documentation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    LucideAngularModule
  ],
  templateUrl: './documentation.html',
  styleUrl: './documentation.scss'
})
export class DocumentationComponent implements OnInit {

  private readonly projectService =
    inject(DocumentationProjectService);

  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  // Icons
  protected readonly Plus = Plus;
  protected readonly AlertCircle = AlertCircle;
  protected readonly FolderOpen = FolderOpen;
  protected readonly CalendarDays = CalendarDays;
  protected readonly Trash2 = Trash2;
  protected readonly CheckCircle = CheckCircle;
  protected readonly Search = Search;

  // Data
  protected projects: DocumentationProject[] = [];

  // Loading and messages
  protected isLoading = true;
  protected isSaving = false;
  protected errorMessage = '';
  protected successMessage = '';
  technologiesInput = '';

  // Form visibility
  protected showCreateForm = false;

  // Search
  protected searchTerm = '';

  // Delete confirmation
  protected deletingProjectId: string | null = null;

  // New project form
  protected newProject: DocumentationProject =
    this.createEmptyProject();

  ngOnInit(): void {
    this.loadProjects();
  }

  private createEmptyProject(): DocumentationProject {
    return {
      name: '',
      description: '',
      technologies: []
    };
  }

  // Load projects
  protected loadProjects(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.projectService.getAll().subscribe({
      next: projects => {
        this.projects = projects;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: error => {
        console.error('Failed to load documentation projects:', error);

        this.errorMessage =
          'Failed to load projects. Please try again.';

        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Filter projects
  protected get filteredProjects(): DocumentationProject[] {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      return this.projects;
    }

    return this.projects.filter(project =>
      project.name.toLowerCase().includes(term) ||
      project.description.toLowerCase().includes(term) ||
      project.technologies.some(technology =>
        technology.toLowerCase().includes(term)
      )
    );
  }

  // Open create form
  protected openCreateForm(): void {
    this.newProject = this.createEmptyProject();
    this.errorMessage = '';
    this.successMessage = '';
    this.showCreateForm = true;
  }

  // Close create form
  protected closeCreateForm(): void {
    if (this.isSaving) {
      return;
    }

    this.showCreateForm = false;
    this.errorMessage = '';
  }

  // Create project
  protected createProject(): void {
    if (
      !this.newProject.name.trim() ||
      this.isSaving
    ) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const projectToCreate: DocumentationProject = {
      name: this.newProject.name.trim(),
      description: this.newProject.description.trim(),
      technologies: this.technologiesInput
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0)
    };

    this.projectService.create(projectToCreate).subscribe({
      next: project => {
        this.projects = [project, ...this.projects];

        this.newProject = this.createEmptyProject();
        this.showCreateForm = false;

        this.isSaving = false;
        this.successMessage = 'Project created successfully.';
        this.technologiesInput = '';
        this.cdr.detectChanges();
      },
      error: error => {
        console.error('Failed to create project:', error);

        this.errorMessage =
          'Failed to create the project. Please try again.';

        this.isSaving = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Delete confirmation
  protected confirmDelete(projectId: string): void {
    this.deletingProjectId = projectId;
    this.errorMessage = '';
    this.successMessage = '';
  }

  protected cancelDelete(): void {
    this.deletingProjectId = null;
  }

  // Delete project
  protected deleteProject(projectId: string): void {
    if (this.deletingProjectId !== projectId) {
      return;
    }

    this.projectService.delete(projectId).subscribe({
      next: () => {
        this.projects = this.projects.filter(
          project => project.id !== projectId
        );

        this.deletingProjectId = null;
        this.successMessage = 'Project deleted successfully.';

        this.cdr.detectChanges();
      },
      error: error => {
        console.error('Failed to delete project:', error);

        this.errorMessage =
          'Failed to delete the project. Please try again.';

        this.deletingProjectId = null;
        this.cdr.detectChanges();
      }
    });
  }

  protected openProject(projectId: string): void {
    console.log('Opening documentation project:', projectId);

    this.router.navigate(['/documentation', projectId]);
  }
}
