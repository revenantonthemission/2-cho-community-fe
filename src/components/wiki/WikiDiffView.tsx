import type { DiffChange } from '../../types/wiki';

interface Props {
  changes: DiffChange[];
}

export default function WikiDiffView({ changes }: Props) {
  return (
    <div className="wiki-diff">
      {changes.map((change, i) => (
        <div key={i} className={`wiki-diff__line wiki-diff__line--${change.type}`}>
          <span className="wiki-diff__line-num">
            {change.type === 'insert'
              ? `+ ${change.new_line ?? ''}`
              : change.type === 'delete'
                ? `- ${change.old_line ?? ''}`
                : `  ${change.old_line ?? ''}`}
          </span>
          <span className="wiki-diff__content">{change.content}</span>
        </div>
      ))}
    </div>
  );
}
