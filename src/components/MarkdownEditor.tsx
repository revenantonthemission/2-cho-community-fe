import { useState, useRef } from 'react';
import {
  Bold, Italic, Strikethrough, Heading, Quote, Minus,
  Code, Braces, Link2, Image, List, ListOrdered, Eye, Edit3,
} from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import MentionDropdown from './MentionDropdown';
import { api } from '../services/api';
import { API_ENDPOINTS } from '../constants/endpoints';
import { showToast } from '../utils/toast';
import { useMention } from '../hooks/useMention';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  compact?: boolean;
  rows?: number;
}

/** 현재 에디터 값을 항상 최신으로 참조하기 위한 ref 패턴 */
type ActionType =
  | { kind: 'wrap'; before: string; after: string }
  | { kind: 'prefix'; text: string }
  | { kind: 'insert'; text: string }
  | { kind: 'preview' };

interface ToolbarItem {
  key: string;
  icon?: React.ReactNode;
  title?: string;
  action: ActionType;
  separator?: boolean;
}

const FULL_TOOLBAR: ToolbarItem[] = [
  { key: 'bold',          icon: <Bold size={14} />,          title: '굵게 (Ctrl+B)',  action: { kind: 'wrap',   before: '**', after: '**' } },
  { key: 'italic',        icon: <Italic size={14} />,        title: '기울임 (Ctrl+I)', action: { kind: 'wrap',   before: '*',  after: '*'  } },
  { key: 'strikethrough', icon: <Strikethrough size={14} />, title: '취소선',          action: { kind: 'wrap',   before: '~~', after: '~~' } },
  { key: 'sep1', separator: true, action: { kind: 'insert', text: '' } },
  { key: 'heading',       icon: <Heading size={14} />,       title: '제목',            action: { kind: 'prefix', text: '## '  } },
  { key: 'quote',         icon: <Quote size={14} />,         title: '인용',            action: { kind: 'prefix', text: '> '   } },
  { key: 'hr',            icon: <Minus size={14} />,         title: '구분선',          action: { kind: 'insert', text: '\n---\n' } },
  { key: 'sep2', separator: true, action: { kind: 'insert', text: '' } },
  { key: 'code',          icon: <Code size={14} />,          title: '인라인 코드',     action: { kind: 'wrap',   before: '`',    after: '`'     } },
  { key: 'codeBlock',     icon: <Braces size={14} />,        title: '코드 블록',       action: { kind: 'wrap',   before: '```\n', after: '\n```' } },
  { key: 'sep3', separator: true, action: { kind: 'insert', text: '' } },
  { key: 'link',          icon: <Link2 size={14} />,         title: '링크',            action: { kind: 'wrap',   before: '[',       after: '](url)' } },
  { key: 'image',         icon: <Image size={14} />,         title: '이미지',          action: { kind: 'wrap',   before: '![alt](', after: ')'     } },
  { key: 'sep4', separator: true, action: { kind: 'insert', text: '' } },
  { key: 'listUl',        icon: <List size={14} />,          title: '목록',            action: { kind: 'prefix', text: '- '   } },
  { key: 'listOl',        icon: <ListOrdered size={14} />,   title: '번호 목록',       action: { kind: 'prefix', text: '1. '  } },
  { key: 'sep5', separator: true, action: { kind: 'insert', text: '' } },
  { key: 'preview',       icon: <Eye size={14} />,           title: '미리보기',        action: { kind: 'preview' } },
];

const COMPACT_TOOLBAR: ToolbarItem[] = [
  { key: 'bold',    icon: <Bold size={14} />,   title: '굵게 (Ctrl+B)',  action: { kind: 'wrap', before: '**', after: '**' } },
  { key: 'italic',  icon: <Italic size={14} />, title: '기울임 (Ctrl+I)', action: { kind: 'wrap', before: '*',  after: '*'  } },
  { key: 'code',    icon: <Code size={14} />,   title: '인라인 코드',     action: { kind: 'wrap', before: '`',  after: '`'  } },
  { key: 'link',    icon: <Link2 size={14} />,  title: '링크',            action: { kind: 'wrap', before: '[',  after: '](url)' } },
  { key: 'sep1', separator: true, action: { kind: 'insert', text: '' } },
  { key: 'preview', icon: <Eye size={14} />,    title: '미리보기',        action: { kind: 'preview' } },
];

export default function MarkdownEditor({
  value,
  onChange,
  placeholder,
  compact = false,
  rows,
}: MarkdownEditorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  /** onChange는 setState가 아니므로 최신 값 참조용 ref 유지 */
  const valueRef = useRef(value);
  valueRef.current = value;

  const { mentionUsers, showMention, selectedIndex, handleInput, handleKeyDown, handleBlur, closeMention } = useMention();

  const toolbar = compact ? COMPACT_TOOLBAR : FULL_TOOLBAR;
  const defaultRows = compact ? 3 : 15;

  /** 선택 영역을 before/after로 감싸기 */
  function wrapSelection(before: string, after: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const current = valueRef.current;
    const selected = current.slice(start, end);
    const newValue = current.slice(0, start) + before + selected + after + current.slice(end);
    onChange(newValue);
    const newCursor = start + before.length + selected.length + after.length;
    requestAnimationFrame(() => {
      ta.selectionStart = selected ? start + before.length : newCursor - after.length;
      ta.selectionEnd = selected ? start + before.length + selected.length : newCursor - after.length;
      ta.focus();
    });
  }

  /** 현재 줄 앞에 prefix 추가 */
  function prefixLine(prefix: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const current = valueRef.current;
    const lineStart = current.lastIndexOf('\n', start - 1) + 1;
    const newValue = current.slice(0, lineStart) + prefix + current.slice(lineStart);
    onChange(newValue);
    const newCursor = start + prefix.length;
    requestAnimationFrame(() => {
      ta.selectionStart = newCursor;
      ta.selectionEnd = newCursor;
      ta.focus();
    });
  }

  /** 커서 위치에 텍스트 삽입 */
  function insertText(text: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const current = valueRef.current;
    const newValue = current.slice(0, start) + text + current.slice(start);
    onChange(newValue);
    const newCursor = start + text.length;
    requestAnimationFrame(() => {
      ta.selectionStart = newCursor;
      ta.selectionEnd = newCursor;
      ta.focus();
    });
  }

  function handleToolbarAction(action: ActionType) {
    if (action.kind === 'preview') {
      setShowPreview((prev) => !prev);
      return;
    }
    if (action.kind === 'wrap') {
      wrapSelection(action.before, action.after);
    } else if (action.kind === 'prefix') {
      prefixLine(action.text);
    } else if (action.kind === 'insert') {
      insertText(action.text);
    }
  }

  function handleChange(newValue: string) {
    onChange(newValue);
    const ta = textareaRef.current;
    if (ta) handleInput(newValue, ta.selectionStart);
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const ta = textareaRef.current;
    if (!ta) return;

    // 멘션 키 처리 우선
    const mentionResult = handleKeyDown(e, value, ta.selectionStart);
    if (mentionResult !== null) {
      onChange(mentionResult);
      const cursorPos = mentionResult.indexOf(' ', mentionResult.lastIndexOf('@')) + 1;
      requestAnimationFrame(() => {
        ta.selectionStart = cursorPos;
        ta.selectionEnd = cursorPos;
      });
      return;
    }

    const isMod = e.ctrlKey || e.metaKey;

    // Ctrl/Cmd + B → 굵게
    if (isMod && e.key === 'b') {
      e.preventDefault();
      wrapSelection('**', '**');
      return;
    }
    // Ctrl/Cmd + I → 기울임
    if (isMod && e.key === 'i') {
      e.preventDefault();
      wrapSelection('*', '*');
      return;
    }

    // Tab → 2칸 들여쓰기
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      insertText('  ');
      return;
    }

    // Shift+Tab → 현재 줄 앞 공백 2칸 제거
    if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault();
      const current = valueRef.current;
      const start = ta.selectionStart;
      const lineStart = current.lastIndexOf('\n', start - 1) + 1;
      const lineContent = current.slice(lineStart);
      if (lineContent.startsWith('  ')) {
        const newValue = current.slice(0, lineStart) + lineContent.slice(2);
        onChange(newValue);
        requestAnimationFrame(() => {
          const newCursor = Math.max(lineStart, start - 2);
          ta.selectionStart = newCursor;
          ta.selectionEnd = newCursor;
        });
      }
    }
  }

  function handleMentionSelect(user: { user_id: number; nickname: string; profileImageUrl: string | null }) {
    const ta = textareaRef.current;
    if (!ta) return;
    const current = valueRef.current;
    const beforeCursor = current.slice(0, ta.selectionStart);
    const atIndex = beforeCursor.lastIndexOf('@');
    if (atIndex === -1) return;
    const before = current.slice(0, atIndex);
    const after = current.slice(ta.selectionStart);
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

  async function uploadImageFile(file: File, placeholder: string) {
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await api.postFormData<{ data: { url: string } }>(
        API_ENDPOINTS.POSTS.IMAGE,
        formData,
      );
      const url = res?.data?.url;
      if (url) {
        const replacement = `![${file.name}](${url})`;
        onChange(valueRef.current.replace(placeholder, replacement));
      } else {
        onChange(valueRef.current.replace(placeholder, ''));
        showToast('이미지 업로드에 실패했습니다.', 'error');
      }
    } catch {
      onChange(valueRef.current.replace(placeholder, ''));
      showToast('이미지 업로드에 실패했습니다.', 'error');
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const placeholder = `![uploading ${file.name}...]()`;
    insertText(placeholder);
    await uploadImageFile(file, placeholder);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleDrop(e: React.DragEvent<HTMLTextAreaElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const placeholder = `![uploading ${file.name}...]()`;
    insertText(placeholder);
    await uploadImageFile(file, placeholder);
  }

  async function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const file = e.clipboardData.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    e.preventDefault();
    const placeholder = `![uploading ${file.name}...]()`;
    insertText(placeholder);
    await uploadImageFile(file, placeholder);
  }

  return (
    <div className={`markdown-editor${compact ? ' markdown-editor--compact' : ''}`}>
      <div className="markdown-editor__toolbar">
        {toolbar.map((item) => {
          if (item.separator) {
            return <span key={item.key} className="md-toolbar-sep" aria-hidden="true" />;
          }
          const isPreviewActive = item.key === 'preview' && showPreview;
          return (
            <button
              key={item.key}
              type="button"
              className={`md-toolbar-btn${isPreviewActive ? ' active' : ''}`}
              title={item.title}
              onClick={() => handleToolbarAction(item.action)}
              aria-label={item.title}
              aria-pressed={item.key === 'preview' ? showPreview : undefined}
            >
              {item.icon}
            </button>
          );
        })}
        {/* 파일 선택 input (항상 존재, 이미지 버튼 또는 드래그&드롭으로 트리거) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden-input"
          onChange={handleImageUpload}
          aria-hidden="true"
        />
      </div>
      {showPreview ? (
        <div className="markdown-preview">
          <button
            type="button"
            className="md-toolbar-btn"
            title="편집으로 돌아가기"
            onClick={() => setShowPreview(false)}
            aria-label="편집으로 돌아가기"
          >
            <Edit3 size={14} />
          </button>
          <MarkdownRenderer content={value} />
        </div>
      ) : (
        <div className="relative">
          <textarea
            ref={textareaRef}
            className="content-textarea"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKey}
            onBlur={handleBlur}
            onDrop={handleDrop}
            onPaste={handlePaste}
            onDragOver={(e) => e.preventDefault()}
            placeholder={placeholder ?? '내용을 입력해주세요. (@로 멘션)'}
            rows={rows ?? defaultRows}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={showMention}
            aria-controls={showMention ? 'mention-listbox' : undefined}
            aria-activedescendant={
              showMention && selectedIndex >= 0 && mentionUsers[selectedIndex]
                ? `mention-option-${mentionUsers[selectedIndex].user_id}`
                : undefined
            }
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
