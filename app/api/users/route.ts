import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';

/**
 * GET /api/users - すべてのユーザーを取得
 */
export async function GET() {
  try {
    const db = getDb();
    const users = db.prepare('SELECT id, username, email, created_at FROM users').all();
    
    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error('ユーザー取得エラー:', error);
    return NextResponse.json(
      { error: 'ユーザー情報の取得中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users - 新しいユーザーを作成
 */
export async function POST(request: NextRequest) {
  try {
    const { username, email, password } = await request.json();
    
    // 入力検証
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'ユーザー名、メール、パスワードは必須です' },
        { status: 400 }
      );
    }

    const db = getDb();
    
    // パスワードは実際の環境では適切にハッシュ化が必要
    const stmt = db.prepare(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
    );
    
    const result = stmt.run(username, email, password);
    
    return NextResponse.json(
      { id: result.lastInsertRowid, username, email },
      { status: 201 }
    );
  } catch (error) {
    console.error('ユーザー作成エラー:', error);
    
    // SQLiteのエラーコードを検証してより具体的なエラーメッセージを返す
    const sqliteError = error as any;
    if (sqliteError.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return NextResponse.json(
        { error: 'そのユーザー名またはメールアドレスは既に使用されています' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'ユーザー作成中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
