/* 文言文断句 / 朗读停顿：在字与字之间点一下，插入或去掉“/”。 */
(function (Y) {
  'use strict';
  var h = Y.h;

  /**
   * text: 不带标点的原文
   * 返回 { el, breaks() -> [位置], setBreaks(arr), lock(), unlock(), mark(okSet) }
   */
  Y.segmenter = function (text) {
    var chars = text.split('');
    var gaps = [];
    var locked = false;
    var row = h('div.seg-row');
    chars.forEach(function (ch, i) {
      row.appendChild(h('span.seg-char', ch));
      if (i < chars.length - 1) {
        var g = h('button.seg-gap', { type: 'button', 'aria-label': '在“' + ch + '”后面断开', 'aria-pressed': 'false' }, h('span.seg-slash', '/'));
        g._pos = i + 1;
        g.addEventListener('click', function () {
          if (locked) return;
          var on = !g.classList.contains('on');
          g.classList.toggle('on', on);
          g.setAttribute('aria-pressed', on ? 'true' : 'false');
          Y.sound.play('tap');
        });
        gaps.push(g);
        row.appendChild(g);
      }
    });
    var el = h('div.segment-widget', row);
    return {
      el: el,
      breaks: function () { return gaps.filter(function (g) { return g.classList.contains('on'); }).map(function (g) { return g._pos; }); },
      setBreaks: function (arr) {
        gaps.forEach(function (g) {
          var on = arr.indexOf(g._pos) >= 0;
          g.classList.toggle('on', on);
          g.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
      },
      lock: function () { locked = true; el.classList.add('locked'); },
      unlock: function () { locked = false; el.classList.remove('locked'); gaps.forEach(function (g) { g.classList.remove('ok', 'bad'); }); },
      mark: function (correct) {
        gaps.forEach(function (g) {
          g.classList.remove('ok', 'bad');
          var on = g.classList.contains('on'), should = correct.indexOf(g._pos) >= 0;
          if (on && should) g.classList.add('ok');
          else if (on !== should) g.classList.add('bad');
        });
      }
    };
  };
})(window.YuwenIsland);
