/* 分栏归类：把卡片拖进对应的栏（筐）；也可以先点卡片、再点栏。
 * 点已放进栏里的卡片，它会回到待选区。 */
(function (Y) {
  'use strict';
  var h = Y.h;

  /**
   * items: 字符串数组；columns: 栏名数组
   * 返回 { el, placement() -> {item: column|null}, place(item, col), lock(), unlock(), mark(fn) }
   */
  Y.columns = function (items, columns, opts) {
    opts = opts || {};
    var locked = false, selected = null;
    var where = {};
    var cardOf = {};

    var pool = h('div.col-pool', { 'aria-label': '待放的卡片' });
    var bucketEls = {};
    // 卡片是长句子时，栏改成上下排列，免得手机上挤成一列一个字
    var stack = opts.stack != null ? opts.stack : items.some(function (t) { return t.length > 10; });
    var bucketWrap = h('div.col-buckets' + (stack ? '.stack' : '') + (columns.length > 3 ? '.many' : ''), columns.map(function (name) {
      var drop = h('div.col-drop');
      var b = h('div.col-bucket', { role: 'button', tabindex: '0' }, h('div.col-head', name), drop);
      b._col = name; b._drop = drop;
      b.addEventListener('click', function (e) {
        if (locked || !selected) return;
        if (e.target.closest && e.target.closest('.col-card')) return; // 卡片自己处理
        place(selected._value, name);
        clearSel();
      });
      bucketEls[name] = b;
      return b;
    }));

    function clearSel() {
      if (selected) selected.classList.remove('sel');
      selected = null;
      bucketWrap.classList.remove('picking');
    }
    function changed() { opts.onChange && opts.onChange(where); }

    function place(item, col) {
      var c = cardOf[item];
      where[item] = col;
      if (col) bucketEls[col]._drop.appendChild(c); else pool.appendChild(c);
      pool.classList.toggle('empty', !pool.children.length);
      Y.sound.play('tap');
      changed();
    }

    function bucketFrom(node) {
      while (node && node !== document.body) {
        if (node._col) return node;
        node = node.parentNode;
      }
      return null;
    }

    items.forEach(function (t) {
      var c = h('button.col-card', { type: 'button' }, t);
      c._value = t;
      cardOf[t] = c;
      where[t] = null;
      Y.drag.attach(c, {
        canDrag: function () { return !locked; },
        onStart: clearSel,
        onMove: function (x, y, under) {
          Object.keys(bucketEls).forEach(function (k) { bucketEls[k].classList.remove('over'); });
          var b = bucketFrom(under); if (b) b.classList.add('over');
        },
        onDrop: function (x, y, under) {
          Object.keys(bucketEls).forEach(function (k) { bucketEls[k].classList.remove('over'); });
          var b = bucketFrom(under);
          if (b) place(t, b._col);
          else if (where[t]) place(t, null);
        },
        onTap: function () {
          if (locked) return;
          if (where[t]) {
            // 已经选中了别的卡片时，点栏里的卡片 = 放进这一栏；否则把这张卡片退回待选区
            if (selected && selected !== c) { var col = where[t]; var v = selected._value; clearSel(); place(v, col); }
            else { clearSel(); place(t, null); }
            return;
          }
          if (selected === c) { clearSel(); return; }
          clearSel();
          selected = c; c.classList.add('sel');
          bucketWrap.classList.add('picking');
        }
      });
      pool.appendChild(c);
    });

    var el = h('div.columns-widget',
      h('p.col-tip', '把卡片拖进对应的栏，或者先点卡片，再点栏。'),
      pool, bucketWrap);

    return {
      el: el,
      placement: function () { var o = {}; Object.keys(where).forEach(function (k) { o[k] = where[k]; }); return o; },
      place: place,
      allPlaced: function () { return items.every(function (t) { return where[t]; }); },
      lock: function () { locked = true; clearSel(); el.classList.add('locked'); },
      unlock: function () { locked = false; el.classList.remove('locked'); },
      mark: function (fn) {
        items.forEach(function (t) {
          var c = cardOf[t]; c.classList.remove('ok', 'bad');
          var m = fn ? fn(t, where[t]) : null; if (m) c.classList.add(m);
        });
      }
    };
  };
})(window.YuwenIsland);
