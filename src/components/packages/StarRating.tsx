import { useState } from 'react';

interface Props {
  value: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md';
}

export default function StarRating({ value, onChange, readonly = false, size = 'md' }: Props) {
  const [hoverValue, setHoverValue] = useState(0);

  const displayValue = hoverValue || value;

  return (
    <span className={`star-rating star-rating--${size}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star-rating__star ${displayValue >= star ? 'star-rating__star--filled' : ''}`}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHoverValue(star)}
          onMouseLeave={() => !readonly && setHoverValue(0)}
          style={{ cursor: readonly ? 'default' : 'pointer' }}
        >
          {displayValue >= star ? '★' : '☆'}
        </span>
      ))}
    </span>
  );
}
