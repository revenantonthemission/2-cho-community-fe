import { onToast, offToast, showToast } from '@/utils/toast';

describe('toast', () => {
  beforeEach(() => {
    offToast();
  });

  it('onToast로 등록한 리스너가 showToast에서 호출된다', () => {
    const fn = vi.fn();
    onToast(fn);
    showToast('성공', 'success');
    expect(fn).toHaveBeenCalledWith('성공', 'success');
  });

  it('showToast의 기본 type은 success', () => {
    const fn = vi.fn();
    onToast(fn);
    showToast('메시지');
    expect(fn).toHaveBeenCalledWith('메시지', 'success');
  });

  it('error type을 전달할 수 있다', () => {
    const fn = vi.fn();
    onToast(fn);
    showToast('오류 발생', 'error');
    expect(fn).toHaveBeenCalledWith('오류 발생', 'error');
  });

  it('offToast 후 showToast가 리스너를 호출하지 않는다', () => {
    const fn = vi.fn();
    onToast(fn);
    offToast();
    showToast('무시됨', 'success');
    expect(fn).not.toHaveBeenCalled();
  });

  it('리스너 없이 showToast를 호출해도 에러 없음', () => {
    expect(() => showToast('안전', 'success')).not.toThrow();
  });
});
