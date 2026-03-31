import { escapeHtml, markedInstance } from '@/utils/markdown';

describe('escapeHtml', () => {
  it('HTML 태그를 이스케이프한다', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });

  it('& 기호를 이스케이프한다', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  it('작은따옴표를 이스케이프한다', () => {
    expect(escapeHtml("it's")).toBe('it&#x27;s');
  });

  it('빈 문자열은 그대로 반환', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('이스케이프 대상 없으면 그대로 반환', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });
});

describe('markedInstance', () => {
  it('마크다운 heading을 HTML로 변환한다', async () => {
    const result = await markedInstance.parse('# Hello');
    expect(result).toContain('<h1>');
    expect(result).toContain('Hello');
  });

  it('bold 텍스트를 변환한다', async () => {
    const result = await markedInstance.parse('**bold**');
    expect(result).toContain('<strong>bold</strong>');
  });

  it('코드 블록에 hljs 클래스를 적용한다', async () => {
    const result = await markedInstance.parse('```javascript\nconst x = 1;\n```');
    expect(result).toContain('class="hljs');
  });

  it('알 수 없는 언어도 자동 감지한다', async () => {
    const result = await markedInstance.parse('```\nconst x = 1;\n```');
    expect(result).toContain('<pre><code');
  });
});
