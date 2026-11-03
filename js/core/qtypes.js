/* 通用题型的界面。每个渲染器：
 *   Y.qtypes[type](q, ctx) -> { el, retry(), reveal(), lock() }
 *   孩子作答后调用 ctx.submit(correct, {final?})，由答题引擎决定给提示还是给讲解。 */
(function (Y) {
  'use strict';
  var h = Y.h, U = Y.util, G = Y.grade;

  function checkBtn(label, onclick) {
    var b = h('button.btn.primary.check-btn', { type: 'button', onclick: onclick }, label || '检查答案');
    return b;
  }

  /* ---------- 单选 ---------- */
  function single(q, ctx) {
    var locked = false;
    var opts = U.shuffle(q.data.options);
    var btns = opts.map(function (o) {
      var b = h('button.opt', { type: 'button' }, o);
      b.addEventListener('click', function () {
        if (locked || b.disabled) return;
        btns.forEach(function (x) { x.classList.remove('sel'); });
        b.classList.add('sel');
        var ok = G.single(q, o);
        b.classList.add(ok ? 'ok' : 'bad');
        ctx.submit(ok);
      });
      return b;
    });
    return {
      el: h('div.opts' + (opts.every(function (o) { return o.length <= 6; }) ? '.grid' : ''), btns),
      lock: function () { locked = true; },
      retry: function () {
        locked = false;
        btns.forEach(function (b) { if (b.classList.contains('bad')) { b.disabled = true; b.classList.add('dim'); } b.classList.remove('sel'); });
      },
      reveal: function () {
        btns.forEach(function (b) { if (b.textContent === q.answer) b.classList.add('ok', 'reveal'); });
      }
    };
  }

  /* ---------- 多选 ---------- */
  function multi(q, ctx) {
    var locked = false;
    var opts = U.shuffle(q.data.options);
    var btns = opts.map(function (o) {
      var b = h('button.opt.multi', { type: 'button', 'aria-pressed': 'false' }, h('span.tick', '✓'), h('span', o));
      b._v = o;
      b.addEventListener('click', function () {
        if (locked) return;
        var on = !b.classList.contains('sel');
        b.classList.toggle('sel', on);
        b.setAttribute('aria-pressed', String(on));
        b.classList.remove('bad');
        go.disabled = !btns.some(function (x) { return x.classList.contains('sel'); });
      });
      return b;
    });
    var go = checkBtn('选好了', function () {
      if (locked) return;
      var picked = btns.filter(function (b) { return b.classList.contains('sel'); }).map(function (b) { return b._v; });
      ctx.submit(G.multi(q, picked));
    });
    go.disabled = true;
    return {
      el: h('div', h('p.tip', '可以选多个哦'), h('div.opts', btns), go),
      lock: function () { locked = true; go.disabled = true; },
      retry: function () {
        locked = false; go.disabled = false;
        btns.forEach(function (b) { if (b.classList.contains('sel') && q.answer.indexOf(b._v) < 0) b.classList.add('bad'); });
      },
      reveal: function () {
        btns.forEach(function (b) {
          b.classList.remove('bad', 'sel');
          if (q.answer.indexOf(b._v) >= 0) b.classList.add('ok', 'reveal');
        });
      }
    };
  }

  /* ---------- 判断 ---------- */
  function judge(q, ctx) {
    var locked = false;
    function mk(v, label, icon) {
      var b = h('button.opt.judge', { type: 'button' }, h('span.judge-ico', icon), label);
      b.addEventListener('click', function () {
        if (locked || b.disabled) return;
        var ok = G.judge(q, v);
        b.classList.add(ok ? 'ok' : 'bad');
        ctx.submit(ok, { final: true });
      });
      b._v = v;
      return b;
    }
    var yes = mk(true, '对', '○'), no = mk(false, '不对', '×');
    return {
      el: h('div.opts.grid', yes, no),
      lock: function () { locked = true; },
      retry: function () { locked = false; },
      reveal: function () { (q.answer ? yes : no).classList.add('ok', 'reveal'); }
    };
  }

  /* ---------- 字块填空 ---------- */
  function blank(q, ctx) {
    var locked = false;
    var parts = q.data.template.split('{}');
    var slots = [];
    var line = h('div.blank-line' + (q.data.poem ? '.poem-font' : ''));
    parts.forEach(function (p, i) {
      if (p) line.appendChild(h('span.blank-text', p));
      if (i < parts.length - 1) {
        var s = h('button.slot', { type: 'button', 'aria-label': '第' + (i + 1) + '个空' });
        s._tile = null;
        s.addEventListener('click', function () {
          if (locked || !s._tile) return;
          s._tile.classList.remove('used'); s._tile.disabled = false;
          s._tile = null; s.textContent = ''; s.classList.remove('filled', 'bad');
          refresh();
        });
        slots.push(s);
        line.appendChild(s);
      }
    });
    var tiles = U.shuffle(q.data.tiles).map(function (t) {
      var b = h('button.tile' + (q.data.poem ? '.poem-font' : ''), { type: 'button' }, t);
      b._v = t;
      b.addEventListener('click', function () {
        if (locked || b.disabled) return;
        var s = slots.filter(function (x) { return !x._tile; })[0];
        if (!s) return;
        s._tile = b; s.textContent = t; s.classList.add('filled');
        b.classList.add('used'); b.disabled = true;
        Y.sound.play('tap');
        refresh();
      });
      return b;
    });
    var go = checkBtn('检查答案', function () {
      if (locked) return;
      ctx.submit(G.blank(q, slots.map(function (s) { return s._tile ? s._tile._v : ''; })));
    });
    function refresh() { go.disabled = slots.some(function (s) { return !s._tile; }); }
    refresh();
    return {
      el: h('div.blank-q', line, h('div.tiles', tiles), go),
      lock: function () { locked = true; go.disabled = true; },
      retry: function () {
        locked = false;
        // 只把填错的字块退回去，填对的留着
        slots.forEach(function (s, i) {
          if (s._tile && s._tile._v !== q.answer[i]) {
            s._tile.classList.remove('used'); s._tile.disabled = false;
            s._tile = null; s.textContent = ''; s.classList.remove('filled');
          }
        });
        refresh();
      },
      reveal: function () {
        slots.forEach(function (s, i) { s.textContent = q.answer[i]; s.classList.add('filled', 'ok'); });
      }
    };
  }

  /* ---------- 自由输入 ---------- */
  function input(q, ctx) {
    var locked = false;
    var inp = h('input.text-input', { type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', placeholder: q.data && q.data.placeholder || '在这里输入', 'aria-label': '答案' });
    var go = checkBtn('确定', submit);
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
    function submit() {
      if (locked || !inp.value.trim()) return;
      inp.blur();
      ctx.submit(G.input(q, inp.value));
    }
    return {
      el: h('div.input-q', inp, go),
      lock: function () { locked = true; inp.disabled = true; go.disabled = true; },
      retry: function () { locked = false; inp.disabled = false; go.disabled = false; inp.select(); },
      reveal: function () { inp.value = q.answer; inp.classList.add('ok'); }
    };
  }

  /* ---------- 排序 ---------- */
  function order(q, ctx) {
    var list = Y.sortable(U.shuffleDifferent(q.answer), { numbered: true });
    var go = checkBtn('排好了', function () { ctx.submit(G.order(q, list.order())); });
    return {
      el: h('div.order-q', h('p.tip', '按住卡片上下拖动，或者点两张卡片交换位置。'), list.el, go),
      lock: function () { list.lock(); go.disabled = true; },
      retry: function () {
        list.mark(function (v, i) { return v === q.answer[i] ? 'ok' : null; });
        list.unlock(); go.disabled = false;
      },
      reveal: function () { list.setOrder(q.answer); list.mark(function () { return 'ok'; }); }
    };
  }

  /* ---------- 连线配对 ---------- */
  var PAIR_COLORS = 6;
  function match(q, ctx) {
    var locked = false;
    var left = U.shuffle(q.answer.map(function (p) { return p[0]; }));
    var right = U.shuffle(q.answer.map(function (p) { return p[1]; }).concat(q.data && q.data.extra || []));
    var pairs = {}; // 左 -> 右
    var selL = null, selR = null;
    var colorOf = {}, nextColor = 0;

    function mkBtn(v, side) {
      var b = h('button.match-item', { type: 'button' }, v);
      b._v = v; b._side = side;
      b.addEventListener('click', function () { if (!locked) tap(b); });
      return b;
    }
    var lBtns = left.map(function (v) { return mkBtn(v, 'L'); });
    var rBtns = right.map(function (v) { return mkBtn(v, 'R'); });

    function partnerOfR(r) { return Object.keys(pairs).filter(function (l) { return pairs[l] === r; })[0]; }
    function unpair(l) { delete pairs[l]; }

    function tap(b) {
      // 点已配对的项：拆开
      if (b._side === 'L' && pairs[b._v]) { unpair(b._v); draw(); return; }
      if (b._side === 'R' && partnerOfR(b._v)) { unpair(partnerOfR(b._v)); draw(); return; }
      if (b._side === 'L') selL = selL === b ? null : b; else selR = selR === b ? null : b;
      if (selL && selR) {
        pairs[selL._v] = selR._v;
        colorOf[selL._v] = (nextColor++) % PAIR_COLORS;
        selL = selR = null;
        Y.sound.play('tap');
      }
      draw();
    }

    function draw() {
      lBtns.forEach(function (b) {
        b.className = 'match-item';
        if (b === selL) b.classList.add('sel');
        if (pairs[b._v]) b.classList.add('paired', 'c' + colorOf[b._v]);
      });
      rBtns.forEach(function (b) {
        b.className = 'match-item';
        if (b === selR) b.classList.add('sel');
        var l = partnerOfR(b._v);
        if (l) b.classList.add('paired', 'c' + colorOf[l]);
      });
      go.disabled = Object.keys(pairs).length < left.length;
    }

    var go = checkBtn('配好了', function () { if (!locked) ctx.submit(G.match(q, pairs)); });
    var el = h('div.match-q',
      h('p.tip', '先点左边一项，再点右边和它配对的一项。点已配好的可以拆开。'),
      h('div.match-cols',
        h('div.match-col', q.data && q.data.leftTitle ? h('div.match-title', q.data.leftTitle) : null, lBtns),
        h('div.match-col', q.data && q.data.rightTitle ? h('div.match-title', q.data.rightTitle) : null, rBtns)),
      go);
    draw();
    var answerMap = {};
    q.answer.forEach(function (p) { answerMap[p[0]] = p[1]; });
    return {
      el: el,
      lock: function () { locked = true; go.disabled = true; },
      retry: function () {
        locked = false;
        Object.keys(pairs).forEach(function (l) { if (pairs[l] !== answerMap[l]) unpair(l); });
        draw();
      },
      reveal: function () {
        pairs = {}; nextColor = 0;
        left.forEach(function (l) { pairs[l] = answerMap[l]; colorOf[l] = (nextColor++) % PAIR_COLORS; });
        draw(); go.disabled = true;
        lBtns.concat(rBtns).forEach(function (b) { if (b.classList.contains('paired')) b.classList.add('reveal'); });
      }
    };
  }

  /* ---------- 分栏归类 ---------- */
  function columns(q, ctx) {
    var items = U.shuffle(Object.keys(q.answer));
    var go;
    var w = Y.columns(items, q.data.columns, { onChange: function () { go.disabled = !w.allPlaced(); } });
    go = checkBtn('放好了', function () { ctx.submit(G.columns(q, w.placement())); });
    go.disabled = true;
    return {
      el: h('div.columns-q', w.el, go),
      lock: function () { w.lock(); go.disabled = true; },
      retry: function () {
        var p = w.placement();
        items.forEach(function (t) { if (p[t] !== q.answer[t]) w.place(t, null); });
        w.unlock(); go.disabled = true;
      },
      reveal: function () {
        items.forEach(function (t) { w.place(t, q.answer[t]); });
        w.mark(function () { return 'ok'; });
      }
    };
  }

  /* ---------- 断句 ---------- */
  function segment(q, ctx) {
    var w = Y.segmenter(q.data.text);
    var go = checkBtn('断好了', function () { ctx.submit(G.segment(q, w.breaks())); });
    var many = G.segmentAnswers(q).length > 1;
    return {
      el: h('div.segment-q', h('p.tip', '在需要停顿的两个字中间点一下，会出现“/”。再点一下可以去掉。'), w.el, go),
      lock: function () { w.lock(); go.disabled = true; },
      retry: function () { w.unlock(); go.disabled = false; },
      reveal: function () {
        w.setBreaks(U.breaks(q.answer));
        w.mark(U.breaks(q.answer));
        if (many) {
          w.el.appendChild(h('p.tip', '这些停顿也可以：' + q.acceptable.join('　')));
        }
      }
    };
  }

  /* ---------- 默写 / 听写自查卡 ---------- */
  function selfcheck(q, ctx) {
    var back = h('div.flip-back' + (q.data.poem ? '.poem-font' : ''), (q.data.back || q.answer).split('\n').map(function (l) { return h('div', l); }));
    var card = h('div.flip-card', h('div.flip-front', h('div.flip-ico', '✍️'), h('div', q.data.front || '先在纸上写下来，写完再翻开对照。')), back);
    var self = h('div.self-btns.hidden',
      h('button.btn.good', { type: 'button', onclick: function () { done(true); } }, '✓ 全写对了'),
      h('button.btn.soft', { type: 'button', onclick: function () { done(false); } }, '有写错的字'));
    var flip = h('button.btn.primary', { type: 'button' }, '写好了，翻开对照');
    flip.addEventListener('click', function () {
      card.classList.add('flipped'); flip.classList.add('hidden'); self.classList.remove('hidden');
      Y.sound.play('flip');
    });
    var locked = false;
    function done(ok) { if (locked) return; ctx.submit(ok, { final: true, self: true }); }
    return {
      el: h('div.selfcheck-q', card, flip, self),
      lock: function () { locked = true; self.classList.add('hidden'); },
      retry: function () { locked = false; },
      reveal: function () { card.classList.add('flipped'); }
    };
  }

  Y.qtypes = {
    single: single, multi: multi, judge: judge, blank: blank, input: input,
    order: order, match: match, columns: columns, segment: segment, selfcheck: selfcheck
  };
})(window.YuwenIsland);
