'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// ユーザー型の定義
export interface User {
  id: number;
  username: string;
  email: string;
}

// セッションCookieの名前
const SESSION_COOKIE_NAME = 'okippa_session';

// 認証コンテキストの型
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => void;
}

// 認証コンテキストの作成
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

// AuthProviderのプロップス
interface AuthProviderProps {
  children: ReactNode;
}

// 認証プロバイダーコンポーネント
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 初期ロード時にセッションを確認
  useEffect(() => {
    const loadUserFromCookie = () => {
      try {
        const cookies = document.cookie.split(';');
        const sessionCookie = cookies.find(cookie => 
          cookie.trim().startsWith(`${SESSION_COOKIE_NAME}=`)
        );
        
        if (!sessionCookie) {
          setLoading(false);
          return;
        }
        
        const encodedSession = sessionCookie.split('=')[1].trim();
        const sessionData = JSON.parse(
          atob(encodedSession)
        );
        
        // 有効期限チェック
        if (sessionData.expires && sessionData.expires < Date.now()) {
          // 期限切れの場合はクッキーを削除
          document.cookie = `${SESSION_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
          setLoading(false);
          return;
        }
        
        setUser({
          id: sessionData.userId,
          username: sessionData.username,
          email: sessionData.email
        });
      } catch (error) {
        console.error('セッション読み込みエラー:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserFromCookie();
  }, []);

  // ログイン処理
  const login = (userData: User) => {
    // セッションデータの作成
    const sessionData = JSON.stringify({
      userId: userData.id,
      username: userData.username,
      email: userData.email,
      expires: Date.now() + 24 * 60 * 60 * 1000 // 24時間
    });

    // Base64エンコード
    const encodedSession = btoa(sessionData);
    
    // Cookieに保存
    document.cookie = `${SESSION_COOKIE_NAME}=${encodedSession}; path=/; max-age=${24 * 60 * 60}; samesite=lax`;
    
    // ユーザー状態を更新
    setUser(userData);
  };

  // ログアウト処理
  const logout = () => {
    // Cookieを削除
    document.cookie = `${SESSION_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    
    // ユーザー状態をクリア
    setUser(null);
    
    // トップページに遷移
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// フックとして使用するためのエクスポート
export const useAuth = () => useContext(AuthContext);
