import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Prompt, PromptService } from '../services/prompt';

@Component({
  selector: 'app-prompt-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './prompt-detail.html',
  styleUrl: './prompt-detail.css'
})
export class PromptDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly promptService = inject(PromptService);
  private readonly location = inject(Location);
  private readonly cdr = inject(ChangeDetectorRef);

  protected prompt: Prompt | null = null;
  protected isLoading = true;
  protected errorMessage = '';
  protected copySuccess = false;
  protected returnToWorkspace = false;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.errorMessage = 'Prompt ID is missing.';
      this.isLoading = false;
      return;
    }

    this.promptService.getById(id).subscribe({
      next: (prompt) => {
        this.prompt = prompt;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load prompt:', error);
        this.errorMessage = 'Failed to load the prompt.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  protected goBack(): void {
    this.location.back();
  }

  protected async copyPrompt(): Promise<void> {
    if (!this.prompt) {
      return;
    }

    try {
      await navigator.clipboard.writeText(this.prompt.content);
      this.copySuccess = true;
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Failed to copy prompt:', error);
      this.errorMessage = 'Failed to copy the prompt to the clipboard.';
      this.cdr.detectChanges();
    }
  }
}
