# 開発ガイド

人間とCodexが使う開発規約の正本です。READMEは起動手順、AGENTS.mdはこのガイドの参照とExpo固有の注意を扱います。

## 現在の構成

Expo SDK 57 / React Native 0.86 / React 19.2 / TypeScript 6 strict / npm。Node.jsは `.nvmrc` の22系を使います。Expo Routerを維持し、Expoのバージョンに合う公式ドキュメントでAPIと互換性を確認します。

```text
src/app/                   Expo Routerの画面と_layout
src/components/            複数機能で共有するUI・デザイントークン
src/features/weight/       体重機能のモデル、Provider、グラフ
src/services/              SQLiteなど端末・外部サービスとの境界
src/constants/             アプリ名、公開URLなど設定値
assets/                    アイコン・画像・フォント
tests/                     ビジネスロジックのテスト
web/                       1ページのLP
docs/                      開発・運用ガイド
```

機能が必要になるまで空のhooks/utils/typesディレクトリは作りません。機能固有のhook・型は同じfeature内へ、複数機能から利用する場合だけ `src/hooks/`・`src/utils/`・`src/types/` に切り出します。

## ファイルと設計

- 画面名はExpo Routerの規約、Component/ProviderはPascalCase、hookはuseXxx、その他のモジュールはcamelCase。テストは `*.test.ts`。
- 画面は表示と操作の接続、featureはビジネスロジック、servicesは永続化やAPIを担当。共通UIに体重保存処理を入れません。
- UIを分割する理由は再利用や責務の違い。1行ごとにComponentを作ったり、将来のためだけのRepository/DI層を増やしたりしません。
- 状態は画面内ならuseState。共有する体重・設定はWeightProviderのContext。取得の完了後に更新し、保存失敗時は入力を保持します。新たな状態管理ライブラリは必要になるまで追加しません。
- hooksはトップレベルで呼び、依存配列を正しく設定。副作用をレンダー中に実行しません。外部のイベント登録と状態更新を区別します。
- 現在のアプリにAPI通信はありません。追加する場合はservicesで通信し、URL・タイムアウト・エラー・再試行を明示します。体重・写真を外部へ送る仕様は事前に設計とポリシーを更新します。
- SQLiteにはパラメーターをバインドし、日付の一意性をDBでも守ります。表示単位と保存単位を分け、保存はkgです。

## 型・import・エラー

- strictを維持。any、ts-ignore、ts-nocheck、非nullアサーションでエラーを隠しません。型の絞り込みや境界の検証を使います。
- 型だけのimportは `import type`。まず外部モジュール、次に機能・共有モジュールを相対パスで参照。バレルexportや循環importを増やしません。
- ビジネスロジックは純粋な関数にし、日付や外部入力は引数で渡せるようにします。
- 保存・読込の失敗はUIに伝え、入力を失わせません。端末データや認証情報をログに出しません。レビュー依頼など補助機能の失敗は記録を妨げません。
- ESLintの無効化やテストskipでチェックを通しません。ルールとライブラリの相性に問題があれば、原因を調べて設計を修正します。

## テストとカバレッジ

既存のNode.js test runner + tsxを使い、c8でStatements / Branches / Functions / Linesを取得します。純粋な体重・日付・期間・継続日数のロジックを直接テストできるため、現段階でJestとネイティブモック群は追加しません。Componentやhooksの重要な操作を自動化する必要が出たら、SDK対応のjest-expo / React Native Testing Libraryを検討します。

- 数字入力→体重、単位換算、境界値・不正値、日付、欠測日、継続日数を検証します。バグ修正には可能な限り再現テストを追加します。
- Snapshotや内部のstate名など実装の形を守るテストより、利用者が期待する結果を優先します。
- 初期基準は、ビジネスロジックの各ファイルで4指標すべて80%以上。100%達成だけを目的にしません。
- 対象は `.c8rc.json` にある `src/features/**/*.ts` と `src/utils/**/*.ts`。`all`により未読込の新規ロジックも0%として検出します。
- TSXの画面・hooks・SQLiteのネイティブ境界はこの率に含みません。これはアプリ全体の網羅率ではありません。これらはシミュレーター/実機で確認し、保存・再起動・編集・削除・単位切替の結果をPRに書きます。
- CIはテストを1回だけ実行し、HTML/LCOV/JSONのカバレッジ成果物を14日保存します。

## コマンドとフォーマット

```sh
nvm use
npm ci
npm run format        # Prettierで整形
npm run format:check  # 整形違反を検出
npm run lint          # Expo公式ESLint。警告も失敗扱い
npm run typecheck
npm test
npm run test:coverage # テスト＋4指標＋基準チェック
npm run check         # format → lint → typecheck → test:coverage
```

整形はPrettier、バグ検出はExpoのESLint設定。eslint-config-prettierで整形ルールの競合を防ぎます。設定を機能ごとに変えません。

## 機能追加とGit運用

1. Notionのタスクとこのガイド、関連する既存コードを読む。
2. `main`から `feature/PB-94` のように `feature/{NotionタスクID}` を作る。
3. ユーザー操作と受け入れ条件を確認し、既存の責務に沿って実装。
4. 新規ロジック・再現可能なバグにテストを追加。実画面を確認。
5. `npm run format`、`npm run check` を実行。
6. pushしてPRを作成。CI成功を確認してからマージ。mainへ直接pushしません。

不要なリファクタリングを同時に行いません。ライブラリ追加時は、既存の標準機能で解けるか、Expo SDK互換性、ネイティブビルドへの影響を確認し、理由をPRに記載。インストールは `npx expo install` を使い、lockfileを更新します。

CI失敗・未確認の操作を完成と報告しません。署名付きiOSビルドやApp Store審査はこのCIに含めず、リリースタスクで別途確認します。

## GitHubで最後に設定する項目

CIが一度成功した後、[リポジトリ設定](https://github.com/wadashuri/bodylog/settings/rules)でmain用Rulesetを作成します。

1. Settings → Rules → Rulesets → New branch ruleset。対象は `main`、状態はActive。
2. Require a pull request before mergingを有効化。1人開発では必須承認数は0（自分のPRを自分で承認できないため）。
3. Require status checks to passを有効化し、`Quality checks`（CIワークフロー）を必須に追加。マージ前に最新mainへ追従させる設定も有効化。
4. Block force pushesとRestrict deletionsを有効化。日常運用で使うbypassは設定しない。
5. 作成したRulesetを保存し、CI未成功のPRでマージが制限されることを確認。

Branch protectionを使う場合も同じくmain、PR必須、`Quality checks`必須、管理者にも適用、force push/削除禁止を設定します。設定権限・プランにより表示が異なる場合は利用可能な方式を選びます。ここでは手順のみ用意し、GitHubの保護設定自体は変更していません。

参考：[Expo ESLint](https://docs.expo.dev/guides/using-eslint/)、[Prettierとlintの分担](https://prettier.io/docs/integrating-with-linters)、[c8](https://github.com/bcoe/c8)、[CodexのAGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md)。
