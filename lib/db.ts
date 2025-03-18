import Database from 'better-sqlite3';
import { join } from 'path';

// データベースファイルのパスを定義
const DB_PATH = join(process.cwd(), 'db', 'okippa.db');

let db: Database.Database;

/**
 * SQLiteデータベースへの接続を取得します
 */
export function getDb(): Database.Database {
  if (!db) {
    try {
      // データベースに接続
      db = new Database(DB_PATH);
      
      // 外部キー制約を有効にする
      db.pragma('foreign_keys = ON');
      
      console.log('SQLiteデータベースに接続しました');
    } catch (error) {
      console.error('データベース接続エラー:', error);
      throw error;
    }
  }
  
  return db;
}

/**
 * データベース接続を閉じます
 */
export function closeDb(): void {
  if (db) {
    db.close();
    console.log('SQLiteデータベース接続を閉じました');
    db = undefined as unknown as Database.Database;
  }
}
