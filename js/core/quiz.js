/* 答题引擎：一轮题目的流程、反馈、计分、总结。
 * 规则：答错不扣分；第一次错 → 给提示，再试一次；第二次错 → 给讲解，并加一道同类题。
 * 正确率按“第一次就对 = 1 分，提示后答对 = 0.5 分”计算。加练题不计分。 */
(function (Y) {
  'use strict';
  var h = Y.h, U = Y.util;

  var PRAISE = ['太棒了！', '答对啦，真细心！', '好样的！', '你记得真清楚！', '一点就通！', '漂亮，继续加油！', '完全正确！', '这题难不倒你！'];
  var RETRY_PRAISE = ['改对了，真不错！', '再想一想就对了，很棒！', '这次对啦！'];
  var praiseIdx = Math.floor(Math.random() * PRAISE.length);
  function praise(second) {
    if (second) return U.pick(RETRY_PRAISE);
    praiseIdx = (praiseIdx + 1) % PRAISE.length;
    return PRAISE[praiseIdx];
  }

  function lessonChip(q) {
    var ls = Y.content.lessonOf(q);
    if (!ls) return null;
    return h('span.chip.soft', ls === '习作' || ls === '快乐读书吧' ? ls : '《' + ls + '》');
  }

  /** 按正确率给星：≥60% 一星，≥80% 两星，100% 三星 */
  function starsFor(pct) { return pct >= 100 ? 3 : pct >= 80 ? 2 : pct >= 60 ? 1 : 0; }

  Y.quiz = {
    starsFor: starsFor,

    /**
     * opts: { title, icon, theme, back, pool: [题目], count, mode: 'practice'|'test'|'dictation',
     *         islandId, againHref, intro }
     */
    run: function (opts) {
      var mode = opts.mode || 'practice';
      var picked = U.sample(opts.pool, Math.min(opts.count || 10, opts.pool.length));
      var items = picked.map(function (q) { return { q: q, result: null, bonus: false }; });
      var used = {};
      picked.forEach(function (q) { used[q.id] = true; });
      var idx = 0;
      var total = items.length;

      var body = Y.ui.page({ title: opts.title, icon: opts.icon, theme: opts.theme, back: opts.back, cls: 'quiz-page' });
      var head = h('div.quiz-head');
      var stage = h('div.quiz-stage');
      body.appendChild(head);
      body.appendChild(stage);

      if (!items.length) {
        stage.appendChild(h('div.empty-card', h('p', '这里暂时还没有题目。'), h('a.btn', { href: opts.back }, '返回')));
        return;
      }

      function scoredDone() { return items.filter(function (it) { return !it.bonus && it.result; }).length; }

      function drawHead(it) {
        head.innerHTML = '';
        var n = scoredDone() + (it && !it.bonus && !it.result ? 1 : 0);
        head.appendChild(h('div.quiz-count',
          it && it.bonus ? h('span.chip.bonus', '加练一题') : h('span', '第 ', h('b', String(Math.min(n, total))), ' / ' + total + ' 题'),
          mode === 'test' ? h('span.chip.test', '闯关') : null));
        head.appendChild(Y.ui.bar(scoredDone() / total * 100));
      }

      function show() {
        if (idx >= items.length) return summary();
        var it = items[idx];
        var q = it.q;
        drawHead(it);
        stage.innerHTML = '';
        var attempts = 0;
        var fb = h('div.feedback', { 'aria-live': 'polite' });
        var nextBar = h('div.next-bar.hidden');
        var view;

        var ctx = {
          submit: function (correct, info) {
            info = info || {};
            view.lock();
            if (correct) {
              it.result = attempts === 0 ? 'first' : 'second';
              finish(true);
            } else {
              attempts++;
              if (attempts === 1 && !info.final) {
                Y.sound.play('wrong');
                fb.className = 'feedback hint';
                fb.innerHTML = '';
                fb.appendChild(h('div.fb-title', '💡 差一点点！看看提示，再试一次'));
                if (q.hint) fb.appendChild(h('p.fb-text', q.hint));
                setTimeout(function () { view.retry(); }, 350);
              } else {
                it.result = 'wrong';
                finish(false, info.self);
              }
            }
          }
        };

        function finish(ok, selfGraded) {
          Y.progress.record(q, it.result);
          fb.innerHTML = '';
          if (ok) {
            Y.sound.play('correct');
            Y.ui.stamp(it.result === 'first' ? '对' : '好', card);
            fb.className = 'feedback good';
            fb.appendChild(h('div.fb-title', '🌸 ' + praise(it.result === 'second')));
          } else {
            if (!selfGraded) view.reveal();
            fb.className = 'feedback explain';
            fb.appendChild(h('div.fb-title', selfGraded ? '📒 没关系，已经放进错题本，下次再写一遍' : '🍵 没关系，我们一起来看看'));
            // 加一道同类题
            var sim = Y.content.similar(q, used);
            if (sim) {
              used[sim.id] = true;
              items.splice(idx + 1, 0, { q: sim, result: null, bonus: true });
            }
          }
          if (q.explanation) fb.appendChild(h('p.fb-text', q.explanation));
          if (!ok && items[idx + 1] && items[idx + 1].bonus && items[idx + 1].q !== q) {
            fb.appendChild(h('p.fb-text.soft', '下面再来一道同类题，巩固一下。'));
          }
          nextBtn.textContent = idx + 1 >= items.length ? '看看这一轮的成绩' : '下一题 →';
          nextBar.classList.remove('hidden');
          drawHead(null);
          setTimeout(function () {
            nextBtn.focus({ preventScroll: true });
            // 让讲解和“下一题”按钮都露出来；讲解太长时优先露出讲解开头
            var r = fb.getBoundingClientRect(), vh = window.innerHeight;
            var target = nextBar.getBoundingClientRect().bottom - vh + 16;
            if (r.top - target < 70) target = r.top - 70;
            if (target > 0) window.scrollBy({ top: target, behavior: 'smooth' });
          }, 60);
        }

        var renderer = Y.qtypes[q.type];
        view = renderer(q, ctx);
        var card = h('section.q-card', { 'data-qid': q.id },
          h('div.q-meta', h('span.chip', Y.content.skillLabel(q.skill)), lessonChip(q)),
          h('h2.q-prompt', q.prompt),
          q.data && q.data.quote ? h('blockquote.q-quote.poem-font', q.data.quote) : null,
          view.el);
        var nextBtn = h('button.btn.primary.wide', { type: 'button', onclick: function () { idx++; show(); } }, '下一题 →');
        nextBar.appendChild(nextBtn);
        stage.appendChild(card);
        stage.appendChild(fb);
        stage.appendChild(nextBar);
        window.scrollTo(0, 0);
      }

      function summary() {
        var scored = items.filter(function (it) { return !it.bonus; });
        var first = scored.filter(function (it) { return it.result === 'first'; }).length;
        var second = scored.filter(function (it) { return it.result === 'second'; }).length;
        var pct = Math.round((first + second * 0.5) / scored.length * 100);
        head.innerHTML = '';
        stage.innerHTML = '';
        var box = h('section.summary');
        if (mode === 'test') {
          var stars = starsFor(pct);
          var best = opts.islandId ? Y.progress.setStars(opts.islandId, stars, pct) : stars;
          if (stars) Y.sound.play('star');
          box.appendChild(h('div.sum-stars', Y.ui.stars(stars, true)));
          box.appendChild(h('h2.sum-title', stars === 3 ? '满分通关！' : stars ? '闯关成功！' : '离星星只差一点点'));
          if (best > stars) box.appendChild(h('p.sum-sub', '最高纪录：' + best + ' 颗星，已经帮你保留啦。'));
        } else {
          Y.sound.play('star');
          box.appendChild(h('div.sum-seal', '练'));
          box.appendChild(h('h2.sum-title', '这一轮练完啦！'));
        }
        box.appendChild(h('div.sum-nums',
          h('div.sum-num', h('b', String(first)), h('span', '一次就对')),
          h('div.sum-num', h('b', String(second)), h('span', '提示后改对')),
          h('div.sum-num', h('b', pct + '%'), h('span', '正确率'))));

        // 薄弱点：按“技能 + 篇目”归并
        var weak = {};
        items.forEach(function (it) {
          if (it.result === 'first') return;
          var ls = Y.content.lessonOf(it.q);
          var k = Y.content.skillLabel(it.q.skill) + (ls ? '（' + (ls === '习作' ? ls : '《' + ls + '》') + '）' : '');
          weak[k] = true;
        });
        var wk = Object.keys(weak);
        if (wk.length) {
          box.appendChild(h('div.sum-weak', h('p', '这几个地方再练练会更棒：'), h('ul', wk.map(function (k) { return h('li', k); }))));
        } else {
          box.appendChild(h('p.sum-sub', '每一题都是一次就答对，真了不起！'));
        }
        if (opts.onFinish) {
          try { opts.onFinish({ pct: pct, first: first, second: second, total: scored.length }, box); } catch (e) { /* 忽略 */ }
        }
        if (Y.checkNewBadges) Y.checkNewBadges(box);
        box.appendChild(h('div.sum-actions',
          h('a.btn.primary', { href: opts.againHref || location.hash, onclick: function (e) { if ((opts.againHref || location.hash) === location.hash) { e.preventDefault(); Y.router.resolve(); } } }, '再来一轮'),
          h('a.btn', { href: opts.back }, '返回')));
        stage.appendChild(box);
        window.scrollTo(0, 0);
      }

      show();
    }
  };
})(window.YuwenIsland);
