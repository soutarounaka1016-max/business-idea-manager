# Business Idea Manager

事業アイデア、仮説、調査記録、評価、次の行動を一画面で管理する個人用Webアプリです。

公開URL: https://soutarounaka1016-max.github.io/business-idea-manager/

## 主な機能

- 事業アイデアの追加・編集・削除
- 状態、優先度、7項目評価
- 仮説、調査記録、次の行動
- 検索と絞り込み
- 今日の行動と優先度ランキング
- localStorage保存
- JSONバックアップと復元
- ダークモード
- iPad、スマートフォン、デスクトップ対応

## ChatGPT同期

### フェーズ1

- ChatGPT会話の貼り付け
- ChatGPTデータエクスポート `conversations.json` の読み込み
- アイデア、課題、仮説、行動、メモの抽出
- 反映前の確認と編集

### フェーズ2

- 顧客、市場、営業、収益、機能、リスク、検証の自動タグ付け
- 既存アイデアへの反映先候補
- 重複する仮説と行動の登録防止
- 会話履歴と関連アイデアの保存

### フェーズ3

- `chat-sync/v1` 標準同期JSON
- 同期URL
- 同一オリジン `postMessage`
- `syncId` による二重同期防止
- ChatGPT連携プロンプトのコピー

詳細: [docs/CHATGPT_SYNC.md](docs/CHATGPT_SYNC.md)

## 開発

```bash
npm install
npm test
npm run build
npm run test:e2e
```

GitHub Actionsでテスト、ビルド、Playwright確認、GitHub Pages公開を行います。
