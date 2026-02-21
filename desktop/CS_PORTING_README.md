# C# 移植ガイド — Python → C# (WPF 単体 exe)

目的
- デスクトップのカメラ／音声キャプチャと疲労解析をすべて C# に移植し、単一の Windows EXE（WPF）で動作させる。
- 今回は「ログイン機能」と「疲労度の算出・サーバ送信」を優先実装する。

現状の再利用候補
- DI 設定、HTTP クライアント登録、`VideoStreamClient` / `AudioStreamClient`、`AuthUsecase` などは既に C# 側に実装済み。
  - 起点: [desktop/App.xaml.cs](desktop/App.xaml.cs)
  - HTTP デバイス呼び出し: `PythonDeviceService`（置換対象）
  - クライアント受信: [desktop/desktop/Services/Http/VideoStreamClient.cs](desktop/desktop/Services/Http/VideoStreamClient.cs)、[desktop/desktop/Services/Http/AudioStreamClient.cs](desktop/desktop/Services/Http/AudioStreamClient.cs)

設計方針（高レベル）
- Python プロセスを廃止し、キャプチャ／解析は WPF アプリ内で直接行う（"in-app"）。
- カメラ: OpenCvSharp を利用して `CameraCapture` クラスを実装（`CameraCapture.cs`）。
- 音声: NAudio（または Wasapi）で `AudioCapture` クラスを実装（`AudioCapture.cs`）。
- 顔解析: まずは OpenCV ベースの EAR（Eye Aspect Ratio）等の heuristic 実装で開始。必要なら将来的に ONNX モデルで精度向上。
- Web 通信: 既存の `AuthService`/`AuthUsecase` を流用してログイン。疲労データ送信は既存の `FatigueService`（または `IFatigueService` を追加）経由でサーバ API に POST する。
- UI: `MainWindow` にデバイス選択 UI（カメラ一覧、マイク一覧）と「開始/停止」、「送信」ボタンを追加。

必要な NuGet / ライブラリ
- OpenCvSharp4.Windows
- NAudio
- System.Text.Json（既存）
- Microsoft.Extensions.DependencyInjection（既存）
- (任意) Microsoft.ML/ONNXRuntime  — 将来のモデル移行用

実装手順（優先順位付）
1. プロジェクト準備
   - `desktop` プロジェクトに NuGet 追加: `OpenCvSharp4.Windows`, `NAudio`。
2. デバイス列挙 API の実装
   - `CameraCapture.GetDeviceList()` を実装（OpenCvSharp の VideoCapture を試行して可用性を確認）。
   - `AudioCapture.GetDeviceList()` を実装（NAudio でデバイス一覧を取得）。
3. `CameraCapture` 実装（`CameraCapture.cs`）
   - Start/Stop、非同期フレーム読取、JPEG バイト列出力（`GetJpegBytes` 相当）。
   - フレームから顔ランドマーク／目の ROI を抽出（OpenCv Haar Cascade / DNN、あるいは簡易 EYE 検出）。
   - EAR を算出し、瞬き/まばたき頻度や短期スコアを出す。
4. `AudioCapture` 実装（`AudioCapture.cs`）
   - マイクから PCM チャンクを取得してキューに入れる。チャンク毎に `estimate_fatigue_from_audio` に相当する処理を呼ぶ。
   - 簡易実装: 音量・ゼロ交差率・ピッチ推定（NAudio + NWaves 等）でスコア化。
5. 疲労算出ロジック実装
   - `FaceFatigueEstimator`（EAR ベース）を実装。
   - `AudioFatigueEstimator` を実装。
   - 両方を統合して短時間の合成スコアを出す（重み付けは設定可能）。
6. サービス層実装
   - 既存の `PythonDeviceService` を廃止または置換して `InAppDeviceService` を作成。
   - 既存の `VideoStreamClient`/`AudioStreamClient` は WebSocket 経由の受信クライアントなので、WPF 内でイベント発火する直接シグナルに置き換える（既存クライアントは UI 側の購読先をそのまま使えるようにAdapterを提供）。
7. UI 統合
   - `MainWindow` にデバイス選択 UI を接続し、`StartCapture` → `CameraCapture.Start()` を呼ぶ。
   - 解析結果を UI へ表示（`VideoFrameEventArgs` を再利用/互換にする）。
8. ログインと疲労送信
   - 既存の `AuthUsecase`/`AuthService` を再利用しログインを実装。
   - 疲労スコア送信: `IFatigueService.SendFatigue(FatiguePayload)` を作り、サーバ API に POST する（既存バックエンドのエンドポイントを利用）。
9. テストとチューニング
   - デバイスの互換性（複数カメラ・デバイス）を確認。
   - EAR のしきい値、平均窓等のパラメータを調整。

最小実装（MVP）スコープ — 1週間で可能な目安
- カメラ選択（OpenCvSharp）: リストと簡易プレビュー
- EAR ベースの瞬き検出と簡易疲労スコア化
- マイク選択と RMS ベースの音声指標
- ログイン（既存の `AuthUsecase` を利用）
- 疲労スコアをサーバへ POST する機能

テスト手順（ローカル）
1. Visual Studio で `desktop` ソリューションを開く。
2. NuGet を追加してビルド。
3. `MainWindow` でカメラ/マイクを選択し「開始」。解析結果が UI に出ることを確認。
4. ログインしてから「送信」ボタンでサーバへ POST されることを確認。

次のアクション提案（選択して下さい）
- A) 詳細な実装チケット（各クラスのメソッド署名＋ファイルテンプレート）を作る。
- B) `CameraCapture.cs` と `FaceFatigueEstimator.cs` の初期実装パッチを作成する。
- C) まず `InAppDeviceService` のインターフェース設計と `App.xaml.cs` の DI 置換を行う。

（注）Python の `processing` 実装ファイルがリポジトリに存在しないため、移植は仕様推定に基づいて行います。元の Python 実装を提供いただければ、より正確に同等ロジックを移植できます。
