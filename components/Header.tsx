'use client';

import Link from 'next/link';
import { useAuth } from './AuthProvider';
import styles from '../app/page.module.css';

export default function Header() {
  const { user, loading, logout } = useAuth();

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <Link href="/">
          <h1>Okippa</h1>
        </Link>
      </div>
      <div className={styles.authLinks}>
        {loading ? (
          // ローディング中は何も表示しない
          null
        ) : user ? (
          // ログイン済みの場合
          <div className={styles.userMenu}>
            <Link href="/mypage" className={styles.authButton}>
              マイページ
            </Link>
            <button 
              onClick={logout} 
              className={styles.authButton}
              style={{ marginLeft: '8px' }}
            >
              ログアウト
            </button>
          </div>
        ) : (
          // 未ログインの場合
          <>
            <Link href="/auth/login" className={styles.authButton}>
              ログイン
            </Link>
            <Link href="/auth/signup" className={styles.authButton}>
              新規登録
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
