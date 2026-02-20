# Auth: 現状の実装と httpOnly Cookie への移行手順

以下はバックエンドの現在の認証実装の要約と、Refresh Token を `HttpOnly` Cookie に移行してセキュリティを向上させるための具体的手順です。

**現状の実装（重要点）**
- **Access Token**: JWT（HS256）を生成し、`exp` を 15 分に設定。レスポンスの JSON に `access_token`（現在は `response.Signin.AuthResponse.AccessToken`）として含めてクライアントへ返す。実際の検証は `Authorization: Bearer <token>` ヘッダを `RequireBearerAuth` ミドルウェアでチェックし、`service.AuthService.VerifyAccessToken` を使う。
- **Refresh Token**: サーバ側ではハッシュ（SHA256）を DB に保存し、クライアントには「生の」リフレッシュ値（raw）をレスポンス JSON の `refresh_token` フィールドで返している（`/auth/signin` と `/auth/refresh`）。`/auth/refresh` と `/auth/logout` はクライアントが JSON ボディで `refresh_token` を送る設計。
- **エンドポイント**: `POST /auth/signin`（署名時に `refresh_token` を JSON で返す）、`POST /auth/refresh`（ボディの `refresh_token` を受け取り新しい `access_token` を返す）、`POST /auth/logout`（ボディの `refresh_token` を受け取り無効化する）。

**現在のリスク・改善点**
- クライアントに `refresh_token` を JavaScript 経由で渡しているため、XSS により盗まれるリスクがある（localStorage やメモリ保管問わず、JS 経由で扱う値は XSS に弱い）。
- Refresh token を body で送受信する設計は CSRF 自体には直接利用されないが、ブラウザ/クライアント側での保護が不十分だと盗用される。

**目的**
- Refresh Token を `HttpOnly` cookie に移動し、JavaScript から直接読み取れないようにして XSS による盗用のリスクを低減する。
- Access Token は引き続き短命の JWT を `Authorization` ヘッダ（Bearer）で使う方針を保ち、XSS 対策と利便性のバランスを取る。

**提案する設計（概要）**
- サーバは `Set-Cookie` ヘッダで `refresh_token`（生の値）を `HttpOnly; Secure; SameSite=Lax`（または必要に応じて `Strict`）の属性付きでセットする。Cookie の `Path` を `/auth/refresh` や `/` にする。
- クライアントは `fetch`/XHR の際に `credentials: 'include'`（または axios の `withCredentials: true`）を指定してブラウザに Cookie を送信させる。
- `/auth/refresh` と `/auth/logout` はリクエストボディの `refresh_token` を使わず、`HttpOnly` Cookie からサーバ側で取得して処理する。
- Refresh トークンは「回転（rotation）」させる：`/auth/refresh` 呼び出しごとに新しい refresh トークンを発行し、DB のハッシュを更新して古いトークンを無効化する。古いトークンが再使用された場合はセッションを全削除（不正利用検知）するポリシーを導入する。

**具体的な移行手順（バックエンド）**
1. `POST /auth/signin` のレスポンスを変更
   - 既存の JSON で `refresh_token` を返す代わりに、`Set-Cookie` で `refresh_token=<raw>` をセットする。
   - Cookie 属性例: `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=<期限秒>`（期限はビジネス要件に応じて、例：30日）。
   - JSON レスポンスには引き続き `access_token` を含めて良い（SPA がメモリで保持するため）。

2. `POST /auth/refresh` の実装を変更
   - クライアントはボディで `refresh_token` を送らない。サーバ側で Cookie を読み取り（`r.Cookie("refresh_token")`）、ハッシュ照合して検証する。
   - 検証成功時、新しい `access_token` を発行して JSON で返す。さらに refresh token ローテーションを行い、新しい raw refresh を Cookie に `Set-Cookie` で再設定し、DB は新しいハッシュを保存して古いハッシュを無効化する。
   - 失敗（ハッシュ不一致や既に無効化されている等）の場合、`401` を返す。リプレイ検知（古い refresh トークンの再利用）を行う場合は、関連セッションを全削除する。

3. `POST /auth/logout` の実装を変更
   - 受け取る `refresh_token` を廃止し、Cookie から `refresh_token` を読み取って `RefreshStore.RevokeByID`（既存の無効化処理）を実行する。
   - クライアント側に Cookie を確実に消させるために `Set-Cookie: refresh_token=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax` を返す。

4. `service.AuthService` 側の調整
   - `Signin` は既に raw refresh を返す仕組みになっているが、この raw をハンドラ層で Cookie にセットするように移行する（レスポンスボディへは含めない）。
   - `RefreshToken(raw string)` の署名と DB 照合ロジックはそのまま使えるが、ローテーションを実装するために `Refresh` ストアに更新/無効化メソッドを追加する（例：`Rotate(oldHash, newHash)`）。

5. 既存の `RequireBearerAuth`（`Authorization` ヘッダ検証）はそのまま維持
   - Access token を Authorization ヘッダで送る方式は継続し、認可の検証は引き続き JWT 検証を行う。

**フロントエンド側の変更**
- `signin` リクエストのレスポンスで `refresh_token` を受け取らない前提に変更。代わりにサインイン成功時にサーバが Cookie をセットするため、`fetch` の際は `credentials: 'include'` を利用して Cookie を受け取る。
- `refresh` 呼び出し時も `credentials: 'include'` を付けて `/auth/refresh` を呼ぶ（ボディに refresh を含めない）。サーバが新 access トークンを返すと同時に Cookie も更新される。
- `logout` では `POST /auth/logout` を `credentials: 'include'` で呼び、成功時にはブラウザ側でも Cookie を削除する（Set-Cookie により上書きで削除される）。
- Access Token の保管はメモリ（React state / context）を推奨。長期保存（localStorage）を避け、ページリロード後は `refresh` で再取得する戦略にする。

**CORS と Cookie の注意点**
- サーバ側で `Access-Control-Allow-Credentials: true` を有効にし、`Access-Control-Allow-Origin` をワイルドカードにしない（明示的なフロントエンドのオリジンを指定する）。
- クライアントは全ての資格情報を送るリクエストに `credentials: 'include'` を付ける必要がある。

**テストと検証**
- サインイン後、ブラウザの開発者ツールで `Set-Cookie` が `HttpOnly` で設定されるか確認する（HttpOnly は JS で見えないため、Cookie タブで属性を確認）。
- `access_token` を Authorization ヘッダにセットして保護されたエンドポイントにアクセスできることを確認。
- `POST /auth/refresh` を呼んで新しい `access_token` と新しい `refresh_token` Cookie が発行されることを確認。
- ログアウトで Cookie が削除され、DB の refresh レコードが無効化されることを確認。

**追加のセキュリティ強化（推奨）**
- Refresh トークンのローテーションと再利用検知を実装して、もし古いトークンが使われた場合は関連セッションを強制的に無効化する。これにより盗難時の被害を限定できる。
- ブラウザ側 XSS 対策（Content Security Policy、入力サニタイズ、依存ライブラリの定期的な監査）を並行して行う。
- 重要: `SameSite` を `Lax` にすることで一般的な CSRF リスクを低減できるが、要件によっては `Strict` や double-submit CSRF トークンの併用を検討する。

---
何か特定箇所（たとえば `internal/httpserver/auth/postSignin.go`、`internal/service/auth.go` など）のパッチを先に用意しましょうか？実装用のパッチを作る場合は次に移行用の具体的変更をコミットします。
