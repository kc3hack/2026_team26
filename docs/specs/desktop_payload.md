# Desktop クライアント送信ペイロード仕様

## 概要
デスクトップクライアント（Windows）がバックエンドに送信するJSONスキーマと初回起動のフローを定義する。画像・生音・PIIは送信しない。

## 初回起動フロー
1. `POST /api/v1/register-device` でデバイス登録、`device_id` と `api_token` を取得。
2. `GET /api/v1/assets` を呼んでアセット（閾値・重み・バージョン）を取得してキャッシュ。
3. 以後、1分ごとに集計して `POST /api/v1/metrics` を送信。

## 認証
- すべての送信は `Authorization: Bearer <api_token>` をHTTPヘッダに含める。

## /api/v1/metrics リクエストスキーマ（例）
```
POST /api/v1/metrics
{
  "device_id": "dev_abc123",
  "ts": "2026-02-15T12:00:00Z",
  "interval_s": 60,
  "metrics": {
    "ear_mean": 0.24,
    "ear_std": 0.03,
    "blink_count": 2,
    "perclos": 0.05,
    "gaze_deviation": 0.12,
    "voice_f0_mean": 210.5,
    "voice_f0_std": 12.1,
    "talk_ratio": 0.08
  },
  "client_metadata": {
    "client_version": "1.0.0",
    "os": "Windows-10",
    "timezone": "Asia/Tokyo"
  }
}
```

注意点:
- `raw_payload` は送らない（内部でのみ利用する）。
- 数値は必ず単位とスケール（例: Hz, 比率）を揃える。

## エラーハンドリングと再送
- サーバが504/5xxを返した場合は指数バックオフで再試行（最大5回）。
- ネットワーク切断時はローカルDB/ファイルにバッファして再接続後に順次送信。

## Assets取得仕様
- `GET /api/v1/assets?version=<current_version>` を呼び、サーバが新しい `version` を返したら上書きして適用。
- 取得失敗時はローカルのデフォルト値を使用し、定期的に再取得を試行する。

## ロギング
- 送信成功/失敗をローカルログに記録（送信TS、HTTPステータス、リトライ回数）。ログはローテーションすること。
