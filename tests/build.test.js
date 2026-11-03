/* 单文件打包、PWA 文件：打包结果不引用任何外部文件；Service Worker 缓存了页面用到的全部文件。 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { read, ROOT } = require('./load');

test('单文件打包：不引用任何外部脚本、样式、网络资源', () => {
  const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'yw4a-')), 'bundle.html');
  execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'bundle.js'), out]);
  const html = fs.readFileSync(out, 'utf8');
  assert.ok(!/<script[^>]+src=/.test(html), '还有外部脚本');
  assert.ok(!/<link[^>]+rel="stylesheet"/.test(html), '还有外部样式');
  assert.ok(!/https?:\/\//.test(html.replace(/http:\/\/www\.w3\.org\/2000\/svg/g, '')), '不应该出现网络地址');
  assert.ok(html.includes('window.YUWEN_BUNDLE = true'));
  assert.ok(html.includes('Y.data.poems'), '数据要打包进去');
});

test('index.html 引用的文件都存在，且不引用 CDN、网络字体、ES module', () => {
  const html = read('index.html');
  const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
  refs.forEach((r) => {
    assert.ok(!/^https?:|^\/\//.test(r), '不能用外部资源：' + r);
    assert.ok(fs.existsSync(path.join(ROOT, r)), '文件不存在：' + r);
  });
  assert.ok(!/type="module"/.test(html));
  assert.ok(fs.existsSync(path.join(ROOT, '.nojekyll')));
});

test('Service Worker 缓存了 index.html 引用的全部文件，路径都是相对的', () => {
  const sw = read('sw.js');
  const assets = [...sw.matchAll(/^\s+'([^']+)',?$/gm)].map((m) => m[1]);
  const html = read('index.html');
  [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]).forEach((r) => assert.ok(assets.includes(r), 'sw.js 没缓存：' + r));
  assets.forEach((a) => { assert.ok(!a.startsWith('/'), '要用相对路径：' + a); if (a !== './') assert.ok(fs.existsSync(path.join(ROOT, a)), '文件不存在：' + a); });
  const mf = JSON.parse(read('manifest.webmanifest'));
  assert.strictEqual(mf.scope, './');
  mf.icons.forEach((i) => assert.ok(fs.existsSync(path.join(ROOT, i.src)), i.src));
});

test('所有脚本都不依赖 ES module，挂在 window.YuwenIsland 下', () => {
  const html = read('index.html');
  for (const m of html.matchAll(/<script src="([^"]+)"/g)) {
    const js = read(m[1]);
    assert.ok(!/^\s*(import|export)\s/m.test(js), m[1] + ' 用了 import/export');
    assert.ok(js.includes('YuwenIsland'), m[1] + ' 没有挂在 window.YuwenIsland 下');
  }
});
