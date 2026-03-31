import { isValidEmail, isValidPassword, isValidNickname } from '@/utils/validators';

describe('isValidEmail', () => {
  it('유효한 이메일을 허용한다', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('a.b+tag@domain.co.kr')).toBe(true);
  });

  it('빈 문자열을 거부한다', () => {
    expect(isValidEmail('')).toBe(false);
  });

  it('@ 없는 문자열을 거부한다', () => {
    expect(isValidEmail('userexample.com')).toBe(false);
  });

  it('도메인 없는 이메일을 거부한다', () => {
    expect(isValidEmail('user@')).toBe(false);
  });

  it('공백 포함 이메일을 거부한다', () => {
    expect(isValidEmail('us er@example.com')).toBe(false);
  });
});

describe('isValidPassword', () => {
  it('문자+숫자+특수문자 8자 이상을 허용한다', () => {
    expect(isValidPassword('Abcdef1!')).toBe(true);
    expect(isValidPassword('Password1@')).toBe(true);
  });

  it('8자 미만을 거부한다', () => {
    expect(isValidPassword('Ab1!xyz')).toBe(false);
  });

  it('특수문자 없이 거부한다', () => {
    expect(isValidPassword('Abcdefg1')).toBe(false);
  });

  it('숫자 없이 거부한다', () => {
    expect(isValidPassword('Abcdefg!')).toBe(false);
  });

  it('문자 없이 거부한다', () => {
    expect(isValidPassword('1234567!')).toBe(false);
  });

  it('빈 문자열을 거부한다', () => {
    expect(isValidPassword('')).toBe(false);
  });
});

describe('isValidNickname', () => {
  it('2~20자를 허용한다', () => {
    expect(isValidNickname('ab')).toBe(true);
    expect(isValidNickname('a'.repeat(20))).toBe(true);
  });

  it('1자를 거부한다', () => {
    expect(isValidNickname('a')).toBe(false);
  });

  it('21자를 거부한다', () => {
    expect(isValidNickname('a'.repeat(21))).toBe(false);
  });

  it('빈 문자열을 거부한다', () => {
    expect(isValidNickname('')).toBe(false);
  });
});
