/**
 * 敏感信息脱敏工具
 */

/** 手机号：138****8888 */
export function maskPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  if (phone.length < 7) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(-4);
}

/** 身份证：110101********1234 */
export function maskIdCard(idCard: string | null | undefined): string | null {
  if (!idCard) return null;
  if (idCard.length < 10) return idCard;
  return idCard.slice(0, 6) + '********' + idCard.slice(-4);
}

/** 银行卡：**** **** **** 1234 */
export function maskBankCard(card: string | null | undefined): string | null {
  if (!card) return null;
  if (card.length < 4) return card;
  return '**** **** **** ' + card.slice(-4);
}

/** 邮箱：a***@example.com */
export function maskEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const atIdx = email.indexOf('@');
  if (atIdx <= 0) return email;
  const local = email.slice(0, atIdx);
  const domain = email.slice(atIdx);
  if (local.length <= 1) return '*'.repeat(local.length) + domain;
  return local[0] + '***' + domain;
}