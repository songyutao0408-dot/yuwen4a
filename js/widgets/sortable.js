/* 排序列表：拖动卡片换位置；也可以“点一张、再点一张”交换。 */
(function (Y) {
  'use strict';
  var h = Y.h;

  /**
   * items: 字符串数组（初始顺序）
   * opts: { onChange(order), numbered: true }
   * 返回 { el, order(), setOrder(arr), lock(), unlock(), mark(fn(item,i)->'ok'|'bad'|null) }
   */
  Y.sortable = function (items, opts) {
    opts = opts || {};
    var list = h('ol.sort-list' + (opts.numbered === false ? '.plain' : ''));
    var locked = false, selected = null;

    function cards() { return Array.prototype.slice.call(list.children); }
    function order() { return cards().map(function (c) { return c._value; }); }
    function changed() { opts.onChange && opts.onChange(order()); }

    function clearSel() { if (selected) selected.classList.remove('sel'); selected = null; }

    function make(text) {
      var c = h('li.sort-card', { tabindex: '0', role: 'button' },
        h('span.sort-grip', { 'aria-hidden': 'true' }, '⋮⋮'),
        h('span.sort-text', text));
      c._value = text;
      Y.drag.attach(c, {
        canDrag: function () { return !locked; },
        onStart: function () { clearSel(); },
        onMove: function (x, y) {
          // 手指越过别的卡片中线，就把当前卡片挪过去
          var cs = cards();
          for (var i = 0; i < cs.length; i++) {
            var o = cs[i]; if (o === c) continue;
            var r = o.getBoundingClientRect();
            if (y > r.top && y < r.bottom) {
              var before = y < r.top + r.height / 2;
              if (before && o.previousSibling !== c) list.insertBefore(c, o);
              else if (!before && o.nextSibling !== c) list.insertBefore(c, o.nextSibling);
              break;
            }
          }
        },
        onDrop: function () { Y.sound.play('tap'); changed(); },
        onTap: function () {
          if (locked) return;
          if (!selected) { selected = c; c.classList.add('sel'); return; }
          if (selected === c) { clearSel(); return; }
          // 交换两张卡片
          var a = selected, b = c, aNext = a.nextSibling === b ? a : a.nextSibling;
          list.insertBefore(a, b);
          list.insertBefore(b, aNext);
          clearSel();
          Y.sound.play('tap');
          changed();
        }
      });
      return c;
    }

    items.forEach(function (t) { list.appendChild(make(t)); });

    return {
      el: list,
      order: order,
      setOrder: function (arr) {
        var byVal = {};
        cards().forEach(function (c) { (byVal[c._value] = byVal[c._value] || []).push(c); });
        arr.forEach(function (v) { list.appendChild(byVal[v].shift()); });
      },
      lock: function () { locked = true; clearSel(); list.classList.add('locked'); },
      unlock: function () { locked = false; list.classList.remove('locked'); },
      mark: function (fn) {
        cards().forEach(function (c, i) {
          c.classList.remove('ok', 'bad');
          var m = fn ? fn(c._value, i) : null;
          if (m) c.classList.add(m);
        });
      }
    };
  };
})(window.YuwenIsland);
