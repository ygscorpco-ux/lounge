import pool from '../../../../lib/db.js';
import { getCurrentUser } from '../../../../lib/auth.js';
import { ROLE_ADMIN } from '../../../../lib/constants.js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== ROLE_ADMIN) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const [rows] = await pool.query('SELECT id, word FROM banned_words ORDER BY id DESC');
    return NextResponse.json({ words: rows });

  } catch (error) {
    console.error('words error:', error);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== ROLE_ADMIN) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const { word } = await request.json();

    if (!word) {
      return NextResponse.json({ error: 'Word required' }, { status: 400 });
    }

    await pool.query('INSERT IGNORE INTO banned_words (word) VALUES (?)', [word]);
    return NextResponse.json({ message: 'Word added' }, { status: 201 });

  } catch (error) {
    console.error('add word error:', error);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== ROLE_ADMIN) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const { wordId } = await request.json();
    await pool.query('DELETE FROM banned_words WHERE id = ?', [wordId]);
    return NextResponse.json({ message: 'Word deleted' });

  } catch (error) {
    console.error('delete word error:', error);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
