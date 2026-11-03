/* 题型：田忌赛马对阵模拟器
 * 齐威王的马按上、中、下等出场（固定）；孩子排田忌三匹马的出场顺序，系统模拟三局比赛。 */
(function (Y) {
  'use strict';
  var h = Y.h, U = Y.util, G = Y.grade;

  Y.qtypes.tianji = function (q, ctx) {
    var d = q.data;
    var locked = false;
    var list = Y.sortable(U.shuffleDifferent(d.king), { numbered: false });
    list.el.classList.add('tj-list');

    var kingCol = h('ol.tj-king', d.king.map(function (k) { return h('li.tj-horse.king', h('span.tj-ico', '🐎'), k); }));
    var rounds = h('ol.tj-rounds', d.king.map(function (_, i) { return h('li.tj-round', '第' + U.cnNum(i + 1) + '局'); }));
    var board = h('div.tj-board',
      h('div.tj-head', h('span', ''), h('span', '齐威王'), h('span', '田忌（你来排）')),
      h('div.tj-grid', rounds, kingCol, list.el));
    var result = h('div.tj-result', { 'aria-live': 'polite' });
    var go = h('button.btn.primary.check-btn', { type: 'button' }, '🏁 开始比赛');

    function maxSpeed() {
      var all = Object.keys(d.speed.king).map(function (k) { return d.speed.king[k]; })
        .concat(Object.keys(d.speed.tian).map(function (k) { return d.speed.tian[k]; }));
      return Math.max.apply(null, all);
    }

    function race(order) {
      var res = G.race(q, order);
      var top = maxSpeed();
      result.innerHTML = '';
      res.forEach(function (r, i) {
        var row = h('div.tj-race' + (r.win ? '.win' : '.lose'),
          h('div.tj-race-title', '第' + U.cnNum(r.round) + '局：', h('b', r.win ? '田忌赢' : '齐威王赢')),
          h('div.tj-lane', h('span.tj-who', '齐威王 · ' + r.king), h('span.tj-track', h('span.tj-bar.king', { style: { width: '0%' } }))),
          h('div.tj-lane', h('span.tj-who', '田忌 · ' + r.tian), h('span.tj-track', h('span.tj-bar.tian', { style: { width: '0%' } }))));
        result.appendChild(row);
        var bars = row.querySelectorAll('.tj-bar');
        setTimeout(function () {
          bars[0].style.width = (d.speed.king[r.king] / top * 100) + '%';
          bars[1].style.width = (d.speed.tian[r.tian] / top * 100) + '%';
        }, 40 + i * 120);
      });
      var wins = res.filter(function (r) { return r.win; }).length;
      result.appendChild(h('p.tj-score', '田忌赢了 ', h('b', String(wins)), ' 局，齐威王赢了 ', h('b', String(3 - wins)), ' 局。',
        wins >= 2 ? ' 🎉 三局两胜！' : ''));
      return wins >= 2;
    }

    go.addEventListener('click', function () {
      if (locked) return;
      var ok = race(list.order());
      ctx.submit(ok);
    });

    return {
      el: h('div.tianji-q', h('p.tip', '拖动右边的马换顺序，或者点两匹马交换。'), board, go, result),
      lock: function () { locked = true; list.lock(); go.disabled = true; },
      retry: function () { locked = false; list.unlock(); go.disabled = false; go.textContent = '🔁 换个顺序再比一次'; },
      reveal: function () { list.setOrder(q.answer); list.mark(function () { return 'ok'; }); race(q.answer); }
    };
  };
})(window.YuwenIsland);
