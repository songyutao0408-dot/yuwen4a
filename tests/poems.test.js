/* 古诗文原文必须和 knowledge-yuwen-4a.md 逐字一致（包括标点），作者、朝代也要一致。 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const plain = (x) => JSON.parse(JSON.stringify(x)); // vm 沙箱里的数组和这里不是同一个原型
const { load, read } = require('./load');

const Y = load(['js/widgets/mask-recite.js']);
const md = read('knowledge-yuwen-4a.md').split(/\r?\n/);

/** 在知识清单里找到某篇的标题行，返回 { headLine, text }：text 是标题后第一段 “> ” 引用块拼起来的原文 */
function findInKnowledge(title) {
  const idx = md.findIndex((l) => l.startsWith('**' + title + '**') || l.startsWith('### ' + title));
  if (idx < 0) return null;
  let i = idx + 1;
  while (i < md.length && !md[i].startsWith('>')) {
    if (md[i].startsWith('#') || md[i].startsWith('**')) return null; // 没找到原文就碰到下一篇了
    i++;
  }
  const lines = [];
  while (i < md.length && md[i].startsWith('>')) { lines.push(md[i].replace(/^>\s?/, '').trim()); i++; }
  return { headLine: md[idx], text: lines.join('') };
}

const EXPECTED = ['暮江吟', '题西林壁', '雪梅', '出塞', '凉州词', '夏日绝句', '精卫填海', '王戎不取道旁李'];

test('收录了全部 6 首古诗和 2 篇文言文', () => {
  assert.deepStrictEqual(plain(Y.data.poems.map((p) => p.title).sort()), EXPECTED.slice().sort());
  assert.strictEqual(Y.data.poems.filter((p) => p.kind === 'poem').length, 6);
  assert.strictEqual(Y.data.poems.filter((p) => p.kind === 'wenyan').length, 2);
});

for (const p of Y.data.poems) {
  test(`《${p.title}》原文与知识清单逐字一致`, () => {
    const k = findInKnowledge(p.title);
    assert.ok(k, `知识清单里找不到《${p.title}》的原文`);
    assert.strictEqual(p.lines.join(''), k.text);
  });

  if (p.kind === 'poem') {
    test(`《${p.title}》作者、朝代与知识清单一致`, () => {
      const k = findInKnowledge(p.title);
      assert.ok(k.headLine.includes(`［${p.dynasty}］${p.author}`), `标题行是：${k.headLine}`);
    });
  }

  test(`《${p.title}》字词注释都能在知识清单里找到`, () => {
    const all = md.join('\n');
    for (const n of p.notes) {
      const pattern = n.pinyin ? `${n.word}（${n.pinyin}，${n.meaning}）` : `${n.word}（${n.meaning}）`;
      assert.ok(all.includes(pattern), `找不到注释：${pattern}`);
    }
  });

  test(`《${p.title}》内容要点都出自知识清单`, () => {
    const all = md.join('\n');
    for (const pt of p.points) assert.ok(all.includes(pt.text), `找不到：${pt.text}`);
    if (p.meaning.source === 'textbook') assert.ok(all.includes(p.meaning.text), '译文应与知识清单一致');
    else assert.strictEqual(p.meaning.needsCheck, true, '自编的白话大意必须标 needsCheck');
  });
}

test('填空题补全后，必须是原文里真实存在的句子', () => {
  for (const q of Y.content.all().filter((x) => x.type === 'blank' && x.island === 'poems')) {
    const poem = Y.content.poem(q.poemId);
    let i = 0;
    const filled = q.data.template.replace(/\{\}/g, () => q.answer[i++]);
    assert.ok(poem.lines.join('').includes(filled), `${q.id} 补全后是“${filled}”，原文里没有`);
  }
});

test('断句题去掉“/”后，必须是原文去掉标点的片段', () => {
  for (const q of Y.content.all().filter((x) => x.type === 'segment')) {
    const poem = Y.content.poem(q.poemId);
    const plain = Y.util.hanOnly(poem.lines.join(''));
    assert.ok(plain.includes(q.data.text), `${q.id}：“${q.data.text}”不在原文里`);
  }
});

test('题干中引用的诗句（quote）必须出自原文', () => {
  for (const q of Y.content.all().filter((x) => x.poemId && x.data && x.data.quote)) {
    const poem = Y.content.poem(q.poemId);
    assert.ok(poem.lines.join('').includes(q.data.quote), `${q.id}：“${q.data.quote}”不在原文里`);
  }
});

test('跨篇目的诗句配对题，诗句都出自对应的诗', () => {
  const byTitle = {};
  Y.data.poems.forEach((p) => { byTitle['《' + p.title + '》'] = p; });
  const q = Y.content.byId('px-m1');
  for (const [line, title] of q.answer) {
    assert.ok(byTitle[title].lines.join('').includes(line), `${line} 不在 ${title} 里`);
  }
});

test('遮字背诵：切分小句后能拼回原文，三关遮字规则正确', () => {
  for (const p of Y.data.poems) {
    for (const line of p.lines) {
      const cs = Y.recitClauses(line);
      assert.strictEqual(cs.map((c) => c.pre + c.chars + c.punct).join(''), line, `${p.title}：${line}`);
      for (const c of cs.filter((x) => x.chars.length > 1)) {
        const n = c.chars.length;
        const count = (lv) => [...Array(n).keys()].filter((i) => Y.maskRule(lv, i, n)).length;
        assert.strictEqual(count(1), 1, '第 1 关每句只遮最后 1 个字');
        assert.ok(Y.maskRule(1, n - 1, n));
        assert.strictEqual(count(2), Math.ceil(n / 2), '第 2 关遮一半');
        assert.strictEqual(count(3), n - 1, '第 3 关只留首字');
        assert.ok(!Y.maskRule(3, 0, n));
      }
    }
  }
});
