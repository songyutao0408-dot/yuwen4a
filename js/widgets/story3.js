/* 题型：起因、经过、结果 → 连成主要内容
 * 第一步：把故事片段拖进三栏；第二步：选出把三部分连起来的主要内容。 */
(function (Y) {
  'use strict';
  var h = Y.h, U = Y.util, G = Y.grade;

  Y.qtypes.story3 = function (q, ctx) {
    var place = q.answer.place;
    var frags = U.shuffle(Object.keys(place));
    var locked = false, step = 1, placedOk = false;
    var nextBtn;
    var cols = Y.columns(frags, q.data.columns, { onChange: function () { nextBtn.disabled = locked || !cols.allPlaced(); } });
    nextBtn = h('button.btn.primary.check-btn', { type: 'button', disabled: true }, '下一步：连成主要内容');

    var step1 = h('div.story-step', h('div.step-label', h('b', '第一步'), ' 分一分'), cols.el, nextBtn);
    var recap = h('div.story-recap');
    var optWrap = h('div.opts');
    var step2 = h('div.story-step.hidden',
      h('div.step-label', h('b', '第二步'), ' 把三部分连起来，哪一句是主要内容？'), recap, optWrap);

    nextBtn.addEventListener('click', function () {
      if (locked) return;
      placedOk = G.columns({ answer: place }, cols.placement());
      if (!placedOk) { ctx.submit(false); return; }
      cols.mark(function () { return 'ok'; });
      cols.lock();
      goStep2();
    });

    var optBtns = U.shuffle(q.data.summaries).map(function (s) {
      var b = h('button.opt', { type: 'button' }, s);
      b.addEventListener('click', function () {
        if (locked || b.disabled || step !== 2) return;
        var ok = s === q.answer.summary;
        b.classList.add(ok ? 'ok' : 'bad');
        ctx.submit(ok);
      });
      optWrap.appendChild(b);
      return b;
    });

    function drawRecap() {
      recap.innerHTML = '';
      q.data.columns.forEach(function (c) {
        var items = Object.keys(place).filter(function (k) { return place[k] === c; });
        recap.appendChild(h('div.recap-row', h('span.recap-col', c), h('span.recap-text', items.join(''))));
      });
    }
    function goStep2() {
      step = 2;
      drawRecap();
      nextBtn.classList.add('hidden');
      step2.classList.remove('hidden');
      setTimeout(function () { step2.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, 30);
    }

    return {
      el: h('div.story3-q', step1, step2),
      lock: function () { locked = true; nextBtn.disabled = true; cols.lock(); },
      retry: function () {
        locked = false;
        if (step === 1) {
          // 只退回放错的片段
          var p = cols.placement();
          frags.forEach(function (t) { if (p[t] !== place[t]) cols.place(t, null); });
          cols.unlock();
          nextBtn.disabled = !cols.allPlaced();
        } else {
          optBtns.forEach(function (b) { if (b.classList.contains('bad')) { b.disabled = true; b.classList.add('dim'); } });
        }
      },
      reveal: function () {
        frags.forEach(function (t) { cols.place(t, place[t]); });
        cols.mark(function () { return 'ok'; });
        if (step === 1) goStep2();
        optBtns.forEach(function (b) { if (b.textContent === q.answer.summary) b.classList.add('ok', 'reveal'); });
      }
    };
  };
})(window.YuwenIsland);
