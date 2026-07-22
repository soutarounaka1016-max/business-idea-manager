# PROJECT STATUS

更新日: 2026-07-22

## 状態

ChatGPT会話同期 フェーズ1〜3 実装完了。自動テストと公開確認中。

公開URL: https://soutarounaka1016-max.github.io/business-idea-manager/

## 実装済み

- 会話の貼り付け取り込み
- ChatGPT `conversations.json` 読み込み
- 会話一覧から対象会話を選択
- アイデア、課題、仮説、タスク、メモの自動分類
- 自動タグ付け
- 反映先アイデアの候補選択
- 登録前の確認、編集、除外
- 会話履歴と関連アイデアの保存
- `chat-sync/v1` JSON
- 同期URL
- 同一オリジン `postMessage`
- `syncId` 二重登録防止
- 旧schemaVersion 1からversion 2への自動移行
- バックアップへの会話履歴追加
- iPad、スマートフォン向け同期画面

## 安全設計

- 会話解析は既定で端末内
- 外部AI APIへ自動送信しない
- URL同期でも即時登録せず確認画面を表示
- 別オリジンのpostMessageは拒否
- APIキーをフロントエンドへ保存しない

## 自動確認対象

- 会話分類の単体テスト
- ChatGPTエクスポート解析テスト
- 同期JSON反映テスト
- 二重同期防止テスト
- schemaVersion移行テスト
- React画面テスト
- Playwright主要操作テスト
- 本番ビルドとGitHub Pages公開

## 残る制約

- ChatGPTの非公開会話履歴を自動監視する機能はない
- 完全自動同期には認証付きリモートMCP/APIサーバーが必要
- 外部サーバー、APIキー、費用、会話データ送信の承認がないため未導入
- 実機iPad Safariでの最終確認は利用者側で必要
