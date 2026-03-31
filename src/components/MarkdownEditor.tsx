import { useState, useRef } from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import MentionDropdown from './MentionDropdown';
import { api } from '../services/api';
import { API_ENDPOINTS } from '../constants/endpoints';
import { useMention } from '../hooks/useMention';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function MarkdownEditor({ value, onChange, placeholder }: MarkdownEditorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mentionUsers, showMention, selectedIndex, handleInput, handleKeyDown, handleBlur, closeMention } = useMention();

  function handleChange(newValue: string) {
    onChange(newValue);
    const ta = textareaRef.current;
    if (ta) handleInput(newValue, ta.selectionStart);
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const ta = textareaRef.current;
    if (!ta) return;
    const result = handleKeyDown(e, value, ta.selectionStart);
    if (result !== null) {
      onChange(result);
      const cursorPos = result.indexOf(' ', result.lastIndexOf('@')) + 1;
      requestAnimationFrame(() => {
        ta.selectionStart = cursorPos;
        ta.selectionEnd = cursorPos;
      });
    }
  }

  function handleMentionSelect(user: { user_id: number; nickname: string; profileImageUrl: string | null }) {
    const ta = textareaRef.current;
    if (!ta) return;
    const beforeCursor = value.slice(0, ta.selectionStart);
    const atIndex = beforeCursor.lastIndexOf('@');
    if (atIndex === -1) return;
    const before = value.slice(0, atIndex);
    const after = value.slice(ta.selectionStart);
    const insert = `@${user.nickname} `;
    onChange(before + insert + after);
    closeMention();
    const cursorPos = before.length + insert.length;
    requestAnimationFrame(() => {
      ta.selectionStart = cursorPos;
      ta.selectionEnd = cursorPos;
      ta.focus();
    });
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await api.postFormData<{ data: { url: string } }>(
        API_ENDPOINTS.POSTS.IMAGE,
        formData,
      );
      const url = res?.data?.url;
      if (url) {
        const imageMarkdown = `\n![${file.name}](${url})\n`;
        onChange(value + imageMarkdown);
      }
    } catch {
      // 이미지 업로드 실패 — 무시
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div className="markdown-editor">
      <div className="markdown-editor__toolbar">
        <button type="button" onClick={() => setShowPreview(!showPreview)}>
          {showPreview ? '편집' : '미리보기'}
        </button>
        <button type="button" onClick={() => fileInputRef.current?.click()}>
          이미지
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleImageUpload}
        />
      </div>
      {showPreview ? (
        <div className="markdown-preview">
          <MarkdownRenderer content={value} />
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <textarea
            ref={textareaRef}
            className="content-textarea"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKey}
            onBlur={handleBlur}
            placeholder={placeholder ?? '내용을 입력해주세요. (@로 멘션)'}
            rows={15}
          />
          {showMention && (
            <MentionDropdown
              users={mentionUsers}
              selectedIndex={selectedIndex}
              onSelect={handleMentionSelect}
            />
          )}
        </div>
      )}
    </div>
  );
}
