import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';

// ユーザー型の定義
interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
}

/**
 * POST /api/auth/login - ユーザーログイン認証
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    // 入力検証
    if (!email || !password) {
      return NextResponse.json(
        { error: 'メールアドレスとパスワードは必須です' },
        { status: 400 }
      );
    }

    const db = getDb();
    
    // ユーザーの検索
    // 注意: 実際の環境ではパスワードのハッシュ比較が必要です
    const user = db.prepare(
      'SELECT id, username, email FROM users WHERE email = ? AND password_hash = ?'
    ).get(email, password) as User | undefined;
    
    if (!user) {
      return NextResponse.json(
        { error: 'メールアドレスまたはパスワードが正しくありません' },
        { status: 401 }
      );
    }
    
    // 認証成功
    return NextResponse.json(
      { 
        message: 'ログインに成功しました',
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('ログインエラー:', error);
    return NextResponse.json(
      { error: 'ログイン処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
