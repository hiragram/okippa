import { cookies } from 'next/headers';
import { getDb } from './db';

// User型の定義
export interface User {
  id: number;
  username: string;
  email: string;
}

// セッションCookieの名前
const SESSION_COOKIE_NAME = 'okippa_session';

/**
 * ユーザー情報をセッションCookieに保存する
 */
export function setUserSession(user: User): void {
  // 実際のアプリケーションでは、JWTなどを利用して署名付きトークンを使用するべき
  const sessionData = JSON.stringify({
    userId: user.id,
    username: user.username,
    email: user.email,
    // 有効期限を設定（例：24時間）
    expires: Date.now() + 24 * 60 * 60 * 1000
  });

  // Base64エンコード
  const encodedSession = Buffer.from(sessionData).toString('base64');
  
  // HTTPのみのCookieを設定（実際の本番環境では secure: true を使用すべき）
  cookies().set({
    name: SESSION_COOKIE_NAME,
    value: encodedSession,
    httpOnly: true,
    path: '/',
    maxAge: 24 * 60 * 60, // 24時間（秒単位）
    sameSite: 'lax'
  });
}

/**
 * クライアントサイドでセッションCookieを設定する
 */
export function setClientSession(encodedSession: string): void {
  document.cookie = `${SESSION_COOKIE_NAME}=${encodedSession}; path=/; max-age=${24 * 60 * 60}; samesite=lax`;
}

/**
 * セッションCookieからユーザー情報を取得
 */
export function getUserFromSession(): User | null {
  const sessionCookie = cookies().get(SESSION_COOKIE_NAME);
  
  if (!sessionCookie) {
    return null;
  }
  
  try {
    // Base64デコード
    const sessionData = JSON.parse(
      Buffer.from(sessionCookie.value, 'base64').toString('utf-8')
    );
    
    // セッションの有効期限をチェック
    if (sessionData.expires && sessionData.expires < Date.now()) {
      // セッションの有効期限切れ
      return null;
    }
    
    // ユーザーIDが有効かどうか確認（オプション）
    if (sessionData.userId) {
      return {
        id: sessionData.userId,
        username: sessionData.username,
        email: sessionData.email
      };
    }
    
    return null;
  } catch (error) {
    console.error('セッションの解析エラー:', error);
    return null;
  }
}

/**
 * ユーザーIDからユーザー情報を取得
 */
export function getUserById(userId: number): User | null {
  if (!userId) return null;
  
  try {
    const db = getDb();
    const user = db.prepare(
      'SELECT id, username, email FROM users WHERE id = ?'
    ).get(userId) as User | undefined;
    
    return user || null;
  } catch (error) {
    console.error('ユーザー取得エラー:', error);
    return null;
  }
}

/**
 * セッションをクリア（ログアウト）
 */
export function clearSession(): void {
  cookies().delete(SESSION_COOKIE_NAME);
}

/**
 * クライアントサイドでセッションCookieから現在のユーザー情報を取得するユーティリティ
 * （クライアントコンポーネント用）
 */
export function getClientSession(): User | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  const sessionCookie = cookies.find(cookie => 
    cookie.trim().startsWith(`${SESSION_COOKIE_NAME}=`)
  );
  
  if (!sessionCookie) return null;
  
  try {
    const encodedSession = sessionCookie.split('=')[1].trim();
    const sessionData = JSON.parse(
      Buffer.from(encodedSession, 'base64').toString('utf-8')
    );
    
    // 有効期限チェック
    if (sessionData.expires && sessionData.expires < Date.now()) {
      return null;
    }
    
    return {
      id: sessionData.userId,
      username: sessionData.username,
      email: sessionData.email
    };
  } catch (error) {
    console.error('クライアントセッション解析エラー:', error);
    return null;
  }
}
