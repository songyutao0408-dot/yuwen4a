/* 错题本、每日一练、奖励（徽章）、家长页 */
(function (Y) {
  'use strict';
  var h = Y.h, U = Y.util, L = Y.learn;

  function islandName(id) {
    var u = (Y.data.islands || []).filter(function (x) { return x.id === id; })[0];
    if (u) return '第' + U.cnNum(u.unit) + '单元';
    var s = Y.content.special(id);
    return s ? s.name : id;
  }
  function qLabel(q) {
    var ls = Y.content.lessonOf(q);
    return (ls ? (ls === '习作' || ls === '快乐读书吧' ? ls : '《' + ls + '》') + ' · ' : '') + Y.content.skillLabel(q.skill);
  }

  /** 题干太笼统时（如“选字填空”），补一行具体内容 */
  function preview(q) {
    var d = q.data || {};
    if (d.template) return d.template.replace(/\{\}/g, '＿');
    if (d.quote) return d.quote;
    if (d.text) return d.text;
    return '';
  }

  /** 新得到的徽章：和已经提示过的比一比，返回新得的 */
  Y.checkNewBadges = function (container) {
    var seen = Y.store.get('badgesSeen', []) || [];
    var fresh = Y.badgeList().filter(function (b) { return b.got && seen.indexOf(b.id) < 0; });
    if (!fresh.length) return [];
    Y.store.set('badgesSeen', seen.concat(fresh.map(function (b) { return b.id; })));
    if (container) {
      container.appendChild(h('a.new-badge', { href: '#/badges' },
        h('span.badge-ico', fresh[0].icon), h('span', h('b', '获得新徽章！'), h('small', fresh.map(function (b) { return b.name; }).join('、')))));
    } else {
      Y.ui.toast('🏅 获得新徽章：' + fresh.map(function (b) { return b.name; }).join('、'));
    }
    Y.sound.play('star');
    return fresh;
  };

  /* ---------- 通用：指定题目的一轮练习（错题重练用） ---------- */
  Y.router.add('/quiz/mix', function (params, query) {
    var pool = (query.ids || '').split(',').map(Y.content.byId).filter(Boolean);
    Y.quiz.run({
      title: query.title || '练一练', icon: query.icon || '📒', back: query.back || '#/wrong',
      pool: pool, count: pool.length, mode: 'practice', againHref: '#/wrong'
    });
  });

  /* ---------- 错题本 ---------- */
  Y.router.add('/wrong', function (params, query) {
    var body = Y.ui.page({ title: '错题本', icon: '📒', nav: 'wrong' });
    var all = L.wrongList(Y.progress.data());
    var fIsl = query.island || '', fType = query.type || '';
    var list = all.filter(function (x) { return (!fIsl || x.q.island === fIsl) && (!fType || x.q.type === fType); });

    if (!all.length) {
      body.appendChild(h('section.card.building', h('div.building-ico', '🌈'), h('h2', '错题本是空的'),
        h('p.card-text', '答错的题会自动放进这里。同一道题连续答对 2 次，就会自动移出。'),
        h('a.btn.primary', { href: '#/daily' }, '去做每日一练')));
      return;
    }
    body.appendChild(h('p.tip', '一共 ' + all.length + ' 道。同一道题连续答对 2 次，就会自动移出错题本。'));

    function chipRow(label, key, items) {
      return h('div.filter-row', h('span.filter-label', label), h('div.filter-chips', [['', '全部']].concat(items).map(function (it) {
        var q = Object.assign({}, query); q[key] = it[0];
        var href = '#/wrong?' + Object.keys(q).filter(function (k) { return q[k]; }).map(function (k) { return k + '=' + encodeURIComponent(q[k]); }).join('&');
        return h('a.filter-chip' + ((query[key] || '') === it[0] ? '.on' : ''), { href: href }, it[1]);
      })));
    }
    var isls = {}, types = {};
    all.forEach(function (x) { isls[x.q.island] = true; types[x.q.type] = true; });
    body.appendChild(chipRow('按岛', 'island', Object.keys(isls).map(function (k) { return [k, islandName(k)]; })));
    body.appendChild(chipRow('按题型', 'type', Object.keys(types).map(function (k) { return [k, L.TYPE_LABEL[k] || k]; })));

    var ids = list.slice(0, 10).map(function (x) { return x.q.id; });
    body.appendChild(h('a.btn.primary.wide' + (list.length ? '' : '.hidden'), {
      href: '#/quiz/mix?title=' + encodeURIComponent('重练错题') + '&ids=' + ids.join(',')
    }, '🔁 重练' + (list.length > 10 ? '最近 10 道' : '这 ' + list.length + ' 道') + '错题'));

    body.appendChild(h('div.wrong-list', list.map(function (x) {
      return h('a.wrong-item', { href: '#/quiz/mix?title=' + encodeURIComponent('练这一题') + '&ids=' + x.q.id },
        h('span.wrong-meta', h('span.chip', islandName(x.q.island)), h('span.chip.soft', qLabel(x.q))),
        h('span.wrong-prompt', x.q.prompt),
        preview(x.q) ? h('span.wrong-preview' + (x.q.data && x.q.data.poem ? '.poem-font' : ''), preview(x.q)) : null,
        h('span.wrong-stat', '错过 ' + x.s.w + ' 次 · 连对 ' + (x.s.streak || 0) + ' / 2'));
    })));
    if (!list.length) body.appendChild(h('p.tip.center', '这个筛选条件下没有错题。'));
  });

  /* ---------- 每日一练 ---------- */
  function dailyState() {
    var today = U.today();
    var st = Y.store.get('daily', null);
    if (!st || st.date !== today) {
      st = { date: today, ids: L.dailyIds(Y.progress.data(), today), done: false, pct: null };
      Y.store.set('daily', st);
    }
    return st;
  }

  Y.router.add('/daily', function () {
    var st = dailyState();
    var p = Y.progress.data();
    var streak = L.streak(p.days, U.today());
    var body = Y.ui.page({ title: '每日一练', icon: '📅', nav: 'daily' });
    var d = new Date();
    body.appendChild(h('section.daily-hero',
      h('div.daily-date', h('b', String(d.getDate())), h('span', (d.getMonth() + 1) + '月')),
      h('div', h('h2', st.done ? '今天的一练完成啦！' : '今天的 10 道题'),
        h('p.card-text', st.done ? '正确率 ' + st.pct + '%，明天再来哦。' : '2 道古诗文，其余优先错题和薄弱单元。'),
        h('p.daily-streak', '🔥 已连续学习 ' + streak + ' 天'))));
    var qs = st.ids.map(Y.content.byId).filter(Boolean);
    body.appendChild(h('a.btn.primary.wide', { href: '#/daily/go' }, st.done ? '再练一遍（不影响打卡）' : '开始今天的一练'));
    body.appendChild(h('h2.sec-title', h('span.sec-dot'), '今天会练到'));
    var seen = {};
    body.appendChild(h('div.idea-chips', qs.map(function (q) {
      var k = qLabel(q); if (seen[k]) return null; seen[k] = true;
      return h('span.idea-chip', k);
    })));
    var done = Y.store.get('dailyDone', []) || [];
    body.appendChild(h('p.tip.center', '已经完成过 ' + done.length + ' 次每日一练。'));
  });

  Y.router.add('/daily/go', function () {
    var st = dailyState();
    var pool = st.ids.map(Y.content.byId).filter(Boolean);
    Y.quiz.run({
      title: '每日一练', icon: '📅', back: '#/daily', againHref: '#/daily',
      pool: pool, count: pool.length, mode: 'practice',
      onFinish: function (r) {
        var s = dailyState();
        if (!s.done) {
          s.done = true; s.pct = r.pct; Y.store.set('daily', s);
          var done = Y.store.get('dailyDone', []) || [];
          if (done.indexOf(s.date) < 0) { done.push(s.date); Y.store.set('dailyDone', done); }
        }
      }
    });
  });

  /* ---------- 奖励（徽章） ---------- */
  function badgeExtra() {
    var outlines = (Y.data.writing || []).filter(function (w) { var o = Y.store.get('outline:' + w.id, null); return o && o.done; }).length;
    return { today: U.today(), dailyDone: Y.store.get('dailyDone', []) || [], outlinesDone: outlines };
  }
  Y.badgeList = function () { return L.badges(Y.progress.data(), badgeExtra()); };

  Y.router.add('/badges', function () {
    var body = Y.ui.page({ title: '奖励', icon: '🏅', nav: 'badges' });
    var list = Y.badgeList();
    var got = list.filter(function (b) { return b.got; }).length;
    var p = Y.progress.data();
    var totalStars = Object.keys(p.stars).reduce(function (n, k) { return n + p.stars[k]; }, 0);
    body.appendChild(h('section.daily-hero',
      h('div.daily-date.seal', h('b', String(got)), h('span', '枚')),
      h('div', h('h2', '已经得到 ' + got + ' / ' + list.length + ' 枚徽章'),
        h('p.card-text', '一共收集了 ' + totalStars + ' 颗星。'))));
    body.appendChild(h('div.badge-grid', list.map(function (b) {
      return h('div.badge' + (b.got ? '.got' : ''),
        h('span.badge-ico', b.icon),
        h('b.badge-name', b.name),
        h('small.badge-desc', b.desc),
        b.got ? h('span.badge-ok', '已获得') : h('span.badge-prog', Y.ui.bar(b.cur / b.total * 100), h('small', b.cur + ' / ' + b.total)));
    })));
  });

  /* ---------- 家长页 ---------- */
  Y.router.add('/parent', function () {
    if (!Y.parentOk) return Y.router.go('#/parent-gate');
    var body = Y.ui.page({ title: '家长页', icon: '👨‍👩‍👧', back: '#/settings' });
    var p = Y.progress.data();

    var stats = L.islandStats(p);
    body.appendChild(h('section.card',
      h('h3.card-title', '📊 各岛正确率'),
      h('p.card-text.small', '正确率 = 答对次数 ÷ 作答次数。“做过”是做过的题数 / 题库题数。'),
      h('table.ptable', h('thead', h('tr', h('th', '岛'), h('th', '做过'), h('th', '正确率'), h('th', '星'))),
        h('tbody', stats.map(function (s) {
          return h('tr', h('td', s.name), h('td', s.tried + '/' + s.total),
            h('td', s.acc == null ? '—' : h('span.acc' + (s.acc < 60 ? '.low' : ''), s.acc + '%')), h('td', s.stars ? '★' + s.stars : '—'));
        })))));

    body.appendChild(h('section.card',
      h('h3.card-title', '🏯 背诵进度'),
      h('table.ptable', h('thead', h('tr', h('th', '篇目'), h('th', '一关'), h('th', '二关'), h('th', '三关'))),
        h('tbody', Y.data.poems.map(function (pm) {
          var r = Y.progress.recite(pm.id);
          return h('tr', h('td', pm.title), r.map(function (x) { return h('td', x ? '✓' : '—'); }));
        })))));

    var top = L.topWrong(p, 10);
    body.appendChild(h('section.card',
      h('h3.card-title', '📌 高频错题（前 10）'),
      top.length ? h('ol.check-list', top.map(function (x) {
        return h('li', h('b', x.q.prompt), h('small', islandName(x.q.island) + ' · ' + qLabel(x.q) + ' · 错 ' + x.s.w + ' 次' + (x.s.wrong ? '（还在错题本里）' : '（已移出）')));
      })) : h('p.card-text', '还没有错题。')));

    var days = p.days.length, streak = L.streak(p.days, U.today());
    body.appendChild(h('section.card',
      h('h3.card-title', '📅 学习记录'),
      h('p.card-text', '一共学习了 ' + days + ' 天，最近连续 ' + streak + ' 天；完成每日一练 ' + (Y.store.get('dailyDone', []) || []).length + ' 次；得到徽章 ' + Y.badgeList().filter(function (b) { return b.got; }).length + ' 枚。')));

    var list = Y.content.collectNeedsCheck();
    body.appendChild(h('section.card',
      h('h3.card-title', '📋 待核对清单（' + list.length + ' 项）'),
      h('p.card-text.small', '这些内容不是直接来自课本，或者知识清单里注明“待核对”“以课本为准”。孩子那边正常显示，请您对照课本或老师的讲解检查；核对无误后，在数据文件里把 needsCheck 改成 false 即可（数据文件位置见 README）。'),
      h('details.check-details',
        h('summary', '展开查看全部 ' + list.length + ' 项'),
        h('ol.check-list', list.map(function (it) {
          return h('li', h('b', it.label), it.note ? h('small', it.note) : null, h('code', it.path));
        })))));

    // 数据：导出、清空
    var out = h('textarea.text-input.export-box.hidden', { readonly: true, 'aria-label': '导出的数据' });
    body.appendChild(h('section.card',
      h('h3.card-title', '💾 数据'),
      h('p.card-text.small', '学习记录只保存在这台设备的浏览器里（键名以 yw4a: 开头）。'),
      h('div.row-btns.left',
        h('button.btn', { type: 'button', onclick: function () {
          var json = JSON.stringify(L.exportAll(), null, 2);
          out.value = json; out.classList.remove('hidden');
          try {
            var a = document.createElement('a');
            a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
            a.download = 'yuwen-island-' + U.today() + '.json';
            document.body.appendChild(a); a.click(); a.remove();
            Y.ui.toast('已导出。如果没有自动下载，可以复制下面的文字保存。');
          } catch (e) { Y.ui.toast('请复制下面的文字保存。'); }
        } }, '导出数据（JSON）'),
        h('button.btn.danger', { type: 'button', onclick: function () {
          Y.ui.modal({
            icon: '⚠️', title: '确定要清空全部学习记录吗？', body: '错题本、星星、徽章、背诵进度、提纲都会被删除，不能恢复。建议先导出备份。',
            buttons: [
              { label: '我确定，继续', cls: 'danger', onclick: function () {
                setTimeout(function () {
                  Y.ui.modal({
                    icon: '🗑️', title: '最后确认一次', body: '真的要清空吗？',
                    buttons: [
                      { label: '清空', cls: 'danger', onclick: function () { Y.store.clearAll(); Y.applySettings && Y.applySettings(); Y.ui.toast('已清空'); Y.router.go('#/'); } },
                      { label: '不清空了', cls: 'primary' }
                    ]
                  });
                }, 50);
              } },
              { label: '取消', cls: 'primary' }
            ]
          });
        } }, '清空数据')),
      out));
  });
})(window.YuwenIsland);
