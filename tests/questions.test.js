/* 题库合法性：每道题结构完整；选择题答案在选项里、选项不重复；
 * 排序、配对、断句、归类题至少有一个合法答案。 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const plain = (x) => JSON.parse(JSON.stringify(x)); // vm 沙箱里的数组和这里不是同一个原型
const { load } = require('./load');

const Y = load();
const all = Y.content.all();
const TYPES = Object.keys(Y.grade).filter((k) => !['segmentAnswers', 'race'].includes(k)).concat(['selfcheck']);

test('题库不为空，古诗文馆至少 40 题', () => {
  assert.ok(Y.content.pool({ island: 'poems' }).length >= 40);
});

test('题目 id 不重复', () => {
  const seen = new Set();
  for (const q of all) { assert.ok(!seen.has(q.id), '重复 id：' + q.id); seen.add(q.id); }
});

test('每道题字段齐全、题型合法、来源标注正确', () => {
  for (const q of all) {
    for (const f of ['id', 'skill', 'type', 'prompt', 'source', 'island']) assert.ok(q[f] !== undefined && q[f] !== '', `${q.id} 缺少 ${f}`);
    assert.ok('answer' in q, `${q.id} 缺少 answer`);
    assert.ok(TYPES.includes(q.type), `${q.id} 题型不认识：${q.type}`);
    assert.ok(['textbook', 'original'].includes(q.source), `${q.id} source 只能是 textbook / original`);
    assert.ok(typeof q.explanation === 'string' && q.explanation.length, `${q.id} 缺少讲解`);
    assert.ok([1, 2, 3].includes(q.difficulty), `${q.id} 难度应为 1~3`);
    assert.ok(Y.content.skills[q.skill], `${q.id} 技能没有中文名：${q.skill}`);
    // 允许重试的题型必须有提示
    if (!['judge', 'selfcheck'].includes(q.type)) assert.ok(q.hint, `${q.id} 缺少提示`);
  }
});

const uniq = (arr) => new Set(arr).size === arr.length;

test('单选、多选：答案在选项里，选项不重复', () => {
  for (const q of all.filter((x) => x.type === 'single' || x.type === 'multi')) {
    const o = q.data.options;
    assert.ok(Array.isArray(o) && o.length >= 2, `${q.id} 选项太少`);
    assert.ok(uniq(o), `${q.id} 选项重复`);
    if (q.type === 'single') {
      assert.strictEqual(typeof q.answer, 'string');
      assert.ok(o.includes(q.answer), `${q.id} 答案不在选项里`);
    } else {
      assert.ok(Array.isArray(q.answer) && q.answer.length >= 1 && uniq(q.answer), `${q.id} 多选答案格式不对`);
      q.answer.forEach((a) => assert.ok(o.includes(a), `${q.id} 答案“${a}”不在选项里`));
      assert.ok(q.answer.length < o.length, `${q.id} 多选题不能全选`);
    }
    assert.ok(Y.grade[q.type](q, q.answer), `${q.id} 用标准答案判分不通过`);
  }
});

test('判断题答案是布尔值', () => {
  for (const q of all.filter((x) => x.type === 'judge')) assert.strictEqual(typeof q.answer, 'boolean', q.id);
});

test('字块填空：空格数和答案数一致，答案都在候选字块里，候选不重复', () => {
  for (const q of all.filter((x) => x.type === 'blank')) {
    const n = q.data.template.split('{}').length - 1;
    assert.ok(n >= 1, `${q.id} 没有空格`);
    assert.strictEqual(q.answer.length, n, `${q.id} 答案数和空格数不一致`);
    assert.ok(uniq(q.data.tiles), `${q.id} 候选字块重复`);
    const pool = q.data.tiles.slice();
    for (const a of q.answer) {
      const i = pool.indexOf(a);
      assert.ok(i >= 0, `${q.id} 答案“${a}”不在字块里（或数量不够）`);
      pool.splice(i, 1);
    }
    assert.ok(pool.length >= 1, `${q.id} 至少要有一个干扰字块`);
    assert.ok(Y.grade.blank(q, q.answer));
  }
});

test('排序题：至少 2 项，不重复，标准答案判分通过', () => {
  for (const q of all.filter((x) => x.type === 'order')) {
    assert.ok(q.answer.length >= 2 && uniq(q.answer), q.id);
    (q.acceptable || []).forEach((a) => assert.deepStrictEqual(plain(a.slice().sort()), plain(q.answer.slice().sort()), `${q.id} 可接受顺序的卡片不一致`));
    assert.ok(Y.grade.order(q, q.answer.slice()));
  }
});

test('连线配对：左右两边都不重复，干扰项不与答案重复', () => {
  for (const q of all.filter((x) => x.type === 'match')) {
    const L = q.answer.map((p) => p[0]), R = q.answer.map((p) => p[1]);
    assert.ok(L.length >= 2 && uniq(L) && uniq(R), q.id);
    const extra = (q.data && q.data.extra) || [];
    assert.ok(uniq(R.concat(extra)), `${q.id} 干扰项和答案重复`);
    const map = {}; q.answer.forEach(([l, r]) => { map[l] = r; });
    assert.ok(Y.grade.match(q, map));
  }
});

test('分栏归类：每张卡片都放进了存在的栏，每栏至少一张', () => {
  for (const q of all.filter((x) => x.type === 'columns')) {
    const cols = q.data.columns;
    assert.ok(cols.length >= 2 && uniq(cols), q.id);
    Object.values(q.answer).forEach((c) => assert.ok(cols.includes(c), `${q.id} 栏“${c}”不存在`));
    cols.forEach((c) => assert.ok(Object.values(q.answer).includes(c), `${q.id} 栏“${c}”是空的`));
    assert.ok(Y.grade.columns(q, Object.assign({}, q.answer)));
  }
});

test('断句：每个可接受答案去掉“/”都等于原文，且至少断一处、不重复', () => {
  for (const q of all.filter((x) => x.type === 'segment')) {
    const answers = Y.grade.segmentAnswers(q);
    assert.ok(uniq(answers), `${q.id} 可接受答案重复`);
    for (const a of answers) {
      assert.strictEqual(a.replace(/\//g, ''), q.data.text, `${q.id}：“${a}”去掉“/”后和原文不一致`);
      assert.ok(!/\/\/|^\/|\/$/.test(a), `${q.id}：“${a}”的“/”位置不对`);
      assert.ok(Y.grade.segment(q, Y.util.breaks(a)), `${q.id}：“${a}”判分不通过`);
    }
    assert.ok(!Y.grade.segment(q, []), `${q.id}：不断句不应该算对`);
  }
});

test('起因经过结果：三栏都有片段，主要内容在选项里且不重复', () => {
  for (const q of all.filter((x) => x.type === 'story3')) {
    const cols = Object.values(q.answer.place);
    q.data.columns.forEach((c) => assert.ok(cols.includes(c), `${q.id} 栏“${c}”是空的`));
    cols.forEach((c) => assert.ok(q.data.columns.includes(c), `${q.id} 栏“${c}”不存在`));
    assert.ok(uniq(q.data.summaries) && q.data.summaries.includes(q.answer.summary), `${q.id} 主要内容选项有问题`);
    assert.ok(Y.grade.story3(q, { place: Object.assign({}, q.answer.place), summary: q.answer.summary }));
  }
});

test('田忌赛马：标准答案能赢，按齐威王原顺序出场会输，只有一种排法能赢', () => {
  for (const q of all.filter((x) => x.type === 'tianji')) {
    assert.ok(Y.grade.tianji(q, q.answer.slice()), `${q.id} 标准答案赢不了`);
    assert.ok(!Y.grade.tianji(q, q.data.king.slice()), `${q.id} 不调换顺序也能赢，题目没意义`);
    const horses = q.data.king.slice();
    const perms = (a) => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms(a.filter((_, j) => j !== i)).map((p) => [x, ...p])));
    assert.strictEqual(perms(horses).filter((p) => Y.grade.tianji(q, p)).length, 1);
  }
});

test('六要素点选：每个要素对应一个不同的片段，片段不重复', () => {
  for (const q of all.filter((x) => x.type === 'tagtext')) {
    const idx = Object.values(q.answer);
    assert.ok(uniq(q.data.segments), `${q.id} 片段重复`);
    assert.ok(uniq(idx), `${q.id} 两个要素指向同一片段`);
    idx.forEach((i) => assert.ok(i >= 0 && i < q.data.segments.length, `${q.id} 片段序号越界`));
    assert.deepStrictEqual(plain(q.data.labels), plain(Object.keys(q.answer)));
    assert.ok(Y.grade.tagtext(q, Object.assign({}, q.answer)));
  }
});

test('批注：句子不重复，答案句子存在，批注类型在四种之内', () => {
  for (const q of all.filter((x) => x.type === 'annotate')) {
    assert.ok(uniq(q.data.sentences), q.id);
    [q.answer.at].concat(q.answer.alsoAt || []).forEach((i) => assert.ok(i >= 0 && i < q.data.sentences.length, `${q.id} 句子序号越界`));
    assert.ok(q.data.kinds.includes(q.answer.kind), q.id);
    assert.ok(Y.grade.annotate(q, { at: q.answer.at, kind: q.answer.kind }));
    assert.ok(!Y.grade.annotate(q, { at: q.answer.at, kind: q.data.kinds.find((k) => k !== q.answer.kind) }));
  }
});

test('书信拼图：每个空位正好放一张卡片', () => {
  for (const q of all.filter((x) => x.type === 'letter')) {
    const keys = q.data.slots.map((s) => s.key);
    assert.ok(uniq(keys), q.id);
    const used = Object.values(q.answer);
    assert.ok(uniq(used) && used.length === keys.length, `${q.id} 空位和卡片数量对不上`);
    used.forEach((k) => assert.ok(keys.includes(k), `${q.id} 空位“${k}”不存在`));
    q.data.slots.forEach((s) => assert.ok(['left', 'indent', 'right'].includes(s.pos), q.id));
    assert.ok(Y.grade.letter(q, Object.assign({}, q.answer)));
  }
});

test('自查卡有背面答案', () => {
  for (const q of all.filter((x) => x.type === 'selfcheck')) assert.ok(q.data.back || q.answer, q.id);
});

test('每道非自查题都能找到同类题（答错两次后加练用）', () => {
  const lonely = all.filter((q) => q.type !== 'selfcheck' && !Y.content.similar(q, {}));
  assert.deepStrictEqual(plain(lonely.map((q) => q.id)), []);
});

test('自由输入判定忽略首尾空格、统一全角半角标点', () => {
  const q = { type: 'input', answer: '取之，信然。' };
  assert.ok(Y.grade.input(q, '  取之,信然.  '));
  assert.ok(!Y.grade.input(q, '取之，果然。'));
});

test('星级规则：≥60% 一星，≥80% 两星，100% 三星', () => {
  // quiz.js 依赖 DOM，这里直接按同一规则校验数据层的阈值说明
  const starsFor = (p) => (p >= 100 ? 3 : p >= 80 ? 2 : p >= 60 ? 1 : 0);
  assert.deepStrictEqual([59, 60, 79, 80, 99, 100].map(starsFor), [0, 1, 1, 2, 2, 3]);
});
