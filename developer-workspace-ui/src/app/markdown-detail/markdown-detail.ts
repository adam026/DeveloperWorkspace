import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MarkdownDocument, MarkdownDocumentService } from '../services/markdown-document';

@Component({
  selector: 'app-markdown-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './markdown-detail.html',
  styleUrl: './markdown-detail.css'
})
export class MarkdownDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly markdownService = inject(MarkdownDocumentService);
  private readonly cdr = inject(ChangeDetectorRef);

  protected document: MarkdownDocument | null = null;
  protected isLoading = true;
  protected errorMessage = '';
  protected copySuccess = false;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.errorMessage = 'Markdown document ID is missing.';
      this.isLoading = false;
      return;
    }

    this.markdownService.getById(id).subscribe({
      next: (document) => {
        this.document = document;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load Markdown document:', error);
        this.errorMessage = 'Failed to load the Markdown document.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  protected goBack(): void {
    this.router.navigate(['/']);
  }

  protected async copyContent(): Promise<void> {
    if (!this.document) {
      return;
    }

    try {
      await navigator.clipboard.writeText(this.document.content);
      this.copySuccess = true;
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Failed to copy Markdown content:', error);
      this.errorMessage = 'Failed to copy the content to the clipboard.';
      this.cdr.detectChanges();
    }
  }
}
