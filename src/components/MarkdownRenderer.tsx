import { useMemo } from 'react';
import { Marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';

// 전역 상태 오염 방지: 로컬 Marked 인스턴스로 highlight.js 구문 강조 적용
const markedInstance = new Marked({
  renderer: {
    code({ text, lang }: { text: string; lang?: string }) {
      const language = lang && hljs.getLanguage(lang) ? lang : undefined;
      const highlighted = language
        ? hljs.highlight(text, { language }).value
        : hljs.highlightAuto(text).value;
      return `<pre><code class="hljs${language ? ` language-${language}` : ''}">${highlighted}</code></pre>`;
    },
  },
});

interface Props {
  content: string;
}

export default function MarkdownRenderer({ content }: Props) {
  // DOMPurify로 XSS 방지 처리 후 dangerouslySetInnerHTML 사용 (안전)
  const html = useMemo(() => {
    const raw = markedInstance.parse(content, { async: false }) as string;
    return DOMPurify.sanitize(raw);
  }, [content]);

  return (
    <div
      className="markdown-body"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
