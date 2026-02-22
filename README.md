# プロダクト名
<!-- プロダクト名に置き換えてください -->

![プロダクトイメージ](https://kc3.me/cms/wp-content/uploads/2026/02/444e7120d5cdd74aa75f7a94bf8821a5-scaled.png)

## チーム名
チーム26 — 同級生3卒年

## 背景・課題・解決されること
学生を中心に、夜更かしの原因として「ゲームをやめるタイミングがわからない」ことがよく挙げられます。自分の疲労状態を正確に把握できないため、無意識に深夜までプレイを続けてしまう問題を解決したいと考えました。

カメラやマイクから取得した表情・まばたき頻度、視線、発話の音声特徴などを解析し、ユーザーの疲労度を算出します。疲労度が一定の閾値を超えた場合にアプリから警告を出すことで、無理な夜更かしを抑制します。計測データはチーム内で共有でき、チーム全体の健康管理にも活用できます。

## プロダクト説明
- カメラで瞬きや視線の変化を検出
- マイクで発話時の周波数変動などの音声特徴を解析
- これらの指標から疲労度を算出し、閾値超過で通知を発行
- チーム内で疲労度データを共有・可視化

カメラで瞬きの頻度や目線、マイクで発話時の周波数の揺らぎをそれぞれ測定し、それらに基づき疲労度を計測します。この疲労度が一定の値を超えたら使用者に対して警告を出すようになっています。
また、この計測した疲労度はチームの間で共有できるようになっています。
<!-- 開発したプロダクトの説明を入力してください -->


## 操作説明・デモ動画
[デモ動画はこちら](https://www.youtube.com/watch?v=fbzGp0XJGq8)

## 注力したポイント
### アイデア面

夜更かしの抑制を目的とした、行動に寄与するフィードバック設計

### デザイン面

シンプルで気軽に使えるUI/UXを重視して実装
MUIを用いて簡単にかつ最低限の品質を担保

### その他

 GitHub Projectsによるタスク管理や、GitHub Actionsを用いたCI/CDで開発効率と品質を担保

プロジェクト管理ボード: https://github.com/orgs/kc3hack/projects/20

## 使用技術

### フロントエンド
[![frontend](https://go-skill-icons.vercel.app/api/icons?i=ts,react,vite,npm,mui&theme=light)](https://skillicons.dev)

### バックエンド
[![backend](https://go-skill-icons.vercel.app/api/icons?i=go,postgres&theme=light)](https://skillicons.dev)

### デスクトップアプリ
[![desktop app](https://go-skill-icons.vercel.app/api/icons?i=cs,net&theme=light)](https://skillicons.dev)


### CI/CD, deploy

[![cd/ci](https://go-skill-icons.vercel.app/api/icons?i=git,github,githubactions,docker,tailscale&theme=light)](https://skillicons.dev)

### ツール
[![tools](https://go-skill-icons.vercel.app/api/icons?i=visualstudio,vscode,postman,windows&theme=light)](https://skillicons.dev)

<!--
Markdown の書き方参考:
https://docs.github.com/ja/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax
-->
