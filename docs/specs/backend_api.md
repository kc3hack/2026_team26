# Backend API仕様書

## 概要
オンプレミス環境向けのREST API。デバイス登録、アセット（閾値等）配信、1分集計メトリクスの受信・取得を主目的とする。

## 認証
- TLS（HTTPS）必須。内部CA証明書に対応。
- デバイスは初回登録で匿名デバイスIDとAPIトークンを受け取る。
- 管理者/ダッシュボードはJWTベースのログインを利用する。

## エンドポイント

### POST /api/v1/register-device
- 説明: デバイス初回登録。デバイス情報を受け取り匿名ID/APIトークンを発行する。
- リクエスト例:
```
POST /api/v1/register-device
{
  "hw_id": "uuid-or-hash",
  "os": "Windows-10",
  "client_version": "1.0.0"
}
```
- レスポンス例:
```
200 OK
{
  "device_id": "dev_abc123",
  "api_token": "secret-token",
  "issued_at": "2026-02-15T12:00:00Z"
}
```

### GET /api/v1/assets
- 説明: クライアント初回起動やバージョンチェックで呼ぶ。閾値、重み、アルゴリズム定義のJSONを返す。
- パラメータ: `?version=2026-02-15_v1`（オプション、差分取得用）
- レスポンス例:
```
200 OK
{
  "version": "2026-02-15_v1",
  "generated_at": "2026-02-15T12:00:00Z",
  "assets": {
    "ear_threshold": 0.22,
    "perclos_window_s": 60,
    "weights": {
      "ear": 0.5,
      "perclos": 0.3,
      "voice": 0.2
    },
    "smoothing": {"ema_alpha": 0.2}
  }
}
```

### POST /api/v1/metrics
- 説明: デバイスからの1分集計を受信して保存する。
- 認証: `Authorization: Bearer <api_token>` ヘッダ必須。
- リクエストスキーマは `docs/specs/desktop_payload.md` を参照。
- レスポンス例:
```
201 Created
{ "status": "ok", "received_at": "2026-02-15T12:01:00Z" }
```

### GET /api/v1/metrics
- 説明: 管理者/ダッシュボード用。匿名ID・チーム別等のフィルタを受ける。
- クエリ例: `?device_id=dev_abc123&from=2026-02-14T00:00:00Z&to=2026-02-15T00:00:00Z`

## DBスキーマ（草案）
- `devices`:
  - id (PK, varchar)
  - hw_id (varchar, hashed)
  - created_at
  - last_seen

- `assets`:
  - version (PK)
  - payload (JSON)
  - generated_at

- `metrics`:
  - id (PK)
  - device_id (FK)
  - ts (timestamp) -- 集計時刻（1分刻み）
  - ear_mean (float)
  - ear_std (float)
  - blink_count (int)
  - perclos (float)
  - gaze_deviation (float)
  - voice_f0_mean (float)
  - voice_f0_std (float)
  - talk_ratio (float)
  - raw_payload (JSON) -- 必要最小限、機密データは含めない

## アセット管理
- 管理画面またはCLIで `assets` を作成・更新。各アセットに `version` を付与。
- クライアントは `version` 比較で差分取得または再取得を行う。

## セキュリティ・運用
- 入力は厳格にバリデートする（型・レンジチェック）。
- 監査ログを保持（登録・受信・アセット更新履歴）。
- データ保持ポリシーを定義（例: メトリクス1年、assets無期限）。

## エラーハンドリング
- 400系: リクエスト不正（詳細メッセージ）、401: 認証失敗、429: レート制限、500: サーバ内部エラー。

## 参考
- クライアントの送信スキーマ: `docs/specs/desktop_payload.md`。
