# 语文岛 · 四年级上册复习闯关

给四年级孩子在手机上复习**统编版（2026 秋新教材）四年级上册语文**的互动网页。纯静态站点，不联网、不登录、不收集数据，进度只保存在本机浏览器里。

> 当前进度：**阶段 2**。已完成：项目骨架、首页地图、通用题型、反馈系统、🏯 古诗文背诵馆、第一至四单元（知识卡、练一练、闯关测验、特色互动）。第五至八单元、专项岛、错题本、每日一练、徽章、完整家长页会在后续阶段补上。

## 怎么打开

- **电脑上**：直接双击 `index.html` 就能用（不需要装任何东西）。
- **手机上**：用 GitHub Pages 发布后，用手机浏览器打开网址，可以“添加到主屏幕”。

## 发布到 GitHub Pages

1. 把代码合并到 `main` 分支。
2. 打开仓库的 **Settings → Pages**。
3. **Source** 选 “Deploy from a branch”，**Branch** 选 `main`，文件夹选 `/ (root)`，点 **Save**。
4. 等 1～2 分钟，页面顶部会出现访问地址，格式是：
   `https://<你的 GitHub 用户名>.github.io/<仓库名>/`
   比如仓库叫 `yuwen4a`，地址就是 `https://用户名.github.io/yuwen4a/`。

仓库根目录有一个空文件 `.nojekyll`，让 GitHub Pages 原样发布所有文件，不要删。所有路径都是相对路径，放在子目录里也能用。

## 目录结构

```
index.html              页面入口（按顺序加载下面的脚本）
css/style.css           样式（颜色都是 CSS 变量，自动跟随浅色/深色模式）
js/core/                核心：命名空间、存储、音效、朗读、路由、判分、题型、答题引擎、题库汇总
js/widgets/             互动组件：拖拽、排序、分栏、断句、渐进遮字背诵
js/pages/               各个页面
data/islands.js         12 座岛的名称、图标、颜色
data/poems.js           古诗文：原文、注释、要点、题库
data/units/u1.js …     各单元：知识卡、语文要素、特色互动、题库
data/words.js           生字词（等待补录）
tests/                  自动测试（node --test）和手动检查清单
```

## 内容规则（家长请留意）

- **唯一的教材依据**是根目录的 `knowledge-yuwen-4a.md`。古诗文原文和它逐字一致（包括标点），`tests/poems.test.js` 会自动比对。
- 来自教材的内容标 `source: "textbook"`；自己编写的练习材料或讲解标 `source: "original"`。
- 不确定、需要对照课本的内容标 `needsCheck: true`：孩子那边正常显示，**家长页**里会列出“待核对清单”。核对无误后把它改成 `needsCheck: false` 即可。
- 现代文课文不录入全文（版权原因），只录篇名、作者、概要、学习重点。

## 家长怎样修改或新增题目

题目都写在 `data/` 下的 `.js` 文件里，用记事本或任何文本编辑器就能改。古诗文的题在 `data/poems.js` 每篇诗文的 `questions` 数组里。复制一道现有的题，改内容即可。

各单元的题在 `data/units/u1.js` 等文件的 `Y.data.banks.u1` 数组里，用了简写形式，参数顺序是：

```js
//       编号         篇目     考什么            题干           选项                 答案      提示     讲解     其他（可省略）
B.single('u1-gc-1', '观潮', 'lesson-content', '……被称为：', ['天下奇观', '……'], '天下奇观', '提示', '讲解', { d: 2, source: 'original' })
```

知识卡在同一个文件的 `cards` 里：`points` 只能放知识清单里的原话（测试会逐字检查），自己补充的提醒写进 `tips`。

《繁星》三次看星的时间词和感受，知识清单里没有，在 `data/units/u1.js` 的 `table` 里留了空：把 `time`、`feeling` 填上，练习里会自动多出配对题。

每道题的格式：

```js
{
  id: 'mjy-w9',               // 唯一编号，不能和别的题重复
  skill: 'poem-word',         // 考什么（决定“同类题”和薄弱点总结），可选值见 js/core/content.js 的 SKILLS
  type: 'single',             // 题型，见下表
  difficulty: 1,              // 难度 1~3
  prompt: '“残阳”指的是：',     // 题干
  data: { options: ['快落山的太阳', '早晨的太阳', '中午的太阳'] },
  answer: '快落山的太阳',
  hint: '题目里的“暮”就是傍晚。',        // 第一次答错时显示
  explanation: '“残阳”是快落山的太阳。',  // 第二次答错或答对后显示
  source: 'textbook'          // 来自教材写 textbook，自己编的写 original
  // needsCheck: true          // 拿不准就加上，家长页会列出来
}
```

| 题型 `type` | `data` 怎么写 | `answer` 怎么写 |
|---|---|---|
| `single` 单选 | `{ options: ['甲', '乙', '丙'] }` | `'甲'` |
| `multi` 多选 | `{ options: [...] }` | `['甲', '丙']` |
| `judge` 判断 | `{}` | `true` 或 `false` |
| `blank` 字块填空 | `{ template: '一道残阳{}水中，', tiles: ['铺', '浦', '捕'], poem: true }`（`{}` 是空格，`poem: true` 用古诗字体） | `['铺']` |
| `input` 自由输入 | `{ placeholder: '在这里输入' }` | `'答案'`，可加 `acceptable: ['其他写法']` |
| `order` 排序 | `{}` | 正确顺序 `['第一', '第二', '第三']` |
| `match` 连线配对 | `{ leftTitle: '字词', rightTitle: '意思', extra: ['干扰项'] }` | `[['曰', '叫作'], ['溺', '淹没']]` |
| `columns` 分栏归类 | `{ columns: ['唐', '宋'] }` | `{ '《出塞》': '唐', '《雪梅》': '宋' }` |
| `segment` 断句 | `{ text: '王戎七岁尝与诸小儿游' }`（不带标点） | `'王戎七岁/尝与诸小儿游'`，多种合理断法写进 `acceptable: [...]` |
| `selfcheck` 默写自查 | `{ front: '正面提示', back: '背面答案' }` | 答案文字 |
| `story3` 起因经过结果 | `{ columns: ['起因','经过','结果'], summaries: ['主要内容选项', ...] }` | `{ place: { '片段': '起因', ... }, summary: '正确的主要内容' }` |
| `tianji` 田忌赛马 | `{ king: ['上等马','中等马','下等马'], speed: {...} }` | 能赢的出场顺序 |

改完后建议跑一下测试（电脑装了 Node.js 就行，不用装别的）：

```bash
node --test
```

测试会检查：原文是否逐字一致、选择题答案是否在选项里、选项有没有重复、排序/配对/断句题是否有合法答案、待核对清单是否完整。

## 补录生字表

仓库里还没有课本照片，所以生字表、词语表、语文园地日积月累都**没有录入**（不能自己编）。有两种补录方式：

1. **拍照**：把课本的识字表、写字表、词语表、各单元语文园地拍照，放进仓库的 `textbook-photos/` 文件夹，让 Claude Code 识别后录入，家长再核对一遍。
2. **手动录入**：编辑 `data/words.js`，在 `lessons` 里按课添加：

```js
Y.data.words = {
  lessons: [
    {
      lesson: '观潮', unit: 1,
      recognize: [{ char: '潮', pinyin: 'cháo' }],                    // 会认字
      write: [{ char: '潮', pinyin: 'cháo', words: ['潮水'] }],        // 会写字
      words: [{ word: '天下奇观', pinyin: 'tiān xià qí guān' }],        // 词语表
      source: 'textbook', needsCheck: true
    }
  ],
  garden: []   // 语文园地·日积月累
};
```

## 本地数据

- 进度保存在浏览器的 `localStorage` 里，键名都以 `yw4a:` 开头。
- 换手机、换浏览器、清除浏览器数据后，进度不会跟过去。
- 浏览器不让保存时（比如部分无痕模式），照样能做题，只是关掉页面就不记得了。

## 技术约束

- HTML + CSS + 原生 JavaScript，不用框架、不用构建工具、不用 ES module（全部挂在 `window.YuwenIsland` 下）。
- 零外部依赖：不引用 CDN、网络字体、外部图片、统计脚本。音效用 Web Audio 现场合成，朗读用浏览器自带的 Web Speech（不支持的浏览器会隐藏朗读按钮）。
- 移动优先，375px 宽为基准；兼容 iOS Safari、安卓 Chrome、微信内置浏览器。
