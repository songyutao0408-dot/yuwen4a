/* 测试辅助：在 Node 的 vm 沙箱里按顺序加载数据和纯逻辑脚本（不需要浏览器、不装依赖）。 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

/** 与 index.html 中加载顺序一致的、不依赖 DOM 的脚本 */
const PURE_SCRIPTS = [
  'js/core/ns.js',
  'js/core/grade.js',
  'js/core/qbuild.js',
  'data/islands.js',
  'data/poems.js',
  'data/words.js',
  'data/units/u1.js',
  'data/units/u2.js',
  'data/units/u3.js',
  'data/units/u4.js',
  'data/units/u5.js',
  'data/units/u6.js',
  'data/units/u7.js',
  'data/units/u8.js',
  'data/sentences.js',
  'data/writing.js',
  'js/core/content.js',
  'js/core/learn.js'
];

function load(extra) {
  const sandbox = { console };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  PURE_SCRIPTS.concat(extra || []).forEach((rel) => {
    const file = path.join(ROOT, rel);
    if (!fs.existsSync(file)) return;
    vm.runInContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: rel });
  });
  return sandbox.YuwenIsland;
}

function read(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

module.exports = { load, read, ROOT, PURE_SCRIPTS };
