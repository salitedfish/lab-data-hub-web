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

## 卡片列表页排版约定（device / product / protocol / component / engine / scheduledEngine / devicelink 七页统一）

这七个页面都是「卡片 + 悬浮分页条」的列表，**排版一律按下面这套写，不要再回退到 `el-row`/`el-col`**：

1. **容器用 CSS Grid，不用 Element 栅格**：`.card-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:20px }`，`@media` 在 1200→3 列、992→2 列、576→1 列。
   Element 的 `el-row`/`el-col` 是 **float 布局**（`.el-col-*{float:left}`），同行卡片高度不一时下一行的首卡会**卡进上一行最短卡的位置、落到错误列**（用户报的「上面一行卡片太高，下面一行就排到后面去了」就是这个）。`el-row--flex` 没有 `flex-wrap`，救不了。
2. **必须给栅格子项加 `min-width: 0`**（`.card-grid > *`、`> * > *`、`> * > * > *` 三级都写）。栅格子项默认 `min-width:auto`，卡片里 `.value`/`.protocol-name` 这类 `white-space:nowrap` 文本的 **min-content 会把 `1fr` 列撑宽** —— 协议页实测算出 `795/788/791/779px` 的列宽，而容器只有 1034px，卡片整体溢出视口三四倍，而且**列宽还各不相同**。光靠 `overflow:hidden` 挡不住（它是子元素上的，撑宽发生在栅格子项这一级）。
3. **卡片做成纵向 flex 列 + 底栏 `margin-top:auto`**，同行卡片等高、底部按钮才能落在同一条线上：
   ```scss
   .xxx-card { display:flex; flex-direction:column; height:100%; }
   .xxx-card ::v-deep .el-card__body { flex:1; display:flex; flex-direction:column; }
   .card-content { flex:1; }          /* 内容撑满，把底栏顶到底部 */
   .card-actions { margin-top:auto; }
   ```
4. **底栏按钮**：`justify-content:center` + `flex-wrap:wrap` + `gap:8px 6px`，按钮 `.action-btn{padding:5px 8px; margin-left:0 !important}`。
   `flex-wrap` 不能省 —— 数据转发页 4 个按钮在 4 列布局下放不下，没有换行时 `删除` 被裁得只剩图标。`margin-left:0` 是抵掉 Element 的 `.el-button+.el-button{margin-left:10px}`，否则换行后首列缩进不齐。`justify-content` 用 `center` 不用 `space-around`，否则换行后的行按钮会被推到两端。
5. **容器 `margin-bottom: 100px`**：`.pagination-wrapper` 是 `position:fixed; bottom:20px` 的悬浮层（约 92px 高），不做底部留白时最后一行卡片会被盖住。（历史上这个留白写在错类名 `.product-card-container` 上，四个页面白留了。）
6. 设备/产品页的底栏类名是 `.card-footer-actions`，协议/组件/引擎族是 `.card-actions`。

## 常用命令

```bash
npm install
npm run dev          # 本地开发，端口 8888
npm run build:prod   # 生产构建
npm run build:stage  # 预发构建（--mode staging）
```

## 主 tab 页面缓存（keep-alive，2026-10-19 开启）

`src/layout/components/AppMain.vue` 已启用 `<keep-alive :include="cachedViews">`，切换 tabs 不再销毁页面、筛选/滚动等状态保留。生效必须同时满足三点：

1. **组件 `name` 与路由 `name` 完全一致**（区分大小写）。后端路由 name 取 `sys_menu.route_name`，为空则取 `capitalize(path)`（见 `SysMenuServiceImpl#getRouteName`）。已对齐：`Product` / `Device` / `Map` / `DeviceGroup` / `Protocol` / `ComponentList` / `Engine` / `Devicelink` / `ScheduledEngine` / `LinkageRecord`。
2. **菜单 `is_cache = '0'`**（0=缓存，1=不缓存）。路由 meta 的 `noCache = (is_cache == '1')`，为 true 时不会进 `cachedViews`。本次把 2042/2043/2044/2046/2050 五个菜单从 1 改成了 0。
3. **不在 `meta.noCache` 白名单里**。详情页（`DeviceDetail` / `ProductDetail` / `ComponentDetail` / `EngineDetail` / `DevicelinkDetail` / `ScheduledEngineDetail`）和首页 `Index` 在 `src/router/index.js` 里显式标了 `noCache: true`：详情页靠 query 区分对象、同一 path 切换会复用实例；首页是实时看板。

⚠️ **不要给组件起名 `Component`** —— Vue 会报 `Do not use built-in or reserved HTML elements as component id: Component`。网络组件页路由名已由后端 `route_name=ComponentList` 指定，组件 name 同步为 `ComponentList`。

⚠️ **改完菜单/路由 name 要刷新页面**：路由由登录后 `getRouters()` 一次性拉取，HMR 不会重新请求。单个缓存页要清状态，用 tab 右键「刷新页面」（走 `/redirect` 并清 `cachedViews`）。

## 联调配置

- 后端地址：`vue.config.js` 中 `baseUrl = http://127.0.0.1:8085`，开发环境通过 devServer proxy 转发（HTTP `/dev-api` 与 WebSocket `/ws` 均代理到该后端）。
- WebSocket：`src/utils/websocket.js` 的 `getWebSocketUrl` 未配置 `VUE_APP_WS_BASE_URL` 时跟随当前页面地址；**路径前缀由 `VUE_APP_WS_PATH_PREFIX` 控制**（留空 = 默认 `/ws`，开发环境即如此，经 devServer `/ws` 代理转发到后端同端口；`.env.production` 设为 `/prod-hub-ws`，避开过于通用的 `/ws`）。完整地址 = `ws(s)://<页面主机><前缀>/<type>/<id>`。
- ⚠️ **生产部署必须自己代理该前缀，否则实时数据不刷新**：dev 能连是因为 `vue.config.js` devServer 有 `"/ws": { target: baseUrl, ws: true }`；生产没有 devServer，而 `getWebSocketUrl` 拼的是 **站点根路径** 下的 `<前缀>/<type>/<id>`（不在 `/lab_data_hub/` 子路径、也不在 `/prod-hub-api/` 里），所以 Web 服务器上要单独加一条 `location /prod-hub-ws/` → `proxy_pass http://127.0.0.1:8085/ws/`（**结尾必须是 `/ws/`**，把前缀换回后端真实端点），并带 `proxy_http_version 1.1` + `Upgrade`/`Connection` 头。**`proxy_read_timeout` 必须放大**（默认 60s 会把空闲的实时通道掐断，表现为「连上能用一会儿就不动了」）。参考配置：`文档/部署-nginx反向代理示例.conf`。症状识别：页面其余功能全正常、只有设备详情「实时数据」不动，切到物模型 tab 再切回来才变（那是 `handleTabClick` 里的 HTTP `getPropertyList` 在刷新，不走 WS），Network 面板 WS 分类下能看到失败请求。后端端点 `/ws/{type}/{sign}`（`WebSocketServer`）**不校验 token**，所以与登录态无关。
- `publicPath`：`/lab_data_hub/`（生产部署路径，构建/上传时保持一致）。
- 接口请求前缀通过环境变量 `VUE_APP_BASE_API` 控制（`.env.*` 文件）。

## Brother 协议点位表

- `src/utils/brotherTcpPoints.js` 内置 Brother NC 点位表，覆盖 **PDSP / WKCNTR / PRD3 / MEM / PANEL / MONT / PRDC2 / PRGN / ALARM** 九个数据区（语义点位 → 协议地址 数据区.行号.字段序号）。数据来源：PDSP 来自开源 BrotherAdapter 的 ProductionData3.json（与通讯手册交叉核对；注意真机 G01/M01 行序与表内不完全一致，坐标/倍率已真机核对）；WKCNTR、PRD3、**MEM**（A01 运行状态：程序号/加工状态/内托盘/模式）、**PANEL**（D01 门 / K01 面板开关 / S01 倍率+急停+门互锁+数据保护）来自**真机 LOD 实测结构**。地址约定与后端 `BrotherTcpDataReader` 一致：行号 1 起、字段序号为 Symbol 后第 1 个值起。**MONT/PRDC2/PRGN/ALARM 四个区为树根参照补齐（2026-08-26）**：树根 `RootLink.DC.Protocol.BrotherTcp.dll` 的 ReadPowerOnTime/ReadOperateTime→GetMontrParams(MONT)、ReadCuttingTime→GetPrdc2Info(PRDC2)、ReadProgramLineNumber/ReadProgramContent→GetPrgn(PRGN)、ReadAlarm→GetAlarmState+GetMem(ALARM)，字段位置反汇编推断、行号按标准单行取 1；**本机 LOD MONT/PRGN/PRDC2 返回空帧（PLCD/TOLSD 亦空帧），这些点位在本机读不到数据，地址待支持机型真机 LOD 采样确认；ALARM 无报警时空帧**，真实行结构待有报警时实测。VER 区为静态机型/版本/机身号，未收录点位，手动地址模式可选（`VER.1.1` 机型 / `VER.3.1` 机身号）。
- `components/BrotherTcpConfig.vue` 配置抽屉据此提供**两级语义点位选择**：先选「点位类型」（按 数据区.行号 分组，`pointType` 值为 `数据区|行号`，如 `PDSP|4` P01 机械坐标 / `WKCNTR|1` A01 工件计数1），再选「点位」下拉（按分组过滤，选项右侧灰显符号地址）。选点自动填 标识(code=点位 key)/数据区/行号/字段序号 并展示符号地址/协议地址/建议数据类型；`pointType`/`pointKey` 为表单 model 字段（均有 `prop`，避免必填项校验报 undefined）。ALARM 及自定义地址走「手动指定地址」模式。选点填入的 `code` 需在「物模型」tab 建同名属性（identifier）数据才能按 dataType 正确解析。
- **设备详情页**（`src/views/business/device/detail.vue`）：「实时数据」tab 实时值由 `/ws/device/{sn}` WebSocket 推送更新（WS 地址跟随页面地址），初始值由 `getDeviceLastData` 拉取；实时通道自带**自动重连**（`connectSocket` / `handleSocketClosed`，延迟按 2s×次数 递增退避、上限 `maxReconnectAttempts`），实时数据表头有**连接状态标签**（`socketStatusText` / `socketStatusTagType`：绿=已连接、橙=连接中·重连中、红=断开·未连接），组件销毁时 `closeSocket` 停掉重连，切回「实时数据」tab 会清零重连计数重新拉起一次 —— 连接失败不再是静默的（原先 `onError` 只打印控制台、页面无任何提示）；「历史数据」弹窗表格含 **属性名/属性值** 两列（解析日志 `properties` JSON 中 `DecodeMessage.properties` 对象，标识符映射物模型显示名），查询的「属性名称」过滤项传 `propertyName`（物模型 identifier）给后端 `/business/deviceLogs/list` 过滤。定时读取开关状态来自后端 `device.modbusRead`（切换时由后端 `readSwitchByDevice` 持久化）。**「定时读取」开关在「Modbus配置」tab（`#pane-modbusConfig`）里，不在物模型 tab**：未激活的 `el-tab-pane` 是 `display:none`，此时开关 `offsetWidth=0`（点了没反应、也不会发 `readSwitchByDevice`）—— 页面点测/排查要先点 `[aria-controls="pane-modbusConfig"]` 切到该 tab 再操作。物模型 tab 右上角另有「**写值记录**」按钮（`api/business/pointWriteRecord.js` → `/business/pointWriteRecord/list`）：弹窗含 序号/设备/点位名称/标识符/写入值/来源/结果/时间 八列（序号列用 `type="index"`，按当前页从 1 起，与 `tool/gen/index.vue` 一致）+ 属性名称/来源/结果/时间范围筛选 + 分页，`create_time` 倒序。**列宽要给弹性列 `min-width`、不能全写死 `width`**：全写死时列宽之和小于弹窗宽度，表格右侧会空出一条；留几个 `min-width` 列让 el-table 分配余量，表格才占满弹窗（末尾的 来源/结果/时间 保持固定 `width`）。**该按钮不加 `v-if`，所有协议共用同一入口**（协议解耦，「所有协议都一样」指的是记录页不按协议分叉，不是所有协议都能写）。失败行把错误码与原因挂在 `el-tag` 的 `el-tooltip` 上，悬停可见；「重置」只清筛选并回第 1 页、**保留每页条数**（与 RuoYi 其它列表一致）。

## PLC 协议配置组件（Modbus / S7-1200 / OMRONFINS / 三菱 MC）

PLC 寄存器协议不能预置点位表（见下「设计原则」），四个配置抽屉都是**手动地址录入**。本次「读」能力补全后：

- `components/ModbusConfig.vue`：新增「功能码」下拉（**01线圈 / 02离散输入 / 03保持寄存器 / 04输入寄存器**，默认 03），列表列 + 编辑回显带；提交时 JS 校验功能码 ∈ 上述四值。「读取后延迟」`prop="delayTime"`（原错标为 `intervalTime`，配置的延迟实际不生效）。`registerRange` 只允许单个区间（`0` 或 `0-3`），后端会把一个 code 的多区间合并为 `[minStart, maxEnd]` 单块读取，保证该 code 只出一个属性值。
- `components/S71200TcpConfig.vue`：新增「区类型」下拉（**DB数据块 / M标志位 / I输入区 / Q输出区**，默认 DB），列表列 + 编辑回显带；映射后端 `area_type` 列 → `DaveArea`（DB/FLAGS/INPUTS/OUTPUTS）。「读取后延迟」`prop="delayTime"` 修复。
- `components/OmronFinsTcpConfig.vue`：存储区 `areaCode` 从裸十六进制数字输入改为「存储区」下拉，**字区码与位区码分两组成对出现**（`WORD_AREA_ITEMS` / `BIT_AREA_ITEMS`，默认 DM区）—— 字区：CIO区 `0xB0` / WR区 `0xB1` / H区(HR) `0xB2` / A区(AR) `0xB3` / DM区 `0x82` / EM当前库 `0x98`；位区：CIO位 `0x30` / WR位 `0x31` / H位(HR) `0x32` / A位(AR) `0x33` / DM位 `0x02` / EM当前库位 `0x18`。**EM 库 0-15 用 `for` 循环展开**（字区 `0xA0-0xAF`「EM库0..15」/ 位区 `0x20-0x2F`「EM库0..15位」，手写 32 行没必要）。列表列显示区名（`areaCodeName` 数字→区名映射）+ **「位号」列**（`bitAddress`，字区显示 `—`）。**选中位区时动态显示「位号」输入框**（`v-if="isBitAreaSelected"`，placeholder 注明「位号 0-15（位区必填，是地址的第 3 字节）」），**切换存储区时自动清空 `bitAddress`**（字区带位号会被后端拒；区码与位号配错了不是报错、而是读写到别的地方去）；提交时 JS 校验位区必填位号且 0-15。标题修复为 `OMRONFINS_TCP配置`；开关 `prop="enabled"`（原拼错 `evalnabled`，开关恒关）；「读取后延迟」`prop="delayTime"` 修复。**区码勘误（2026-09-19）**：旧的「IR区 0x88」**已删除**（0x88 实为 CNT 计数器区，CS/CJ 系列没有 IR 区）、旧「H区 0x31」也是错的（0x31 是 WR 的**位**码）—— 区码填错设备不报错、只会静默读写到另一个区，所以按 W342 内存区指定表卡死，与后端 `FinsDataReader.BIT_AREA_CODES` / `LabdatahubOmronFinsConfigController#checkConfig` 保持一致。组件/协议页下拉均含 `OMRONFINS_TCP`，**组件动态配置默认端口 9600**；设备/产品详情页出现 `OMRONFINS_TCP配置` tab（`v-if="component?.netType == 'OMRONFINS_TCP'"`）。
- `components/MitsubishiMc3eTcpConfig.vue`：新增三菱 MC 配置组件。软元件 `areaCode` 用「软元件类型」下拉（**字设备 D/W/R/ZR/SD；位设备 M/L/B/X/Y/S/SM/F**，值=十六进制代码，默认 D），列表列显示软元件名（`areaCodeName` 数字→名称映射）；选 X/Y 软元件时起始地址下方提示「X/Y 地址为八进制」；2026-08-29 曾加过「协议类型」下拉（`3E`/`1E`）与列表「协议类型」列，**2026-09-19 协议拆分时已一并删除** —— 3E / 1E / A-1E 现在是三个独立 netType、各自单独上传，帧模式不再是配置项，这个下拉本就是「一个 netType 混两种帧」的产物；标题 `MITSUBISHI_MC3E 点位配置（TCP / UDP 通用）`（2026-10-22 改名，原 `MITSUBISHI_MC3E_TCP配置`）；路由前缀 `/business/mitsubishiMc3eTcp`（`src/api/business/mitsubishiMc3eTcp.js`）；组件/协议页下拉均含 `MITSUBISHI_MC3E_TCP` 与 **`MITSUBISHI_MC3E_UDP`**（后者同一套 3E 帧走 UDP，供应商网关如 `192.168.3.15:5040`），组件动态配置默认端口 5007（UDP 现场按网关填，常见 5040）；设备/产品详情页出现 `Mitsubishi_MC3E配置` tab（`v-if` 同时接受 `MITSUBISHI_MC3E_TCP` / `MITSUBISHI_MC3E_UDP`）。**起始地址输入支持 `150` / `D150` / `D150.0`（2026-10-22）**：带字母前缀时自动映射 `areaCode`（D/W/R/ZR/SD/M/L/B/X/Y/S/SM/F，`areaCodeMap`），`.n` 解析为 `bitIndex`（字内位号 0-15，仅字设备），位点位 `length` 强制为 1；提交前 JS 校验（`validateMitsubishiForm`，不用 rules）、列表「起始地址」列按 `areaCode+startAddress+bitIndex` 回显为 `D150.0`。三菱 MC 是 PLC 寄存器协议，**不能预置点位表**，手动地址录入。

三个组件定时读取开关状态来自后端 `device.modbusRead`（切换时 `readSwitchByDevice` 持久化），消费端均消费 `delayTime`（读取后延迟毫秒）。**编码收敛（六个配置组件 Modbus/S7/Fins/Mitsubishi/Brother/Fanuc 一致）**：异步一律 `async/await` + `try/catch/finally`（禁止 `.then()`）；等值判断用 `==`；表格行操作按钮（编辑/删除）用 `editLoading == row.id` / `deleteLoading == row.id` 独立 loading + `disabled`（避免点一行整列一起转圈）；抽屉提交按钮带 `submitLoading`；分页 `@current-change`/`@size-change` 写回 `pageNum`/`pageSize`（size 变化重置 pageNum=1），修复翻页/改每页条数不生效问题。

## 物模型「写值」（写方向 UI）

- **入口**：设备详情页「物模型」tab 表格行内「写值」按钮（`src/views/business/device/detail.vue`）→ `LabdatahubDeviceController#pointValue`，来源标 `manual`；openapi 那条 `POST /openapi/v1/device/pointValue` 来源标 `api`。**两条入口共用后端同一条链路，前端只负责收集一个值。**「写值记录」弹窗（同 tab 右上角）与写值按钮一样**不加 `v-if`、所有协议共用**，netType 只作为数据列。
- **弹窗按物模型 dataType 分派输入控件**：`number` → `el-input-number`（类名 `write-input-ctrl`）、`bool` → `el-switch`、其余 → `el-input`。`openWriteDialog(row)` 里的初值按类型给：bool 给 `false`、number 给 **`undefined`**、其余给空串。
- ⚠️ **数字类型只能给 `undefined`，不能给 `null`**（2026-09-19 页面实测踩到，**影响所有可写协议的写值弹窗**）：`el-input-number` 收到 `null` 会做 `Number(null)` 归一成 **0**，后果有两个 —— ① 弹窗一打开 `writeValue` 就是 0、输入框显示 `"0"`，用户不开输入直接点「确定」，**0 就被静默写进 PLC**；② 用户敲进非法内容（如 `abc`）时，`el-input-number` 在失焦时回退到 `currentValue`，看着输入框里是 `abc`、实际提交的还是 0，**且全程没有任何提示**。Element 的 value 观察器对 `undefined` 短路（不做 `Number()`），才能留住「没填」这个状态、由 `submitWrite` 的非空校验（`writeValue === null || === undefined || === ""`）拦下。**后端没问题**：直调 openapi 传 `abc`/`1.5`/`null`/`true` 都正确返回 422，这个坑纯粹在前端控件的归一行为上。
- ⚠️ **接口报错提示走 `Notification` 还是 `Message`，取决于错误码**（点测断言选择器必须对，否则会误判成「前端没提示」）：`src/utils/request.js` 的响应拦截器里（`request.js:106-122`）—— `code === 500` 走 `Message({type:'error'})`；`code === 601` **看 `msg` 里有没有换行**（2026-10-10 起）：**含换行走 `Notification.warning({duration:0})`**（选择器 `.el-notification`，右上角**长驻**不自动消失，`\n` 转成 `<br/>`，用于后端给的多行诊断如协议包加载失败的「可能原因 / 处理办法」）、**一句话的仍走 `Message({type:'warning'})`**（`.el-message`，3 秒 toast）；**`code !== 200` 的其余全部（400/404/409/422/503/504）走 `Notification.error({ title: msg })`**（选择器 **`.el-notification`**，右上角弹条，**不是** `.el-message`）。写值的错误码几乎全落在最后这档（422 值非法、503 组件未开、504 设备侧异常），**点测断言要用 `.el-notification`** —— 抓 `.el-message` 会取到空数组，容易误判成「前端根本没提示」。**601 现在两种都可能**：断言前先看后端那条 `msg` 是不是多行的。

## FANUC FOCAS2 协议点位表

- `src/utils/fanucTcpPoints.js` 内置 FANUC FOCAS2（台丽 CNC / FANUC 0i-MF Plus）点位表，覆盖 **axis 坐标 / spindle 主轴 / feed 进给 / mode 操作模式 / status 运行状态 / prgnum 程序 / exeprgname 主程序名 / alarm 报警 / tcode 刀具 / timer 时间 / count 产量 / diag 诊断号 / override 倍率 / macro 宏变量(#500-#999) / pmc PMC信号** 共 554 个语义点位。**FOCAS2 官方语义（2026-08-25 按官方 Fwlib64.h 全面修正）**：坐标 `axis` param2=1 机械 2 绝对 3 相对 4 剩余，后端映射 fwlib type 1/0/2/3（值 = data/10^dec）；操作模式 `mode` = `ODBST.aut`（0=MDI 1=MEM 2=*** 3=EDIT 4=HANDLE 5=JOG 6=Teach JOG 7=Teach HANDLE 8=INC 9=REF 10=RMT 11=TEST）；`status` 运行/停止/急停/自动分别按 run==START/run==STOP、emergency、aut==MEM 判定；`alarm` 报警数量 = `cnc_rdalmmsg` 的 num 输出条数（不是报警号），报警文本多条取最后一条（GBK 解码）；`tcode` 刀具号经系统宏变量 **#3901 当前刀具 / #3902 下一把** 读取（FOCAS2 无直接读刀具函数），**宏值必须按 10^dec_val 换算（#3901 刀具 44 存为 mcr_val=440000000/dec=7）**；**主轴倍率按 FANUC 标准梯形图约定读 PMC G30**（SOV0-SOV7，值即百分比，后端 `spindle` param1=2 直接 pmc_rdpmcrng 读 G30，台丽真机实测 G30=100）；**进给/快速倍率同约定读 PMC G12/G14**（`override` 点位，后端 pmc_rdpmcrng 读整字节，值即百分比）；**顺序号 `cnc_rdseqnum`、主程序名 `cnc_exeprgname`**（此前误标"无直接读取函数"，2026-08-26 起已实现读取）；**产量 `count`**（param1=0 総加工数/总产量 1 稼働程序加工数/当日产量 2 特定加工数/目标产量，对应树根 WorkPartAllCount / WorkPartCount / RequiredPartCount）——**2026-08-26 起后端改自研 FOCAS2 报文客户端读系统参数 6712（总）/6711（当日）/6713（目标）**（fwlib cnc_rdcount 返回+3、cnc_rdparam 返回+4 被台丽机拒绝；报文负载第 3 字段 len 必须为 0 才被机床接受——这是树根能读、fwlib 不能读的根因，详见 api CLAUDE.md FANUC 段落）。**真机验证（2026-08-26）**：6711=44（当日加工 44 件）/6712=2989（总产量，昨 2946+今 43≈2989）/6713=0（目标）；**主轴温度 `diag` 读诊断号 403**（cnc_diagnoss，树根实际配置值；标准 0i 中 403 常为第 4 轴负载，台丽机是否为主轴温度待真机确认）。**真机实测（2026-08-26 台丽 0i-MF Plus）**：受控轴 4 根 X/Y/Z/A（cnc_rdaxisdata len 输出确认，B/C 返回 null）、四类坐标均有效（dec=3）、#500-509 未使用宏返回 0 不报错、F1/F0/G8 实测字节 0x80/0x40/0x31（位含义以机床 PMC 梯形图为准）、**G30 实测 100（主轴倍率 100%）**。地址模型与后端 `FanucFocasDataReader` 一致：**协议地址 = 采集项类型.参数1.参数2**（如 `axis.1.1` = X 轴机械坐标，未用参数省略，如 `mode`）。数据来源为 FANUC FOCAS2 官方 fwlib 读取函数族（cnc_rdaxisdata/cnc_acts/cnc_rdspload/cnc_actf/cnc_statinfo/cnc_rdprgnum/cnc_rdseqnum/cnc_exeprgname/cnc_rdalmmsg/cnc_rdmacro/cnc_rdtimer/cnc_rdcount/cnc_diagnoss/pmc_rdpmcrng）；**JNA 结构体字段偏移第一次真机/NCGuide 验证后需核对修正**；PMC 完整点位待真机验证后补充（点位表先给常见 F1/F0/G8）。
- `components/FanucTcpConfig.vue` 配置抽屉据此提供**两级语义点位选择**：先选「点位类型」（按采集项 readType 分组，如 axis 坐标 / spindle 主轴 / macro 宏变量），再选「点位」下拉（选项右侧灰显符号地址）。选点自动填 标识(code=点位 key)/采集项(readType)/参数1/参数2 并展示符号地址/协议地址/建议数据类型；`pointType`/`pointKey` 为表单 model 字段。手动模式输入 readType（采集项下拉）/参数1/参数2（axis/pmc 才需参数2）。选点填入的 `code` 需在「物模型」tab 建同名属性（identifier）数据才能按 dataType 正确解析。协议路由前缀 `/business/fanucTcp`（`src/api/business/fanucFocas.js`）。**count 产量 param1 允许 0（0=总产量 1=当日产量 2=目标产量），前端空值校验用 `param1 === ""` 判断（2026-08-26 修复：原 `param1 == ""` 在 JS 中 `0 == ""` 为 true，会把合法的 param1=0 误判为空拒绝保存——总产量配置报"参数1不能为空"的根因）。**
- **组件/协议页面**：`src/views/business/component/index.vue` 与 `src/views/business/protocol/index.vue` 的协议类型下拉均含 `FANUC_TCP`；组件动态配置模板含 服务器IP/端口(默认8193)/连接超时/FOCAS2库路径(可选，不填自动搜索常见目录)。设备/产品详情页出现 `Fanuc_TCP配置` tab（`v-if="component?.netType == 'FANUC_TCP'"`）。
- **后续加点位从树根解包挖**：树根 RootDCService 安装包解包目录 `C:\树根平台\msi_out\`（本机）。FANUC 点位参考反汇编 `RootLink.DC.Protocol.Focas.dll`（驱动实现：函数/参数/诊断号，P/Invoke 真名在 ImplMap ImportName、调用方 ldc 常量）与 `RootLink.UI.Protocol.Focas.dll`（UI 点位清单/显示名）；Brother 用 `RootLink.DC.Protocol.BrotherTcp.dll` / `RootLink.UI.Protocol.BrotherTcp.dll`。挖掘脚本 `C:\Users\20357\AppData\Local\Temp\TestFwlib\diag_scan.py`（dnfile 扫 IL）。语义对应均需真机核对。

## Mitsubishi CNC TCP 协议点位表

- `src/utils/cncTcpPoints.js` 内置三菱 CNC MELDAS MOCHA（`MITSUBISHI_CNC_TCP`，TCP 683）点位表。**2026-10-15 真机（192.168.151.103:683）逐条读通后大改过一轮**，下面是改后的口径：
  - **规模**：**48 个语义点位 = 18 静态点 + 5 轴点×6 轴**（原 49/19 —— `axc` 已从语义表移除，见下）。分组 `CNC_TCP_GROUPS` = `coord` 坐标 / `state` 运行状态 / `prog` 程序与刀具 / `speed` 速度与代码 / `timing` 时间与计数 / `load` 轴负载（原 `poscnt` 组改名为 `timing`）。
  - **7 个显示名原来错了，已按树根 `MitsubishiNcTcpPacket.dll` 各读点方法的错误串 + 实测值纠正**（原稿按名字猜的语义）：`po`=**上电时间**(105923901ms≈29.4h，不是"位置")、`opt`=**运行时间**(≈13.3h，不是"操作倍率")、`cut`=**切削时间**、`sl1`=**主轴负载**(不是"状态1")、`ss1`=**主轴转速**(1201rpm，不是"状态2")、`stn`=**程序步序号**(37，不是"主轴转速")、`sv`=**S代码**(1200，不是"主轴速度")、`fv`=**F代码**(60.0，不是"进给倍率")、`spn`=**子程序名**(`9001`，不是"主轴号")、`pn`=**主程序名**(`O0613`)、`st`=**主轴温度**(37℃)、`cc`=**工件总计数**(88)。树根点位表 17 键为准绳：`pst opm fre pn spn cc sl1 ss1 tn stn cut po opt st cur sv fv`。
  - **`axc`/`al`/`ct` 三个键树根没有、语义未证实**，点表里都带「未证实」字样：`axc` 与 `pst` **同址**（35.10，仅 dataType 不同而 dataType 被机床忽略）且回包**逐字节相同**，是 `pst` 的重复项 —— **已从 `CNC_TCP_READTYPE_NAMES` 语义表移除**（后端地址保留，老配置仍读得到）；`al` 回 u8、本机恒 0；`ct` 实测**每秒 +1**（117→157 走 40 秒、偶有跳变归零），**不是计数**。
  - **树根的 `cur`（程序内容）本表没有** —— 它走单独操作 `mochaGetCurrentPrgBlockFirst`，尚未破解（见 api CLAUDE.md 的三菱 CNC 段）。
  - ⚠️ **`dataType` 只是"建议数据类型"**：机床**忽略**请求里的 DataType，回包类型是数据区自己的（实测 `axc` 请求 1 回 2、`cc` 请求 4 回 3、`st` 请求 3 回 2、`fv` 请求 3 回 6）。静态点已按**实测回包类型**填（不再按逆向稿的请求类型），轴点 `cu`/`sp` 由 `float` 改成 `int`。它决定的是物模型那边怎么解，改它不影响机床返回什么。
  - 轴点 `mechpos`/`currpos`/`remapos`（机械/当前/相对坐标 Section37）+ `cu`/`sp`（Section59），axisNo 1-6=X/Y/Z/A/B/C；实测值与描述的对应关系写在各点位 `desc` 里。点位 key 格式 `cnc_<readType>`（非轴点）/`cnc_<readType>_<轴小写>`（轴点，如 `cnc_mechpos_x`）；`cncTcpAddress(point)` → `readType[.axisNo]`（协议地址）；`isAxisReadType` 判定轴类点位（前端用它控制轴号输入框显示）。**列表「采集项」列显示的是原始 `readType`**，所以从语义表移除一个键只影响语义选点下拉、不影响老配置的回显。地址模型与后端 `MitsubishiCncDataReader` 一致：**协议地址 = readType 或 readType.轴号**。
- `components/MitsubishiCncTcpConfig.vue` 配置抽屉据此提供**两级语义点位选择**（同 FanucTcpConfig.vue）：先选「点位类型」（6 语义分组，`pointType`=group），再选「点位」下拉（轴点选项右侧灰显轴名）。选点自动填 标识(code=点位 key)/采集项(readType)/轴号 并展示协议地址/建议数据类型；手动模式输入 readType（采集项下拉）+ 轴号（轴类点位才需要，`isAxisReadType` 判定）；提交时 JS 校验 readType 必填、轴类点位轴号 1-6。标题 `Mitsubishi_CNC_TCP配置`；路由前缀 `/business/mitsubishiCncTcp`（`src/api/business/mitsubishiCncTcp.js`）；组件/协议页下拉均含 `MITSUBISHI_CNC_TCP`，组件动态配置默认端口 683；设备/产品详情页出现 `Mitsubishi_CNC_TCP配置` tab（`v-if="component?.netType == 'MITSUBISHI_CNC_TCP'"`）。选点填入的 `code` 需在「物模型」tab 建同名属性（identifier）数据才能按 dataType 正确解析。
- **机型 / NC 型（2026-10-15 加）** — 机型**不改变协议族**，所以它是**参数不是新协议**；它决定**取哪张语义点位表**。⚠️ **但别指望从树根抄第二张表**：2026-10-15 反汇编复核确认，树根 `MitsubishiNc*` 族**只有一个机型取值 `MELDAS700m`**、点位表也只有机型无关的一张（`AllAddressManage.InitialMazakCNCRegsiter`），`_ncType` 只当 9 个读点方法的布尔门闩。此前那句「树根同一驱动靠 `lstModel` 下拉吃多个机型」是**没有证据的推断，已作废**（`lstModel` 只是 lambda 局部捕获变量、`KeyTextModel` 是每个协议插件都有的通用键值下拉模型）。所以本节的机型分表是**我们自己的扩展位**，不是照树根的结构做的。取证见根 CLAUDE.md「树根解包参考」。三处落点：
  - **配置项存在「网络组件」上**（`other_config.model`，与 `ipAddr`/`port`/`timeout` 同一份 JSON）。**不是协议**：`labdatahub_protocol` 一行 = 一个上传的 jar、全局共享，机型挂上去等于「这个 jar 是 M80 的」，而实际只有一个 jar 吃所有机型，且同一平台同接 M70/M80 没法表达。**也不是设备**：改 IP 的入口在产品页的「网络组件」（设备侧无自选入口），机型与 IP 必须一起改才不会漂移；设备记录还会被自注册/复制重建。后端 `MitsubishiCncTcpConfig` 加了同名字段（**后端不按机型分支**，`MitsubishiCncDataReader` 一个字节没动）。
  - **`utils/cncTcpPoints.js` 按机型分表**：新增 `CNC_TCP_MODELS`（`m70` M70/M700 系 / `m80` M80/M800 系 / `unknown` 未确认机型，各带 `desc` 与 `hasOwnTable`）与 `CNC_TCP_POINT_TABLES` + `getCncTcpPointTable(model)` + `findCncTcpModel(model)`；`findCncTcpPoint(readType, axisNo, model)` 加了**可选第三参**（不传按 `CNC_TCP_DEFAULT_MODEL` = m70）。⚠️ **除 m70 外都还没有逆向证据**（m80/`unknown` 的 `hasOwnTable=false`，暂共用 M70 表）—— 补证据时只需把 `CNC_TCP_POINT_TABLES` 里那一项指到它自己的表，抽屉/选点/回显代码无需改。`m80`/`unknown` 一律能在 `msi_out` 里零命中（见根 CLAUDE.md），别当成"已经支持"。
    - **2026-10-15 有一台标着 `m80` 的真机（192.168.151.103:683）用 M70 表全通了** —— 24 个协议地址全部 `code=0`、读回的值自洽（详见本文件「Mitsubishi CNC TCP 协议点位表」与 api CLAUDE.md）。⚠️ **但这是单机观测，不是型号对照结论**：机型是网络组件里**手选的下拉值、不是从机床读的**（协议侧无读型号的地址）—— 但该机 **2026-10-15 已在机床面板上确认确为 M80**；仍没有 M70 真机对照，「两型号点表一致」无从证明。**接第二台 M80 要逐台验，别假定通用** —— 型号不同而某键语义变了的话，地址照样回 `code=0`，只会静默读回一个看着合理的错值。
  - **`MitsubishiCncTcpConfig.vue` 加了 `model` prop**（由两个详情页以 `:model="cncModel"` 传入，`cncModel` 是各自 `computed` 里解析 `component.otherConfig.model` 得来），抽屉顶部有一条**只读**机型展示条：未设置写「未设置」而不是冒充 m70，未设置或 `!hasOwnTable` 时再补一行橙色提示（说明暂按 M70/M700 点位表工作）。机型**不在该抽屉里改** —— 唯一入口是「网络组件」页，避免两处不同步。
  - **`views/business/component/index.vue`**：三菱 CNC 的动态配置模板块里加了「机型 / NC型」下拉（`v-if="form.netType === 'MITSUBISHI_CNC_TCP'"`，选项右侧灰显 `desc`，沿用同块 FANUC `libPath` 的"共享块内按 netType 条件显示"写法），提交时 **JS 校验必填**（`this.$modal.msgError("请选择机床机型 / NC型")`，不用 `rules`，与同文件 MQTT_BROKER 的特殊校验同一写法）。⚠️ **存量组件的 `other_config` 里没有 `model`，编辑保存时会被这里拦下要求补选一次**（故意如此：不补的话点表由谁兜底是隐式的，读不到值时无从判断是机型不对还是地址不对）。
    - ⚠️ **红星要加 `class="is-required"`，不能加 `required` 属性**（2026-10-15 实测踩到）。`el-form-item` 的 `required` **属性不只是画红星**：Element 的 `FormItem.getRules()` 会拿它**追加一条裸规则** `{required: true}`，而这个表单的 `dynamicRules` 里没有 `dynamicConfig.model` 条目 → 提交时先弹一句英文的 `dynamicConfig.model is required`（裸规则没有 `message`，Element 回退成 prop 路径），`submitForm` 里那句中文 JS 提示**永远轮不到**。改成 `class="is-required"` 后红星照旧（`::before{content:'*';color:#F56C6C}`，实测 `content="*"` / `rgb(245,108,108)`）、规则为空、中文提示正常。**同文件其他项（组件名称/网络类型/状态）看着也写了 `required`，但它们同时有带 `message` 的 `dynamicRules` 条目兜底，第一条错误就是中文的**，所以只有新加的这项会露英文 —— 往这个表单加必填项时按本条办。

## 网络组件页：批量启停 与 `request.js` 的 `silentError`（2026-10-16 实装并页面验收）

**入口**：`views/business/component/index.vue` —— 工具栏「批量启动 / 批量停止」两个按钮 + 卡片标题左侧的勾选框 + 「全选本页」。

- **选中态按 id 存**（`selectedIds`，**不是对象**）：列表刷新/翻页后对象就过期了，而批量时要按 `status` 过滤，拿过期对象会漏处理或重复处理。`selectedCards` 是**计算属性、没有 setter** —— 要改选中集合必须写 `this.selectedIds = …`（`handleDelete` 里那行已跟着改；写回 `this.selectedCards = []` 在严格模式下会直接抛）。
- **页面侧分批并发调「既有的单组件接口」**，没有加后端批量接口，两个原因：① 组件开启是**同步建连**，单个最长要等满建连探针超时（默认 3 秒，见 api 的 `ModbusConnectionManager#probeReachable`），上百个交给后端同步跑必然超过前端 10 秒的 axios 超时；② 交给后端异步跑，页面就拿不回「哪个成功、哪个失败」。批大小 `BATCH_CONCURRENCY = 5`（与浏览器对同一主机的并发连接数同量级）。
- **进度有两处**：工具栏的「批量处理中 n/总数」（响应式绑 `batchDone`，能给出细粒度进度）+ 一条长驻 `$message`（每个 chunk 改写一次文案，`finally` 里必定 `close()`）。
- **勾选里本来就已经是目标状态的会被过滤掉**；全都已处于目标状态时只提示「所选组件均已处于「X」状态」并**直接 return** —— 实测**一个请求都不会发**。
- **失败的汇总通知是 `duration: 0` 长驻**（要让人看清是哪些组件失败了，自动消失反而读不完），并在**下一批开头先 `closeBatchNotify()` 关掉上一条** —— 否则连跑几批就在右上角叠成一摞。`closeBatchNotify` 里对 `close()` 做了 try/catch：用户已手动点「×」时句柄指向的实例已销毁，别为了一条提示把批量带崩。
- **`silentError`（`utils/request.js` 新增的可选配置，默认关闭）**：批量时逐条弹 601 提示会叠成一堵墙，所以每条请求带 `{ silentError: true }`，由调用方收齐后统一汇总。它**只关掉「每个请求各自的提示」，不改变成败语义** —— 仍然 reject，并且**把后端 msg 带出去**（原本 601 / 非 200 分支只 reject 一个 `'error'`，调用方汇总时拿不到原因；控制台里 `Error: 开启失败，请检查配置信息是否正确` 这个形态就是这条通路）。**401 不受影响**：登录态过期必须弹重登框。
- **验收过的断言**（页面真实操作）：5 选混合结果 `成功 2 个，失败 3 个：…`（逐张独立 loading、进度 n/5、列表自动刷新）；全失败 `成功 0 个，失败 2 个：…`；**整轮 `.el-message` 始终只有 1 条**（我方那条长驻进度条，两条 601 一条 toast 都没弹）；对已处于目标状态的组件批量操作 → **XHR 探针实测 0 请求**；全选/取消 → 5/5 → 0，提示与按钮 `disabled` 联动正常。（失败时可逐个点名的那条通知：`$notify({type:'warning', duration:0})`。）

**启动自愈说明**（2026-10-21）：工具栏「批量停止」右侧一个 `el-icon-info` 图标，`el-tooltip`（`effect="dark"`、`placement="bottom-start"`）**悬停显示**整套规则（首轮失败每 60 秒重试、10 分钟封顶、期间手动关闭即取消、超时后保持停用需手动开启），**不占卡片区版面**。文案须与后端 `ComponentStartupRetryer` 保持一致 —— 改默认值（`application.yml` 的 `labdatahub.component.startup-retry.*`）时同步改这里。

## 规则引擎节点表单：产品范围「弹窗搜索 + 分页勾选」（2026-10-21）

`views/business/engine/ef/node_form.vue`（规则引擎详情页 `detail.vue` 与旧版 `ef/panel.vue` 共用）的「设备日志 / 设备预警」节点，右侧表单里的「产品范围」**不能再一次性 `listProduct({pageSize: 100000})`** —— 产品一多，接口载荷和下拉 DOM 会把页面拖死。做法：

- **表单上只放一行**：`选择产品` 按钮 + `已选 N 个` + `清空`。**不在按钮下面铺已选产品标签**（产品一多，标签列表既看不全也删不干净）—— 增删统一进弹窗。
- **弹窗（`el-dialog` 720px，append-to-body）**：搜索框（产品名称，回车/点搜索/清空都查第 1 页）+ `el-table`（高度 360，列：手动勾选框 / 产品名称 / 产品编号）+ `el-pagination`（total/prev/pager/next）。勾选写在**草稿 `productDraft`（SN → 名称）**里，跨页、跨搜索都保留；表头复选框 = **全选本页**（半选态随当前页勾选情况变化）；点「确定」才写回 `configData.productScope`（数组，只存 SN）与 `productNameMap`，点「取消」直接丢弃。**要删某个产品 = 重新打开弹窗搜到它、取消勾选、确定**。
- ⚠️ **表头插槽必须写 `v-slot:header`，不能写 `slot="header"`**（Vue 2.6 的普通插槽 vs 作用域插槽）。`el-table-column` 的表头只认作用域插槽：`table-column.js#setColumnRenders` 里 `column.renderHeader = (h, scope) => this.$scopedSlots.header(scope)`，而 `table-header.js` 是在**表头自己的 `render`** 里调它。写 `slot="header"` 时它只是父组件（本文件）`render` 产出的普通 VNode，`$scopedSlots.header` 是 `$slots` 的代理、返回预先渲染好的节点 —— 父组件 `render` 时读一次 `pageAllChecked` 就定死，`productDraft` 变了表头**不会**重渲染，全选框一直停在上一次的状态（2026-10-21 用户报的「全选按钮没有根据本页的全选状态变化」即此）。写成 `v-slot:header` 会编进 `scopedSlots`（`_u([{key:"header", fn…}])`），在表头 `render` 里执行，依赖才挂到表头的渲染 watcher 上。同类表头自定义（列头放 checkbox / 按钮）都要按这条写。
- **回显不拉全量**：`productNameMap` 随节点配置保存，回显直接用；`productList` / `deviceList` 保存时置 `null`，不把上千条产品写进流程配置。
- **产品删除后自动剔除**：节点初始化时 `syncSelectedProducts()` 把已选 SN 以 `productSnList` 逗号串传给 `GET /business/product/list`（后端按 `product_sn IN (...)` 过滤）—— 返回里没有的 SN 就是「产品管理里已删掉的产品」，从 `productScope` / `productNameMap` 里移除并 `console.warn` 提示。若后端（老版本）没有这条过滤（返回结果里出现范围外的 SN），回退到 `resolveProductsOneByOne()` 按 SN 逐个查；**逐个查时请求失败保留原名称**（网络抖动不能当产品被删，否则会把配置删掉）。
- 产品范围变了会调 `getDeviceByProductSnList()` 刷新「设备筛选」候选，并把已选设备 `deviceSnList` 中不再属于这些产品的 SN 剔除。
- 「设备筛选」下拉仍是按产品范围一次拉全（后端只有 `getDeviceByProductSn` 一个接口），已加 `filterable` + `collapse-tags`；设备量特别大时需另加远程接口。
- **节点编辑面板去掉了「保存」按钮（2026-10-21）**：面板字段 `v-model` 绑的 `configData` 与 `node.configData` 是**同一对象**，改动即时进流程数据，落库统一走右上角「保存」（`detail.vue#saveConfig`）；原来那个面板「保存」对已有节点是空转（同一引用赋回去 + 拷贝没人编辑的 `node.name/left/top`）。删它时配了两处：① `node_form.vue` 的 `watch.configData` —— `configData` 换成新对象（打开新建节点生成默认配置、点「重置」置空）时同步挂回 `data.nodeList` 里的节点，**否则新建节点/重置后的改动只存在游离对象里，右上角保存时丢失**；② 面板保存原本顺带把 `productList`/`deviceList` 查询缓存置空，现已挪到 `saveConfig()` 对所有节点统一清，避免全量设备列表随流程配置写库。**别把面板「保存」加回来**。`重置` 代码没动（`this.configData = {}`），靠上面的 watcher 让它真正清空节点配置。
- ⚠️ `devicelink/ef/node_form.vue`、`scheduledEngine/ef/node_form.vue` 是同一套老写法（面板「保存」+ 同一引用绑定 + 新建节点不挂 `configData`），同样存在「保存空转、不点保存新建节点丢配置」的隐患，2026-10-21 **未动**，只改了规则引擎这一份。

## 为什么有些协议能预置点位表（设计原则）

平台点位配置有两条路线，取决于**协议层是否自带"数据点"语义**——即数据点是不是协议/固件定义好的固定对象：

1. **能预置语义点位表的协议（CNC：Brother / FANUC）**：数据点由数控系统厂商在协议/固件层面定义，语义固定，且同品牌同系列所有机型一致。
   - Brother：`PDSP.4.1` 就是机械坐标 X、`WKCNTR.1.1` 就是工件计数 1，任何一台兄弟机都长这样；
   - FANUC：`axis.1.1` 就是 X 轴机械坐标、`status.1` 就是运行状态，任何一台 FANUC 系统都长这样。
   - 所以可以把「语义点位 → 协议地址」的映射表**全局预置一份**（`src/utils/brotherTcpPoints.js` / `src/utils/fanucTcpPoints.js`），前端选点自动填 标识/地址，后端只校验地址合法性（`LabdatahubXxxConfigController#validateConfig`），不感知点表内容。
2. **不能预置、只能手动配地址的协议（PLC 寄存器：Modbus / S7 / Fins / 三菱 MC）**：协议只定义**怎么读**——功能码 + 地址 + 字节序 + 数据类型（如 Modbus `功能码03 + 寄存器 40001 + 两字节大端`），**不定义读的是什么**。一个地址代表什么（温度？转速？某个状态位？），由每台设备各自的 PLC 程序（梯形图 / 寄存器分配表）决定：同一台设备改个梯形图含义就变，不同设备之间毫无通用性。这类地址语义只能由实施工程师查设备手册手动录入，无法全局预置。

**判断一条新协议走哪条路，先问：协议文档里有没有一份"点位清单"，写明有哪些语义点位、每个怎么读？**
- 有（数控系统、部分变频器/电表等标准化产品）→ 可做预置点位表；若该品牌全部机型通用，做全局表；
- 只有读法、没有语义（通用 PLC 寄存器）→ 走手动地址配置；若某 PLC 厂商公开了固定寄存器映射表，可另做**项目级**点位表（仅覆盖该品牌已公开的寄存器，仍按手动地址模式留兜底）。

**边界与特例：**
- FANUC PMC 的 F/G 地址**不是** FOCAS2 固件定义的，而是机床 PMC 梯形图定义的——与 PLC 寄存器同性质。所以 `fanucTcpPoints.js` 的 pmc 分组只给常见示例（F1/F0/G8），标注"待真机验证"，完整点位需按机床梯形图补充。
- Brother 点表本身也是逆向工程（PDSP 来自开源 BrotherAdapter，MEM/PANEL 来自真机 LOD 实测）。之所以"一次逆向、全品牌复用"，正是因为 CNC 协议的数据点语义是固件内建的；PLC 寄存器协议没有这个前提，逆向一台设备的寄存器表换台设备就得重来。

## 编码规范（重要）

1. **异步操作一律用 `async/await` + `try/catch/finally`**，catch 打印错误，finally 重置状态。**禁止 Promise 链式调用**（`.then()` / `.catch()`）。
2. **按钮手动触发的异步操作**：按钮加 `loading` 状态，同时设置 `disabled` 和 `loading`。
3. **等值判断一律用 `==`**，不用 `===`。
4. **表单必填校验不用 `rules`**：必填红星仍要显示，校验用 JS 判断后通过提示组件（`this.$message` / `this.$msg`）提示。
5. **接口对接时页面结构不要改变**：列表列保持不变，字段名用接口返回的字段名，接口没有的字段不额外添加。
6. **分页列表操作按钮**：`disabled` 和 `loading` 不能用同一个属性控制；每行按钮用行数据唯一标识（如 `row.id`）做独立 loading，避免点一行导致整列按钮同时 loading/disabled。
7. **表格行内操作按钮**：文字左侧加图标（`el-icon-view` / `el-icon-edit` / `el-icon-delete` 等），用 `size="mini"`，按钮间保持适当间距。
8. **表单里"后加的属性"必须写进对象字面量**（Vue2 响应式陷阱，网络组件「复制」踩过）：`this.form = { ...data, id: null }` 之后再 `this.form.dynamicConfig = {}` 属于**给已 observe 的对象新增属性** —— Vue2 不为它装 getter/setter，后续所有赋值都不触发重渲染。而 `el-input` 的 `handleInput` 里有 `$nextTick(setNativeInputValue)`，会拿**上一次渲染时的旧 prop 值**写回输入框，于是「其余配置」里刚敲进去的内容下一个 tick 被顶回旧值（模型已更新、输入框回退），要动一下上面任何响应式字段（如组件名称）才同步过来。`component/index.vue` 的 `data()` / `reset()` / `handleUpdate` 都把 `dynamicConfig` 写在字面量里所以没事，只有 `handleCopy` 漏了（2026-10-14 修）。**新增类似的预填/回显逻辑时，子对象一律写在字面量里**。
9. **「复制」只复制配置，不复制运行时状态**（2026-10-19 修）：`handleCopy` 用 `{...data}` 预填新增表单时，`status` 这类**运行时状态**必须显式重置为 `"0"`——组件 `status`（0 停用 / 1 启用）被带过去，保存走 `add` 接口后端看到 `status="1"` 会立刻尝试建连并启用副本；设备 `status`（0 离线 / 1 在线）被带过去，新设备从没收到过数据、组件也没启动，却会一直显示在线（离线只能由组件掉线事件写库，而它没上线过、不会有这个事件）。新增其他带运行时状态的实体（如规则引擎 `isEnable`）复制时同理。
