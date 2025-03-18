import { setupDatabase, seedDatabase } from '../lib/dbSetup';
import { closeDb } from '../lib/db';

/**
 * データベースを初期化するメインスクリプト
 */
function initializeDatabase() {
  try {
    console.log('データベースの初期化を開始します...');
    
    // テーブルの作成
    setupDatabase();
    
    // 開発環境の場合はシードデータを挿入
    if (process.env.NODE_ENV === 'development') {
      seedDatabase();
    }
    
    console.log('データベースの初期化が完了しました');
  } catch (error) {
    console.error('データベース初期化中にエラーが発生しました:', error);
  } finally {
    // 接続を閉じる
    closeDb();
  }
}

// スクリプト実行
initializeDatabase();
