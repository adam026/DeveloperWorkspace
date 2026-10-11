
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { Prompt, PromptService } from '../services/prompt';

@Component({
  selector: 'app-prompt-library',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './prompt-library.html',
  styleUrl: './prompt-library.css'
})
export class PromptLibrary implements OnInit {
  private readonly promptService = inject(PromptService);
  private readonly cdr = inject(ChangeDetectorRef);

  prompts: Prompt[] = [];
  isLoading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loadPrompts();
  }


  loadPrompts(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.promptService.getAll().subscribe({
      next: (prompts) => {
        console.log('Betöltött promptok:', prompts);

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

}

