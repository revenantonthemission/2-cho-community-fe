import { useState, useRef, useCallback } from 'react';

interface Props {
  onSend: (content: string) => void;
  onTyping: () => void;
  disabled?: boolean;
}

export default function DMInput({ onSend, onTyping, disabled = false }: Props) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [value, onSend]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    onTyping();
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }

  return (
    <div className="dm-input">
      <span className="dm-input__prompt">$</span>
      <textarea
        ref={textareaRef}
        className="dm-input__textarea"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="메시지 입력..."
        rows={1}
        disabled={disabled}
      />
      <button
        className="dm-input__send"
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
      >
        전송
      </button>
    </div>
  );
}
