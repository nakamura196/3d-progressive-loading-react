# IIIF 3D拡張でLOD（Level of Detail）を実装する - 標準化前の実験的アプローチ

## はじめに

3Dモデルの配信において、ファイルサイズと表示品質のバランスは重要な課題です。高精細な3Dモデルは数百MBに及ぶことも珍しくなく、ネットワーク帯域やデバイス性能によってはユーザー体験を大きく損なう可能性があります。

本記事では、IIIF（International Image Interoperability Framework）の3D拡張を使用して、LOD（Level of Detail）機能を実装する実験的なアプローチを紹介します。

## 背景：IIIF 3Dの現状

### IIIF 3D Technical Specification Group (TSG)

2021年12月、IIIFコミュニティは3D Technical Specification Groupを設立し、3Dコンテンツのための標準仕様策定を開始しました。2024年現在、仕様はまだドラフト段階にあり、2025年の正式リリースを目指して開発が進められています。

### 現在定義されている要素

TSGのドラフト仕様（[temp-draft-4](https://iiif.github.io/3d/temp-draft-4.html)）では、以下の要素が定義されています：

- **Scene**: 3D空間を表現する新しいコンテナタイプ
- **Model**: 3Dモデルリソースのタイプ定義
- **Camera/Light**: 視点と照明の定義
- **Transform**: 3D空間での変換操作

しかし、**LODやプログレッシブローディングについては「Future work」として認識されているものの、具体的な実装方法は未定義**です。

## 実装アプローチ：IIIFのChoiceメカニズムを活用

### 基本コンセプト

IIIF Presentation API 3.0の`Choice`タイプを活用し、複数のLODバリアントを提供する方法を採用しました。これにより、ビューアが状況に応じて適切な品質レベルを選択できます。

```json
{
  "body": {
    "type": "Choice",
    "items": [
      {
        "id": "https://example.com/model_lod0.glb",
        "type": "Model",
        "format": "model/gltf-binary",
        "label": {"en": ["Level LOD0 - Close inspection / Full detail"]},
        "service": [{
          "type": "ModelService",
          "quality": "high",
          "fileSize": 231537254,
          "lodLevel": "lod0"
        }]
      },
      {
        "id": "https://example.com/model_lod1.glb",
        "type": "Model",
        "format": "model/gltf-binary",
        "label": {"en": ["Level LOD1 - Standard viewing"]},
        "service": [{
          "type": "ModelService",
          "quality": "medium",
          "fileSize": 53687091,
          "lodLevel": "lod1"
        }]
      }
    ]
  }
}
```

### LODレベルの定義

実装では5段階のLODレベルを定義しました：

| レベル | ポリゴン削減率 | 用途 | ファイルサイズ例 |
|--------|---------------|------|-----------------|
| LOD0 | 100% (オリジナル) | 近距離詳細表示 | 221MB |
| LOD1 | 50% | 標準表示 | 51MB |
| LOD2 | 25% | 高速読み込み | 27MB |
| LOD3 | 10% | プレビュー/モバイル | 12MB |
| LOD4 | 5% | サムネイル | 7MB |

## 実装コード

### 1. LODモデル生成スクリプト

```python
#!/usr/bin/env python3
import trimesh
import os
from pathlib import Path

def create_lod_levels(input_file, output_dir="lod_models"):
    os.makedirs(output_dir, exist_ok=True)
    mesh = trimesh.load(input_file, force='mesh')
    
    original_faces = len(mesh.faces)
    print(f"Original model: {original_faces} faces")
    
    lod_ratios = {
        "lod0": 1.0,
        "lod1": 0.5,
        "lod2": 0.25,
        "lod3": 0.1,
        "lod4": 0.05,
    }
    
    for lod_name, ratio in lod_ratios.items():
        if ratio == 1.0:
            simplified = mesh
        else:
            target_faces = int(original_faces * ratio)
            simplified = mesh.simplify_quadric_decimation(
                face_count=target_faces
            )
        
        output_file = os.path.join(output_dir, f"model_{lod_name}.glb")
        simplified.export(output_file)
        print(f"{lod_name}: {len(simplified.faces)} faces -> {output_file}")
```

### 2. IIIFマニフェスト生成

マニフェスト生成では、各LODレベルに対して品質情報とメタデータを付与します：

```python
def create_3d_manifest(model_base_path, base_url, lod_files=None):
    manifest = {
        "@context": [
            "http://iiif.io/api/presentation/3/context.json",
            {
                "gltf": "https://www.khronos.org/gltf/",
                "lod": "http://www.w3.org/ns/lod#",
                "quality": "http://iiif.io/api/presentation/3#quality"
            }
        ],
        "id": f"{base_url}/manifest.json",
        "type": "Manifest",
        "label": {"en": ["3D Model with LOD"]},
        "items": []
    }
    
    # LODバリアントをChoiceとして追加
    choices = []
    for lod_name, file_name in lod_files.items():
        quality_map = {
            "lod0": "high",
            "lod1": "medium",
            "lod2": "low",
            "lod3": "thumbnail"
        }
        
        choice_item = {
            "id": f"{base_url}/{file_name}",
            "type": "Model",
            "format": "model/gltf-binary",
            "service": [{
                "type": "ModelService",
                "quality": quality_map.get(lod_name, "default"),
                "lodLevel": lod_name
            }]
        }
        choices.append(choice_item)
    
    # Annotationとして追加
    annotation = {
        "type": "Annotation",
        "motivation": "painting",
        "body": {
            "type": "Choice",
            "items": choices
        }
    }
    
    return manifest
```

### 3. ビューアでの自動LOD切り替え

Three.jsベースのビューアで、カメラ距離に応じた自動LOD切り替えを実装：

```javascript
class IIIF3DViewer {
    constructor(manifestUrl) {
        this.currentLOD = 'lod1';
        this.models = {};
        this.autoLOD = true;
    }
    
    async loadManifest() {
        const response = await fetch(this.manifestUrl);
        this.manifest = await response.json();
        
        // ChoiceからLODモデルを抽出
        const choices = this.manifest.items[0].items[0].items[0].body.items;
        choices.forEach(choice => {
            const service = choice.service[0];
            this.models[service.lodLevel] = {
                url: choice.id,
                quality: service.quality,
                fileSize: service.fileSize
            };
        });
    }
    
    updateLOD() {
        if (!this.autoLOD) return;
        
        const distance = this.camera.position.length();
        let targetLOD;
        
        // 距離に応じたLOD選択
        if (distance < 20) targetLOD = 'lod0';
        else if (distance < 40) targetLOD = 'lod1';
        else if (distance < 60) targetLOD = 'lod2';
        else targetLOD = 'lod3';
        
        if (targetLOD !== this.currentLOD) {
            this.loadLOD(targetLOD);
        }
    }
}
```

## 実装結果

### パフォーマンス改善

5.6M面の3Dモデルで検証した結果：

- **初期読み込み時間**: 221MB → 12MB（LOD3使用時）で**95%削減**
- **メモリ使用量**: 段階的な読み込みにより最大50%削減
- **フレームレート**: モバイルデバイスで15fps → 60fps

### IIIFの利点

1. **標準化された記述**: メタデータ、ライセンス、作者情報を統一形式で管理
2. **相互運用性**: IIIF対応ビューアでの表示が可能
3. **拡張性**: アノテーション、マルチメディア統合が容易

## TSG仕様との対応関係

| 要素 | TSG仕様 | 本実装 |
|------|---------|--------|
| Model type | ✅ 定義済み | ✅ 使用 |
| Annotation (painting) | ✅ 定義済み | ✅ 使用 |
| Scene | ✅ 定義済み | ❌ Canvas使用 |
| LOD/Progressive Loading | 🚧 Future work | 🔴 独自実装 |
| Quality levels | ❌ 未定義 | 🔴 独自定義 |
| File size metadata | ❌ 未定義 | 🔴 独自追加 |

## 今後の展望

### 標準化への期待

IIIF 3D TSGは2025年に最初の正式仕様リリースを予定しています。LODサポートが標準仕様に含まれることで、より広範な相互運用性が実現されることが期待されます。

### 改善の可能性

1. **ストリーミング対応**: glTF-Dracoなどの圧縮形式との統合
2. **適応的品質**: ネットワーク帯域に応じた動的調整
3. **部分読み込み**: 視野内のみの高品質化

## まとめ

IIIF 3D拡張は発展途上ですが、既存のIIIF仕様（特にChoice機構）を活用することで、実用的なLOD実装が可能です。本アプローチは実験的ですが、3Dコンテンツの効率的な配信とユーザー体験の向上に貢献できると考えています。

標準化の進展を注視しながら、コミュニティと共に3Dコンテンツの相互運用性向上に取り組んでいきたいと思います。

## リソース

- [実装コード（GitHub）](https://github.com/yourusername/iiif-3d-lod)
- [IIIF 3D TSG](https://iiif.io/community/groups/3d/tsg/)
- [IIIF 3D Draft Specifications](https://iiif.github.io/3d/)
- [デモサイト](https://example.com/iiif-3d-demo)

## 技術スタック

- Python: trimesh, fast-simplification
- JavaScript: Three.js, IIIF Manifesto
- 3D Format: glTF 2.0 Binary (.glb)

---

*本記事で紹介した実装は実験的なものであり、将来のIIIF 3D仕様とは異なる可能性があります。*