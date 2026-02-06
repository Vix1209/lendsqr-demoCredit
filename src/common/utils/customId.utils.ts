export function generateId(prefix: string) {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  let random = '';
  for (let i = 0; i < 20; i++) {
    random += chars[Math.floor(Math.random() * chars.length)];
  }

  return `${prefix}-${random}`;
}
