'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, User } from '@/components/AuthProvider';
import Header from '@/components/Header';
import styles from '../page.module.css';

// 予約ステータスを日本語表示に変換する関数
const getStatusText = (status: string): string => {
  switch(status) {
    case 'pending': return '保留中';
    case 'confirmed': return '確認済み';
    case 'cancelled': return 'キャンセル済み';
    case 'completed': return '完了';
    default: return status;
  }
};

// 支払いステータスを日本語表示に変換する関数
const getPaymentStatusText = (paymentStatus: string): string => {
  switch(paymentStatus) {
    case 'unpaid': return '未払い';
    case 'paid': return '支払い済み';
    case 'refunded': return '返金済み';
    default: return paymentStatus;
  }
};

export default function MyPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [reservations, setReservations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 未ログインユーザーをリダイレクト
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [loading, user, router]);

  // APIから予約データをロード
  useEffect(() => {
    if (user) {
      // ユーザーのIDで予約を取得
      fetch(`/api/reservations?user_id=${user.id}`)
        .then(response => {
          if (!response.ok) {
            throw new Error('予約データの取得に失敗しました');
          }
          return response.json();
        })
        .then(data => {
          setReservations(data.reservations || []);
          setIsLoading(false);
        })
        .catch(error => {
          console.error('予約データ取得エラー:', error);
          setIsLoading(false);
        });
    }
  }, [user]);

  if (loading || !user) {
    return (
      <div className={styles.container}>
        <Header />
        <div className={styles.loadingContainer}>
          <p>読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Header />
      <main className={styles.main}>
        <h1 className={styles.pageTitle}>マイページ</h1>
        
        <section className={styles.userInfoSection}>
          <h2 className={styles.sectionTitle}>ユーザー情報</h2>
          <div className={styles.userInfoCard}>
            <div className={styles.userInfoItem}>
              <span className={styles.userInfoLabel}>ユーザー名:</span>
              <span className={styles.userInfoValue}>{user.username}</span>
            </div>
            <div className={styles.userInfoItem}>
              <span className={styles.userInfoLabel}>メールアドレス:</span>
              <span className={styles.userInfoValue}>{user.email}</span>
            </div>
            <div className={styles.userInfoItem}>
              <span className={styles.userInfoLabel}>アカウントID:</span>
              <span className={styles.userInfoValue}>{user.id}</span>
            </div>
          </div>
        </section>
        
        <section className={styles.reservationsSection}>
          <h2 className={styles.sectionTitle}>予約履歴</h2>
          {isLoading ? (
            <p>予約データを読み込み中...</p>
          ) : reservations.length > 0 ? (
            <div className={styles.reservationsList}>
              {reservations.map((reservation) => (
              <div key={reservation.id} className={styles.reservationCard}>
                <h3 className={styles.reservationTitle}>{reservation.space_title}</h3>
                <div className={styles.reservationDetails}>
                  <div className={styles.reservationDetail}>
                    <span className={styles.reservationLabel}>予約期間:</span> 
                    <span>{new Date(reservation.start_date).toLocaleDateString()} ～ {new Date(reservation.end_date).toLocaleDateString()}</span>
                  </div>
                  <div className={styles.reservationDetail}>
                    <span className={styles.reservationLabel}>料金:</span> 
                    <span>¥{reservation.total_price.toLocaleString()}</span>
                  </div>
                  <div className={styles.reservationDetail}>
                    <span className={styles.reservationLabel}>ステータス:</span> 
                    <span>{getStatusText(reservation.status)}</span>
                  </div>
                  <div className={styles.reservationDetail}>
                    <span className={styles.reservationLabel}>支払い:</span> 
                    <span>{getPaymentStatusText(reservation.payment_status)}</span>
                  </div>
                </div>
              </div>
              ))}
            </div>
          ) : (
            <p className={styles.emptyMessage}>予約履歴はありません</p>
          )}
        </section>
      </main>
    </div>
  );
}
