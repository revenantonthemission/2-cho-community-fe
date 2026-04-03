import { useMemo, useRef, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { markedInstance } from '../utils/markdown';

const PURIFY_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr',
    'strong', 'em', 'del', 's', 'code', 'pre',
    'blockquote', 'ul', 'ol', 'li',
    'a', 'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'span', 'div', 'button', 'input',
  ],
  ALLOWED_ATTR: [
    'href', 'target', 'rel', 'src', 'alt', 'title',
    'class', 'type', 'checked', 'disabled',
  ],
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  ALLOW_DATA_ATTR: false,
};

// 링크 안전성 및 이미지 지연 로딩 훅 — 새 탭 열기 + noopener noreferrer 강제 적용
if (typeof window !== 'undefined') {
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A' && node.getAttribute('href')) {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
    if (node.tagName === 'IMG') {
      node.setAttribute('loading', 'lazy');
    }
  });
}

interface Props { content: string; }

export default function MarkdownRenderer({ content }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const html = useMemo(() => {
    const raw = markedInstance.parse(content, { async: false }) as string;
    return DOMPurify.sanitize(raw, PURIFY_CONFIG);
  }, [content]);

  // 코드 복사 버튼 이벤트 바인딩 — html 변경 시마다 재등록
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.querySelectorAll('.code-copy-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const code = btn.closest('.code-block-wrapper')?.querySelector('code');
        if (code) {
          navigator.clipboard.writeText(code.textContent ?? '');
          btn.textContent = '복사됨';
          setTimeout(() => { btn.textContent = '복사'; }, 2000);
        }
      });
    });
  }, [html]);

  return (
    <div
      ref={containerRef}
      className="markdown-body"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
