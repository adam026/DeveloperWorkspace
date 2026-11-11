import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Task, TaskService } from '../services/task';
import { LucideAngularModule,Plus,X,Save,Search,AlertCircle,Pencil,Trash2,Check,Calendar,Flag,ListTodo } from 'lucide-angular';

@Component({
  selector: 'app-task-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, DragDropModule],
  templateUrl: './task-manager.html',
  styleUrl: './task-manager.scss'
})
export class TaskManager implements OnInit {
  private readonly taskService = inject(TaskService);
  private readonly cdr = inject(ChangeDetectorRef);

  // Icons from lucide-angular
  readonly Plus = Plus;
  readonly X = X;
  readonly Save = Save;
  readonly Search = Search;
  readonly AlertCircle = AlertCircle;
  readonly Pencil = Pencil;
  readonly Trash2 = Trash2;
  readonly Check = Check;
  readonly Calendar = Calendar;
  readonly Flag = Flag;
  readonly ListTodo = ListTodo;

  protected tasks: Task[] = [];

  protected isLoading = true;
  protected isSaving = false;
  protected errorMessage = '';
  protected successMessage = '';
  protected showCreateForm = false;

  // Editing and deletion state
  protected editingTaskId: string | null = null;
  protected deletingTaskId: string | null = null;
  protected editTask: Task = this.createEmptyTask();

  // Search and filtering state
  protected searchTerm = '';
  protected selectedStatus = '';
  protected selectedPriority = '';

  // New task form state
  protected newTask: Task = this.createEmptyTask();

  protected readonly statuses = ['To Do', 'In Progress', 'Done'];
  protected readonly priorities = ['Low', 'Medium', 'High'];

  private createEmptyTask(): Task {
    return {
      title: '',
      description: '',
      status: 'To Do',
      priority: 'Medium',
      projectId: null,
      dueDate: null,
      tags: []
    };
  }

  ngOnInit(): void {
    this.loadTasks();
  }

  protected loadTasks(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.taskService.getAll().subscribe({
      next: tasks => {
        this.tasks = tasks;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: error => {
        console.error('Failed to load tasks.', error);
        this.errorMessage = 'Failed to load tasks.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  protected dropTask(event: CdkDragDrop<Task[]>, newStatus: string): void {
    if (event.previousContainer === event.container) {
      return;
    }

    const task = event.item.data as Task;

    if (!task.id || task.status === newStatus || this.isSaving) {
      return;
    }

    const previousStatus = task.status;
    const updatedTask: Task = {
      ...task,
      status: newStatus
    };

    // Update the UI immediately
    this.tasks = this.tasks.map(item =>
      item.id === task.id ? updatedTask : item
    );

    this.errorMessage = '';
    this.successMessage = '';

    this.taskService.update(task.id, updatedTask).subscribe({
      next: () => {
        this.successMessage = 'Task status updated successfully.';
        this.cdr.detectChanges();
      },
      error: error => {
        console.error('Failed to update task status.', error);

        // Restore the previous status if the request fails
        this.tasks = this.tasks.map(item =>
          item.id === task.id
            ? { ...item, status: previousStatus }
            : item
        );

        this.errorMessage = 'Failed to update task status.';
        this.cdr.detectChanges();
      }
    });
  }

  protected getTasksByStatus(status: string): Task[] {
    return this.filteredTasks.filter(task => task.status === status);
  }

  protected openCreateForm(): void {
    this.newTask = this.createEmptyTask();
    this.errorMessage = '';
    this.successMessage = '';
    this.showCreateForm = true;
  }

  protected closeCreateForm(): void {
    if (this.isSaving) {
      return;
    }

    this.showCreateForm = false;
    this.errorMessage = '';
  }

  protected createTask(): void {
    if (
      !this.newTask.title.trim() ||
      this.isSaving
    ) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const taskToCreate: Task = {
      title: this.newTask.title.trim(),
      description: (this.newTask.description ?? '').trim(),
      status: this.newTask.status,
      priority: this.newTask.priority,
      projectId: this.newTask.projectId || null,
      dueDate: this.newTask.dueDate || null,
      tags: this.newTask.tags ?? []
    };

    this.taskService.create(taskToCreate).subscribe({
      next: createdTask => {
        this.tasks = [createdTask, ...this.tasks];
        this.newTask = this.createEmptyTask();
        this.showCreateForm = false;
        this.isSaving = false;
        this.successMessage = 'Task created successfully.';
        this.cdr.detectChanges();
      },
      error: error => {
        console.error('Failed to create task.', error);
        this.errorMessage = 'Failed to create the task.';
        this.isSaving = false;
        this.cdr.detectChanges();
      }
    });
  }

  protected startEditing(task: Task): void {
    if (!task.id) {
      return;
    }

    this.editingTaskId = task.id;
    this.deletingTaskId = null;
    this.errorMessage = '';
    this.successMessage = '';

    this.editTask = {
      title: task.title,
      description: task.description ?? '',
      status: task.status,
      priority: task.priority,
      projectId: task.projectId ?? null,
      dueDate: task.dueDate ?? null,
      tags: [...(task.tags ?? [])]
    };
  }

  protected cancelEditing(): void {
    this.editingTaskId = null;
    this.editTask = this.createEmptyTask();
    this.errorMessage = '';
  }

  protected updateTask(): void {
    const id = this.editingTaskId;

    if (
      !id ||
      !this.editTask.title.trim() ||
      this.isSaving
    ) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const updatedTask: Task = {
      title: this.editTask.title.trim(),
      description: (this.editTask.description ?? '').trim(),
      status: this.editTask.status,
      priority: this.editTask.priority,
      projectId: this.editTask.projectId || null,
      dueDate: this.editTask.dueDate || null,
      tags: this.editTask.tags ?? []
    };

    this.taskService.update(id, updatedTask).subscribe({
      next: () => {
        this.tasks = this.tasks.map(task =>
          task.id === id
            ? {
              ...task,
              ...updatedTask,
              updatedAt: new Date().toISOString(),
              completedAt:
                updatedTask.status === 'Done'
                  ? task.completedAt ?? new Date().toISOString()
                  : null
            }
            : task
        );

        this.editingTaskId = null;
        this.editTask = this.createEmptyTask();
        this.isSaving = false;
        this.successMessage = 'Task updated successfully.';
        this.cdr.detectChanges();
      },
      error: error => {
        console.error('Failed to update task.', error);
        this.errorMessage = 'Failed to update the task.';
        this.isSaving = false;
        this.cdr.detectChanges();
      }
    });
  }

  protected confirmDelete(task: Task): void {
    if (!task.id) {
      return;
    }

    this.deletingTaskId = task.id;
    this.editingTaskId = null;
    this.errorMessage = '';
    this.successMessage = '';
  }

  protected cancelDelete(): void {
    this.deletingTaskId = null;
  }

  protected deleteTask(id: string): void {
    if (this.deletingTaskId !== id || this.isSaving) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.taskService.delete(id).subscribe({
      next: () => {
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.deletingTaskId = null;
        this.isSaving = false;
        this.successMessage = 'Task deleted successfully.';
        this.cdr.detectChanges();
      },
      error: error => {
        console.error('Failed to delete task.', error);
        this.errorMessage = 'Failed to delete the task.';
        this.isSaving = false;
        this.cdr.detectChanges();
      }
    });
  }

  protected get filteredTasks(): Task[] {
    const term = this.searchTerm.trim().toLocaleLowerCase();

    return this.tasks.filter(task => {
      const matchesSearch =
        !term ||
        (task.title ?? '').toLocaleLowerCase().includes(term) ||
        (task.description ?? '').toLocaleLowerCase().includes(term) ||
        (task.tags ?? []).some(tag =>
          tag.toLocaleLowerCase().includes(term)
        );

      const matchesStatus =
        !this.selectedStatus ||
        task.status === this.selectedStatus;

      const matchesPriority =
        !this.selectedPriority ||
        task.priority === this.selectedPriority;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }

  protected isOverdue(task: Task): boolean {
    if (!task.dueDate || task.status === 'Done') {
      return false;
    }

    const dueDate = new Date(task.dueDate);
    const today = new Date();

    dueDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return dueDate < today;
  }

  protected updateNewTaskTags(value: string): void {
    this.newTask.tags = value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  }

  protected updateEditTaskTags(value: string): void {
    this.editTask.tags = value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  }

  protected clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.selectedPriority = '';
  }

  protected get totalTasks(): number {
    return this.tasks.length;
  }

  protected get completedTasks(): number {
    return this.tasks.filter(task => task.status === 'Done').length;
  }

  protected get inProgressTasks(): number {
    return this.tasks.filter(task => task.status === 'In Progress').length;
  }

  protected get pendingTasks(): number {
    return this.tasks.filter(task => task.status === 'To Do').length;
  }
}
