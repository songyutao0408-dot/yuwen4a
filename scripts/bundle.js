#!/usr/bin/env node
/* 把网页打包成一个独立的 HTML 文件：dist/yuwen-island.html
 * CSS、所有脚本和数据都内联进去，不需要网络、不需要别的文件，可以直接发到手机上离线打开。
 * 用法：node scripts/bundle.js            （输出到 dist/yuwen-island.html）
 *      node scripts/bundle.js 输出路径.html
 * 没有任何依赖，只用 Node 自带的 fs、path。 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const out = path.resolve(process.argv[2] || path.join(ROOT, 'dist', 'yuwen-island.html'));

function read(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }
// 内联到 <script> 里时，脚本内容里不能出现 </script
function safeScript(js) { return js.replace(/<\/(script)/gi, '<\\/$1'); }
function safeStyle(css) { return css.replace(/<\/(style)/gi, '<\\/$1'); }

let html = read('index.html');

// 1) 样式
html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (m, href) => `<style>\n${safeStyle(read(href))}\n</style>`);
// 2) 离线版用不到的：PWA 清单、图标文件 → 图标改成内联 SVG
const svg = read('icons/icon.svg');
const svgData = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
html = html.replace(/\s*<link rel="manifest"[^>]*>/, '');
html = html.replace(/<link rel="icon"[^>]*>/, `<link rel="icon" href="${svgData}">`);
html = html.replace(/\s*<link rel="apple-touch-icon"[^>]*>/, '');
// 3) 脚本：按原顺序内联；最前面标记这是单文件版（不注册 Service Worker）
let first = true;
html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, src) => {
  const pre = first ? '<script>window.YUWEN_BUNDLE = true;</script>\n  ' : '';
  first = false;
  return `${pre}<script>/* ${src} */\n${safeScript(read(src))}\n</script>`;
});
html = html.replace('<head>', `<head>\n  <!-- 语文岛单文件离线版，由 scripts/bundle.js 生成于 ${new Date().toISOString().slice(0, 10)}，请勿直接修改，改源文件后重新打包 -->`);

const left = html.match(/<(script|link)[^>]+(src|href)="(?!data:)[^"]+"/g);
if (left) { console.error('还有没内联的外部文件：', left); process.exit(1); }

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log(`已生成 ${path.relative(process.cwd(), out)}（${(Buffer.byteLength(html) / 1024).toFixed(0)} KB）`);
