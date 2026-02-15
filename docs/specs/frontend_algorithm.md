# Frontend（ダッシュボード）算出ロジック仕様

## 概要
フロントエンドで受け取った1分集計メトリクスから疲労スコアを算出する責務を持つ。アルゴリズムはサーバから配布されるアセット（閾値・重み・平滑化パラメータ）に従う。

## アセット（例）
```
{
  "version": "2026-02-15_v1",
  "assets": {
    "ear_threshold": 0.22,
    "perclos_window_s": 60,
    "weights": {"ear":0.5, "perclos":0.3, "voice":0.2},
    "normalization": {
      "ear": {"min":0.08, "max":0.35},
      "perclos": {"min":0.0, "max":0.5},
      "voice": {"min":0.0, "max":300.0}
    },
    "smoothing": {"ema_alpha":0.2}
  }
}
```

## スコア算出手順（疑似コード）
```
function normalize(x, min, max) {
  return clamp((x - min) / (max - min), 0.0, 1.0)
}

function compute_raw_score(metrics, assets) {
  ear_s = 1 - normalize(metrics.ear_mean, assets.normalization.ear.min, assets.normalization.ear.max)
  perclos_s = normalize(metrics.perclos, assets.normalization.perclos.min, assets.normalization.perclos.max)
  voice_s = 1 - normalize(metrics.voice_f0_mean, assets.normalization.voice.min, assets.normalization.voice.max)

  raw = ear_s * assets.weights.ear + perclos_s * assets.weights.perclos + voice_s * assets.weights.voice
  return clamp(raw, 0.0, 1.0)
}

// EMA smoothing
smoothed_score = ema_alpha * raw + (1 - ema_alpha) * previous_smoothed_score
```

説明:
- `ear_s` は EAR が低いほど疲労スコアを増やすために `1 - normalized(ear)` を使う。
- `voice_s` は基本周波数の低下/変動が疲労に繋がるため `1 - normalized(f0)` を使う。

## アセット更新時の処理
- 新しい `version` を検出したら、既存キャッシュをバージョンで比較。
- 必要なら過去データの再評価（再計算）機能を提供する。管理者が「再評価」トリガーを押すと、フロントは保存済みのメトリクスを再度スコア計算して表示を更新する。

## しきい値・アラート
- 最終スコアがアセットで定義された閾値（例: 0.7）を超えた場合、赤アラートを表示し管理者へ通知のオプションを提示する（通知自体はサーバ連携で運用）。

## 診断モード
- サンプルデータセットを読み込んでスコア計算を行い、期待されるスコアレンジと実際の違いを可視化できる。

## オフライン/キャッシュ
- アセットはローカルストレージにバージョン付きでキャッシュ。オフライン時は最後に取得したアセットで計算を継続。
