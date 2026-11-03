/* 语文岛 · 全局命名空间与小工具
 * 所有脚本都用普通 <script> 顺序加载，挂在 window.YuwenIsland 下。
 * 本文件不碰 DOM，测试里也能直接加载。 */
(function (global) {
  'use strict';

  var Y = global.YuwenIsland = global.YuwenIsland || {};
  Y.version = '1.0.0';
  Y.data = Y.data || {};

  var FULL = { ',': '，', '.': '。', '?': '？', '!': '！', ':': '：', ';': '；', '(': '（', ')': '）' };

  Y.util = {
    /** 洗牌，返回新数组 */
    shuffle: function (arr) {
      var a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    },

    /** 洗牌，并尽量避免和原顺序完全相同（排序题用） */
    shuffleDifferent: function (arr) {
      if (arr.length < 2) return arr.slice();
      for (var k = 0; k < 10; k++) {
        var s = Y.util.shuffle(arr);
        if (s.some(function (v, i) { return v !== arr[i]; })) return s;
      }
      return arr.slice().reverse();
    },

    pick: function (arr) { return arr[Math.floor(Math.random() * arr.length)]; },

    sample: function (arr, n) { return Y.util.shuffle(arr).slice(0, n); },

    /** 自由输入判定：去首尾空格、统一全角标点、去掉中间空格 */
    normalize: function (s) {
      s = String(s == null ? '' : s).trim();
      s = s.replace(/[,.?!:;()]/g, function (c) { return FULL[c]; });
      s = s.replace(/["“”]/g, '"').replace(/['‘’]/g, "'");
      s = s.replace(/\s+/g, '');
      return s;
    },

    /** 只保留汉字（比对断句、遮字用） */
    hanOnly: function (s) { return String(s).replace(/[^一-鿿]/g, ''); },

    isPunct: function (ch) { return /[，。？！：；、“”‘’（）《》…—,.?!:;"']/.test(ch); },

    today: function (d) {
      d = d || new Date();
      var m = d.getMonth() + 1, day = d.getDate();
      return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
    },

    esc: function (s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    },

    /** 把“一二三”式单元号转中文 */
    cnNum: function (n) { return '零一二三四五六七八九十'.charAt(n) || String(n); },

    /** 把 "王戎七岁/尝与诸小儿游" 变成断点位置 [4]（第几个字后面断开） */
    breaks: function (str) {
      var out = [], n = 0;
      for (var i = 0; i < str.length; i++) {
        if (str[i] === '/') out.push(n); else n++;
      }
      return out;
    },

    sameSet: function (a, b) {
      if (a.length !== b.length) return false;
      var x = a.slice().sort(), y = b.slice().sort();
      return x.every(function (v, i) { return v === y[i]; });
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
