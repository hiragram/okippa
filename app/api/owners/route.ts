import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';

/**
 * GET /api/owners - すべてのオーナーを取得
 */
export async function GET() {
  try {
    const db = getDb();
    const owners = db.prepare('SELECT id, username, email, phone, address, verified, created_at FROM owners').all();
    
    return NextResponse.json({ owners }, { status: 200 });
  } catch (error) {
    console.error('オーナー取得エラー:', error);
    return NextResponse.json(
      { error: 'オーナー情報の取得中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/owners - 新しいオーナーを作成
 */
export async function POST(request: NextRequest) {
  try {
    const { username, email, password, phone, address, bank_info } = await request.json();
    
    // 入力検証
    if (!username || !email || !password || !phone || !address) {
      return NextResponse.json(
        { error: 'ユーザー名、メール、パスワード、電話番号、住所は必須です' },
        { status: 400 }
      );
    }

    const db = getDb();
    
    // パスワードは実際の環境では適切にハッシュ化が必要
    const stmt = db.prepare(
      'INSERT INTO owners (username, email, password_hash, phone, address, bank_info, verified) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    
    const result = stmt.run(username, email, password, phone, address, bank_info || null, 0);
    
    return NextResponse.json(
      { id: result.lastInsertRowid, username, email, phone, address, verified: 0 },
      { status: 201 }
    );
  } catch (error) {
    console.error('オーナー作成エラー:', error);
    
    // SQLiteのエラーコードを検証してより具体的なエラーメッセージを返す
    const sqliteError = error as any;
    if (sqliteError.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return NextResponse.json(
        { error: 'そのユーザー名またはメールアドレスは既に使用されています' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'オーナー作成中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/owners/:id - 特定のオーナー情報を取得
 */
export async function GET_ONE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const db = getDb();
    
    const owner = db.prepare('SELECT id, username, email, phone, address, verified, created_at FROM owners WHERE id = ?').get(id);
    
    if (!owner) {
      return NextResponse.json(
        { error: '指定されたIDのオーナーが見つかりません' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(owner, { status: 200 });
  } catch (error) {
    console.error('オーナー取得エラー:', error);
    return NextResponse.json(
      { error: 'オーナー情報の取得中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
