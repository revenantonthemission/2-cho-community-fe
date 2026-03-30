import type { WikiTag } from '../../types/wiki';

interface Props {
  tags: WikiTag[];
  selectedTag: string;
  onSelect: (tag: string) => void;
}

export default function WikiTagFilter({ tags, selectedTag, onSelect }: Props) {
  return (
    <div className="wiki-tag-filter">
      <button
        className={`wiki-tag-filter__btn ${!selectedTag ? 'active' : ''}`}
        onClick={() => onSelect('')}
      >
        전체
      </button>
      {tags.map((tag) => (
        <button
          key={tag.id}
          className={`wiki-tag-filter__btn ${selectedTag === tag.name ? 'active' : ''}`}
          onClick={() => onSelect(tag.name)}
        >
          {tag.name} ({tag.page_count})
        </button>
      ))}
    </div>
  );
}
