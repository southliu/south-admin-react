import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { addCollection, getIcon } from '@iconify/react';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const prefixes = [
  'ant-design',
  'cil',
  'gg',
  'gridicons',
  'icon-park',
  'icon-park-outline',
  'ion',
  'mdi',
  'uil',
  'la',
  'fluent',
  'majesticons',
  'material-symbols',
];
mkdirSync('public/icons', { recursive: true });
for (const prefix of prefixes) {
  const collection = require(`@iconify-json/${prefix}/icons.json`);
  addCollection(collection);
  writeFileSync(`public/icons/${prefix}.json`, JSON.stringify(collection));
}
const names = new Set([
  'la:tachometer-alt',
  'fluent:box-20-regular',
  'ion:settings-outline',
  'majesticons:article-search-line',
  'material-symbols:link',
]);
for (const entry of readdirSync('src', { recursive: true })) {
  if (!/\.(tsx?|json)$/.test(entry) || entry.replaceAll('\\', '/') === 'assets/icons.json')
    continue;
  const source = readFileSync(`src/${entry}`, 'utf8');
  for (const match of source.matchAll(/['"`]([a-z0-9-]+:[a-z0-9-]+)['"`]/g)) names.add(match[1]);
}
const collections = {};
for (const name of [...names].sort()) {
  const icon = getIcon(name);
  if (!icon) continue;
  const [prefix, key] = name.split(':');
  collections[prefix] ??= { prefix, icons: {} };
  collections[prefix].icons[key] = icon;
}
mkdirSync('src/assets', { recursive: true });
writeFileSync('src/assets/icons.json', JSON.stringify(collections) + '\n');
console.log(
  `Offline icon subset: ${Object.values(collections).reduce((sum, collection) => sum + Object.keys(collection.icons).length, 0)} icons`,
);
