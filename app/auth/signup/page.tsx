'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../auth.module.css';
import { useAuth } from '@/components/AuthProvider';

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSuccess('');

    // バリデーション
    if (!username || !email || !password || !confirmPassword) {
      setError('すべての項目を入力してください');
      return;
    }

    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'アカウント作成に失敗しました');
      }

      setSuccess('アカウントが作成されました！トップページに移動します...');
      
      // ユーザー情報を取得してログイン処理
      try {
        const loginResponse = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });
        
        if (loginResponse.ok) {
          const loginData = await loginResponse.json();
          // ログイン処理を実行
          login(loginData.user);
          
          // 成功メッセージを表示した後にトップページにリダイレクト
          setTimeout(() => {
            router.push('/');
          }, 2000);
        } else {
          // ログインに失敗した場合でもとりあえずトップページに遷移
          setTimeout(() => {
            router.push('/');
          }, 2000);
        }
      } catch (loginError) {
        console.error('自動ログインエラー:', loginError);
        // エラーが発生した場合でもとりあえずトップページに遷移
        setTimeout(() => {
          router.push('/');
        }, 2000);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '予期せぬエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={styles.authContainer}>
      <h1 className={styles.title}>アカウント作成</h1>
      
      {success && <p className={styles.success}>{success}</p>}
      {error && <p className={styles.error}>{error}</p>}
      
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="username">
            ユーザー名
          </label>
          <input
            id="username"
            className={styles.input}
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
          />
        </div>
        
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
        
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="confirmPassword">
            パスワード（確認）
          </label>
          <input
            id="confirmPassword"
            className={styles.input}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>
        
        <button
          type="submit"
          className={styles.button}
          disabled={isLoading}
        >
          {isLoading ? '処理中...' : 'アカウント作成'}
        </button>
      </form>
      
      <p className={styles.switchText}>
        すでにアカウントをお持ちですか？{' '}
        <Link href="/auth/login" className={styles.switchLink}>
          ログイン
        </Link>
      </p>
    </div>
  );
}
