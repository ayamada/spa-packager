# @tir.jp/spa-packager

[![npm version](https://img.shields.io/npm/v/@tir.jp/spa-packager.svg)](https://www.npmjs.com/package/@tir.jp/spa-packager)
[![License](https://img.shields.io/npm/l/@tir.jp/spa-packager.svg)](https://www.npmjs.com/package/@tir.jp/spa-packager)

SPAのリリースに際して、ブラウザのキャッシュ問題やリリース作業中のダウンタイムを防ぐためのシンプルなデプロイ補助ツールです。

## 何をするツールか？ (Before / After)

指定したサブディレクトリ（SPAの実体）を**タイムスタンプ（シリアル）名にリネーム**し、ルートの `index.html` をそこへの**リダイレクト用HTMLに書き換える**だけのツールです。

■ Before (ビルド直後)
```text
html/
  ├─ index.html
  └─ _main/         <-- SPAの実体（デフォルト名）
       ├─ index.html
       ├─ app.js
       └─ style.css
```

↓↓↓ `npx spa-packager html _main` を実行 ↓↓↓

■ After (パッケージング後)
```text
html/
  ├─ index.html     <-- 「17123456789/」へのリダイレクト用HTMLに書き換えられる
  └─ 17123456789/   <-- _main が タイムスタンプ(シリアル) にリネームされる
       ├─ index.html
       ├─ app.js
       └─ style.css
```

## なぜこんなことをするのか？（メリット）

1. **強烈なキャッシュ対策:**
   デプロイごとにURLのパス（シリアル）が変わるため、ブラウザの古いキャッシュを確実に回避できます。
2. **安全な遅延ロード（旧バージョンの保護）:**
   サーバーに古いシリアルのディレクトリを残す運用にすれば、アプリ起動中のユーザーが遅延ロード（別チャンクの読み込み等）を行っても、ファイルが見つからずにエラーになるのを防ぐことができます（ダウンタイム・ゼロデプロイ）。

## デプロイのワークフロー

このツール自体がデプロイ（通信）を行うわけではありません。以下のフローで使用します。

1. **ビルド:**
   あらかじめSPAをビルドし、成果物を出力ディレクトリ（例: `html/_main/`）に生成しておきます。
2. **パッケージング (本ツール):**
   ```bash
   # 例: 一時ディレクトリ deploy/html にコピーしてから実行
   npx spa-packager deploy/html _main
   ```
   *   第1引数 (`targetDir`): 変換対象のディレクトリ
   *   第2引数 (`replacedName`): SPA本体が格納されているサブディレクトリ名（省略時は `_main`）
3. **アップロード:**
   出来上がったディレクトリを SCP 等でサーバーにアップロードします。
   ```bash
   scp -Cr deploy/html/* "user@server:/var/www/my-spa/"
   ```

## フロントエンド実装のおまじない（URLの隠蔽）

ディレクトリ名がタイムスタンプになるとURLが不格好になります。
これを防ぐため、SPA本体側の `index.html` （上記の例では `html/_main/index.html`）の `<head>` 等に以下のスニペットを記述することを推奨します。

```html
<script>((p)=>{if(p!=='/'){history.replaceState(0,0,'..');document.write(`<base href="${p}">`)}})(location.pathname)</script>
```

これにより、リダイレクトされた直後にアドレスバーのURLからシリアル部分が隠蔽されます（同時に `<base>` タグによって相対パスでのリソース読み込みも正常に機能します）。
URLが綺麗に保たれるため、コンテンツ内容の更新があった際にも、同じページURLのまま再読み込み等で新しいコンテンツにアクセスできるようになります。

## 開発環境について

開発時のローカルWebサーバーでは、トップレベルの `index.html` （`html/index.html`）の内容を以下のようにしておくことで、リダイレクト専用の処理をサーバー側に書くことなく開発が進められます。

```html
<!DOCTYPE html><html><head><meta http-equiv="Pragma" content="no-cache" /><meta http-equiv="Cache-Control" content="no-cache" /><meta http-equiv="refresh" content="0;URL=_main/" /></head></html>
```

ただし、開発時はシリアルが変化する訳ではないため、ブラウザ側でコンテンツのキャッシングをオフにしておく事を推奨します（DevToolsを開いている間はキャッシュを無効にするオプションを有効にするのがおすすめです）。

## 運用上の注意点

本番環境のサーバーには、デプロイのたびに「古いシリアルのディレクトリ」が残っていく運用になります。
これにより、遅延ロードするようなSPAの利用中にコンテンツ更新があっても、新しいコンテンツの影響を受けずに済みます。
ただし、更新が多くなるにつれディスク容量を消費するため、**十分に古いシリアルを持つディレクトリは定期的に削除してください**。
