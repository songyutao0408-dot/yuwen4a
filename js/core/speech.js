/* 朗读：Web Speech API，中文（zh-CN）、较慢语速。
 * 浏览器不支持（比如部分微信内置浏览器）时 supported=false，页面隐藏朗读按钮。 */
(function (Y) {
  'use strict';

  var synth = window.speechSynthesis;
  var supported = !!(synth && window.SpeechSynthesisUtterance);
  var voice = null;
  var runId = 0;

  function pickVoice() {
    if (!supported) return;
    try {
      var vs = synth.getVoices() || [];
      voice = vs.filter(function (v) { return /zh[-_]CN/i.test(v.lang); })[0] ||
        vs.filter(function (v) { return /^zh/i.test(v.lang); })[0] || null;
    } catch (e) { voice = null; }
  }
  if (supported) {
    pickVoice();
    try { synth.addEventListener('voiceschanged', pickVoice); } catch (e) { /* 旧浏览器 */ }
  }

  function speakOne(text, rate, done) {
    var u = new window.SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN';
    if (voice) u.voice = voice;
    u.rate = rate || 0.75;
    var finished = false;
    function fin() { if (finished) return; finished = true; clearTimeout(guard); done && done(); }
    u.onend = fin;
    u.onerror = fin;
    // 有的浏览器不触发 onend，按字数估一个保底时间
    var guard = setTimeout(fin, 1500 + text.length * 450 / (rate || 0.75));
    synth.speak(u);
  }

  Y.speech = {
    supported: supported,
    /** 设置里关掉朗读，也当作不可用 */
    enabled: function () { return supported && Y.settings.get().speech; },

    speak: function (text, opts) {
      opts = opts || {};
      if (!Y.speech.enabled()) { opts.onDone && opts.onDone(); return; }
      Y.speech.stop();
      var id = ++runId;
      speakOne(text, opts.rate, function () { if (id === runId && opts.onDone) opts.onDone(); });
    },

    /** 逐句朗读，每读一句回调 onLine(i)，便于高亮 */
    speakLines: function (lines, opts) {
      opts = opts || {};
      if (!Y.speech.enabled()) return;
      Y.speech.stop();
      var id = ++runId, i = 0;
      (function next() {
        if (id !== runId) return;
        if (i >= lines.length) { opts.onLine && opts.onLine(-1); opts.onDone && opts.onDone(); return; }
        opts.onLine && opts.onLine(i);
        speakOne(lines[i], opts.rate, function () { i++; setTimeout(next, 250); });
      })();
    },

    stop: function () {
      runId++;
      if (supported) { try { synth.cancel(); } catch (e) { /* 忽略 */ } }
    }
  };
})(window.YuwenIsland);
