/* 题型：书信格式拼图（letter）
 * 信纸上有几个空位，位置分别是：顶格、空两格、右下方。孩子把称呼、问候语、正文……放进正确的空位。
 * 操作：先点一张卡片，再点信纸上的空位；也可以直接拖过去。点已放好的卡片可以拿回来。 */
(function (Y) {
  'use strict';
  var h = Y.h, U = Y.util;
  var POS_LABEL = { left: '顶格', indent: '空两格', right: '右下方' };

  Y.qtypes.letter = function (q, ctx) {
    var pieces = U.shuffle(Object.keys(q.answer));
    var where = {};           // 内容 -> 空位 key
    var selected = null, locked = false;
    var slotEls = {}, cardOf = {};

    var pool = h('div.col-pool.letter-pool');
    var paper = h('div.letter-paper', q.data.slots.map(function (s) {
      var drop = h('div.letter-drop');
      var slot = h('div.letter-slot.pos-' + s.pos, { role: 'button', tabindex: '0', 'aria-label': '信纸上的空位' },
        s.pos === 'indent' ? h('span.indent-mark', { 'aria-hidden': 'true' }, '□□') : null, drop,
        h('span.slot-name', s.key));
      slot._key = s.key; slot._drop = drop;
      slot.addEventListener('click', function (e) {
        if (locked || !selected) return;
        if (e.target.closest && e.target.closest('.col-card')) return;
        put(selected._value, s.key);
      });
      slotEls[s.key] = slot;
      return slot;
    }));

    function occupant(key) { return Object.keys(where).filter(function (p) { return where[p] === key; })[0]; }
    function clearSel() { if (selected) selected.classList.remove('sel'); selected = null; paper.classList.remove('picking'); }
    function put(p, key) {
      clearSel();
      if (key) {
        var old = occupant(key);
        if (old && old !== p) { where[old] = null; pool.appendChild(cardOf[old]); }
        slotEls[key]._drop.appendChild(cardOf[p]);
      } else {
        pool.appendChild(cardOf[p]);
      }
      where[p] = key || null;
      pool.classList.toggle('empty', !pool.children.length);
      Y.sound.play('tap');
      go.disabled = pieces.some(function (x) { return !where[x]; });
    }
    function slotFrom(node) {
      while (node && node !== document.body) { if (node._key) return node; node = node.parentNode; }
      return null;
    }

    pieces.forEach(function (p) {
      var c = h('button.col-card.letter-card', { type: 'button' }, p);
      c._value = p; cardOf[p] = c; where[p] = null;
      Y.drag.attach(c, {
        canDrag: function () { return !locked; },
        onStart: clearSel,
        onDrop: function (x, y, under) { var s = slotFrom(under); if (s) put(p, s._key); else if (where[p]) put(p, null); },
        onTap: function () {
          if (locked) return;
          if (where[p]) {
            if (selected && selected !== c) { put(selected._value, where[p]); return; }
            put(p, null); return;
          }
          if (selected === c) { clearSel(); return; }
          clearSel(); selected = c; c.classList.add('sel'); paper.classList.add('picking');
        }
      });
      pool.appendChild(c);
    });

    var go = h('button.btn.primary.check-btn', { type: 'button', disabled: true }, '拼好了');
    go.addEventListener('click', function () { if (!locked) ctx.submit(Y.grade.letter(q, where)); });

    function mark() {
      pieces.forEach(function (p) {
        cardOf[p].classList.remove('ok', 'bad');
        if (where[p]) cardOf[p].classList.add(where[p] === q.answer[p] ? 'ok' : 'bad');
      });
    }

    return {
      el: h('div.letter-q',
        h('p.tip', '先点一张卡片，再点信纸上的空位。注意看空位的位置：顶格、空两格（□□）、右下方。'),
        pool, paper, go),
      lock: function () { locked = true; clearSel(); go.disabled = true; },
      retry: function () {
        locked = false;
        pieces.forEach(function (p) { if (where[p] && where[p] !== q.answer[p]) put(p, null); });
        go.disabled = true;
      },
      reveal: function () {
        pieces.forEach(function (p) { put(p, q.answer[p]); });
        mark();
        paper.classList.add('revealed');
        go.disabled = true;
      },
      posLabel: POS_LABEL
    };
  };
})(window.YuwenIsland);
