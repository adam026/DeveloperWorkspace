import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { DatePipe, Location} from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DocumentService, Document } from '../services/document';
import { AiService } from '../services/ai';

@Component({
  selector: 'app-document-detail',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './document-detail.html',
  styleUrl: './document-detail.css'
})
export class DocumentDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly documentService = inject(DocumentService);
  private readonly aiService = inject(AiService);
  private readonly cdr = inject(ChangeDetectorRef);

  protected document: Document | null = null;
  protected loading = true;
  protected errorMessage = '';

  protected summary = '';
  protected summarizing = false;
  protected summaryError = '';

  protected returnToWorkspace = false;

  ngOnInit(): void {
    this.returnToWorkspace =
      this.route.snapshot.queryParamMap.get('source') === 'workspace';

    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.errorMessage = 'The document ID is missing.';
      this.loading = false;
      return;
    }

    this.documentService.getAll().subscribe({
      next: documents => {
        this.document = documents.find(item => item.id === id) ?? null;
        this.summary = this.document?.aiSummary ?? '';

        if (!this.document) {
          this.errorMessage = 'The requested document could not be found.';
        }

        this.loading = false;
        this.cdr.markForCheck();
      },
      error: error => {
        console.error('Failed to load the document.', error);
        this.errorMessage = 'Failed to load the document. Please try again.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  protected generateSummary(): void {
    if (!this.document?.id || this.summarizing) {
      return;
    }

    this.summarizing = true;
    this.summaryError = '';
    this.summary = '';

    this.aiService.summarizeDocument(this.document.id).subscribe({
      next: result => {
        this.summary = result.summary;
        this.summarizing = false;
        this.cdr.markForCheck();
      },
      error: error => {
        console.error('Failed to generate the AI summary.', error);
        this.summaryError = 'Failed to generate the summary. Please try again.';
        this.summarizing = false;
        this.cdr.markForCheck();
      }
    });
  }

  protected goBack(): void {
    this.location.back();
  }
}
