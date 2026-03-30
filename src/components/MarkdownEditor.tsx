import { useState, useRef } from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import { api } from '../services/api';
import { API_ENDPOINTS } from '../constants/endpoints';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function MarkdownEditor({ value, onChange, placeholder }: MarkdownEditorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const url = res?.data?.url ?? (res as any)?.url;
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
        <textarea
          ref={textareaRef}
          className="content-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? '내용을 입력해주세요.'}
          rows={15}
        />
      )}
    </div>
  );
}
