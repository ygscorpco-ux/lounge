import pool from './db.js';

export async function containsBannedWord(text) {
  const [rows] = await pool.query('SELECT word FROM banned_words');
  const words = rows.map(r => r.word);

  for (const word of words) {
    if (text.includes(word)) {
      return true;
    }
  }
  return false;
}

export async function checkAndHide(targetType, targetId, threshold) {
  const table = targetType === 'post' ? 'posts' : 'comments';
  const [rows] = await pool.query(
    `SELECT report_count FROM ${table} WHERE id = ?`,
    [targetId]
  );

  if (rows.length > 0 && rows[0].report_count >= threshold) {
    await pool.query(
      `UPDATE ${table} SET is_hidden = TRUE WHERE id = ?`,
      [targetId]
    );
    return true;
  }
  return false;
}

export function timeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 172800) return '어제';
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export async function hashPassword(password) {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password, hash) {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(password, hash);
}
