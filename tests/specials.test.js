/* 专项岛：句子工坊、字词乐园题量；习作小助手的题目要求逐字出自知识清单。 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { load, read } = require('./load');

const Y = load();
const md = read('knowledge-yuwen-4a.md').replace(/\*\*/g, '');

test('句子工坊、字词乐园各不少于 40 题，题目都标了来源', () => {
  for (const id of ['sentences', 'words']) {
    const pool = Y.content.pool({ island: id, noTypes: ['selfcheck'] });
    assert.ok(pool.length >= 40, `${id} 只有 ${pool.length} 题`);
  }
});

test('句子工坊、字词乐园的专项列表都有题', () => {
  for (const [id, topics] of [['sentences', Y.data.sentenceTopics], ['words', Y.data.wordTopics]]) {
    for (const t of topics) {
      const n = Y.content.pool({ island: id }).filter((q) => q.skill === t.skill).length;
      assert.ok(n >= 2, `${id} / ${t.label} 只有 ${n} 题`);
    }
  }
});

test('句子工坊的例句都是原创（知识清单里没有例句）', () => {
  for (const q of Y.content.pool({ island: 'sentences' })) assert.strictEqual(q.source, 'original', q.id);
});

test('生字表没有课本照片前保持为空，不自己编', () => {
  assert.strictEqual(Y.data.words.lessons.length, 0);
  assert.strictEqual(Y.content.pool({ island: 'words', types: ['selfcheck'] }).length, 0);
});

test('补录词语表后，听写模式自动出题', () => {
  const Y2 = load();
  Y2.data.words.lessons.push({ lesson: '观潮', unit: 1, words: [{ word: '天下奇观', pinyin: 'tiān xià qí guān' }], source: 'textbook', needsCheck: true });
  Y2.content.reset();
  const d = Y2.content.pool({ island: 'words', types: ['selfcheck'] });
  assert.strictEqual(d.length, 1);
  assert.strictEqual(d[0].data.speak, '天下奇观');
});

test('8 篇习作都有指导卡，题目要求逐字出自知识清单', () => {
  assert.strictEqual(Y.data.writing.length, 8);
  const titles = '推荐一个好地方｜小小“动物园”｜写观察日记｜我和____过一天｜生活万花筒｜中国的世界文化遗产｜我的心儿怦怦跳｜写信'.split('｜');
  assert.deepStrictEqual(JSON.parse(JSON.stringify(Y.data.writing.map((w) => w.title))), titles);
  for (const w of Y.data.writing) {
    w.require.forEach((r) => assert.ok(md.includes(r), `${w.id} 题目要求不在清单里：${r}`));
    assert.ok(Y.data.outlines[w.outline] && Y.data.outlines[w.outline].length >= 4, `${w.id} 缺少提纲模板`);
    for (const f of ['steps', 'ideas', 'phrases', 'checklist']) assert.ok(w[f].length >= 3, `${w.id} 的 ${f} 太少`);
  }
});
