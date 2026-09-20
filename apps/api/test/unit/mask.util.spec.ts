import {
  maskBankCard,
  maskEmail,
  maskIdCard,
  maskPhone,
} from '../../src/common/utils/mask.util';

describe('mask.util', () => {
  describe('maskPhone', () => {
    it('正常手机号脱敏', () => {
      expect(maskPhone('13800138000')).toBe('138****8000');
    });

    it('空值返回 null', () => {
      expect(maskPhone(null)).toBeNull();
      expect(maskPhone(undefined)).toBeNull();
      expect(maskPhone('')).toBeNull();
    });

    it('短字符串不崩', () => {
      expect(maskPhone('12345')).toBe('12345');
    });
  });

  describe('maskIdCard', () => {
    it('正常身份证脱敏', () => {
      expect(maskIdCard('110101199001011234')).toBe('110101********1234');
    });

    it('空值返回 null', () => {
      expect(maskIdCard(null)).toBeNull();
    });
  });

  describe('maskBankCard', () => {
    it('正常银行卡脱敏', () => {
      expect(maskBankCard('6222021234567890')).toBe('**** **** **** 7890');
    });

    it('空值返回 null', () => {
      expect(maskBankCard(null)).toBeNull();
    });
  });

  describe('maskEmail', () => {
    it('正常邮箱脱敏', () => {
      expect(maskEmail('abc@example.com')).toBe('a***@example.com');
    });

    it('单字符本地部分', () => {
      expect(maskEmail('a@example.com')).toBe('*@example.com');
    });

    it('无 @ 符号原样返回', () => {
      expect(maskEmail('notanemail')).toBe('notanemail');
    });

    it('空值返回 null', () => {
      expect(maskEmail(null)).toBeNull();
    });
  });
});