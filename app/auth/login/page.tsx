'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../auth.module.css';
import { useAuth } from '@/components/AuthProvider';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    // バリデーション
    if (!email || !password) {
      setError('メールアドレスとパスワードを入力してください');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'ログインに失敗しました');
      }

      // クライアント側でもユーザー情報を保存
      login(data.user);

      // ログイン成功後はホームページにリダイレクト
      router.push('/');
    } catch (error) {
      setError(error instanceof Error ? error.message : '予期せぬエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={styles.authContainer}>
      <h1 className={styles.title}>ログイン</h1>
      
      {error && <p className={styles.error}>{error}</p>}
      
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="email">
            メールアドレス
          </label>
          <input
            id="email"
            className={styles.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>
        
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="password">
            パスワード
          </label>
          <input
            id="password"
            className={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>
        
        <button
          type="submit"
          className={styles.button}
          disabled={isLoading}
        >
          {isLoading ? '処理中...' : 'ログイン'}
        </button>
      </form>
      
      <p className={styles.switchText}>
        アカウントをお持ちでないですか？{' '}
        <Link href="/auth/signup" className={styles.switchLink}>
          新規登録
        </Link>
      </p>
    </div>
  );
}
