
import {
  Component,
  inject,
  ChangeDetectorRef,
  OnInit
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { DocumentService, Document } from '../services/document';
import { AiService } from '../services/ai';

@Component({
  selector: 'app-document-detail',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './document-detail.html',
  styleUrl: './document-detail.css'
})
export class DocumentDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly documentService = inject(DocumentService);
  private readonly aiService = inject(AiService);
  private readonly cdr = inject(ChangeDetectorRef);

  protected document: Document | null = null;
  protected loading = true;
  protected errorMessage = '';

  protected summary = '';
  protected summarizing = false;
  protected summaryError = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.errorMessage = 'A dokumentum azonosítója hiányzik.';
      this.loading = false;
      return;
    }

    this.documentService.getAll().subscribe({
      next: (documents) => {
        this.document = documents.find(item => item.id === id) ?? null;
        this.summary = this.document?.aiSummary ?? '';

        if (!this.document) {
          this.errorMessage = 'A keresett dokumentum nem található.';
        }

        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Hiba a dokumentum lekérésekor:', error);
        this.errorMessage = 'Nem sikerült betölteni a dokumentumot.';
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
      next: (result) => {
        this.summary = result.summary;
        this.summarizing = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Hiba az AI-összefoglalás során:', error);
        this.summaryError =
          'Nem sikerült elkészíteni az összefoglalót.';
        this.summarizing = false;
        this.cdr.markForCheck();
      }
    });
  }

}
