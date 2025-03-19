import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

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
    
    // メールアドレスでユーザーを検索
    const user = db.prepare(
      'SELECT id, username, email, password_hash FROM users WHERE email = ?'
    ).get(email) as User | undefined;
    
    if (!user) {
      return NextResponse.json(
        { error: 'メールアドレスまたはパスワードが正しくありません' },
        { status: 401 }
      );
    }
    
    // パスワードを検証
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'メールアドレスまたはパスワードが正しくありません' },
        { status: 401 }
      );
    }
    
    // セッションを作成
    const sessionData = JSON.stringify({
      userId: user.id,
      username: user.username,
      email: user.email,
      expires: Date.now() + 24 * 60 * 60 * 1000 // 24時間
    });

    // Base64エンコード
    const encodedSession = Buffer.from(sessionData).toString('base64');
    
    // レスポンスオブジェクトを作成
    const response = NextResponse.json(
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
    
    // Cookieを設定
    response.cookies.set({
      name: 'okippa_session',
      value: encodedSession,
      httpOnly: true,
      path: '/',
      maxAge: 24 * 60 * 60, // 24時間（秒単位）
      sameSite: 'lax'
    });
    
    return response;
  } catch (error) {
    console.error('ログインエラー:', error);
    return NextResponse.json(
      { error: 'ログイン処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
