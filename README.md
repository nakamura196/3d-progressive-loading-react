# 3D Progressive Loading Demo

React Three Fiberを使用した大規模3Dモデルのプログレッシブローディングデモアプリケーションです。IIIF (International Image Interoperability Framework) マニフェスト形式に対応し、Sponza Atriumモデル（総容量230MB）を5段階のLODで段階的に読み込みます。

## 主な特徴

- **IIIF マニフェスト対応**: 標準化されたIIIF形式でモデル情報を管理
- **自動LOD順序決定**: ファイルサイズに基づいて自動的に最適な読み込み順序を決定
- **プログレッシブローディング**: 低解像度から高解像度へシームレスな段階的読み込み
- **5段階のLOD**: 3.7MB → 7MB → 17MB → 33MB → 169MB
- **リアルタイムステータス表示**: 読み込み進捗、頂点数、ファイルサイズ、ロード時間を動的に表示
- **完了ステータス**: 全てのLODレベル読み込み完了時に視覚的フィードバック

## クイックスタート

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

ブラウザで http://localhost:3000 を開きます。

## 使用方法

### デフォルト使用（Sponzaモデル）
```
http://localhost:3000
```
自動的に `/data/manifests/sponza_iiif.json` を読み込み、Sponzaモデルを表示します。

### カスタムIIIFマニフェスト
```
http://localhost:3000/?manifest=/path/to/iiif_manifest.json
```

### 特定モデルの指定
```
http://localhost:3000/?manifest=/data/manifests/sponza_iiif.json&model=model_id
```

## IIIF マニフェスト形式

本アプリケーションは標準的なIIIF Presentation API 3.0形式のマニフェストに対応しています：

```json
{
  "@context": "http://iiif.io/api/presentation/3/context.json",
  "id": "https://example.com/3d/sponza/manifest.json",
  "type": "Manifest",
  "label": {
    "en": ["Sponza Atrium 3D Model"]
  },
  "items": [
    {
      "id": "https://example.com/3d/sponza/canvas/1",
      "type": "Canvas",
      "items": [
        {
          "id": "https://example.com/3d/sponza/annotation/1",
          "type": "AnnotationPage",
          "items": [
            {
              "id": "https://example.com/3d/sponza/annotation/model",
              "type": "Annotation",
              "body": {
                "type": "Choice",
                "items": [
                  {
                    "id": "/sponza/sponza_s_lod0.glb",
                    "type": "Model",
                    "format": "model/gltf-binary",
                    "label": { "en": ["LOD0 - Extreme Quality"] },
                    "service": [{
                      "id": "https://example.com/3d/sponza/lod0/info",
                      "type": "ModelInfo",
                      "fileSize": 177209344,
                      "vertices": 2142369,
                      "lodLevel": "lod0"
                    }]
                  }
                  // ... 他のLODレベル
                ]
              }
            }
          ]
        }
      ]
    }
  ]
}
```

### 自動LOD順序決定機能

マニフェスト内のモデルは記述順序に関わらず、`fileSize`情報に基づいて自動的に小さいファイルから順番に読み込まれます。これにより、最初のプレビューを素早く表示し、段階的に品質を向上させることができます。

## プロジェクト構成

```
3d/
├── src/
│   ├── components/
│   │   ├── ProgressiveModel.jsx    # プログレッシブローディングロジック
│   │   └── LoadingInfo.jsx         # ステータス表示UI
│   ├── hooks/
│   │   └── useManifest.js          # IIIFマニフェストパーサー
│   ├── store/
│   │   └── loadingStore.js         # Zustand状態管理
│   └── App.jsx                     # メインアプリケーション
├── data/
│   ├── manifests/
│   │   └── sponza_iiif.json       # Sponza用IIIFマニフェスト
│   └── models/
│       └── sponza/                 # Sponzaモデルファイル (GLB形式)
└── scripts/
    └── (Python変換スクリプト)
```

## Sponzaモデル詳細

5段階のLODレベルで構成：

| レベル | ファイルサイズ | 頂点数 | 説明 |
|--------|---------------|---------|------|
| Low (LOD4) | 3.7MB | 67,749 | 最速プレビュー |
| Medium (LOD3) | 7.0MB | 141,318 | 低解像度 |
| High (LOD2) | 17MB | 547,187 | 中解像度 |
| Ultra (LOD1) | 33MB | 1,047,482 | 高解像度 |
| Extreme (LOD0) | 169MB | 2,142,369 | 最高品質（全詳細） |

## 技術スタック

- **React 18**: モダンなUIフレームワーク
- **Three.js**: WebGL 3Dグラフィックスライブラリ
- **@react-three/fiber**: Three.jsの宣言的Reactバインディング
- **@react-three/drei**: React Three Fiber用ユーティリティコンポーネント
- **Leva**: インタラクティブなGUIコントロール
- **Zustand**: 軽量な状態管理ライブラリ
- **Vite**: 高速なビルドツール

## 主な機能

### プログレッシブローディング
- 自動的に最小ファイルから開始
- 各LODレベル間で設定可能な遅延
- シームレスなモデル切り替え

### コントロールパネル
- プログレッシブローディングのオン/オフ
- 手動LODレベル選択
- 自動回転とスピード調整
- ワイヤーフレーム表示切り替え

### ステータス表示
- リアルタイムローディング進捗
- 現在のLODレベル
- 頂点数とファイルサイズ
- ロード時間測定
- 完了ステータスバッジ（オレンジ→緑）

## パフォーマンス最適化

- DRACOジオメトリ圧縮対応
- 効率的なメモリ管理
- React.StrictMode無効化による二重実行防止
- useCallbackによる関数メモ化

## ライセンス

- アプリケーションコード: MIT License
- Sponzaモデル: CC BY 3.0 (Crytek)

## 貢献

プルリクエストは歓迎します。大きな変更の場合は、まずissueを開いて変更内容について議論してください。

## トラブルシューティング

### モデルが表示されない場合
- ブラウザコンソールでエラーを確認
- ネットワークタブでモデルファイルの読み込み状況を確認
- CORSエラーの場合は適切なヘッダー設定を確認

### パフォーマンスが低い場合
- プログレッシブローディングを有効化
- 手動で低いLODレベルを選択
- ブラウザのハードウェアアクセラレーションを確認