/* 题型：批注练习（annotate）
 * 给出一条批注，孩子做两件事：① 点出它应该写在哪一句旁边；② 选出它属于哪种批注。 */
(function (Y) {
  'use strict';
  var h = Y.h;

  Y.qtypes.annotate = function (q, ctx) {
    var at = null, kind = null, locked = false;
    var ats = [q.answer.at].concat(q.answer.alsoAt || []);

    var sents = q.data.sentences.map(function (t, i) {
      var b = h('button.ann-sent', { type: 'button' }, t);
      b.addEventListener('click', function () { if (!locked) { at = at === i ? null : i; draw(); } });
      return b;
    });
    var kinds = q.data.kinds.map(function (k) {
      var b = h('button.tag-chip', { type: 'button', 'aria-pressed': 'false' }, k);
      b.addEventListener('click', function () { if (!locked) { kind = kind === k ? null : k; draw(); } });
      b._k = k;
      return b;
    });
    var noteBox = h('div.ann-note', h('span.ann-note-label', '✏️ 批注'), h('span.ann-note-text', q.data.note));
    var go = h('button.btn.primary.check-btn', { type: 'button' }, '批好了');
    go.addEventListener('click', function () { if (!locked) ctx.submit(Y.grade.annotate(q, { at: at, kind: kind })); });

    function draw() {
      sents.forEach(function (b, i) { b.classList.toggle('sel', i === at); });
      kinds.forEach(function (b) { b.classList.toggle('on', b._k === kind); b.setAttribute('aria-pressed', String(b._k === kind)); });
      go.disabled = locked || at == null || !kind;
    }
    draw();

    return {
      el: h('div.annotate-q',
        noteBox,
        h('p.step-label', h('b', '①'), ' 这条批注应该写在哪一句旁边？点一下那句话。'),
        h('div.ann-passage', sents),
        h('p.step-label', h('b', '②'), ' 它是哪一种批注？'),
        h('div.tag-chips', kinds),
        go),
      lock: function () { locked = true; go.disabled = true; },
      retry: function () {
        locked = false;
        if (ats.indexOf(at) < 0) { sents[at] && sents[at].classList.add('bad'); at = null; }
        if (kind !== q.answer.kind) kind = null;
        draw();
      },
      reveal: function () {
        at = q.answer.at; kind = q.answer.kind; draw();
        sents.forEach(function (b, i) { b.classList.remove('bad'); if (ats.indexOf(i) >= 0) b.classList.add('ok'); });
        kinds.forEach(function (b) { if (b._k === q.answer.kind) b.classList.add('ok'); });
        go.disabled = true;
      }
    };
  };
})(window.YuwenIsland);
