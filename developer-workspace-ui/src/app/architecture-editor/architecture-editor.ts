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

  isSaving = false;
  successMessage = '';

  // New connection form fields
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

  // New component form fields
  showAddComponentForm = false;
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

  // Editing state for component properties
  editingComponentId: string | null = null;
  editComponentName = '';
  editComponentType = '';

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
    axis: 'x' | 'y',
    otherComponentId?: string
  ): number {
    const component = this.project?.components.find(
      item => item.id === componentId
    );

    if (!component) {
      return 0;
    }

    const componentWidth = 190;
    const componentHeight = 72;

    if (!otherComponentId) {
      return axis === 'x'
        ? component.x + componentWidth / 2
        : component.y + componentHeight / 2;
    }

    const otherComponent = this.project?.components.find(
      item => item.id === otherComponentId
    );

    if (!otherComponent) {
      return axis === 'x'
        ? component.x + componentWidth / 2
        : component.y + componentHeight / 2;
    }

    const centerX = component.x + componentWidth / 2;
    const centerY = component.y + componentHeight / 2;

    const otherCenterX = otherComponent.x + componentWidth / 2;
    const otherCenterY = otherComponent.y + componentHeight / 2;

    const dx = otherCenterX - centerX;
    const dy = otherCenterY - centerY;

    if (dx === 0 && dy === 0) {
      return axis === 'x' ? centerX : centerY;
    }

    const scale = Math.min(
      (componentWidth / 2) / Math.max(Math.abs(dx), 0.0001),
      (componentHeight / 2) / Math.max(Math.abs(dy), 0.0001)
    );

    return axis === 'x'
      ? centerX + dx * scale
      : centerY + dy * scale;
  }

  getConnectionColor(type: string): string {
    switch (type) {
      case 'REST API':
        return '#8175f5'; // Purple

      case 'Database Connection':
        return '#2dd4bf'; // Teal

      case 'Message Queue':
        return '#fb923c'; // Orange

      case 'Dependency':
        return '#94a3b8'; // Gray

      case 'Event':
        return '#f472b6'; // Pink

      default:
        return '#a5a0ff'; // Default lavender
    }
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

  deleteConnection(connectionId: string): void {
    if (!this.project) {
      return;
    }

    this.project.connections = this.project.connections.filter(
      connection => connection.id !== connectionId
    );

    this.successMessage = 'Connection deleted. Save to keep the changes.';
    this.errorMessage = '';

    this.cdr.detectChanges();
  }

  editComponent(componentId: string): void {
    if (!this.project) {
      return;
    }

    const component = this.project.components.find(
      item => item.id === componentId
    );

    if (!component) {
      return;
    }

    this.editingComponentId = component.id;
    this.editComponentName = component.name;
    this.editComponentType = component.type || 'Service';

    this.errorMessage = '';
    this.successMessage = '';
  }

  saveComponentEdit(): void {
    if (!this.project || !this.editingComponentId) {
      return;
    }

    const name = this.editComponentName.trim();
    const type = this.editComponentType.trim();

    if (!name || !type) {
      this.errorMessage = 'Component name and type are required.';
      return;
    }

    const component = this.project.components.find(
      item => item.id === this.editingComponentId
    );

    if (!component) {
      return;
    }

    component.name = name;
    component.type = type;

    this.editingComponentId = null;
    this.editComponentName = '';
    this.editComponentType = '';

    this.errorMessage = '';
    this.successMessage = 'Component updated. Save to keep the changes.';

    this.cdr.detectChanges();
  }

  cancelComponentEdit(): void {
    this.editingComponentId = null;
    this.editComponentName = '';
    this.editComponentType = '';
    this.errorMessage = '';

    this.cdr.detectChanges();
  }

  deleteComponent(componentId: string): void {
    if (!this.project) {
      return;
    }

    const componentExists = this.project.components.some(
      component => component.id === componentId
    );

    if (!componentExists) {
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete this component and its connections?'
    );

    if (!confirmed) {
      return;
    }

    this.project.components = this.project.components.filter(
      component => component.id !== componentId
    );

    this.project.connections = this.project.connections.filter(
      connection =>
        connection.sourceComponentId !== componentId &&
        connection.targetComponentId !== componentId
    );

    if (this.draggedComponentId === componentId) {
      this.stopDragging();
    }

    this.successMessage =
      'Component and its connections deleted. Save to keep the changes.';
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

  getArrowHeadPoints(
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): string {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const length = 12;
    const width = 6;

    const baseX = x2 - length * Math.cos(angle);
    const baseY = y2 - length * Math.sin(angle);

    const leftX = baseX + width * Math.sin(angle);
    const leftY = baseY - width * Math.cos(angle);

    const rightX = baseX - width * Math.sin(angle);
    const rightY = baseY + width * Math.cos(angle);

    return `${x2},${y2} ${leftX},${leftY} ${rightX},${rightY}`;
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
