/* 渐进遮字背诵：
 *   第 1 关：遮住每句最后 1 个字
 *   第 2 关：遮住每句后一半
 *   第 3 关：全部遮住，只留每句首字提示
 * “句”按标点切分；标点从不遮。点按方块可以偷看这个字。 */
(function (Y) {
  'use strict';
  var h = Y.h, U = Y.util;

  /** 把一行切成若干小句：[{chars: '一道残阳铺水中', punct: '，'}] */
  function clauses(line) {
    var out = [], cur = '', pre = '';
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (/[“‘《（]/.test(ch)) {
        // 前引号跟着后面的小句走
        if (cur) { out.push({ pre: pre, chars: cur, punct: '' }); cur = ''; pre = ''; }
        pre += ch;
      } else if (U.isPunct(ch)) {
        if (!cur && !pre && out.length) out[out.length - 1].punct += ch; // 连续标点并到上一句
        else { out.push({ pre: pre, chars: cur, punct: ch }); cur = ''; pre = ''; }
      } else cur += ch;
    }
    if (cur || pre) out.push({ pre: pre, chars: cur, punct: '' });
    return out;
  }
  Y.recitClauses = clauses;

  /** 这一句第 i 个字在第 level 关要不要遮 */
  function masked(level, i, n) {
    if (n <= 1) return level >= 3 ? false : level === 1;
    if (level === 1) return i === n - 1;
    if (level === 2) return i >= n - Math.ceil(n / 2);
    return i > 0;
  }
  Y.maskRule = masked;

  /** 返回 { el, revealAll(), peeks() } */
  Y.maskRecite = function (poem, level) {
    var peeks = 0;
    var boxes = [];
    var wrap = h('div.poem-text.recite' + (poem.kind === 'wenyan' ? '.prose' : ''));
    poem.lines.forEach(function (line) {
      var row = h('div.poem-line');
      clauses(line).forEach(function (c) {
        var n = c.chars.length;
        // 一个小句（连同后面的标点）放在一起，不让标点单独掉到下一行
        var cl = h('span.clause');
        row.appendChild(cl);
        if (c.pre) cl.appendChild(h('span.ch.punct', c.pre));
        for (var i = 0; i < n; i++) {
          if (masked(level, i, n)) {
            var b = h('button.mask', { type: 'button', 'aria-label': '点一下偷看这个字' }, h('span.mask-ch', c.chars[i]));
            b.addEventListener('click', function () {
              if (this.classList.contains('shown')) return;
              this.classList.add('shown'); peeks++;
              Y.sound.play('flip');
            });
            boxes.push(b);
            cl.appendChild(b);
          } else {
            cl.appendChild(h('span.ch', c.chars[i]));
          }
        }
        if (c.punct) cl.appendChild(h('span.ch.punct', c.punct));
      });
      wrap.appendChild(row);
    });
    return {
      el: wrap,
      revealAll: function () { boxes.forEach(function (b) { b.classList.add('shown'); }); },
      hideAll: function () { boxes.forEach(function (b) { b.classList.remove('shown'); }); peeks = 0; },
      peeks: function () { return peeks; },
      count: boxes.length
    };
  };
})(window.YuwenIsland);
