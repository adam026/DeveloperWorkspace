import { Component,Input,Output,EventEmitter,OnInit,OnChanges,SimpleChanges, ViewChild, ElementRef } from '@angular/core';
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
  @ViewChild('markdownTextarea')

  private markdownTextarea!: ElementRef<HTMLTextAreaElement>;

  protected previewHtml = '';
  protected selectedCodeLanguage = 'csharp';

  // Undo/Redo stacks
  private undoStack: string[] = [];
  private redoStack: string[] = [];
  private lastContent = '';

  constructor() {
    marked.setOptions({
      gfm: true,
      breaks: true
    });
  }

  ngOnInit(): void {
    this.lastContent = this.content || '';
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
    this.recordHistory();
    this.contentChange.emit(this.content);
    void this.updatePreview();
  }

  // Formatting methods
  protected insertMarkdown(
    prefix: string,
    suffix: string,
    placeholder: string
  ): void {
    const textarea = this.markdownTextarea.nativeElement;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const selectedText = this.content.substring(start, end);
    const textToInsert = selectedText || placeholder;

    const replacement = `${prefix}${textToInsert}${suffix}`;

    this.content =
      this.content.substring(0, start) +
      replacement +
      this.content.substring(end);

    this.recordHistory();
    this.contentChange.emit(this.content);
    void this.updatePreview();

    requestAnimationFrame(() => {
      textarea.focus();

      if (selectedText) {
        textarea.setSelectionRange(
          start + prefix.length,
          start + prefix.length + selectedText.length
        );
      } else {
        const cursorPosition = start + prefix.length + textToInsert.length;
        textarea.setSelectionRange(cursorPosition, cursorPosition);
      }
    });
  }

  protected insertLinePrefix(prefix: string): void {
    const textarea = this.markdownTextarea.nativeElement;

    const start = textarea.selectionStart;
    const lineStart = this.content.lastIndexOf('\n', start - 1) + 1;

    this.content =
      this.content.substring(0, lineStart) +
      prefix +
      this.content.substring(lineStart);

    this.recordHistory();
    this.contentChange.emit(this.content);
    void this.updatePreview();

    requestAnimationFrame(() => {
      textarea.focus();

      const cursorPosition = start + prefix.length;
      textarea.setSelectionRange(cursorPosition, cursorPosition);
    });
  }

  protected insertCodeBlock(): void {
    const language = this.selectedCodeLanguage;
    const prefix = `\`\`\`${language}\n`;
    const suffix = '\n```';

    this.insertMarkdown(prefix, suffix, 'your code here');
  }

  // Undo/Redo methods
  protected get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  protected get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  private recordHistory(): void {
    if (this.content !== this.lastContent) {
      this.undoStack.push(this.lastContent);
      this.redoStack = [];
      this.lastContent = this.content;
    }
  }

  protected undo(): void {
    if (!this.canUndo) return;

    this.redoStack.push(this.content);
    this.content = this.undoStack.pop() ?? '';

    this.lastContent = this.content;

    this.contentChange.emit(this.content);
    void this.updatePreview();
  }

  protected redo(): void {
    if (!this.canRedo) return;

    this.undoStack.push(this.content);
    this.content = this.redoStack.pop() ?? '';

    this.lastContent = this.content;

    this.contentChange.emit(this.content);
    void this.updatePreview();
  }
}
