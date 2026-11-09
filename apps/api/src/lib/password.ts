import argon2 from 'argon2';

// argon2id é o algoritmo recomendado pela OWASP para senhas.
export function hashPassword(password: string) {
  return argon2.hash(password, { type: argon2.argon2id });
}

export function verifyPassword(hash: string, password: string) {
  return argon2.verify(hash, password);
}

// Quando o usuário não existe, ainda gastamos o mesmo tempo de um verify real.
// Sem isso, dá pra descobrir quais emails estão cadastrados medindo o tempo de resposta.
let dummyHash: Promise<string> | undefined;

export async function fakeVerifyPassword(password: string) {
  dummyHash ??= hashPassword('dummy-password-used-only-for-timing');
  await argon2.verify(await dummyHash, password);
  return false;
}
