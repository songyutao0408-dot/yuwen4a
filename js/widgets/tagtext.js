/* 题型：六要素点选（tagtext）
 * 先点上面的要素标签（时间、地点……），再点短文里对应的那一段。一段只能贴一个标签。 */
(function (Y) {
  'use strict';
  var h = Y.h;

  Y.qtypes.tagtext = function (q, ctx) {
    var labels = q.data.labels;
    var assign = {};      // 要素 -> 片段序号
    var active = null, locked = false;

    var chips = labels.map(function (l) {
      var c = h('button.tag-chip', { type: 'button', 'aria-pressed': 'false' }, l);
      c.addEventListener('click', function () {
        if (locked) return;
        active = l; // 点标签总是选中它（自动跳到下一个标签后，孩子再点一下也不会反而取消）
        draw();
      });
      c._l = l;
      return c;
    });
    var segs = q.data.segments.map(function (t, i) {
      var b = h('button.tag-seg', { type: 'button' }, h('span.tag-seg-text', t));
      b.addEventListener('click', function () {
        if (locked) return;
        var cur = labelAt(i);
        if (active) {
          if (cur) delete assign[cur];
          assign[active] = i;
          // 自动跳到下一个还没贴的标签
          var rest = labels.filter(function (l) { return assign[l] == null; });
          active = rest[0] || null;
          Y.sound.play('tap');
        } else if (cur) {
          delete assign[cur];
        }
        draw();
      });
      return b;
    });
    function labelAt(i) { return labels.filter(function (l) { return assign[l] === i; })[0] || null; }

    var go = h('button.btn.primary.check-btn', { type: 'button' }, '找好了');
    go.addEventListener('click', function () { if (!locked) ctx.submit(Y.grade.tagtext(q, assign)); });

    function draw(marks) {
      chips.forEach(function (c) {
        c.classList.toggle('on', c._l === active);
        c.classList.toggle('used', assign[c._l] != null);
        c.setAttribute('aria-pressed', String(c._l === active));
      });
      segs.forEach(function (b, i) {
        var l = labelAt(i);
        var old = b.querySelector('.tag-badge'); if (old) old.remove();
        b.classList.toggle('tagged', !!l);
        b.classList.remove('ok', 'bad');
        if (l) {
          b.insertBefore(h('span.tag-badge', l), b.firstChild);
          if (marks) b.classList.add(q.answer[l] === i ? 'ok' : 'bad');
        }
      });
      go.disabled = locked || labels.some(function (l) { return assign[l] == null; });
    }
    active = labels[0];
    draw();

    return {
      el: h('div.tagtext-q',
        h('p.tip', '先点一个标签，再点短文里对应的那一段。点错了可以重新贴。'),
        h('div.tag-chips', chips),
        h('div.tag-passage', segs),
        go),
      lock: function () { locked = true; active = null; draw(); go.disabled = true; },
      retry: function () {
        locked = false;
        labels.forEach(function (l) { if (assign[l] !== q.answer[l]) delete assign[l]; });
        active = labels.filter(function (l) { return assign[l] == null; })[0] || null;
        draw(true);
      },
      reveal: function () {
        assign = {};
        labels.forEach(function (l) { assign[l] = q.answer[l]; });
        active = null; draw(true); go.disabled = true;
      }
    };
  };
})(window.YuwenIsland);
