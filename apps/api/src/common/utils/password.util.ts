import * as bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/** 生成 bcrypt 密码哈希（cost 10）。 */
export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/** 校验明文密码与哈希是否匹配。 */
export function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
