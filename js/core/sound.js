/* 音效：Web Audio API 现场合成，不加载任何音频文件。 */
(function (Y) {
  'use strict';

  var ctx = null;
  function ac() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch (e) { ctx = null; }
    return ctx;
  }

  function tone(freq, start, dur, type, gain) {
    var c = ac(); if (!c) return;
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    var t0 = c.currentTime + start;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain || 0.18, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }

  var SOUNDS = {
    tap: function () { tone(660, 0, 0.08, 'triangle', 0.08); },
    correct: function () { tone(784, 0, 0.16, 'sine'); tone(1046.5, 0.1, 0.26, 'sine'); },
    // 答错音要温和：低一点、短一点，不刺耳
    wrong: function () { tone(330, 0, 0.18, 'triangle', 0.1); tone(294, 0.12, 0.2, 'triangle', 0.08); },
    star: function () { [523.3, 659.3, 784, 1046.5].forEach(function (f, i) { tone(f, i * 0.09, 0.3, 'sine', 0.15); }); },
    flip: function () { tone(520, 0, 0.06, 'square', 0.04); }
  };

  Y.sound = {
    /** 第一次点按时解锁（iOS 必须在用户手势里 resume） */
    unlock: function () {
      var c = ac();
      if (c && c.state === 'suspended') { try { c.resume(); } catch (e) { /* 忽略 */ } }
    },
    play: function (name) {
      if (!Y.settings.get().sound) return;
      try { Y.sound.unlock(); if (SOUNDS[name]) SOUNDS[name](); } catch (e) { /* 忽略 */ }
    }
  };
})(window.YuwenIsland);
