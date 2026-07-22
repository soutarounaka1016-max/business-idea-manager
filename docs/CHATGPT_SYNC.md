# ChatGPT同期仕様

更新日: 2026-07-22

## 目的

ChatGPTで行った事業相談を、事業アイデア管理アプリのアイデア・課題・仮説・次の行動・メモへ安全に反映する。

会話データは既定ではブラウザ内で処理し、外部APIへ送信しない。登録前に抽出結果を確認できる。

## 利用できる取り込み方法

### 1. 会話の貼り付け

ChatGPTの会話をコピーして「ChatGPT同期 > 会話を貼る」へ貼り付ける。

アプリが端末内のルールで次の分類を行う。

- idea: 新しい事業アイデア
- problem: 解決したい課題
- hypothesis: 検証すべき仮説
- task: 次に行う具体的な行動
- note: 残しておくメモ

### 2. ChatGPTデータエクスポート

ChatGPTのデータエクスポートに含まれる `conversations.json` を読み込み、対象の会話を選択する。

複数の会話が含まれていても、アプリ内で一つずつ選んで確認できる。

### 3. chat-sync/v1 JSON

ChatGPTへアプリ内の「連携プロンプト」を貼り、次の形式で出力されたJSONを同期画面へ貼り付ける。

```json
{
  "version": "chat-sync/v1",
  "syncId": "conversation-unique-id",
  "conversation": {
    "title": "会話タイトル",
    "summary": "会話の要約"
  },
  "items": [
    {
      "kind": "idea",
      "text": "塾向け受付AI",
      "industry": "教育",
      "targetCustomer": "個人塾"
    },
    {
      "kind": "task",
      "text": "塾3校へ聞き取りする",
      "targetIdeaName": "塾向け受付AI",
      "dueDate": "2026-07-22"
    }
  ]
}
```

`syncId` は二重登録防止に使用する。同じIDは再反映されない。

### 4. 同期URL

静的なGitHub Pagesでも使えるよう、URLクエリから同期内容を受け取れる。

```text
https://soutarounaka1016-max.github.io/business-idea-manager/?sync=1&syncId=sample-1&title=塾AI&idea=塾向け受付AI&task=塾へ聞き取りする
```

利用できる複数値パラメータ:

- `idea`
- `problem`
- `hypothesis`
- `task`
- `note`

URLを開いても即時登録はせず、必ず確認画面を表示する。

### 5. 同一オリジン postMessage

将来のブラウザ拡張や同一サイト内ツールから、次の形式で同期画面を開ける。

```js
window.postMessage({ payload: syncPayload }, window.location.origin);
```

安全のため、別オリジンからのメッセージは受け付けない。

## データ保護

- 保存先はブラウザの `localStorage`
- 外部AI APIへ会話を自動送信しない
- 反映前に項目の選択、分類、文章、反映先を編集可能
- `syncId` により二重登録を防止
- 既存のschemaVersion 1データは自動でversion 2へ移行
- JSONバックアップには会話履歴も含む

## 現在の制約

ChatGPTの個人アカウントの非公開会話履歴を、GitHub Pages上のアプリが権限なしで常時監視することはできない。

完全自動同期には、認証付きのリモートMCPサーバーまたはサーバー側APIが必要になる。APIキー、外部ホスティング、費用、会話データの外部送信が関係するため、現版では導入していない。

現版のフェーズ3は、秘密鍵と外部サーバーを使わずに実現できる「同期JSON・同期URL・同一オリジン連携」の安全な同期基盤である。
