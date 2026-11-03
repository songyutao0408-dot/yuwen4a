/* 错题本、每日一练、徽章、连续天数。 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./load');

const Y = load();
const empty = () => ({ q: {}, stars: {}, best: {}, recite: {}, known: {}, days: [] });

test('每日一练：10 题，固定 2 道古诗文，不含默写自查卡，同一天结果相同', () => {
  const p = empty();
  const a = Y.learn.dailyIds(p, '2026-11-03');
  const b = Y.learn.dailyIds(p, '2026-11-03');
  const c = Y.learn.dailyIds(p, '2026-11-04');
  assert.strictEqual(a.length, 10);
  assert.strictEqual(new Set(a).size, 10, '不能重复');
  assert.deepStrictEqual(a, b);
  assert.notDeepStrictEqual(a, c);
  const qs = a.map(Y.content.byId);
  assert.ok(qs.every((q) => q && q.type !== 'selfcheck'));
  assert.ok(qs.filter((q) => q.island === 'poems').length >= 2, '至少 2 道古诗文');
});

test('每日一练：优先出错题', () => {
  const p = empty();
  ['u3-ps-1', 'u5-mq-1', 's-rh-1', 'mjy-w1'].forEach((id) => { p.q[id] = { r: 0, w: 1, streak: 0, wrong: true, t: 1 }; });
  const ids = Y.learn.dailyIds(p, '2026-11-03');
  ['u3-ps-1', 'u5-mq-1', 's-rh-1', 'mjy-w1'].forEach((id) => assert.ok(ids.includes(id), `错题 ${id} 应该出现`));
  assert.strictEqual(ids.length, 10);
});

test('连续学习天数', () => {
  assert.strictEqual(Y.learn.streak(['2026-11-01', '2026-11-02', '2026-11-03'], '2026-11-03'), 3);
  assert.strictEqual(Y.learn.streak(['2026-11-01', '2026-11-02'], '2026-11-03'), 2, '今天还没学，从昨天往前数');
  assert.strictEqual(Y.learn.streak(['2026-10-30', '2026-11-03'], '2026-11-03'), 1);
  assert.strictEqual(Y.learn.streak([], '2026-11-03'), 0);
  assert.strictEqual(Y.learn.streak(['2026-10-31', '2026-11-01'], '2026-11-01'), 2, '跨月');
});

test('徽章：古诗小达人要 6 首古诗三关全过', () => {
  const p = empty();
  const poems = Y.data.poems.filter((x) => x.kind === 'poem');
  poems.slice(0, 5).forEach((x) => { p.recite[x.id] = [true, true, true]; });
  let b = Y.learn.badges(p, { today: '2026-11-03' }).find((x) => x.id === 'poet');
  assert.ok(!b.got && b.cur === 5 && b.total === 6);
  p.recite[poems[5].id] = [true, true, true];
  b = Y.learn.badges(p, { today: '2026-11-03' }).find((x) => x.id === 'poet');
  assert.ok(b.got);
});

test('徽章：每个徽章都有名称、图标、进度，名单包含需求里的 6 个', () => {
  const list = Y.learn.badges(empty(), { today: '2026-11-03' });
  const names = list.map((b) => b.name);
  ['古诗小达人', '文言文小先生', '提问高手', '批注能手', '小小讲解员', '连续学习 3 天'].forEach((n) => assert.ok(names.includes(n), n));
  list.forEach((b) => { assert.ok(b.icon && b.desc && b.total >= 1); assert.strictEqual(b.got, false); });
  // 每个“答对 N 道”的徽章，题库里都要有足够的题
  const p = empty();
  Y.content.all().forEach((q) => { p.q[q.id] = { r: 1, w: 0, streak: 0, wrong: false }; });
  const full = Y.learn.badges(p, { today: '2026-11-03' });
  ['question', 'annotate', 'guide', 'letter'].forEach((id) => assert.ok(full.find((b) => b.id === id).got, `${id} 的题不够`));
});

test('各岛正确率与高频错题', () => {
  const p = empty();
  p.q['u1-gc-1'] = { r: 3, w: 1, streak: 0, wrong: false };
  p.q['u1-gc-2'] = { r: 0, w: 4, streak: 0, wrong: true };
  const u1 = Y.learn.islandStats(p).find((x) => x.id === 'u1');
  assert.strictEqual(u1.tried, 2);
  assert.strictEqual(u1.acc, 38); // 3 / 8
  const top = Y.learn.topWrong(p, 5);
  assert.strictEqual(top[0].q.id, 'u1-gc-2');
  assert.strictEqual(Y.learn.wrongList(p).length, 1);
});
