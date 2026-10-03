# Bodylog

iOS向け体重記録アプリ。アプリと1ページのLPを同じリポジトリで管理します。

## 開発

```sh
nvm use
npm ci
npm run ios
```

Expo SDK 57 / React Native / Expo Router / SQLite / Victory Native。
入力・グラフ・設定の画面は `src/app/`、データ処理は `src/lib/`。
記録は1日1件。グラフの丸または記録一覧から編集します。

```sh
npm run typecheck
npm run lint
npm test
npm run lp # http://localhost:4173
```

## LP

`web/index.html` に紹介・問い合わせ・プライバシーポリシーをまとめています。
GitHub Pagesでは `web/` だけを公開します。
公開後、`.env.example` を `.env.local` にコピーすると、設定画面からWebのポリシーを開けます。

## リリース前

- 実画面のレビューと実機テスト
- 正式名・アイコン・キーワード・スクリーンショットの確定
- Bundle ID、EASプロジェクト、Apple署名の確認
- 公開LPと問い合わせメールの確認、App Store ConnectへのURL設定
- データ収集なしの申告（実装のSDKと一致させる）
- EASのproductionビルドとApp Store申請

広告・課金・写真はv1.0に含みません。
