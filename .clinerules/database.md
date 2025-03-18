# データベース操作ルール

## データベースファイルの取り扱い

- データベースファイル（例：`db/okippa.db`）を直接削除しないでください
  - 他のプロセス（SQLiteクライアントなど）が接続中の場合に問題が発生します
  - 代わりに、テーブルを `DROP TABLE IF EXISTS` してから再作成する方法を使用してください

```typescript
// 良い例: テーブルの再作成（外部キー制約を考慮した順序）
db.exec(`
  DROP TABLE IF EXISTS reservations;
  DROP TABLE IF EXISTS spaces;
  DROP TABLE IF EXISTS owners;
  DROP TABLE IF EXISTS users;
`);
// テーブルの作成処理...

// 悪い例: ファイルの削除
// rm db/okippa.db  // ← これはやらない
```

## シードデータの管理

- シードデータは `NODE_ENV=development` 環境でのみ挿入するように設計してください
- 本番環境では絶対に実行されないようにガードを入れてください
- スクリプト実行時は適切な環境変数を設定してください：

```bash
# 開発環境でのデータベース初期化（シードデータあり）
NODE_ENV=development npm run db:init

# 本番環境用の初期化（スキーマのみ）
npm run db:init
```

## SQLiteのタイプセーフな利用

- データベースから取得した結果は型付けを明示的に行ってください
- 特にAPIエンドポイントで使用する場合は、型安全性を確保してください

```typescript
// 良い例: 型を明示的に定義
interface Space {
  id: number;
  title: string;
  // 他のプロパティ...
}

const space = db.prepare('SELECT * FROM spaces WHERE id = ?').get(id) as Space;
```

## 外部キー制約の考慮

- テーブルの作成順序と削除順序は外部キー制約を考慮してください
- 削除時は参照されるテーブルより先に参照するテーブルを削除してください
- 作成時はその逆の順序で行います

## 豊富なテストデータの準備

- 開発環境では、現実的なテストデータを十分な量用意してください
- 様々なケース（例：認証済み/未認証のオーナー、異なる状態の予約など）を含めて、エッジケースのテストも可能にしてください
- ランダム生成関数を使って多様なデータを効率的に生成しましょう

```typescript
// ランダムなテストデータ生成のヘルパー関数の例
const randomChoice = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
```
