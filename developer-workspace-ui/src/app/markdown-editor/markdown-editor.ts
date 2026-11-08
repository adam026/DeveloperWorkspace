import { Component,Input,Output,EventEmitter,OnInit,OnChanges,SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

@Component({
  selector: 'app-markdown-editor',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './markdown-editor.html',
  styleUrl: './markdown-editor.scss'
})
export class MarkdownEditorComponent implements OnInit, OnChanges {

  @Input() content = '';
  @Output() contentChange = new EventEmitter<string>();

  protected previewHtml = '';

  constructor() {
    marked.setOptions({
      gfm: true,
      breaks: true
    });
  }

  ngOnInit(): void {
    void this.updatePreview();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['content']) {
      void this.updatePreview();
    }
  }

  protected async updatePreview(): Promise<void> {
    const markdown = this.content || '';
    const html = await marked.parse(markdown);

    this.previewHtml = DOMPurify.sanitize(html);
  }

  protected onContentChange(): void {
    this.contentChange.emit(this.content);
    void this.updatePreview();
  }
}
