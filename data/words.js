/* 生字词（字词乐园用）。
 * 仓库里还没有课本照片（textbook-photos/），所以这里先留空，不自己编生字表。
 * 家长补录方法见 README.md 的“补录生字表”一节。补录的内容请都标 needsCheck: true，核对无误后可改为 false。
 *
 * 字段示例：
 * { lesson: '观潮', unit: 1,
 *   recognize: [ { char: '潮', pinyin: 'cháo' } ],        // 会认字（识字表）
 *   write:     [ { char: '潮', pinyin: 'cháo', words: ['潮水'] } ],  // 会写字（写字表）
 *   words:     [ { word: '天下奇观', pinyin: 'tiān xià qí guān' } ], // 词语表
 *   source: 'textbook', needsCheck: true }
 */
(function (Y) {
  'use strict';
  Y.data.words = {
    lessons: [],
    // 各单元“语文园地·日积月累”，同样等待补录
    garden: []
  };
})(window.YuwenIsland);
