/* 启动：应用设置、休息提醒、开始路由。最后加载。 */
(function (Y) {
  'use strict';

  Y.applySettings = function () {
    var s = Y.settings.get();
    document.documentElement.setAttribute('data-font', s.fontSize === 'large' ? 'large' : 'normal');
  };
  Y.applySettings();

  // iOS 需要在第一次点按时解锁音频
  document.addEventListener('pointerdown', function once() {
    Y.sound.unlock();
    document.removeEventListener('pointerdown', once);
  });

  /* 连续使用 25 分钟，温和提醒休息（只在页面可见时计时） */
  var REST_MS = 25 * 60 * 1000;
  var used = 0, last = Date.now();
  setInterval(function () {
    var now = Date.now();
    if (document.visibilityState === 'visible') used += Math.min(now - last, 60000);
    last = now;
    if (used >= REST_MS && !document.querySelector('.modal-wrap')) {
      used = 0;
      Y.ui.modal({
        icon: '🍵', title: '已经学了 25 分钟啦',
        body: '站起来走一走，看看窗外远处的绿色，让眼睛休息一下吧。',
        buttons: [{ label: '好的，休息一下', cls: 'primary' }, { label: '再学一会儿' }]
      });
    }
  }, 15000);

  // 离线缓存：只在 http(s) 下注册（GitHub Pages）；本地双击打开或单文件版不注册
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !window.YUWEN_BUNDLE) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () { /* 不支持就算了 */ });
    });
  }

  Y.router.start();
})(window.YuwenIsland);
