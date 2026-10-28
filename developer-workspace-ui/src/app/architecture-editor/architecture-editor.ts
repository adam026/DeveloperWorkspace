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

  // Connection direction for the new connection
  newConnectionDirection: 'forward' | 'backward' | 'both' = 'forward';

  readonly connectionDirections = [
    { value: 'forward', label: 'Source → Target' },
    { value: 'backward', label: 'Source ← Target' },
    { value: 'both', label: 'Bidirectional ↔' }
  ] as const;

  // Editing state for an existing connection
  editingConnectionId: string | null = null;
  editConnectionSourceId = '';
  editConnectionTargetId = '';
  editConnectionType = 'REST API';
  editConnectionLabel = '';
  editConnectionDirection: 'forward' | 'backward' | 'both' = 'forward';

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

  // Zoom
  zoomLevel = 1;
  private readonly minZoom = 0.5;
  private readonly maxZoom = 2;
  private readonly zoomStep = 0.1;

  // Panning state
  isPanning = false;

  private panStartX = 0;
  private panStartY = 0;
  private panScrollLeft = 0;
  private panScrollTop = 0;

  // Dragging state
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  private draggedComponentId: string | null = null;

  // Resizing state
  private resizingComponentId: string | null = null;
  private resizeStartX = 0;
  private resizeStartY = 0;
  private resizeStartWidth = 190;
  private resizeStartHeight = 72;
  private readonly minComponentWidth = 150;
  private readonly minComponentHeight = 64;

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

    const componentWidth = component.width ?? 190;
    const componentHeight = component.height ?? 72;
    const centerX = component.x + componentWidth / 2;
    const centerY = component.y + componentHeight / 2;

    if (!otherComponentId) {
      return axis === 'x' ? centerX : centerY;
    }

    const otherComponent = this.project?.components.find(
      item => item.id === otherComponentId
    );

    if (!otherComponent) {
      return axis === 'x' ? centerX : centerY;
    }

    const otherCenterX = otherComponent.x + (otherComponent.width ?? 190) / 2;
    const otherCenterY = otherComponent.y + (otherComponent.height ?? 72) / 2;

    const dx = otherCenterX - centerX;
    const dy = otherCenterY - centerY;

    if (dx === 0 && dy === 0) {
      return axis === 'x' ? centerX : centerY;
    }

    // Find the intersection with the component's rectangular boundary.
    const halfWidth = componentWidth / 2;
    const halfHeight = componentHeight / 2;

    const scaleX = Math.abs(dx) > 0
      ? halfWidth / Math.abs(dx)
      : Number.POSITIVE_INFINITY;

    const scaleY = Math.abs(dy) > 0
      ? halfHeight / Math.abs(dy)
      : Number.POSITIVE_INFINITY;

    const scale = Math.min(scaleX, scaleY);

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
      width: 190,
      height: 72,
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

    if (!sourceId || !targetId || sourceId === targetId) {
      return;
    }

    const sourceExists = this.project.components.some(
      component => component.id === sourceId
    );

    const targetExists = this.project.components.some(
      component => component.id === targetId
    );

    if (!sourceExists || !targetExists) {
      this.errorMessage =
        'Please select valid source and target components.';
      return;
    }

    const label = this.newConnectionLabel.trim();

    this.project.connections.push({
      id: crypto.randomUUID(),
      sourceComponentId: sourceId,
      targetComponentId: targetId,
      type: this.newConnectionType,
      label: label || this.newConnectionType,
      direction: this.newConnectionDirection
    });

    // Reset the form after successful creation.
    this.newConnectionSourceId = '';
    this.newConnectionTargetId = '';
    this.newConnectionType = 'REST API';
    this.newConnectionLabel = '';
    this.newConnectionDirection = 'forward';

    this.showAddConnectionForm = false;
    this.successMessage = 'Connection created successfully.';
    this.errorMessage = '';

    this.cdr.detectChanges();
  }

  editConnection(connectionId: string): void {
    if (!this.project) {
      return;
    }

    const connection = this.project.connections.find(
      item => item.id === connectionId
    );

    if (!connection) {
      return;
    }

    this.editingConnectionId = connection.id;
    this.editConnectionSourceId = connection.sourceComponentId;
    this.editConnectionTargetId = connection.targetComponentId;
    this.editConnectionType = connection.type;
    this.editConnectionLabel = connection.label ?? '';
    this.editConnectionDirection =
      connection.direction === 'backward' || connection.direction === 'both'
        ? connection.direction
        : 'forward';

    this.errorMessage = '';
    this.successMessage = '';
  }

  saveConnectionEdit(): void {
    if (!this.project || !this.editingConnectionId) {
      return;
    }

    const sourceId = this.editConnectionSourceId;
    const targetId = this.editConnectionTargetId;

    if (!sourceId || !targetId || sourceId === targetId) {
      this.errorMessage = 'Please select two different components.';
      return;
    }

    const connection = this.project.connections.find(
      item => item.id === this.editingConnectionId
    );

    if (!connection) {
      return;
    }

    connection.sourceComponentId = sourceId;
    connection.targetComponentId = targetId;
    connection.type = this.editConnectionType;
    connection.label = this.editConnectionLabel.trim() || this.editConnectionType;
    connection.direction = this.editConnectionDirection;

    this.cancelConnectionEdit();
    this.successMessage = 'Connection updated. Save to keep the changes.';
    this.errorMessage = '';
    this.cdr.detectChanges();
  }

  cancelConnectionEdit(): void {
    this.editingConnectionId = null;
    this.editConnectionSourceId = '';
    this.editConnectionTargetId = '';
    this.editConnectionType = 'REST API';
    this.editConnectionLabel = '';
    this.editConnectionDirection = 'forward';
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
    if (!this.project) {
      return;
    }

    // Resize takes priority over dragging.
    if (this.resizingComponentId) {
      const component = this.project.components.find(
        item => item.id === this.resizingComponentId
      );

      if (!component) {
        return;
      }

      const deltaX = (event.clientX - this.resizeStartX) / this.zoomLevel;
      const deltaY = (event.clientY - this.resizeStartY) / this.zoomLevel;

      component.width = Math.max(
        this.minComponentWidth,
        this.resizeStartWidth + deltaX
      );
      component.height = Math.max(
        this.minComponentHeight,
        this.resizeStartHeight + deltaY
      );

      this.cdr.detectChanges();
      return;
    }

    if (!this.draggedComponentId) {
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
      (event.clientX - rect.left + canvas.scrollLeft) / this.zoomLevel - this.dragOffsetX / this.zoomLevel
    );

    component.y = Math.max(
      0,
      (event.clientY - rect.top + canvas.scrollTop) / this.zoomLevel - this.dragOffsetY / this.zoomLevel
    );

    this.cdr.detectChanges();
  }

  startResizing(event: MouseEvent, componentId: string): void {
    if (!this.project || event.button !== 0) {
      return;
    }

    const component = this.project.components.find(
      item => item.id === componentId
    );

    if (!component) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    this.resizingComponentId = componentId;
    this.draggedComponentId = null;
    this.resizeStartX = event.clientX;
    this.resizeStartY = event.clientY;
    this.resizeStartWidth = component.width ?? 190;
    this.resizeStartHeight = component.height ?? 72;
  }

  stopDragging(): void {
    this.draggedComponentId = null;
    this.resizingComponentId = null;
  }

  getConnectionPath(
    sourceComponentId: string,
    targetComponentId: string
  ): string {
    const source = this.project?.components.find(
      component => component.id === sourceComponentId
    );

    const target = this.project?.components.find(
      component => component.id === targetComponentId
    );

    if (!source || !target) {
      return '';
    }

    const x1 = this.getConnectionPoint(
      sourceComponentId,
      'x',
      targetComponentId
    );
    const y1 = this.getConnectionPoint(
      sourceComponentId,
      'y',
      targetComponentId
    );
    const x2 = this.getConnectionPoint(
      targetComponentId,
      'x',
      sourceComponentId
    );
    const y2 = this.getConnectionPoint(
      targetComponentId,
      'y',
      sourceComponentId
    );

    const sourceCenterX = source.x + (source.width ?? 190) / 2;
    const targetCenterX = target.x + (target.width ?? 190) / 2;
    const sourceCenterY = source.y + (source.height ?? 72) / 2;
    const targetCenterY = target.y + (target.height ?? 72) / 2;

    // Prefer a straight line for components in the same row or column.
    if (
      Math.abs(sourceCenterY - targetCenterY) < 10 ||
      Math.abs(sourceCenterX - targetCenterX) < 10
    ) {
      return `M ${x1} ${y1} L ${x2} ${y2}`;
    }

    // Otherwise, route through a midpoint to create a right-angle path.
    const middleX = (x1 + x2) / 2;

    return `M ${x1} ${y1} L ${middleX} ${y1} L ${middleX} ${y2} L ${x2} ${y2}`;
  }

  // Panning methods
  startPanning(event: MouseEvent): void {
    // Only start panning with the left mouse button.
    if (event.button !== 0) {
      return;
    }

    const canvas = event.currentTarget as HTMLElement;

    // Do not pan when dragging a component.
    if ((event.target as HTMLElement).closest('.canvas-component')) {
      return;
    }

    this.isPanning = true;
    this.panStartX = event.clientX;
    this.panStartY = event.clientY;
    this.panScrollLeft = canvas.scrollLeft;
    this.panScrollTop = canvas.scrollTop;

    event.preventDefault();
  }

  panCanvas(event: MouseEvent): void {
    if (!this.isPanning) {
      return;
    }

    const canvas = event.currentTarget as HTMLElement;
    const deltaX = event.clientX - this.panStartX;
    const deltaY = event.clientY - this.panStartY;

    canvas.scrollLeft = this.panScrollLeft - deltaX;
    canvas.scrollTop = this.panScrollTop - deltaY;
  }

  stopPanning(): void {
    this.isPanning = false;
  }

  // Auto-layout method
  autoLayout(): void {
    if (!this.project || this.project.components.length === 0) {
      return;
    }

    const components = this.project.components;
    const connections = this.project.connections;

    const componentWidth = 190;
    const componentHeight = 72;
    const horizontalGap = 120;
    const verticalGap = 90;
    const startX = 40;
    const startY = 40;

    // Build a directed graph from the connections.
    const outgoing = new Map<string, string[]>();
    const incomingCount = new Map<string, number>();

    for (const component of components) {
      outgoing.set(component.id, []);
      incomingCount.set(component.id, 0);
    }

    for (const connection of connections) {
      const sourceId = connection.sourceComponentId;
      const targetId = connection.targetComponentId;

      if (
        sourceId === targetId ||
        !outgoing.has(sourceId) ||
        !outgoing.has(targetId)
      ) {
        continue;
      }

      const targets = outgoing.get(sourceId)!;

      if (!targets.includes(targetId)) {
        targets.push(targetId);
        incomingCount.set(
          targetId,
          (incomingCount.get(targetId) ?? 0) + 1
        );
      }
    }

    // Find each component's layer using topological traversal.
    const layers = new Map<string, number>();
    const queue: string[] = [];

    for (const component of components) {
      if ((incomingCount.get(component.id) ?? 0) === 0) {
        layers.set(component.id, 0);
        queue.push(component.id);
      }
    }

    let queueIndex = 0;

    while (queueIndex < queue.length) {
      const currentId = queue[queueIndex++];
      const currentLayer = layers.get(currentId) ?? 0;

      for (const targetId of outgoing.get(currentId) ?? []) {
        layers.set(
          targetId,
          Math.max(
            layers.get(targetId) ?? 0,
            currentLayer + 1
          )
        );

        incomingCount.set(
          targetId,
          (incomingCount.get(targetId) ?? 1) - 1
        );

        if (incomingCount.get(targetId) === 0) {
          queue.push(targetId);
        }
      }
    }

    // Put disconnected components and components in cycles
    // into a final layer so that none are left behind.
    const maxLayer = Math.max(0, ...layers.values()) + 1;

    for (const component of components) {
      if (!layers.has(component.id)) {
        layers.set(component.id, maxLayer);
      }
    }

    // Group components by layer.
    const groupedLayers = new Map<number, typeof components>();

    for (const component of components) {
      const layer = layers.get(component.id) ?? 0;

      if (!groupedLayers.has(layer)) {
        groupedLayers.set(layer, []);
      }

      groupedLayers.get(layer)!.push(component);
    }

    // Position each layer from left to right and center vertically.
    const sortedLayerNumbers = [...groupedLayers.keys()].sort(
      (a, b) => a - b
    );

    for (const layerNumber of sortedLayerNumbers) {
      const layerComponents = groupedLayers.get(layerNumber)!;
      const totalHeight = layerComponents.reduce(
        (sum, component) => sum + (component.height ?? componentHeight), 0
      ) + (layerComponents.length - 1) * verticalGap;

      layerComponents.forEach((component, index) => {
        component.x =
          startX + layerNumber * (componentWidth + horizontalGap);

        component.y =
          startY + index * (componentHeight + verticalGap);
      });

      // Keep the next layer's components aligned around its center.
      const layerOffset = Math.max(0, totalHeight / 2);
      for (const component of layerComponents) {
        component.y = Math.max(startY, component.y - layerOffset + (component.height ?? componentHeight) / 2);
      }
    }

    this.successMessage =
      'Components arranged by connections. Save to keep the changes.';
    this.errorMessage = '';

    this.cdr.detectChanges();
  }

  // Arrowhead calculation
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

  getConnectionArrowHead(
    sourceComponentId: string,
    targetComponentId: string
  ): string {
    const source = this.project?.components.find(
      component => component.id === sourceComponentId
    );

    const target = this.project?.components.find(
      component => component.id === targetComponentId
    );

    if (!source || !target) {
      return '';
    }

    const x1 = this.getConnectionPoint(
      sourceComponentId,
      'x',
      targetComponentId
    );
    const y1 = this.getConnectionPoint(
      sourceComponentId,
      'y',
      targetComponentId
    );
    const x2 = this.getConnectionPoint(
      targetComponentId,
      'x',
      sourceComponentId
    );
    const y2 = this.getConnectionPoint(
      targetComponentId,
      'y',
      sourceComponentId
    );

    const sourceCenterX = source.x + (source.width ?? 190) / 2;
    const sourceCenterY = source.y + (source.height ?? 72) / 2;
    const targetCenterX = target.x + (target.width ?? 190) / 2;
    const targetCenterY = target.y + (target.height ?? 72) / 2;

    // Same row: the arrow points horizontally.
    if (Math.abs(sourceCenterY - targetCenterY) < 10) {
      return this.getArrowHeadPoints(x1, y1, x2, y2);
    }

    // Same column: the arrow points vertically.
    if (Math.abs(sourceCenterX - targetCenterX) < 10) {
      return this.getArrowHeadPoints(x1, y1, x2, y2);
    }

    // The current path bends at the midpoint X.
    const middleX = (x1 + x2) / 2;

    return this.getArrowHeadPoints(
      middleX,
      y2,
      x2,
      y2
    );
  }

  // Export architecture as PNG
  exportArchitecture(): void {
    if (!this.project || this.project.components.length === 0) {
      this.errorMessage = 'No architecture project is loaded.';
      return;
    }

    const components = this.project.components;
    const connections = this.project.connections;
    const padding = 50;
    const scale = 2;
    const gap = 70;

    const componentWidth = (c: typeof components[number]) => c.width ?? 190;
    const componentHeight = (c: typeof components[number]) => c.height ?? 72;

    const minX = Math.min(...components.map(c => c.x));
    const minY = Math.min(...components.map(c => c.y));
    const maxX = Math.max(...components.map(c => c.x + componentWidth(c)));
    const maxY = Math.max(...components.map(c => c.y + componentHeight(c)));

    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;

    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      this.errorMessage = 'Failed to create the export image.';
      return;
    }

    ctx.scale(scale, scale);
    ctx.fillStyle = '#151720';
    ctx.fillRect(0, 0, width, height);

    const getCenter = (c: typeof components[number]) => ({
      x: c.x - minX + componentWidth(c) / 2 + padding,
      y: c.y - minY + componentHeight(c) / 2 + padding
    });

    const getEdge = (
      from: typeof components[number],
      to: typeof components[number]
    ) => {
      const a = getCenter(from);
      const b = getCenter(to);
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const hw = componentWidth(from) / 2;
      const hh = componentHeight(from) / 2;
      const factor = Math.min(
        hw / Math.max(Math.abs(dx), 0.001),
        hh / Math.max(Math.abs(dy), 0.001)
      );

      return { x: a.x + dx * factor, y: a.y + dy * factor };
    };

    // Draw straight connection lines.
    for (const connection of connections) {
      const source = components.find(c => c.id === connection.sourceComponentId);
      const target = components.find(c => c.id === connection.targetComponentId);
      if (!source || !target) continue;

      const start = getEdge(source, target);
      const end = getEdge(target, source);
      const color = this.getConnectionColor(connection.type);

      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();

      const drawArrow = (from: { x: number; y: number }, to: { x: number; y: number }) => {
        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        const length = 10;
        ctx.beginPath();
        ctx.moveTo(to.x, to.y);
        ctx.lineTo(
          to.x - length * Math.cos(angle - Math.PI / 6),
          to.y - length * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          to.x - length * Math.cos(angle + Math.PI / 6),
          to.y - length * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
      };

      if (!connection.direction || connection.direction === 'forward' || connection.direction === 'both') {
        drawArrow(start, end);
      }
      if (connection.direction === 'backward' || connection.direction === 'both') {
        drawArrow(end, start);
      }

      const label = connection.label || connection.type;
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;

      ctx.font = 'bold 11px Arial';
      const labelWidth = ctx.measureText(label).width + 14;
      ctx.fillStyle = '#151720';
      ctx.fillRect(midX - labelWidth / 2, midY - 10, labelWidth, 20);
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, midX, midY);
    }

    // Draw components with wrapped text.
    for (const component of components) {
      const x = component.x - minX + padding;
      const y = component.y - minY + padding;
      const w = componentWidth(component);
      const h = componentHeight(component);

      ctx.fillStyle = '#252938';
      ctx.strokeStyle = '#8175f5';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#343853';
      ctx.beginPath();
      ctx.roundRect(x + 12, y + 16, 32, 32, 7);
      ctx.fill();

      ctx.fillStyle = '#b9b5ff';
      ctx.font = '24px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('◇', x + 18, y + 39);

      const textX = x + 54;
      const textWidth = Math.max(40, w - 66);

      const drawWrappedText = (
        text: string,
        startY: number,
        font: string,
        color: string,
        lineHeight: number,
        maxLines: number
      ) => {
        ctx.font = font;
        ctx.fillStyle = color;
        const words = text.split(/\s+/);
        let line = '';
        let lineCount = 0;

        for (const word of words) {
          const test = line ? `${line} ${word}` : word;
          if (ctx.measureText(test).width > textWidth && line) {
            ctx.fillText(line, textX, startY + lineCount * lineHeight);
            line = word;
            lineCount++;
            if (lineCount >= maxLines - 1) break;
          } else {
            line = test;
          }
        }

        if (line && lineCount < maxLines) {
          ctx.fillText(line, textX, startY + lineCount * lineHeight);
        }
      };

      drawWrappedText(component.name, y + 27, 'bold 11px Arial', '#ffffff', 14, 2);
      drawWrappedText(component.type || 'Komponens', y + 48, '10px Arial', '#c7c9d8', 12, 2);
    }

    canvas.toBlob(blob => {
      if (!blob) {
        this.errorMessage = 'PNG export failed.';
        this.cdr.detectChanges();
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'devworkspace-architecture.png';
      link.click();
      URL.revokeObjectURL(url);

      this.successMessage = 'Architecture exported successfully.';
      this.errorMessage = '';
      this.cdr.detectChanges();
    }, 'image/png');
  }

  // Save the project to the backend
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

  // Zoom methods
  zoomIn(): void {
    this.zoomLevel = Math.min(
      this.maxZoom,
      Math.round((this.zoomLevel + this.zoomStep) * 10) / 10
    );
  }

  zoomOut(): void {
    this.zoomLevel = Math.max(
      this.minZoom,
      Math.round((this.zoomLevel - this.zoomStep) * 10) / 10
    );
  }


  onCanvasWheel(event: WheelEvent): void {
    event.preventDefault();

    if (event.deltaY < 0) {
      this.zoomIn();
    } else if (event.deltaY > 0) {
      this.zoomOut();
    }
  }

  fitToScreen(): void {
    if (!this.project || this.project.components.length === 0) {
      this.zoomLevel = 1;
      return;
    }

    const canvas = document.querySelector(
      '.architecture-canvas'
    ) as HTMLElement | null;

    if (!canvas) {
      this.zoomLevel = 1;
      return;
    }

    const componentWidth = 190;
    const componentHeight = 72;
    const padding = 60;

    const minX = Math.min(
      ...this.project.components.map(component => component.x)
    );
    const minY = Math.min(
      ...this.project.components.map(component => component.y)
    );
    const maxX = Math.max(
      ...this.project.components.map(
        component => component.x + (component.width ?? componentWidth)
      )
    );
    const maxY = Math.max(
      ...this.project.components.map(
        component => component.y + (component.height ?? componentHeight)
      )
    );

    const diagramWidth = maxX - minX + padding * 2;
    const diagramHeight = maxY - minY + padding * 2;

    const availableWidth = canvas.clientWidth;
    const availableHeight = canvas.clientHeight;

    const scaleX = availableWidth / diagramWidth;
    const scaleY = availableHeight / diagramHeight;

    this.zoomLevel = Math.max(
      this.minZoom,
      Math.min(
        this.maxZoom,
        Math.floor(Math.min(scaleX, scaleY) * 10) / 10
      )
    );

    this.cdr.detectChanges();
  }
}
