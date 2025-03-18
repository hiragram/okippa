'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import styles from './space.module.css';

// スペースの型定義
interface Space {
  id: number;
  owner_id: number;
  title: string;
  description: string | null;
  address: string;
  size_sqm: number;
  price_per_day: number;
  available_from: string;
  available_until: string | null;
  amenities: string[] | null;
  images: string[] | null;
  owner_name: string;
  owner_phone: string;
  owner_email: string;
  created_at: string;
  updated_at: string;
}

export default function SpaceDetail() {
  const params = useParams();
  const router = useRouter();
  const [space, setSpace] = useState<Space | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    // スペースIDを取得
    const spaceId = params.id;
    
    if (!spaceId) {
      setError('スペースIDが見つかりません');
      setLoading(false);
      return;
    }

    // APIからスペース詳細を取得
    fetch(`/api/spaces/${spaceId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('スペース情報の取得に失敗しました');
        }
        return response.json();
      })
      .then(data => {
        setSpace(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'エラーが発生しました');
        setLoading(false);
      });
  }, [params.id]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loading}>読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.error}>{error}</div>
        <Link href="/" className={styles.backLink}>トップページに戻る</Link>
      </div>
    );
  }

  if (!space) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.error}>スペース情報が見つかりません</div>
        <Link href="/" className={styles.backLink}>トップページに戻る</Link>
      </div>
    );
  }

  // 利用可能期間の表示用フォーマット
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/" className={styles.backButton}>← トップに戻る</Link>
        <div className={styles.headerRight}>
          <Link href="/auth/login" className={styles.authButton}>
            ログイン
          </Link>
          <Link href="/auth/signup" className={styles.authButton}>
            新規登録
          </Link>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.spaceHeader}>
          <h1 className={styles.spaceTitle}>{space.title}</h1>
          <p className={styles.spaceAddress}>{space.address}</p>
        </div>

        <div className={styles.spaceContent}>
          <div className={styles.spaceImageContainer}>
            {space.images && space.images.length > 0 ? (
              <>
                {/* メイン画像 */}
                <div className={styles.spaceImage}>
                  <Image 
                    src={`https://picsum.photos/seed/${space.id}_${space.images[selectedImageIndex]}/600/400`}
                    alt={`${space.title} - 画像 ${selectedImageIndex + 1}`}
                    width={600}
                    height={400}
                    className={styles.spaceImageItem}
                    style={{ objectFit: "cover", width: "100%", height: "100%" }}
                  />
                </div>
                
                {/* サムネイル画像一覧 */}
                {space.images.length > 1 && (
                  <div className={styles.thumbnailContainer}>
                    {space.images.map((image, index) => (
                      <div 
                        key={index}
                        className={`${styles.thumbnail} ${selectedImageIndex === index ? styles.activeThumbnail : ''}`}
                        onClick={() => setSelectedImageIndex(index)}
                      >
                        <Image 
                          src={`https://picsum.photos/seed/${space.id}_${image}/150/100`}
                          alt={`${space.title} - サムネイル ${index + 1}`}
                          width={150}
                          height={100}
                          style={{ objectFit: "cover", width: "100%", height: "100%" }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className={styles.spaceImage}>
                <div className={styles.noImage}>
                  {space.title.charAt(0).toUpperCase()}
                </div>
              </div>
            )}
          </div>

          <div className={styles.spaceDetails}>
            <div className={styles.spaceInfo}>
              <h2 className={styles.sectionTitle}>スペース情報</h2>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>サイズ</span>
                  <span className={styles.infoValue}>{space.size_sqm} m²</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>料金</span>
                  <span className={styles.infoValue}>¥{space.price_per_day.toLocaleString()}/日</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>利用可能期間</span>
                  <span className={styles.infoValue}>
                    {formatDate(space.available_from)}
                    {space.available_until ? ` 〜 ${formatDate(space.available_until)}` : ' から利用可能'}
                  </span>
                </div>
                {space.amenities && space.amenities.length > 0 && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>設備・特徴</span>
                    <div className={styles.amenitiesList}>
                      {space.amenities.map((amenity, index) => (
                        <span key={index} className={styles.amenityTag}>{amenity}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.spaceDescription}>
              <h2 className={styles.sectionTitle}>詳細説明</h2>
              <p>{space.description || 'このスペースの詳細説明はありません。'}</p>
            </div>

            <div className={styles.ownerInfo}>
              <h2 className={styles.sectionTitle}>オーナー情報</h2>
              <div className={styles.ownerDetails}>
                <p><strong>オーナー名:</strong> {space.owner_name}</p>
                <p><strong>連絡先:</strong> {space.owner_phone}</p>
                <p><strong>メールアドレス:</strong> {space.owner_email}</p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.actionButtons}>
          <button className={styles.reserveButton} onClick={() => alert('予約機能は実装中です')}>
            このスペースを予約する
          </button>
          <button className={styles.contactButton} onClick={() => alert('問い合わせ機能は実装中です')}>
            オーナーに問い合わせる
          </button>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>&copy; 2025 Okippa - レンタルスペースサービス</p>
      </footer>
    </div>
  );
}
