/* 通用拖拽：Pointer Events（鼠标、触摸、触控笔通吃）。
 * 移动超过 8px 才算拖动，否则当作点按，交给 onTap。
 * 拖动时生成一个跟手的“影子”，松手时报告手指下方的元素。
 * 注意：拖动中会把元素在列表里挪位置，这会让浏览器丢掉 pointer capture，
 * 所以 move / up 监听挂在 window 上，而不是元素上。 */
(function (Y) {
  'use strict';

  var THRESHOLD = 8;

  Y.drag = {
    /**
     * el: 可拖动元素
     * opts: { onTap(), onStart(), onMove(x, y, under), onDrop(x, y, under), onCancel(), canDrag() }
     */
    attach: function (el, opts) {
      var start = null, ghost = null, dragging = false, offX = 0, offY = 0;

      function underPoint(x, y) {
        if (ghost) ghost.style.display = 'none';
        var u = document.elementFromPoint(x, y);
        if (ghost) ghost.style.display = '';
        return u;
      }

      function onMove(e) {
        if (!start || e.pointerId !== start.id) return;
        var dx = e.clientX - start.x, dy = e.clientY - start.y;
        if (!dragging && Math.abs(dx) + Math.abs(dy) > THRESHOLD) {
          dragging = true;
          var r = el.getBoundingClientRect();
          offX = start.x - r.left; offY = start.y - r.top;
          ghost = el.cloneNode(true);
          ghost.classList.add('drag-ghost');
          ghost.classList.remove('draggable');
          ghost.style.width = r.width + 'px';
          ghost.style.height = r.height + 'px';
          document.body.appendChild(ghost);
          el.classList.add('drag-src');
          opts.onStart && opts.onStart();
        }
        if (dragging) {
          if (e.cancelable) e.preventDefault();
          ghost.style.transform = 'translate(' + (e.clientX - offX) + 'px,' + (e.clientY - offY) + 'px)';
          opts.onMove && opts.onMove(e.clientX, e.clientY, underPoint(e.clientX, e.clientY));
        }
      }

      function end(e, cancelled) {
        if (!start || e.pointerId !== start.id) return;
        var wasDragging = dragging;
        start = null; dragging = false;
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onCancel);
        if (ghost) { ghost.remove(); ghost = null; }
        el.classList.remove('drag-src');
        if (wasDragging) {
          if (!cancelled) opts.onDrop && opts.onDrop(e.clientX, e.clientY, underPoint(e.clientX, e.clientY));
          else opts.onCancel && opts.onCancel();
        } else if (!cancelled) {
          opts.onTap && opts.onTap();
        }
      }
      function onUp(e) { end(e, false); }
      function onCancel(e) { end(e, true); }

      el.classList.add('draggable');
      el.addEventListener('pointerdown', function (e) {
        if (e.button > 0 || start) return;
        if (opts.canDrag && !opts.canDrag()) return;
        start = { x: e.clientX, y: e.clientY, id: e.pointerId };
        dragging = false;
        window.addEventListener('pointermove', onMove, { passive: false });
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onCancel);
      });
      // 键盘（回车/空格）触发的 click，detail 为 0，也当作点按
      el.addEventListener('click', function (e) { if (e.detail === 0 && opts.onTap) opts.onTap(); });
      // 不让浏览器把点按变成别的手势
      el.addEventListener('dragstart', function (e) { e.preventDefault(); });
    }
  };
})(window.YuwenIsland);
