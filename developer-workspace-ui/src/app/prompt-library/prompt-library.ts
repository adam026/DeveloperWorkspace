
import {ChangeDetectorRef,Component,OnInit,inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Prompt, PromptService } from '../services/prompt';

@Component({
  selector: 'app-prompt-library',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './prompt-library.html',
  styleUrl: './prompt-library.css'
})
export class PromptLibrary implements OnInit {

  // =========================================================
  // Szolgáltatások és állapotok
  // =========================================================

  private readonly promptService = inject(PromptService);
  private readonly cdr = inject(ChangeDetectorRef);

  protected prompts: Prompt[] = [];

  protected isLoading = false;
  protected isSaving = false;
  protected errorMessage = '';
  protected successMessage = '';
  protected showCreateForm = false;

  // Edit
  protected editingPromptId: string | null = null;
  protected deletingPromptId: string | null = null;
  protected editPrompt: Prompt = this.createEmptyPrompt();

  // Search and fitler
  protected searchTerm = '';
  protected selectedCategory = '';

  // Copy
  protected copiedPromptId: string | null = null;
  protected copyErrorMessage = '';

  // =========================================================
  // Új prompt űrlapja
  // =========================================================

  protected newPrompt: Prompt = this.createEmptyPrompt();

  private createEmptyPrompt(): Prompt {
    return {
      title: '',
      description: '',
      category: '',
      content: ''
    };
  }

  ngOnInit(): void {
    this.loadPrompts();
  }

  // =========================================================
  // Promptok betöltése
  // =========================================================

  protected loadPrompts(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.promptService.getAll().subscribe({
      next: (prompts) => {
        this.prompts = prompts;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Prompt betöltési hiba:', error);

        this.errorMessage =
          'Nem sikerült betölteni a promptokat.';

        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // =========================================================
  // Új prompt űrlap megnyitása és bezárása
  // =========================================================

  protected openCreateForm(): void {
    this.newPrompt = this.createEmptyPrompt();
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

  // =========================================================
  // Új prompt mentése
  // =========================================================

  protected createPrompt(): void {
    if (
      !this.newPrompt.title.trim() ||
      !this.newPrompt.content.trim() ||
      this.isSaving
    ) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const promptToCreate: Prompt = {
      title: this.newPrompt.title.trim(),
      description: this.newPrompt.description.trim(),
      category: this.newPrompt.category.trim(),
      content: this.newPrompt.content.trim()
    };

    this.promptService.create(promptToCreate).subscribe({
      next: (createdPrompt) => {
        this.prompts = [
          createdPrompt,
          ...this.prompts
        ];

        this.newPrompt = this.createEmptyPrompt();
        this.showCreateForm = false;
        this.isSaving = false;
        this.successMessage = 'A prompt sikeresen elmentve.';

        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Prompt mentési hiba:', error);

        this.errorMessage =
          'Nem sikerült elmenteni a promptot.';

        this.isSaving = false;
        this.cdr.detectChanges();
      }
    });
  }

  // =========================================================
  // PROMPT SZERKESZTÉSÉNEK ELINDÍTÁSA
  // =========================================================

  protected startEditing(prompt: Prompt): void {
    if (!prompt.id) {
      return;
    }

    this.editingPromptId = prompt.id;
    this.deletingPromptId = null;
    this.errorMessage = '';
    this.successMessage = '';

    this.editPrompt = {
      title: prompt.title,
      description: prompt.description,
      category: prompt.category,
      content: prompt.content
    };
  }

  // =========================================================
  // SZERKESZTÉS MEGSZAKÍTÁSA
  // =========================================================

  protected cancelEditing(): void {
    this.editingPromptId = null;
    this.editPrompt = this.createEmptyPrompt();
    this.errorMessage = '';
  }

  // =========================================================
  // MÓDOSÍTOTT PROMPT MENTÉSE
  // =========================================================

  protected updatePrompt(): void {
    const id = this.editingPromptId;

    if (
      !id ||
      !this.editPrompt.title.trim() ||
      !this.editPrompt.content.trim() ||
      this.isSaving
    ) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const updatedPrompt: Prompt = {
      title: this.editPrompt.title.trim(),
      description: this.editPrompt.description.trim(),
      category: this.editPrompt.category.trim(),
      content: this.editPrompt.content.trim()
    };

    this.promptService.update(id, updatedPrompt).subscribe({
      next: () => {
        this.prompts = this.prompts.map(prompt =>
          prompt.id === id
            ? { ...prompt, ...updatedPrompt, updatedAt: new Date().toISOString() }
            : prompt
        );

        this.editingPromptId = null;
        this.editPrompt = this.createEmptyPrompt();
        this.isSaving = false;
        this.successMessage = 'A prompt sikeresen frissítve.';

        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Prompt frissítési hiba:', error);

        this.errorMessage =
          'Nem sikerült frissíteni a promptot.';

        this.isSaving = false;
        this.cdr.detectChanges();
      }
    });
  }

  // =========================================================
  // TÖRLÉS MEGERŐSÍTÉSÉNEK MEGJELENÍTÉSE
  // =========================================================

  protected confirmDelete(prompt: Prompt): void {
    if (!prompt.id) {
      return;
    }

    this.deletingPromptId = prompt.id;
    this.editingPromptId = null;
    this.errorMessage = '';
    this.successMessage = '';
  }

  protected cancelDelete(): void {
    this.deletingPromptId = null;
  }

  // =========================================================
  // PROMPT VÉGLEGES TÖRLÉSE
  // =========================================================

  protected deletePrompt(id: string): void {
    if (this.deletingPromptId !== id || this.isSaving) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.promptService.delete(id).subscribe({
      next: () => {
        this.prompts = this.prompts.filter(
          prompt => prompt.id !== id
        );

        this.deletingPromptId = null;
        this.isSaving = false;
        this.successMessage = 'A prompt sikeresen törölve.';

        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Prompt törlési hiba:', error);

        this.errorMessage =
          'Nem sikerült törölni a promptot.';

        this.isSaving = false;
        this.cdr.detectChanges();
      }
    });
  }


  // =========================================================
  // KATEGÓRIÁK ÖSSZEGYŰJTÉSE
  // =========================================================

  protected get categories(): string[] {
    return [...new Set(
      this.prompts
        .map(prompt => prompt.category?.trim())
        .filter((category): category is string => !!category)
    )].sort((a, b) => a.localeCompare(b));
  }

  // =========================================================
  // KERESÉS ÉS SZŰRÉS ALKALMAZÁSA
  // =========================================================

  protected get filteredPrompts(): Prompt[] {
    const term = this.searchTerm.trim().toLocaleLowerCase();

    return this.prompts.filter(prompt => {
      const matchesSearch =
        !term ||
        prompt.title.toLocaleLowerCase().includes(term) ||
        (prompt.description ?? '').toLocaleLowerCase().includes(term) ||
        (prompt.category ?? '').toLocaleLowerCase().includes(term) ||
        prompt.content.toLocaleLowerCase().includes(term);

      const matchesCategory =
        !this.selectedCategory ||
        (prompt.category ?? '').trim() === this.selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }

  // =========================================================
  // SZŰRŐK TÖRLÉSE
  // =========================================================

  protected clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = '';
  }

  // =========================================================
  // PROMPT SZÖVEGÉNEK MÁSOLÁSA
  // =========================================================

  protected async copyPrompt(prompt: Prompt): Promise<void> {
    if (!prompt.id) {
      return;
    }

    this.copyErrorMessage = '';

    try {
      await navigator.clipboard.writeText(prompt.content);

      this.copiedPromptId = prompt.id;
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Másolási hiba:', error);

      this.copyErrorMessage =
        'A másolás nem sikerült. Ellenőrizd a böngésző vágólap-hozzáférését.';

      this.cdr.detectChanges();
    }
  }
}
