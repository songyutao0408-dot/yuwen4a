/* 所有标了 needsCheck 的数据，家长页都要能列出来。 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const plain = (x) => JSON.parse(JSON.stringify(x)); // vm 沙箱里的数组和这里不是同一个原型
const { load, ROOT } = require('./load');

const Y = load();

function dataFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? dataFiles(p) : p.endsWith('.js') ? [p] : [];
  });
}

test('家长页的待核对清单 = 数据文件里所有 needsCheck: true 的条目', () => {
  const srcCount = dataFiles(path.join(ROOT, 'data'))
    .map((f) => fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, ''))
    .reduce((n, s) => n + (s.match(/needsCheck:\s*true/g) || []).length, 0);
  const listed = Y.content.collectNeedsCheck();
  assert.ok(srcCount > 0, '至少应有自编的古诗大意待核对');
  assert.strictEqual(listed.length, srcCount);
  listed.forEach((it) => assert.ok(it.label, '每条都要有可读的名称：' + it.path));
});

test('收集器能找到嵌套很深的条目，也不会重复计数', () => {
  const fake = { a: [{ id: 'x', needsCheck: true, title: 'X' }, { b: { c: { needsCheck: true, word: '堙' } } }], d: { needsCheck: false } };
  fake.loop = fake.a; // 同一对象被引用两次
  const r = Y.content.collectNeedsCheck(fake);
  assert.deepStrictEqual(plain(r.map((x) => x.label).sort()), ['X', '堙']);
});
