import { getDb } from "@/lib/db";
import Link from "next/link";
import styles from "./page.module.css";
import Image from "next/image";
import Header from "@/components/Header";

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
  amenities: string | null;
  images: string | null;
  owner_name: string;
  created_at: string;
  updated_at: string;
}

// このページは静的な内容を持たず、定期的に更新されるためキャッシュを無効化
export const dynamic = 'force-dynamic';

export default async function Home() {
  // データベースからスペース情報を取得
  const db = getDb();
  const spaces = db.prepare(`
    SELECT 
      s.*,
      o.username as owner_name
    FROM spaces s
    JOIN owners o ON s.owner_id = o.id
    ORDER BY s.created_at DESC
  `).all() as Space[];

  return (
    <div className={styles.container}>
      <Header />

      <main className={styles.main}>
        <div className={styles.hero}>
          <h2>必要な時に、必要なだけのスペースを</h2>
          <p>Okippaで簡単にスペースを探して予約できます</p>
        </div>

        <section className={styles.spacesSection}>
          <h2 className={styles.sectionTitle}>利用可能なスペース</h2>
          
          <div className={styles.spaceGrid}>
            {spaces.map((space) => (
              <Link 
                href={`/spaces/${space.id}`} 
                key={space.id} 
                className={styles.spaceCard}
              >
                <div className={styles.spaceImageContainer}>
                  {space.images ? (
                    // Lorem Picsumを使用して画像を表示
                    <Image 
                      src={`https://picsum.photos/seed/${space.id}_${space.images.split(',')[0]}/300/200`}
                      alt={space.title}
                      width={300}
                      height={200}
                      className={styles.spaceImage}
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <div className={styles.noImage}>
                      {space.title.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className={styles.spaceInfo}>
                  <h3 className={styles.spaceTitle}>{space.title}</h3>
                  <p className={styles.spaceAddress}>{space.address}</p>
                  <div className={styles.spaceDetails}>
                    <span>{space.size_sqm} m²</span>
                    <span className={styles.spacePrice}>¥{space.price_per_day.toLocaleString()}/日</span>
                  </div>
                  <div className={styles.spaceOwner}>オーナー: {space.owner_name}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <p>&copy; 2025 Okippa - レンタルスペースサービス</p>
      </footer>
    </div>
  );
}
