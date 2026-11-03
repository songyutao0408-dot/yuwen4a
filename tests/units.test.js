/* 单元岛：知识卡要点逐字出自知识清单；每个单元题库 ≥ 40 题；特色互动的题目都存在。 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { load, read } = require('./load');

const Y = load();
// 去掉 Markdown 加粗符号再比对
const md = read('knowledge-yuwen-4a.md').replace(/\*\*/g, '');
const DONE = [1, 2, 3, 4]; // 已完成的单元，后续阶段往里加

for (const n of DONE) {
  const u = Y.content.unit(n);

  test(`第${n}单元：有知识卡、语文要素和特色互动`, () => {
    assert.ok(u, `缺少 data/units/u${n}.js`);
    assert.ok(u.cards.length >= 4, '知识卡太少');
    assert.ok(u.element && u.element.text);
    assert.ok(u.featured && u.featured.length >= 1);
  });

  test(`第${n}单元：标为教材内容的知识卡要点，都逐字出自知识清单`, () => {
    assert.ok(md.includes(u.element.text), `语文要素不在清单里：${u.element.text}`);
    for (const c of u.cards) {
      assert.strictEqual(c.source, 'textbook', `${c.id} 的 source 应为 textbook（自编内容放进 tips）`);
      for (const pt of c.points) assert.ok(md.includes(pt), `${c.id} 找不到：${pt}`);
      (c.poems || []).forEach((id) => assert.ok(Y.content.poem(id), `${c.id} 引用了不存在的诗文 ${id}`));
    }
  });

  test(`第${n}单元：题库不少于 40 题（含本单元古诗文）`, () => {
    const pool = Y.content.unitPool(n);
    assert.ok(pool.length >= 40, `只有 ${pool.length} 题`);
    assert.ok(Y.data.banks['u' + n].length >= 20, '单元自己的题目太少');
  });

  test(`第${n}单元：题目的 unit、island 正确，id 以 u${n}- 开头`, () => {
    for (const q of Y.data.banks['u' + n]) {
      assert.strictEqual(q.unit, n, q.id);
      assert.strictEqual(q.island, 'u' + n, q.id);
      assert.ok(q.id.startsWith('u' + n + '-'), q.id);
    }
  });

  test(`第${n}单元：特色互动引用的题目都存在`, () => {
    for (const f of u.featured) {
      assert.ok(f.ids.length, f.label);
      f.ids.forEach((id) => assert.ok(Y.content.byId(id), `${f.label} 引用了不存在的题目 ${id}`));
    }
  });
}

test('原创练习材料都标了 source: original（题干里写了“练习”的题）', () => {
  for (const q of Y.content.all().filter((x) => /练习句|练习题|练习用/.test(x.prompt))) {
    assert.strictEqual(q.source, 'original', `${q.id} 题干说是练习材料，source 应为 original`);
  }
});

test('《繁星》三次看星表：补录完整前不生成配对题，补录后自动生成', () => {
  const card = Y.content.unit(1).cards.find((c) => c.table);
  assert.ok(!Y.content.byId(card.id + '-table-time'), '时间词还没补录，不应生成题目');
  const Y2 = load();
  const t2 = Y2.content.unit(1).cards.find((c) => c.table).table;
  ['从前', '三年前', '如今'].forEach((v, i) => { t2[i].time = v; });
  Y2.content.reset();
  const q = Y2.content.byId(card.id + '-table-time');
  assert.ok(q && q.type === 'match' && q.answer.length === 3);
});
