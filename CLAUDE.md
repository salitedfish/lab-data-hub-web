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

- 后端地址：`vue.config.js` 中 `baseUrl = http://127.0.0.1:8085`，开发环境通过 devServer proxy 转发（HTTP `/dev-api` 与 WebSocket `/ws` 均代理到该后端）。
- WebSocket：`src/utils/websocket.js` 的 `getWebSocketUrl` 未配置 `VUE_APP_WS_BASE_URL` 时跟随当前页面地址（开发环境经 devServer `/ws` 代理转发到后端同端口，本地/局域网访问均可）；`.env.development` 已置空该变量。
- `publicPath`：`/lab_data_hub/`（生产部署路径，构建/上传时保持一致）。
- 接口请求前缀通过环境变量 `VUE_APP_BASE_API` 控制（`.env.*` 文件）。

## Brother 协议点位表

- `src/utils/brotherTcpPoints.js` 内置 Brother NC 点位表，覆盖 **PDSP / WKCNTR / PRD3 / MEM / PANEL** 五个数据区（语义点位 → 协议地址 数据区.行号.字段序号）。数据来源：PDSP 来自开源 BrotherAdapter 的 ProductionData3.json（与通讯手册交叉核对；注意真机 G01/M01 行序与表内不完全一致，坐标/倍率已真机核对）；WKCNTR、PRD3、**MEM**（A01 运行状态：程序号/加工状态/内托盘/模式）、**PANEL**（D01 门 / K01 面板开关 / S01 倍率+急停+门互锁+数据保护）来自**真机 LOD 实测结构**。地址约定与后端 `BrotherTcpDataReader` 一致：行号 1 起、字段序号为 Symbol 后第 1 个值起。**ALARM 暂无点位**（机床无报警时 LOD ALARM 返回空帧，真实行结构待有报警时实测补充）。VER 区为静态机型/版本/机身号，未收录点位，手动地址模式可选（`VER.1.1` 机型 / `VER.3.1` 机身号）。
- `components/BrotherTcpConfig.vue` 配置抽屉据此提供**两级语义点位选择**：先选「点位类型」（按 数据区.行号 分组，`pointType` 值为 `数据区|行号`，如 `PDSP|4` P01 机械坐标 / `WKCNTR|1` A01 工件计数1），再选「点位」下拉（按分组过滤，选项右侧灰显符号地址）。选点自动填 标识(code=点位 key)/数据区/行号/字段序号 并展示符号地址/协议地址/建议数据类型；`pointType`/`pointKey` 为表单 model 字段（均有 `prop`，避免必填项校验报 undefined）。ALARM 及自定义地址走「手动指定地址」模式。选点填入的 `code` 需在「物模型」tab 建同名属性（identifier）数据才能按 dataType 正确解析。
- **设备详情页**（`src/views/business/device/detail.vue`）：「实时数据」tab 实时值由 `/ws/device/{sn}` WebSocket 推送更新（WS 地址跟随页面地址），初始值由 `getDeviceLastData` 拉取；「历史数据」弹窗表格含 **属性名/属性值** 两列（解析日志 `properties` JSON 中 `DecodeMessage.properties` 对象，标识符映射物模型显示名），查询的「属性名称」过滤项传 `propertyName`（物模型 identifier）给后端 `/business/deviceLogs/list` 过滤。定时读取开关状态来自后端 `device.modbusRead`（切换时由后端 `readSwitchByDevice` 持久化）。

## 编码规范（重要）

1. **异步操作一律用 `async/await` + `try/catch/finally`**，catch 打印错误，finally 重置状态。**禁止 Promise 链式调用**（`.then()` / `.catch()`）。
2. **按钮手动触发的异步操作**：按钮加 `loading` 状态，同时设置 `disabled` 和 `loading`。
3. **等值判断一律用 `==`**，不用 `===`。
4. **表单必填校验不用 `rules`**：必填红星仍要显示，校验用 JS 判断后通过提示组件（`this.$message` / `this.$msg`）提示。
5. **接口对接时页面结构不要改变**：列表列保持不变，字段名用接口返回的字段名，接口没有的字段不额外添加。
6. **分页列表操作按钮**：`disabled` 和 `loading` 不能用同一个属性控制；每行按钮用行数据唯一标识（如 `row.id`）做独立 loading，避免点一行导致整列按钮同时 loading/disabled。
7. **表格行内操作按钮**：文字左侧加图标（`el-icon-view` / `el-icon-edit` / `el-icon-delete` 等），用 `size="mini"`，按钮间保持适当间距。
