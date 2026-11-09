// MapLibre GL JS 6 は地図の描画処理を別ファイルの worker で動かす。
// Next.js の bundle に入れると worker の場所が分からなくなるので、
// ビルド・開発サーバの起動前に public/ へ写し、MapView.jsx の setWorkerUrl で指す。
import { copyFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const src = join(dirname(require.resolve('maplibre-gl/package.json')), 'dist', 'maplibre-gl-worker.mjs');
const dest = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'maplibre-gl-worker.mjs');
copyFileSync(src, dest);
console.log(`copied ${src} -> ${dest}`);
