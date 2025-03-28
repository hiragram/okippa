#!/bin/bash

# カラー設定
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 関数: ステップの開始を表示
start_step() {
  echo -e "${BLUE}[INFO]${NC} $1..."
}

# 関数: 成功メッセージを表示
success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# 関数: エラーメッセージを表示して終了
error() {
  echo -e "${RED}[ERROR]${NC} $1"
  exit 1
}

# 関数: 警告メッセージを表示
warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

# 関数: コマンドが存在するかチェック
check_command() {
  command -v $1 >/dev/null 2>&1
}

echo -e "${BLUE}===== okippaプロジェクト初期セットアップ =====${NC}"

# Homebrewのチェックとインストール
start_step "Homebrewをチェック中"
if ! check_command brew; then
  warning "Homebrewがインストールされていません。インストールします..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" || error "Homebrewのインストールに失敗しました"
  success "Homebrewのインストールが完了しました"
else
  success "Homebrewは既にインストールされています"
fi

# Node.jsのチェックとインストール
start_step "Node.jsをチェック中"
if ! check_command node; then
  warning "Node.jsがインストールされていません。インストールします..."
  brew install node || error "Node.jsのインストールに失敗しました"
  success "Node.jsのインストールが完了しました"
else
  success "Node.jsは既にインストールされています"
fi

# npmのチェック
if ! check_command npm; then
  error "npmが見つかりません。Node.jsを再インストールしてください"
fi

# 必要なディレクトリの作成
start_step "必要なディレクトリを作成中"
mkdir -p db
success "ディレクトリの作成が完了しました"

# 依存パッケージのインストール
start_step "依存パッケージをインストール中"
npm install || error "依存パッケージのインストールに失敗しました"
success "依存パッケージのインストールが完了しました"

# データベースの初期化
start_step "データベースを初期化中"
NODE_ENV=development npm run db:init || error "データベースの初期化に失敗しました"
success "データベースの初期化が完了しました"

# 完了メッセージ
echo -e "\n${GREEN}===== セットアップが完了しました =====${NC}"
echo -e "以下のコマンドでNext.jsアプリケーションを起動できます："
echo -e "  ${BLUE}npm run dev${NC}"
echo -e "\nAPIエンドポイント："
echo -e "  ${BLUE}GET /api/users${NC} - 全ユーザー情報の取得"
echo -e "  ${BLUE}POST /api/users${NC} - 新規ユーザーの作成"
echo -e "\n詳細は README-sqlite.md を参照してください。"
