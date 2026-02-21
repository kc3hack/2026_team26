
# デスクトップアプリ仕様書 (C# + Python 3.9)

概要
- 目的: カメラとマイクから取得したデータを用い、ユーザーの疲労度(0–100)を算出するデスクトップアプリ。UIはC# (WPF)、データ処理および推定ロジックはPython 3.9で実装する。
- アーキテクチャ: クリーンアーキテクチャを採用。責務をUI / Application (UseCases) / Domain / Infrastructure に分離する。

設計方針（要点）
 変更: 画像・音声の取得（キャプチャ）は Python 側で行う。Python はデバイス一覧を提供し、C# はその一覧からデバイスを選択して選択情報を Python に伝達するワークフローを採用する。C# は UI と表示（Python から送られるフレーム/プレビューの表示）を担当する。
 補足: デバイス選択フロー
 - Python はローカルで利用可能なカメラ / マイクの一覧を取得し、HTTP エンドポイントで公開する（例: GET /api/devices）。
 - C# は起動時または設定画面で `GET /api/devices` を呼び出して一覧を表示し、ユーザーが選択したデバイスIDを `POST /api/start_capture` 等で Python に渡す。
 - Python は選択されたデバイスでキャプチャを開始し、必要に応じて WebSocket（/ws/video）でフレームをストリーミングして C# がプレビュー表示する。
 Python と C# のやり取り（例）
 - デバイス一覧取得: `GET http://127.0.0.1:8000/api/devices` → JSON list
 - キャプチャ開始/停止: `POST http://127.0.0.1:8000/api/start_capture` (body: {"device_id": "...","mode":"video"/"audio"})
 - 画像解析（単発）: `POST http://127.0.0.1:8000/api/image` (multipart/form-data)
 - ビデオプレビュー: WebSocket `ws://127.0.0.1:8000/ws/video` (binary frames or base64-encoded images)
 - 音声ストリーミング: WebSocket `ws://127.0.0.1:8000/ws/audio` (binary PCM chunks)

補足: 音声デバイスの列挙と指定
- `GET /api/devices` はカメラとマイクの両方を返します（`id` が `audio_{n}` の項目はマイク、`id` が数字文字列のものはカメラです）。
- マイクを選択する場合は `POST /api/start_capture` に `{"device_id":"audio_1","mode":"audio"}` のように `device_id` を渡してください。Python サービスは対応する音声入力デバイスインデックスでキャプチャを開始します。
	- カメラフレーム／マイク入力の取得と Python への送信
- Application / UseCases (C# と Python 両方に対応)
	- `CaptureImageAndSend()`, `StreamAudio()` などのユースケース
- Domain (共通モデル)
	- `ImagePayload`, `AudioChunk`, `FatigueScore` 等のデータ定義
- Infrastructure (Python側)
	- カメラ/音声処理実装（OpenCV、sounddevice/pyaudio 等）
	- 推定モデル（TensorFlow/PyTorch かルールベース）
	- FastAPI エンドポイント / WebSocket ハンドラ

Python 側仕様

依存パッケージ（例）
- Python 3.9
- opencv-python
- numpy
- fastapi
- uvicorn
- websockets or starlette WebSocket（FastAPI 経由）
- pydantic
- sounddevice または pyaudio
- scipy, librosa（音声特徴量抽出が必要な場合）
- (任意) tensorflow / torch（学習モデルを使用する場合）

モジュールと機能
- api.server
	- 起動: `uvicorn api.server:app --host 127.0.0.1 --port 8000`
	- POST /api/image
		- 説明: C# から送信された静止画像（単一フレーム）を受け取り、顔検出→疲労度算出→JSONで返却
		- リクエスト: multipart/form-data, field=`image` (JPEG/PNG)
		- レスポンス: { "score": 0-100, "faces": [ {"bbox": [x,y,w,h], "id": n } ] }
	- WebSocket /ws/audio
		- 説明: C# から音声チャンクをバイナリで送信。サーバは受け取り都度特徴量を算出、窓ごとに疲労度を返す
		- メッセージ形式: バイナリ PCM/16-bit リトルエンディアン、サンプリングレートは事前設定（例: 16000 Hz）

- processing.camera
	- カメラ入力を想定した関数群（テスト用にファイル読み込みも提供）
	- 顔検出: OpenCV の HaarCascade または DNN を使う。検出結果は顔領域を切り出す。

- processing.face_fatigue
	- 入力: 顔画像 (RGB / グレースケール)
	- 出力: 疲労度スコア 0-100
	- 実装案:
		- フェイシャルランドマークから瞬き率、目の開閉係数、表情特徴量を抽出しルールベースでスコア化
		- または、小型の学習済みモデル（CNN）に顔を通して回帰出力を得る

- processing.audio_fatigue
	- 入力: 音声チャンク（PCM）
	- 出力: 疲労度スコア 0-100
	- 実装案:
		- 音声特徴量（MFCC、ピッチ、声のエネルギー、話速）を窓ごとに算出
		- ルールベースまたは学習モデルで疲労推定

C# (UI) 側仕様

- 技術: .NET 6/7 または適切な LTS、WPF を想定
- 機能
	- デバイス選択 (カメラ/マイク)
	- カメラプレビュー表示
	- 「撮影して解析」「解析停止」「ストリーム音声送信」ボタン
	- 疲労度のリアルタイム表示（顔・音声それぞれ）
- Python への送信方法
	- 画像: HttpClient を用いて `POST http://127.0.0.1:8000/api/image` に multipart/form-data で送信
	- 音声: WebSocket 接続を張って、PCM バッファを順次送信。サーバからのJSONメッセージでスコアを受信し UI を更新

API / メッセージ定義（要約）
- POST /api/image
	- Request: multipart/form-data (image)
	- Response: 200 { "score": float(0-100), "faces": [ {"bbox":[x,y,w,h]} ] }
- WebSocket /ws/audio
	- Client→Server: バイナリ (PCM chunk)
	- Server→Client: JSON { "score": float, "window_ms": N }

データ形式の注意
- 画像: JPEG (RGB) を推奨。送信前にリサイズ（例: 640x480）で帯域と処理負荷を下げる。
- 音声: PCM 16-bit, mono, 16000 Hz を推奨。チャンク長: 200-1000 ms。

ディレクトリ構成（提案）
- desktop/ (WPF アプリ)
	- App.xaml, MainWindow.xaml
	- Services/ (HttpClient, WebSocket client wrapper)
	- ViewModels/
- python_service/
	- api/ (FastAPI エントリポイント)
		- server.py
	- processing/
		- camera.py
		- face_fatigue.py
		- audio_fatigue.py
	- models/
	- requirements.txt

開発手順（簡易）
1. Python 環境を作成（3.9）
	 - python -m venv .venv
	 - source .venv/bin/activate
	 - pip install -r python_service/requirements.txt
2. Python サーバ起動
	 - cd python_service
	 - uvicorn api.server:app --host 127.0.0.1 --port 8000
3. C# アプリから接続して動作確認
	 - アプリ起動後、カメラを選択して「撮影して解析」ボタンを押す

テスト & 検証
- 単体テスト: Python の各モジュール（顔検出・疲労推定・音声特徴量）に対してユニットテストを用意する
- 統合テスト: サーバ起動 + C# から API を叩く自動テストを用意する（CI では uvicorn をバックグラウンドで起動）

拡張案 / 今後の改善点
- リアルタイム性改善: gRPC ストリーミングで低遅延化
- プライバシー: 画像や音声データのローカル保持のみを徹底し、外部送信しない設計
- モデル改善: ラベル付きデータで疲労ラベルを学習し精度向上

不明点 / 要確認事項
- 疲労度推定は学習モデルを使うかルールベースで良いか
- オンデバイスでの処理性能要件（リアルタイムFPS等）
- サポートする OS/.NET のバージョン

README を保存しました: [desktop/README.md](desktop/README.md#L1)

既存コード解析と修正が必要な箇所
 - `CameraDevice.cs`: 現状は C# 側で直接カメラを開いてフレームを取得している。要変更点:
	- Python 側でキャプチャする設計に合わせ、このクラスは廃止するか、Python から送られるフレームを受け取って WPF 用に変換するラッパーに差し替える。
	- 依存する `OpenCvSharp` の扱い（ローカルキャプチャを残すか削除するか）を決める。
 - `AudioDevice.cs`: 現状は NAudio を用いて C# 側でマイクを取り扱う。要変更点:
	- Python 側で音声キャプチャを行うため、ローカル録音/解析を行う実装は削除またはオプトイン化し、代わりに音量表示程度の軽量モックラッパーを用意する。
 - `MainWindow.xaml.cs`: `CameraDevice` と `AudioDevice` を直接利用している。要変更点:
	- 起動時に Python の `GET /api/devices` を叩いてデバイス一覧を表示する UI を追加する。
	- ユーザー選択を `POST /api/start_capture` へ送信し、WebSocket (`/ws/video`, `/ws/audio`) で受信したデータをプレビュー/表示するように変更する。
 - `App.xaml.cs`: DI コンテナで Python サービス用の `HttpClient` と、`IDeviceService` / `IPythonService` を登録する必要がある（現在はバックエンド向け HttpClient のみ登録されている）。
 - Services 層: `Services/Http/baseService.cs` と既存の `IAuthService` 等は残すが、Python 用の `PythonInteropService`（デバイス一覧取得・開始・停止・WebSocket 管理）を追加する。
 - 認証関連 (`Usecases/authUsecase.cs`, `Services/Interfaces/authService.cs` 等): 既に実装済みだが、UI のログイン状態と Python サービス（ローカル）の関係を明確にする。ローカル Python サービスは通常認証不要だが、将来的に外部と連携する場合はアクセストークン伝搬の検討が必要。

優先度の高い修正（短期）
 - `MainWindow.xaml` にデバイス選択 UI を追加する。
 - `App.xaml.cs` に Python 用 HttpClient 登録を追加する（`BaseAddress` を `http://127.0.0.1:8000` に設定）。
 - `Services/Interfaces` に `IDeviceService` インターフェースを追加し、`PythonDeviceService` 実装を用意する。

詳細実装計画（ステップ分解）
1) Python サービス雛形（1-2日）
	- `python_service/requirements.txt` と仮実装ファイルを作成 (`api/server.py`, `processing/camera.py`, `processing/audio.py`, `processing/face_fatigue.py`)。
	- 実装内容: `GET /api/devices`, `POST /api/start_capture`, `POST /api/stop_capture`, `POST /api/image`, WebSocket `/ws/video`, `/ws/audio`。
	- ローカル動作確認用にダミーのフレーム/音声を返すモードを用意する。

2) C# 側インフラ変更（1-2日）
	- `Services/Interfaces` に `IDeviceService` を追加（`GetDevicesAsync()`, `StartCaptureAsync(deviceId, mode)`, `StopCaptureAsync()`）
	- `Services/Http` に `PythonDeviceService` 実装を追加。`HttpClient` を注入して `GET /api/devices` などを呼ぶ。
	- `App.xaml.cs` に Python 用 `HttpClient` 登録。

3) C# UI 変更（1-3日）
	- `MainWindow.xaml` にデバイス一覧ドロップダウンと「接続」ボタンを追加。
	- `MainWindow.xaml.cs` の初期化で `GetDevicesAsync()` を呼び、選択/接続操作を実装。
	- WebSocket で受信したビデオフレームを `Image.Source` に渡すラッパー（`VideoStreamClient`）を実装。
	- マイクは同様に音量表示や波形表示用に WebSocket 受信を行う。

4) キャプチャ/解析パイプライン（1-3日）
	- Python 側で選択デバイスからフレームを取得し、OpenCV で顔検出→疲労推定のパスを用意。
	- 解析結果（スコア、顔矩形など）を WebSocket / HTTP のいずれかで C# に通知する。
	- C# は受信したスコアを UI に反映。

5) テストと CI（1-2日）
	- Python モジュールにユニットテストを追加（顔検出、特徴量抽出、音声特徴抽出）。
	- C# 側はモック HTTP サーバを用いた統合テストを用意。

6) 安全性・運用（追加検討）
	- ローカルのみで完結する設計を徹底（PII 保護）。
	- リアルタイム性改善が必要なら gRPC への移行を検討。

見積り（ラフ）
- 最低限のプロトタイプ（Python サービス雛形 + C# デバイス選択UI + プレビュー）: 3-7 日
- 実用的な疲労推定アルゴリズム実装（ルールベース）: 3-5 日
- 学習モデルの訓練と精度改善: 1-4 週間（データ次第）

次の推奨アクション
- まずは Python のサービス雛形を作成して `GET /api/devices` と `POST /api/start_capture` を動かせるようにします。C# 側はモックレスポンスで UI を作りながら並行実装します。

