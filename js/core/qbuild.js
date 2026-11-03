/* 题目构造小工具：让数据文件写起来短一点。纯函数，不碰 DOM。
 *
 *   var B = Y.qb({ unit: 1, island: 'u1' });
 *   B.single('u1-gc-1', '观潮', 'lesson-content', '题干', ['甲', '乙'], '甲', '提示', '讲解', { d: 2 });
 *
 * 最后一个参数 opt 可选：{ d 难度(默认 1), source(默认 'textbook'), needsCheck, checkNote, quote, data }
 * 生成的题目结构和手写题完全一样：{ id, unit, island, lesson, skill, type, difficulty, prompt, data, answer, hint, explanation, source } */
(function (Y) {
  'use strict';

  Y.qb = function (base) {
    function make(type, id, lesson, skill, prompt, data, answer, hint, explanation, opt) {
      opt = opt || {};
      var q = {
        id: id, unit: base.unit, island: base.island, lesson: lesson || '',
        skill: skill, type: type, difficulty: opt.d || 1,
        prompt: prompt, data: data || {}, answer: answer,
        hint: hint || '', explanation: explanation || '',
        source: opt.source || 'textbook'
      };
      if (opt.quote) q.data.quote = opt.quote;
      if (opt.acceptable) q.acceptable = opt.acceptable;
      if (opt.needsCheck) { q.needsCheck = true; if (opt.checkNote) q.checkNote = opt.checkNote; }
      return q;
    }
    return {
      single: function (id, lesson, skill, prompt, options, answer, hint, expl, opt) {
        return make('single', id, lesson, skill, prompt, { options: options }, answer, hint, expl, opt);
      },
      multi: function (id, lesson, skill, prompt, options, answer, hint, expl, opt) {
        return make('multi', id, lesson, skill, prompt, { options: options }, answer, hint, expl, opt);
      },
      judge: function (id, lesson, skill, prompt, answer, expl, opt) {
        return make('judge', id, lesson, skill, prompt, {}, answer, '', expl, opt);
      },
      blank: function (id, lesson, skill, prompt, template, tiles, answer, hint, expl, opt) {
        return make('blank', id, lesson, skill, prompt, { template: template, tiles: tiles }, answer, hint, expl, opt);
      },
      order: function (id, lesson, skill, prompt, answer, hint, expl, opt) {
        return make('order', id, lesson, skill, prompt, {}, answer, hint, expl, opt);
      },
      match: function (id, lesson, skill, prompt, titles, pairs, hint, expl, opt) {
        var d = { leftTitle: titles[0], rightTitle: titles[1] };
        if (opt && opt.extra) d.extra = opt.extra;
        return make('match', id, lesson, skill, prompt, d, pairs, hint, expl, opt);
      },
      columns: function (id, lesson, skill, prompt, cols, placement, hint, expl, opt) {
        return make('columns', id, lesson, skill, prompt, { columns: cols }, placement, hint, expl, opt);
      },
      /** 起因 / 经过 / 结果 分栏 + 连成主要内容 */
      story3: function (id, lesson, skill, prompt, fragments, summaries, summary, hint, expl, opt) {
        return make('story3', id, lesson, skill, prompt,
          { columns: ['起因', '经过', '结果'], summaries: summaries },
          { place: fragments, summary: summary }, hint, expl, opt);
      },
      raw: make
    };
  };
})(window.YuwenIsland);
