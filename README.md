# 3D Progressive Loading Demo - Sponza

React Three Fiberを使用した、大規模3Dモデルのプログレッシブローディングデモです。Sponza Atriumモデル（230MB）を5段階のLODで段階的に読み込みます。

## 特徴

- **プログレッシブローディング**: 低解像度から高解像度へ段階的にモデルを読み込み
- **5段階のLOD**: 3.7MB → 7MB → 17MB → 33MB → 169MB
- **マニフェストファイル対応**: JSONファイルでモデル情報を管理
- **React Three Fiber**: 宣言的な3D描画
- **リアルタイムステータス表示**: ロード状況、頂点数、ファイルサイズ、ロード時間

## セットアップ

```bash
npm install
npm run dev
```

ブラウザで http://localhost:3000 を開きます。

## 使用方法

### デフォルト（Sponzaモデル）
```
http://localhost:3000
```
自動的に `/manifests/sponza.json` を読み込み、Sponzaモデルを表示します。

### カスタムマニフェスト
```
http://localhost:3000/?manifest=/path/to/manifest.json
```

### 特定のモデルID
```
http://localhost:3000/?manifest=/manifests/sponza.json&model=sponza
```

## マニフェストファイル形式

```json
{
  "version": "1.0",
  "models": [
    {
      "id": "sponza",
      "name": "Sponza Atrium",
      "description": "説明",
      "lods": {
        "low": {
          "url": "/sponza/sponza_s_lod4.glb",
          "fileSize": "3.7MB",
          "vertices": "auto"
        },
        // ... 他のLODレベル
      },
      "metadata": {
        "author": "Crytek",
        "license": "CC BY 3.0"
      }
    }
  ],
  "settings": {
    "defaultModel": "sponza",
    "enableProgressive": true,
    "lodDelays": {
      "low": 100,
      "medium": 500,
      "high": 1000,
      "ultra": 1500,
      "extreme": 2000
    }
  }
}
```

## Sponzaモデル詳細

- **Low (LOD4)**: 3.7MB - 最速プレビュー
- **Medium (LOD3)**: 7.0MB - 低解像度
- **High (LOD2)**: 17MB - 中解像度
- **Ultra (LOD1)**: 33MB - 高解像度
- **Extreme (LOD0)**: 169MB - 最高解像度（全詳細）

## 技術スタック

- **React 18**: UIフレームワーク
- **Three.js**: 3Dレンダリングエンジン
- **@react-three/fiber**: Three.jsのReactレンダラー
- **@react-three/drei**: ヘルパーコンポーネント
- **Leva**: GUIコントロール
- **Zustand**: 状態管理
- **Vite**: ビルドツール

## ライセンス

- アプリケーション: MIT
- Sponzaモデル: CC BY 3.0 (Crytek)