import { useState, useRef, useCallback, useEffect } from 'react';
import { api } from '../services/api';
import { API_ENDPOINTS } from '../constants/endpoints';

const DEBOUNCE_MS = 300;

interface MentionUser {
  user_id: number;
  nickname: string;
  profileImageUrl: string | null;
}

interface UseMentionReturn {
  mentionUsers: MentionUser[];
  showMention: boolean;
  selectedIndex: number;
  handleInput: (value: string, selectionStart: number) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>, value: string, selectionStart: number) => string | null;
  handleBlur: () => void;
  closeMention: () => void;
}

/**
 * 멘션 자동완성 훅.
 * textarea에서 @를 입력하면 닉네임 후보를 검색하고,
 * 선택 시 텍스트를 수정한 새 값을 반환합니다.
 */
export function useMention(): UseMentionReturn {
  const [mentionUsers, setMentionUsers] = useState<MentionUser[]>([]);
  const [showMention, setShowMention] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const mentionStartRef = useRef(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    };
  }, []);

  const closeMention = useCallback(() => {
    mentionStartRef.current = -1;
    setMentionUsers([]);
    setShowMention(false);
    setSelectedIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const search = useCallback(async (query: string) => {
    try {
      const res = await api.get<{ data: MentionUser[] }>(
        `${API_ENDPOINTS.USERS.SEARCH}?q=${encodeURIComponent(query)}&limit=5`,
      );
      const users = res.data ?? [];
      if (users.length === 0) {
        closeMention();
      } else {
        setMentionUsers(users);
        setSelectedIndex(-1);
        setShowMention(true);
      }
    } catch {
      closeMention();
    }
  }, [closeMention]);

  // textarea input 시 호출 — @ 뒤 쿼리를 추출하여 검색
  const handleInput = useCallback((value: string, selectionStart: number) => {
    const beforeCursor = value.slice(0, selectionStart);
    const atIndex = beforeCursor.lastIndexOf('@');

    if (atIndex === -1) { closeMention(); return; }

    // @ 앞이 공백이거나 문자열 시작이어야 유효
    if (atIndex > 0 && !/\s/.test(value[atIndex - 1])) { closeMention(); return; }

    const query = beforeCursor.slice(atIndex + 1);

    // 쿼리에 공백이 있으면 멘션 종료
    if (/\s/.test(query)) { closeMention(); return; }

    mentionStartRef.current = atIndex;

    if (query.length < 1) { closeMention(); return; }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), DEBOUNCE_MS);
  }, [closeMention, search]);

  // 키보드 네비게이션 — 선택 시 수정된 텍스트 반환, 아니면 null
  const handleKeyDown = useCallback((
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    value: string,
    selectionStart: number,
  ): string | null => {
    if (!showMention || mentionUsers.length === 0) return null;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, mentionUsers.length - 1));
      return null;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
      return null;
    }
    if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      return insertMention(value, selectionStart, mentionUsers[selectedIndex]);
    }
    if (e.key === 'Escape') {
      closeMention();
      return null;
    }
    return null;
  }, [showMention, mentionUsers, selectedIndex, closeMention]);

  // 닉네임 삽입 — 수정된 텍스트 반환
  function insertMention(value: string, selectionStart: number, user: MentionUser): string {
    const before = value.slice(0, mentionStartRef.current);
    const after = value.slice(selectionStart);
    const insert = `@${user.nickname} `;
    closeMention();
    return before + insert + after;
  }

  const handleBlur = useCallback(() => {
    blurTimerRef.current = setTimeout(closeMention, 150);
  }, [closeMention]);

  // 외부에서 마우스로 항목 선택 시 사용
  // (selectUser는 컴포넌트에서 직접 호출)

  return {
    mentionUsers,
    showMention,
    selectedIndex,
    handleInput,
    handleKeyDown,
    handleBlur,
    closeMention,
  };
}

// 마우스 클릭으로 항목 선택 시 텍스트 삽입 헬퍼
export function insertMentionAtCursor(
  value: string,
  selectionStart: number,
  mentionStart: number,
  nickname: string,
): string {
  const before = value.slice(0, mentionStart);
  const after = value.slice(selectionStart);
  return before + `@${nickname} ` + after;
}
