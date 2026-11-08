import { Pipe, PipeTransform } from '@angular/core';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

@Pipe({
  name: 'markdownHtml',
  standalone: true,
  pure: true
})
export class MarkdownHtmlPipe implements PipeTransform {

  transform(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    const html = marked.parse(value, {
      async: false,
      gfm: true,
      breaks: true
    });

    if (typeof html !== 'string') {
      return '';
    }

    return DOMPurify.sanitize(html);
  }
}
