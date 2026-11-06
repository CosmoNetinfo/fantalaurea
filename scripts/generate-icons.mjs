import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = await fs.readFile(path.join(root, 'public/brand/app-icon.svg'), 'utf8');
await fs.mkdir(path.join(root, 'public/icons'), { recursive: true });
for (const size of [32, 180, 192, 512]) {
  const png = new Resvg(source, { fitTo: { mode: 'width', value: size } }).render().asPng();
  await fs.writeFile(path.join(root, `public/icons/icon-${size}.png`), png);
}
// A full-bleed variant whose mark stays within Android's central mask safe area.
const maskable = source.replace('rx="112"', 'rx="0"').replace('<rect x="29" y="29" width="454" height="454" rx="88" fill="none" stroke="#79613a" stroke-width="2"/>', '');
await fs.writeFile(path.join(root, 'public/icons/maskable-512.png'), new Resvg(maskable).render().asPng());
await fs.writeFile(path.join(root, 'public/favicon.svg'), source);
const png = await fs.readFile(path.join(root, 'public/icons/icon-32.png'));
const header = Buffer.alloc(22);
header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4);
header[6] = 32; header[7] = 32;
header.writeUInt16LE(1, 10); header.writeUInt16LE(32, 12);
header.writeUInt32LE(png.length, 14); header.writeUInt32LE(22, 18);
await fs.writeFile(path.join(root, 'public/favicon.ico'), Buffer.concat([header, png]));
console.log('Generated favicon, Apple touch icon and PWA icons from the vector master.');
