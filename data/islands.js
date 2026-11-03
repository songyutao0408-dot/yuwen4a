/* 语文岛地图：8 个单元岛 + 4 个专项岛。
 * stage：在第几个开发阶段完成内容（用于“建设中”提示）。 */
(function (Y) {
  'use strict';
  Y.data.islands = [
    { id: 'u1', unit: 1, name: '自然之美', icon: '🌊', color: '#2f7fa3', stage: 2, lessons: '观潮 · 现代诗二首 · 繁星' },
    { id: 'u2', unit: 2, name: '提问小能手', icon: '🤔', color: '#c27a1d', stage: 2, lessons: '一个豆荚里的五粒豆 · 夜间飞行的秘密 · 方帽子店 · 田忌赛马' },
    { id: 'u3', unit: 3, name: '观察家', icon: '🌿', color: '#4c8a3d', stage: 2, lessons: '古诗三首 · 爬山虎的脚 · 蟋蟀的住宅' },
    { id: 'u4', unit: 4, name: '神话世界', icon: '🐉', color: '#b0473b', stage: 2, lessons: '盘古开天地 · 精卫填海 · 普罗米修斯 · 女娲补天' },
    { id: 'u5', unit: 5, name: '把事情写清楚', icon: '⛰️', color: '#6d6aa8', stage: 3, lessons: '麻雀 · 爬天都峰 · 习作例文' },
    { id: 'u6', unit: 6, name: '世界文化遗产', icon: '🧱', color: '#a0662b', stage: 3, lessons: '长城 · 颐和园 · 秦兵马俑' },
    { id: 'u7', unit: 7, name: '成长故事', icon: '🌱', color: '#3d8f7d', stage: 3, lessons: '王戎不取道旁李 · 牛和鹅 · 一只窝囊的大老虎 · 陀螺' },
    { id: 'u8', unit: 8, name: '家国情怀', icon: '🌅', color: '#c0392b', stage: 3, lessons: '古诗三首 · 为中华之崛起而读书 · 延安，我把你追寻' }
  ];
  Y.data.specials = [
    { id: 'poems', name: '古诗文背诵馆', icon: '🏯', color: '#9b3b2f', stage: 1, href: '#/poems', desc: '6 首古诗 · 2 篇文言文' },
    { id: 'words', name: '字词乐园', icon: '🔤', color: '#2d7d9a', stage: 4, desc: '拼音 · 多音字 · 近反义词' },
    { id: 'sentences', name: '句子工坊', icon: '✍️', color: '#7a5aa6', stage: 4, desc: '修辞 · 句式 · 病句' },
    { id: 'writing', name: '习作小助手', icon: '📮', color: '#b5683a', stage: 4, desc: '8 篇习作指导 · 提纲' }
  ];
})(window.YuwenIsland);
