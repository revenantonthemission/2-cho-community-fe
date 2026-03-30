import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { timeAgo } from '../../utils/formatters';
import type { WikiPageSummary } from '../../types/wiki';

interface Props {
  page: WikiPageSummary;
}

export default function WikiCard({ page }: Props) {
  return (
    <Link to={ROUTES.WIKI_DETAIL(page.slug)} className="wiki-card">
      <div className="wiki-card__tags">
        {page.tags.map((tag) => (
          <span key={tag.id} className="tag-badge">#{tag.name}</span>
        ))}
      </div>
      <h3 className="wiki-card__title">{page.title}</h3>
      <div className="wiki-card__meta">
        <span className="wiki-card__author">{page.author.nickname}</span>
        <span className="wiki-card__views"><Eye size={14} /> {page.views_count}</span>
        <span className="wiki-card__date">{timeAgo(page.created_at)}</span>
      </div>
    </Link>
  );
}
