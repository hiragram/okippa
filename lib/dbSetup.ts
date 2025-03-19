import { getDb } from './db';
import bcrypt from 'bcryptjs';

/**
 * データベースの初期セットアップを行います
 * テーブルの作成などの初期化処理をここで実行します
 */
export function setupDatabase(): void {
  const db = getDb();
  
  // トランザクションを使用して実行
  db.transaction(() => {
    // 既存のテーブルを削除（外部キー制約を考慮した順序）
    db.exec(`
      DROP TABLE IF EXISTS reservations;
      DROP TABLE IF EXISTS spaces;
      DROP TABLE IF EXISTS owners;
      DROP TABLE IF EXISTS users;
    `);
    
    // ユーザーテーブル（スペースを借りるユーザー）
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
      );
    `);
    
    // オーナーテーブル（スペースを貸し出すオーナー）
    db.exec(`
      CREATE TABLE IF NOT EXISTS owners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        phone TEXT NOT NULL,
        address TEXT NOT NULL,
        bank_info TEXT,
        verified BOOLEAN DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
      );
    `);
    
    // スペーステーブル（貸し出し可能なスペース）
    db.exec(`
      CREATE TABLE IF NOT EXISTS spaces (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        address TEXT NOT NULL,
        size_sqm REAL NOT NULL,
        price_per_day INTEGER NOT NULL,
        available_from TEXT NOT NULL,
        available_until TEXT,
        amenities TEXT,
        images TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
        FOREIGN KEY (owner_id) REFERENCES owners (id) ON DELETE CASCADE
      );
    `);
    
    // 予約テーブル
    db.exec(`
      CREATE TABLE IF NOT EXISTS reservations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        space_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        total_price INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, cancelled, completed
        payment_status TEXT NOT NULL DEFAULT 'unpaid', -- unpaid, paid, refunded
        created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
        FOREIGN KEY (space_id) REFERENCES spaces (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );
    `);
    
    console.log('データベーステーブルを初期化しました');
  })();
}

/**
 * データベースを初期化して必要なシードデータを挿入します
 * 開発環境でのテスト用データなどを追加できます
 */
export async function seedDatabase(): Promise<void> {
  const db = getDb();
  
  // 事前にハッシュ化されたパスワードを準備
  const testPasswordHash = await bcrypt.hash('password123', 10);
  const ownerPasswordHash = await bcrypt.hash('owner123', 10);
  
  // トランザクションを使用して実行
  db.transaction(() => {
    // テスト用ユーザーの挿入
    const insertUser = db.prepare(`
      INSERT OR IGNORE INTO users (username, email, password_hash, phone, address)
      VALUES (?, ?, ?, ?, ?);
    `);
    
    // ユーザーサンプルデータ（5名）
    const users = [
      {
        username: 'yamada_taro',
        email: 'yamada@example.com',
        phone: '090-1234-5678',
        address: '東京都渋谷区'
      },
      {
        username: 'tanaka_hanako',
        email: 'tanaka@example.com',
        phone: '080-8765-4321',
        address: '東京都新宿区'
      },
      {
        username: 'suzuki_ichiro',
        email: 'suzuki@example.com',
        phone: '070-2345-6789',
        address: '東京都目黒区'
      },
      {
        username: 'sato_yuki',
        email: 'sato@example.com',
        phone: '090-3456-7890',
        address: '神奈川県横浜市'
      },
      {
        username: 'takahashi_kenji',
        email: 'takahashi@example.com',
        phone: '080-4567-8901',
        address: '埼玉県さいたま市'
      }
    ];
    
    // ユーザーをデータベースに挿入
    users.forEach(user => {
      insertUser.run(
        user.username, 
        user.email, 
        testPasswordHash,
        user.phone,
        user.address
      );
    });
    
    // テスト用オーナーの挿入
    const insertOwner = db.prepare(`
      INSERT OR IGNORE INTO owners (username, email, password_hash, phone, address, bank_info, verified)
      VALUES (?, ?, ?, ?, ?, ?, ?);
    `);
    
    // オーナーサンプルデータ（10名）
    const owners = [
      {
        username: 'space_owner1',
        email: 'owner1@example.com',
        phone: '090-1111-1111',
        address: '東京都千代田区',
        bank_info: 'みずほ銀行 東京支店 普通 1111111',
        verified: 1
      },
      {
        username: 'space_owner2',
        email: 'owner2@example.com',
        phone: '090-2222-2222',
        address: '東京都中央区',
        bank_info: '三菱UFJ銀行 銀座支店 普通 2222222',
        verified: 1
      },
      {
        username: 'space_owner3',
        email: 'owner3@example.com',
        phone: '090-3333-3333',
        address: '東京都港区',
        bank_info: '三井住友銀行 六本木支店 普通 3333333',
        verified: 1
      },
      {
        username: 'space_owner4',
        email: 'owner4@example.com',
        phone: '090-4444-4444',
        address: '東京都新宿区',
        bank_info: 'りそな銀行 新宿支店 普通 4444444',
        verified: 1
      },
      {
        username: 'space_owner5',
        email: 'owner5@example.com',
        phone: '090-5555-5555',
        address: '東京都渋谷区',
        bank_info: 'ゆうちょ銀行 普通 5555555',
        verified: 1
      },
      {
        username: 'space_owner6',
        email: 'owner6@example.com',
        phone: '090-6666-6666',
        address: '神奈川県横浜市',
        bank_info: '横浜銀行 横浜駅前支店 普通 6666666',
        verified: 0
      },
      {
        username: 'space_owner7',
        email: 'owner7@example.com',
        phone: '090-7777-7777',
        address: '神奈川県川崎市',
        bank_info: '川崎信用金庫 川崎支店 普通 7777777',
        verified: 1
      },
      {
        username: 'space_owner8',
        email: 'owner8@example.com',
        phone: '090-8888-8888',
        address: '埼玉県さいたま市',
        bank_info: '埼玉りそな銀行 大宮支店 普通 8888888',
        verified: 0
      },
      {
        username: 'space_owner9',
        email: 'owner9@example.com',
        phone: '090-9999-9999',
        address: '千葉県千葉市',
        bank_info: '千葉銀行 千葉支店 普通 9999999',
        verified: 1
      },
      {
        username: 'space_owner10',
        email: 'owner10@example.com',
        phone: '090-0000-0000',
        address: '茨城県つくば市',
        bank_info: '常陽銀行 つくば支店 普通 0000000',
        verified: 1
      }
    ];
    
    // オーナーをデータベースに挿入
    owners.forEach(owner => {
      insertOwner.run(
        owner.username,
        owner.email,
        ownerPasswordHash,
        owner.phone,
        owner.address,
        owner.bank_info,
        owner.verified
      );
    });
    
    // スペースのサンプルデータを挿入
    const insertSpace = db.prepare(`
      INSERT OR IGNORE INTO spaces (
        owner_id, title, description, address, size_sqm, 
        price_per_day, available_from, available_until, amenities, images
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);
    
    // スペース名の接頭辞
    const spaceNamePrefixes = [
      '駅近の便利な', '広々とした', '清潔感あふれる', 'アクセス抜群の',
      '24時間利用可能な', 'セキュリティ万全の', '格安', '高級感のある',
      '静かな環境の', '新築', 'リノベーション済みの', 'プライベート',
      '多目的', '防音対策済みの', '温度管理完備の'
    ];
    
    // スペース名の種類
    const spaceTypes = [
      '収納スペース', 'トランクルーム', 'レンタルスペース', '物置スペース',
      '倉庫', 'ガレージ', 'コンテナスペース', '屋内保管スペース',
      'ロフトスペース', '防湿スペース', '書類保管庫', 'アトリエスペース'
    ];
    
    // 地域情報
    const areas = [
      { name: '東京都千代田区', station: '東京駅' },
      { name: '東京都中央区', station: '銀座駅' },
      { name: '東京都港区', station: '六本木駅' },
      { name: '東京都新宿区', station: '新宿駅' },
      { name: '東京都渋谷区', station: '渋谷駅' },
      { name: '東京都目黒区', station: '目黒駅' },
      { name: '東京都世田谷区', station: '二子玉川駅' },
      { name: '東京都杉並区', station: '荻窪駅' },
      { name: '東京都葛飾区', station: '亀有駅' },
      { name: '神奈川県横浜市', station: '横浜駅' },
      { name: '神奈川県川崎市', station: '川崎駅' },
      { name: '埼玉県さいたま市', station: '大宮駅' },
      { name: '千葉県千葉市', station: '千葉駅' },
      { name: '茨城県つくば市', station: 'つくば駅' }
    ];
    
    // アメニティのオプション
    const amenityOptions = [
      'セキュリティカメラ', '24時間アクセス', '温度管理', '湿度管理',
      '大型家具可', '搬入補助', '私設駐車場', '耐震設計',
      'エレベーター', '宅配受取可', '防塵対策', '防虫対策',
      '荷物の預かり', '荷物の配送', '段ボール無料提供', '台車貸出',
      'Wi-Fi完備', '電源利用可', '照明設備', '空調完備'
    ];
    
    // サイズバリエーション
    const sizeOptions = [
      3.0, 4.5, 6.0, 8.0, 10.0, 12.0, 15.0, 20.0, 25.0, 30.0
    ];
    
    // 価格帯（1日あたり）
    const priceOptions = [
      500, 800, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 7000, 10000
    ];
    
    // 利用可能日
    const availableDates = [
      '2025-04-01', '2025-05-01', '2025-06-01', '2025-07-01', '2025-08-01',
      '2025-09-01', '2025-10-01', '2025-11-01', '2025-12-01'
    ];
    
    // スペースのダミー画像
    const dummyImages = [
      'space_img_1.jpg',
      'space_img_2.jpg', 
      'space_img_3.jpg', 
      'space_img_4.jpg',
      'space_img_5.jpg',
      'space_img_6.jpg'
    ];
    
    // ランダムな要素を配列から選択する関数
    const randomChoice = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
    
    // ランダムな数値を範囲内で生成する関数
    const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
    
    // ランダムな配列要素をn個選ぶ関数
    const randomChoices = (arr: any[], n: number) => {
      const result = [];
      const copy = [...arr];
      n = Math.min(n, copy.length);
      for (let i = 0; i < n; i++) {
        const index = Math.floor(Math.random() * copy.length);
        result.push(copy[index]);
        copy.splice(index, 1);
      }
      return result;
    };
    
    // 各オーナーに対して、1〜5個のスペースを生成
    for (let owner_id = 1; owner_id <= 10; owner_id++) {
      const numSpaces = randomInt(1, 5);
      
      for (let i = 0; i < numSpaces; i++) {
        const area = randomChoice(areas);
        const title = `${randomChoice(spaceNamePrefixes)}${randomChoice(spaceTypes)}`;
        const station = area.station;
        const distanceToStation = randomInt(1, 15);
        const size = randomChoice(sizeOptions);
        const price = randomChoice(priceOptions);
        const amenities = randomChoices(amenityOptions, randomInt(3, 8)).join(',');
        const availableFrom = randomChoice(availableDates);
        const availableUntil = Math.random() > 0.3 ? 
                              new Date(new Date(availableFrom).setFullYear(new Date(availableFrom).getFullYear() + 1)).toISOString().split('T')[0] : 
                              null;
        const images = randomChoices(dummyImages, randomInt(1, 4)).join(',');
        
        const description = `${station}から徒歩${distanceToStation}分。${size}平米の${title}です。` + 
                        `清潔で安全な環境で、${randomChoice(['大切な荷物', '季節家電', '趣味の道具', '商品在庫', '書類や備品'])}の保管に最適です。` +
                        `${Math.random() > 0.5 ? '24時間いつでもアクセス可能。' : '営業時間内であればいつでも出し入れ自由。'}` +
                        `${Math.random() > 0.7 ? 'セキュリティ対策も万全で安心してご利用いただけます。' : ''}`;
        
        const address = `${area.name}${randomInt(1, 30)}-${randomInt(1, 20)}`;
        
        insertSpace.run(
          owner_id,
          title,
          description,
          address,
          size,
          price,
          availableFrom,
          availableUntil,
          amenities,
          images
        );
      }
    }
    
    // 予約サンプル
    const insertReservation = db.prepare(`
      INSERT OR IGNORE INTO reservations (
        space_id, user_id, start_date, end_date, 
        total_price, status, payment_status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?);
    `);
    
    // 各ユーザーに1〜3つの予約を作成
    const reservationStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    const paymentStatuses = ['unpaid', 'paid', 'refunded'];
    
    for (let user_id = 1; user_id <= 5; user_id++) {
      const numReservations = randomInt(1, 3);
      
      for (let i = 0; i < numReservations; i++) {
        const space_id = randomInt(1, 30); // 全スペース数を考慮（最大で10オーナー×5スペース=50）
        
        // 過去や未来の予約をランダムに生成
        const isInFuture = Math.random() > 0.3;
        
        let startDate, endDate;
        if (isInFuture) {
          // 未来の予約
          const startDaysFromNow = randomInt(10, 180);
          const durationDays = randomInt(7, 90);
          
          const start = new Date();
          start.setDate(start.getDate() + startDaysFromNow);
          startDate = start.toISOString().split('T')[0];
          
          const end = new Date(start);
          end.setDate(end.getDate() + durationDays);
          endDate = end.toISOString().split('T')[0];
        } else {
          // 過去の予約
          const startDaysAgo = randomInt(180, 10);
          const durationDays = randomInt(7, 90);
          
          const start = new Date();
          start.setDate(start.getDate() - startDaysAgo);
          startDate = start.toISOString().split('T')[0];
          
          const end = new Date(start);
          end.setDate(end.getDate() + durationDays);
          endDate = end.toISOString().split('T')[0];
        }
        
        // 予約ステータスとお支払いステータスを設定
        let status, paymentStatus;
        
        if (isInFuture) {
          // 未来の予約
          status = Math.random() > 0.3 ? 'confirmed' : 'pending';
          paymentStatus = status === 'confirmed' && Math.random() > 0.5 ? 'paid' : 'unpaid';
        } else {
          // 過去の予約
          status = Math.random() > 0.2 ? 'completed' : (Math.random() > 0.5 ? 'cancelled' : 'confirmed');
          paymentStatus = status === 'completed' ? 'paid' : (status === 'cancelled' ? (Math.random() > 0.5 ? 'refunded' : 'paid') : 'paid');
        }
        
        // 仮の価格計算（実際には正確なスペース価格 × 日数）
        const durationInDays = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const estimatedDailyPrice = randomInt(500, 5000);
        const totalPrice = durationInDays * estimatedDailyPrice;
        
        insertReservation.run(
          space_id,
          user_id,
          startDate,
          endDate,
          totalPrice,
          status,
          paymentStatus
        );
      }
    }
    
    console.log('シードデータを挿入しました');
  })();
}
