import { useMemo } from 'react';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface Props {
  html: string;
}

export default function WikiTOC({ html }: Props) {
  const items = useMemo(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const headings = doc.querySelectorAll('h1, h2, h3');
    const result: TOCItem[] = [];
    headings.forEach((h) => {
      const text = h.textContent?.trim() ?? '';
      if (!text) return;
      const id = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      result.push({ id, text, level: parseInt(h.tagName[1], 10) });
    });
    return result;
  }, [html]);

  if (items.length === 0) return null;

  return (
    <nav className="wiki-toc">
      <h4 className="wiki-toc__title">목차</h4>
      <ul className="wiki-toc__list">
        {items.map((item) => (
          <li
            key={item.id}
            className="wiki-toc__item"
            style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
          >
            <a href={`#${item.id}`} className="wiki-toc__link">{item.text}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
