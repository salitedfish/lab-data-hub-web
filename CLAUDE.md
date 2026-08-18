# lab-data-hub-web

物联网平台管理后台前端（RuoYi-Vue 体系，Vue 2）。

## 技术栈

- Vue 2.6 + Vuex 3 + Vue Router 3
- Element UI 2.15
- axios（request 封装在 `src/utils/request.js`）
- 可视化/大屏：echarts、vue-count-to
- 视频/流媒体：flv.js、hls.js、mpegts.js、video.js
- 其他：vue-codemirror、quill、jsencrypt、js-cookie、splitpanes、vuedraggable、dayjs、moment、nprogress
- 构建：Vue CLI 4 + sass

## 目录结构

```
src/
├── api/           # 接口封装（business / system / monitor / tool / login / menu）
├── assets/
├── components/
├── directive/
├── layout/        # 布局
├── router/        # 路由
├── store/         # vuex
├── utils/         # request.js、auth.js 等工具
└── views/         # 页面（business / system / monitor / tool / dashboard / login）
```

## 常用命令

```bash
npm install
npm run dev          # 本地开发，端口 8888
npm run build:prod   # 生产构建
npm run build:stage  # 预发构建（--mode staging）
```

## 联调配置

- 后端地址：`vue.config.js` 中 `baseUrl = http://192.168.0.47:8081`，开发环境通过 devServer proxy 转发。
- `publicPath`：`/lab_data_hub/`（生产部署路径，构建/上传时保持一致）。
- 接口请求前缀通过环境变量 `VUE_APP_BASE_API` 控制（`.env.*` 文件）。

## 编码规范（重要）

1. **异步操作一律用 `async/await` + `try/catch/finally`**，catch 打印错误，finally 重置状态。**禁止 Promise 链式调用**（`.then()` / `.catch()`）。
2. **按钮手动触发的异步操作**：按钮加 `loading` 状态，同时设置 `disabled` 和 `loading`。
3. **等值判断一律用 `==`**，不用 `===`。
4. **表单必填校验不用 `rules`**：必填红星仍要显示，校验用 JS 判断后通过提示组件（`this.$message` / `this.$msg`）提示。
5. **接口对接时页面结构不要改变**：列表列保持不变，字段名用接口返回的字段名，接口没有的字段不额外添加。
6. **分页列表操作按钮**：`disabled` 和 `loading` 不能用同一个属性控制；每行按钮用行数据唯一标识（如 `row.id`）做独立 loading，避免点一行导致整列按钮同时 loading/disabled。
7. **表格行内操作按钮**：文字左侧加图标（`el-icon-view` / `el-icon-edit` / `el-icon-delete` 等），用 `size="mini"`，按钮间保持适当间距。
