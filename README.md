# 事業アイデア管理アプリ

思いついた事業アイデアを、調査・仮説・検証・改善・事業化候補まで育てるための個人用Webアプリです。iPad Safariの横向きを最優先にし、インストール不要でGitHub Pagesから利用できます。

## 主な機能

- アイデアカードの追加・編集・削除
- 8段階の状態と5段階の優先度
- 7観点の評価と評価理由
- 仮説、確認方法、成功条件、検証結果
- 顧客聞き取り・競合調査の記録
- 期限・完了チェック付き「次にやること」
- ダッシュボード、名前・状態・業界検索
- localStorage保存、JSONバックアップ・復元
- ライト・ダークモード

## 開発

```bash
npm install
npm run dev
npm test
npm run build
npx playwright install chromium webkit
npm run test:e2e
```

## 保存と互換性

保存キーは `businessIdeaManager.v1`、データ形式は `schemaVersion: 1` です。読み込み時に不足項目を補完するため、第1版の保存データを維持したまま項目追加へ対応できます。
