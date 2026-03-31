import { formatDate, formatCount, timeAgo } from '@/utils/formatters';

describe('formatDate', () => {
  it('ISO 문자열을 YYYY-MM-DD HH:MM으로 변환한다', () => {
    const result = formatDate('2026-03-31T14:30:00Z');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
  });

  it('유효하지 않은 날짜에 빈 문자열을 반환한다', () => {
    expect(formatDate('invalid')).toBe('');
    expect(formatDate('')).toBe('');
  });
});

describe('formatCount', () => {
  it('1000 미만은 그대로 문자열 변환한다', () => {
    expect(formatCount(999)).toBe('999');
    expect(formatCount(1)).toBe('1');
  });

  it('1000~9999는 소수점 1자리 + k', () => {
    expect(formatCount(1000)).toBe('1.0k');
    expect(formatCount(1500)).toBe('1.5k');
    expect(formatCount(9999)).toBe('10.0k');
  });

  it('10000 이상은 정수 + k', () => {
    expect(formatCount(10000)).toBe('10k');
    expect(formatCount(15000)).toBe('15k');
  });

  it('0과 falsy 값은 "0" 반환', () => {
    expect(formatCount(0)).toBe('0');
  });

  it('음수는 문자열로 변환', () => {
    expect(formatCount(-5)).toBe('-5');
    expect(formatCount(-1000)).toBe('-1000');
  });
});

describe('timeAgo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-31T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('1분 미만이면 "방금 전"', () => {
    expect(timeAgo('2026-03-31T11:59:30Z')).toBe('방금 전');
  });

  it('N분 전', () => {
    expect(timeAgo('2026-03-31T11:55:00Z')).toBe('5분 전');
  });

  it('N시간 전', () => {
    expect(timeAgo('2026-03-31T09:00:00Z')).toBe('3시간 전');
  });

  it('N일 전', () => {
    expect(timeAgo('2026-03-29T12:00:00Z')).toBe('2일 전');
  });

  it('30일 이상이면 formatDate 결과 반환', () => {
    const result = timeAgo('2026-02-01T12:00:00Z');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
  });
});
