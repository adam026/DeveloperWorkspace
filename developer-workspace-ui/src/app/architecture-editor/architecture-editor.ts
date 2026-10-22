import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ArchitectureProject, ArchitectureProjectService } from '../services/architecture-project.service';

@Component({
  selector: 'app-architecture-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './architecture-editor.html',
  styleUrl: './architecture-editor.css'
})
export class ArchitectureEditorComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly projectService = inject(ArchitectureProjectService);

  project: ArchitectureProject | null = null;
  loading = false;
  errorMessage = '';

  showAddComponentForm = false;
  isSaving = false;
  successMessage = '';


  showAddConnectionForm = false;

  newConnectionSourceId = '';
  newConnectionTargetId = '';
  newConnectionType = 'REST API';
  newConnectionLabel = '';

  readonly connectionTypes = [
    'REST API',
    'Database Connection',
    'Message Queue',
    'Event',
    'Dependency',
    'Other'
  ];

  newComponentName = '';
  newComponentType = 'Service';

  readonly componentTypes = [
    'Frontend',
    'Backend',
    'Database',
    'Service',
    'External System',
    'Queue',
    'Other'
  ];

  private dragOffsetX = 0;
  private dragOffsetY = 0;
  private draggedComponentId: string | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.errorMessage = 'Project ID is missing.';
      return;
    }

    this.loadProject(id);
  }

  private loadProject(id: string): void {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.projectService.getById(id).subscribe({
      next: (project) => {
        this.project = project;

        this.newConnectionSourceId =
          project.components[0]?.id ?? '';

        this.newConnectionTargetId =
          project.components[1]?.id ?? '';

        this.loading = false;
        this.cdr.detectChanges();
      },

      error: (error) => {
        console.error('Failed to load architecture project.', error);

        this.errorMessage =
          'Failed to load the project. Please try again.';

        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/']).then(() => {
      // The main workspace is displayed at the root route.
    });
  }


  getComponentName(componentId: string): string {
    const component = this.project?.components.find(
      item => item.id === componentId
    );

    return component?.name ?? 'Unknown component';
  }


  getConnectionPoint(
    componentId: string,
    axis: 'x' | 'y'
  ): number {
    const component = this.project?.components.find(
      item => item.id === componentId
    );

    if (!component) {
      return 0;
    }

    // Keep these dimensions in sync with .canvas-component in CSS.
    const componentWidth = 190;
    const componentHeight = 72;

    return axis === 'x'
      ? component.x + componentWidth / 2
      : component.y + componentHeight / 2;
  }

  getConnectionLabelX(connection: {
    sourceComponentId: string;
    targetComponentId: string;
  }): number {
    const sourceX = this.getConnectionPoint(
      connection.sourceComponentId,
      'x'
    );
    const targetX = this.getConnectionPoint(
      connection.targetComponentId,
      'x'
    );

    return (sourceX + targetX) / 2;
  }

  getConnectionLabelY(connection: {
    sourceComponentId: string;
    targetComponentId: string;
  }): number {
    const sourceY = this.getConnectionPoint(
      connection.sourceComponentId,
      'y'
    );
    const targetY = this.getConnectionPoint(
      connection.targetComponentId,
      'y'
    );

    return (sourceY + targetY) / 2 - 8;
  }

  addComponent(): void {
    if (!this.project) {
      return;
    }

    const name = this.newComponentName.trim();

    if (!name) {
      return;
    }

    this.project.components.push({
      id: crypto.randomUUID(),
      name,
      type: this.newComponentType,
      x: 40 + (this.project.components.length % 4) * 220,
      y: 40 + Math.floor(this.project.components.length / 4) * 120,
      properties: {}
    });

    this.newComponentName = '';
    this.newComponentType = 'Service';
    this.showAddComponentForm = false;
    this.successMessage = '';
  }


  addConnection(): void {
    if (!this.project) {
      return;
    }

    const sourceId = this.newConnectionSourceId;
    const targetId = this.newConnectionTargetId;

    if (
      !sourceId ||
      !targetId ||
      sourceId === targetId
    ) {
      return;
    }

    const sourceExists = this.project.components.some(
      component => component.id === sourceId
    );

    const targetExists = this.project.components.some(
      component => component.id === targetId
    );

    if (!sourceExists || !targetExists) {
      this.errorMessage = 'Please select valid source and target components.';
      return;
    }

    const label = this.newConnectionLabel.trim();

    this.project.connections.push({
      id: crypto.randomUUID(),
      sourceComponentId: sourceId,
      targetComponentId: targetId,
      type: this.newConnectionType,
      label: label || this.newConnectionType
    });

    this.showAddConnectionForm = false;
    this.newConnectionLabel = '';
    this.newConnectionType = 'REST API';
    this.successMessage = 'Connection created successfully.';
    this.errorMessage = '';

    this.cdr.detectChanges();
  }

  startDragging(event: MouseEvent, componentId: string): void {
    if (!this.project) {
      return;
    }

    const component = this.project.components.find(
      item => item.id === componentId
    );

    if (!component) {
      return;
    }

    const element = event.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();

    this.dragOffsetX = event.clientX - rect.left;
    this.dragOffsetY = event.clientY - rect.top;
    this.draggedComponentId = componentId;

    event.preventDefault();
  }

  onCanvasMouseMove(event: MouseEvent): void {
    if (!this.project || !this.draggedComponentId) {
      return;
    }

    const canvas = event.currentTarget as HTMLElement;
    const rect = canvas.getBoundingClientRect();

    const component = this.project.components.find(
      item => item.id === this.draggedComponentId
    );

    if (!component) {
      return;
    }

    component.x = Math.max(
      0,
      event.clientX - rect.left + canvas.scrollLeft - this.dragOffsetX
    );

    component.y = Math.max(
      0,
      event.clientY - rect.top + canvas.scrollTop - this.dragOffsetY
    );

    this.cdr.detectChanges();
  }

  stopDragging(): void {
    this.draggedComponentId = null;
  }

  saveProject(): void {
    if (!this.project?.id || this.isSaving) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.projectService.update(this.project.id, this.project).subscribe({
      next: () => {
        this.isSaving = false;
        this.successMessage = 'Architecture saved successfully.';
      },
      error: (error) => {
        console.error('Failed to save architecture.', error);
        this.isSaving = false;
        this.errorMessage = 'Failed to save the architecture. Please try again.';
      }
    });
  }
}
