/* 判分：纯函数，不碰 DOM，测试里也会用到。
 * 每种题型的数据格式（q.data / q.answer）：
 *   single   单选  data.options[]          answer: 正确选项文字
 *   multi    多选  data.options[]          answer: [正确选项...]
 *   judge    判断                          answer: true / false
 *   blank    字块填空 data.template 用 {} 表示空格, data.tiles[] 候选字块   answer: [每个空的答案]
 *   input    自由输入                       answer: 文字, acceptable: [其他可接受写法]
 *   order    排序                          answer: [正确顺序], acceptable: [[其他可接受顺序]]
 *   match    连线配对 data.leftTitle/rightTitle, data.extra[] 右侧干扰项   answer: [[左, 右], ...]
 *   columns  分栏归类 data.columns[]        answer: { 卡片: 栏名 }
 *   segment  断句   data.text 无标点原文     answer: "王戎七岁/尝与诸小儿游", acceptable: [...]
 *   selfcheck 自查卡 data.back 背面答案      孩子自己判断对错
 */
(function (Y) {
  'use strict';
  var U = Y.util;

  function eqArr(a, b) {
    return a.length === b.length && a.every(function (v, i) { return v === b[i]; });
  }

  Y.grade = {
    single: function (q, r) { return r === q.answer; },
    multi: function (q, r) { return U.sameSet(r, q.answer); },
    judge: function (q, r) { return r === q.answer; },
    blank: function (q, r) {
      return [q.answer].concat(q.acceptable || []).some(function (a) { return eqArr(r, a); });
    },
    input: function (q, r) {
      var n = U.normalize(r);
      return [q.answer].concat(q.acceptable || []).some(function (a) { return U.normalize(a) === n; });
    },
    order: function (q, r) {
      return [q.answer].concat(q.acceptable || []).some(function (a) { return eqArr(r, a); });
    },
    match: function (q, r) {
      return q.answer.length === Object.keys(r).length &&
        q.answer.every(function (p) { return r[p[0]] === p[1]; });
    },
    columns: function (q, r) {
      var keys = Object.keys(q.answer);
      return keys.every(function (k) { return r[k] === q.answer[k]; });
    },
    segment: function (q, breaks) {
      return Y.grade.segmentAnswers(q).some(function (a) { return U.sameSet(U.breaks(a), breaks); });
    },
    segmentAnswers: function (q) { return [q.answer].concat(q.acceptable || []); }
  };
})(window.YuwenIsland);
