# バックエンド

## DB設計

## 実装手順 (Go)

### 1. 事前準備
- Go 1.22 以上
- PostgreSQL 15 以上
- Docker / Docker Compose (任意: DB 起動用)

### 2. DB 起動 (任意: Docker)
DB は [db/docker-compose.yml](db/docker-compose.yml) を利用します。

```bash
cd backend/db
docker compose up -d
```

### 3. 設定ファイル / 環境変数
下記を前提に実装します。実環境に合わせて調整してください。

```bash
export APP_PORT=8080
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=team26
export DB_USER=team26
export DB_PASSWORD=team26
```

### 4. 起動
例: `cmd/server/main.go` をエントリとする想定。

```bash
cd backend
go run ./cmd/server
```

## 仕様書 (API)

OpenAPI は [docs/swagger.yaml](../docs/swagger.yaml) にあります。

### 認証 (Auth)
- POST `/auth/signup`
  - Request: `SignupRequest`
  - Response: `AuthResponse`
- POST `/auth/signin`
  - Request: `SigninRequest`
  - Response: `AuthResponse`

### 疲労度 (Fatigue)
- POST `/fatigue`
  - Request: `FatigueCreateRequest`
  - Response: `FatigueCreateResponse`
- GET `/fatigue?u={uuid}&f={from}&t={to}`
  - Response: `FatigueListResponse`

### WebSocket
- GET `/ws/fatigue`
  - `POST /fatigue` をトリガに fatigue 更新を配信

## 仕様書 (DB)

ER 図は [backend/er.mmd](er.mmd) を参照。

### users
- id (uuid, PK)
- email (string, UK)
- display_name (string)
- created_at (timestamp)

### fatigue_logs
- id (uuid, PK)
- user_id (uuid, FK -> users.id)
- game_id (uuid, FK -> games.id)
- face_score (int)
- voice_score (int)
- recorded_at (timestamp)

### games
- id (uuid, PK)
- name (string)
- process (string)

## 実装指示 (Go)

### プロジェクト構成 (案)
- `cmd/server/main.go`: エントリ
  - `cmd/server/wire.go`: 依存の組み立て (DI 代替)
- `internal/config`: 設定読み込み
  - `internal/config/config.go`: 環境変数の読み込み
- `internal/db`: DB 接続、マイグレーション
  - `internal/db/conn.go`: `*sql.DB` の初期化
  - `internal/db/migrate.go`: マイグレーション実行
- `internal/httpserver`: ルーティングとハンドラ
  - `internal/httpserver/router.go`: ルート登録（`RegisterGet` / `RegisterPost` ヘルパーを利用）
  - `internal/httpserver/handlers.go`: 汎用ハンドラおよび JSON エラー出力ヘルパー
  - `internal/httpserver/postFatigue.go`: `POST /fatigue` 用ラッパー（リクエストデコードとサービス呼び出し）
  - `internal/httpserver/getFatigue.go`: `GET /fatigue` 用ラッパー（クエリ検証とサービス呼び出し）
  - `internal/httpserver/postSignup.go`: `POST /auth/signup` 用ラッパー
  - `internal/httpserver/postSignin.go`: `POST /auth/signin` 用ラッパー
  - `internal/ws` (ハブ/接続管理は `internal/ws` 側にあり、WS ハンドラは `handlers.go` にて登録)
- `internal/model`: API / DB モデル
  - `internal/model/user.go`: `User`
  - `internal/model/fatigue.go`: `FatigueLog`
- `internal/service`: ビジネスロジック
  - `internal/service/auth.go`: サインアップ、サインイン
  - `internal/service/fatigue.go`: 記録、検索、配信
- `internal/store`: リポジトリ層 (SQL)
  - `internal/store/user_store.go`: `users` CRUD
  - `internal/store/fatigue_store.go`: `fatigue_logs` CRUD
  - `internal/store/game_store.go`: `games` 参照
- `internal/ws`: WebSocket 配信
  - `internal/ws/hub.go`: 接続管理
  - `internal/ws/message.go`: 配信メッセージ
- `migrations`: マイグレーション SQL
  - `migrations/001_init.sql`: 初期スキーマ
- `scripts`: 開発補助
  - `scripts/dev.sh`: ローカル起動

### 明示スキーマ定義
- ファイル: `backend/internal/model/schema.go`
- 内容: API リクエスト/レスポンスと DB レコードの Go 構造体をここにまとめます。
- 理由:
  - 型を一元化することでハンドラ／サービス／ストア間の契約を明示化できます。
  - OpenAPI (`docs/swagger.yaml`) と対応づけて自動生成・同期しやすくなります。
  - バリデーションタグ（`validate:"..."`）を付けることで入力チェックを集中管理できます。

### 運用上の注意
- OpenAPI と Go 構造体は必ずどちらかを「正」として同期運用してください（例: OpenAPI を正としてコード生成またはマッピングを作る）。
- スキーマ改定時は `internal/model/schema.go` → `docs/swagger.yaml` の差分をレビュー必須にする運用を推奨します。

### OpenAPI → Go 自動生成 (oapi-codegen)

- 推奨: `oapi-codegen` を使い、`docs/swagger.yaml` から Go の型/スタブを生成します。
- スクリプト: `backend/scripts/generate_api.sh` を追加しました。使い方:

```bash
cd backend
./scripts/generate_api.sh
```

- 生成先デフォルト: `internal/api/types.gen.go`（パッケージ名 `api`）。
- 生成内容: 現在は `types` のみを生成します。将来的に `server` や `chi` 用スタブ生成も可能です。

注意: スクリプトは実行時に `oapi-codegen` を `go install` でインストールします。CI 環境では `go install github.com/deepmap/oapi-codegen/cmd/oapi-codegen@latest` を事前に実行してください。

### API 実装指針
- JSON は `application/json`
- `POST /fatigue` 成功後に WebSocket で配信
- `GET /fatigue` は `u` `f` `t` を必須とする
- 返却形式は OpenAPI のスキーマに合わせる

### DB 実装指針
- すべての `uuid` はアプリ生成（UUID v4）。サーバ側で生成してから挿入してください。
- DB 側の列は PostgreSQL の `uuid` 型を使用し、アプリが生成した UUID を保存します（DB にデフォルト値を設定する必要はありません）。
- `recorded_at` が未指定ならサーバ時刻を採用
- `face_score` / `voice_score` は 0 以上を保証

### エラーハンドリング
- 4xx: 入力エラー、認証失敗
- 5xx: DB/内部処理エラー
- JSON エラーレスポンスの型を統一する

### テスト方針 (最低限)
- `POST /auth/signup` のバリデーション
- `POST /auth/signin` の認証失敗
- `POST /fatigue` の保存と WS 配信
- `GET /fatigue` の期間検索

