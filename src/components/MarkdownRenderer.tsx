import { useMemo } from 'react';
import DOMPurify from 'dompurify';
import { markedInstance } from '../utils/markdown';

interface Props {
  content: string;
}

export default function MarkdownRenderer({ content }: Props) {
  const html = useMemo(() => {
    const raw = markedInstance.parse(content, { async: false }) as string;
    return DOMPurify.sanitize(raw);
  }, [content]);

  return (
    <div
      className="markdown-body"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
