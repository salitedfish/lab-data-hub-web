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

## PLC 协议配置组件（Modbus / S7-1200 / OMRONFINS / 三菱 MC）

PLC 寄存器协议不能预置点位表（见下「设计原则」），四个配置抽屉都是**手动地址录入**。本次「读」能力补全后：

- `components/ModbusConfig.vue`：新增「功能码」下拉（**01线圈 / 02离散输入 / 03保持寄存器 / 04输入寄存器**，默认 03），列表列 + 编辑回显带；提交时 JS 校验功能码 ∈ 上述四值。「读取后延迟」`prop="delayTime"`（原错标为 `intervalTime`，配置的延迟实际不生效）。`registerRange` 只允许单个区间（`0` 或 `0-3`），后端会把一个 code 的多区间合并为 `[minStart, maxEnd]` 单块读取，保证该 code 只出一个属性值。
- `components/S71200TcpConfig.vue`：新增「区类型」下拉（**DB数据块 / M标志位 / I输入区 / Q输出区**，默认 DB），列表列 + 编辑回显带；映射后端 `area_type` 列 → `DaveArea`（DB/FLAGS/INPUTS/OUTPUTS）。「读取后延迟」`prop="delayTime"` 修复。
- `components/OmronFinsTcpConfig.vue`：存储区 `areaCode` 从裸十六进制数字输入改为「存储区」下拉（**DM区 0x82 / CIO区 0x30 / WR区 0xB1 / H区 0x32 / IR区 0x88 / LR区 0x98 / EM区 0xA0**，默认 DM区），列表列显示区名（`areaCodeName` 数字→区名映射）；标题修复为 `OMRONFINS_TCP配置`；开关 `prop="enabled"`（原拼错 `evalnabled`，开关恒关）；「读取后延迟」`prop="delayTime"` 修复。**区码勘误**：H 区标准码 0x32（0x31 是 WR 的位码）、IR 区非标准 0x80 改为 0x88，下拉与 `areaCodeName` 映射均已同步。
- `components/MitsubishiTcpConfig.vue`：新增三菱 MC 配置组件。软元件 `areaCode` 用「软元件类型」下拉（**字设备 D/W/R/ZR/SD；位设备 M/L/B/X/Y/S/SM/F**，值=十六进制代码，默认 D），列表列显示软元件名（`areaCodeName` 数字→名称映射）；选 X/Y 软元件时起始地址下方提示「X/Y 地址为八进制」；标题 `MITSUBISHI_TCP配置`；路由前缀 `/business/mitsubishiTcp`（`src/api/business/mitsubishiTcp.js`）；组件/协议页下拉均含 `MITSUBISHI_TCP`，组件动态配置默认端口 5007；设备/产品详情页出现 `Mitsubishi_TCP配置` tab（`v-if="component?.netType == 'MITSUBISHI_TCP'"`）。三菱 MC 是 PLC 寄存器协议，**不能预置点位表**，手动地址录入。

三个组件定时读取开关状态来自后端 `device.modbusRead`（切换时 `readSwitchByDevice` 持久化），消费端均消费 `delayTime`（读取后延迟毫秒）。**编码收敛（六个配置组件 Modbus/S7/Fins/Mitsubishi/Brother/Fanuc 一致）**：异步一律 `async/await` + `try/catch/finally`（禁止 `.then()`）；等值判断用 `==`；表格行操作按钮（编辑/删除）用 `editLoading == row.id` / `deleteLoading == row.id` 独立 loading + `disabled`（避免点一行整列一起转圈）；抽屉提交按钮带 `submitLoading`；分页 `@current-change`/`@size-change` 写回 `pageNum`/`pageSize`（size 变化重置 pageNum=1），修复翻页/改每页条数不生效问题。

## FANUC FOCAS2 协议点位表

- `src/utils/fanucTcpPoints.js` 内置 FANUC FOCAS2（台丽 CNC / FANUC 0i-MF Plus）点位表，覆盖 **axis 坐标 / spindle 主轴 / feed 进给 / mode 操作模式 / status 运行状态 / prgnum 程序 / alarm 报警 / tcode 刀具 / timer 时间 / macro 宏变量(#500-#999) / pmc PMC信号** 共 547 个语义点位。**语义勘误**：`alarm` 分组 `alarm_no` 点位名"报警号"改为"报警数量"——FOCAS2 `cnc_rdalmmsg` 的 `alm_no` 字段返回的是报警条数（不是报警号，多条报警时不是"取最后一条"）。axis 点位 param2=3 是相对坐标、4 是剩余移动量（与 fwlib type 的 3=剩余 4=相对 相反，后端已做映射）。地址模型与后端 `FanucFocasDataReader` 一致：**协议地址 = 采集项类型.参数1.参数2**（如 `axis.1.1` = X 轴机械坐标，未用参数省略，如 `mode`）。数据来源为 FANUC FOCAS2 官方 fwlib32 读取函数族；**JNA 结构体字段偏移第一次真机/NCGuide 验证后需核对修正**；PMC 完整点位待真机验证后补充（点位表先给常见 F1/F0/G8）。
- `components/FanucTcpConfig.vue` 配置抽屉据此提供**两级语义点位选择**：先选「点位类型」（按采集项 readType 分组，如 axis 坐标 / spindle 主轴 / macro 宏变量），再选「点位」下拉（选项右侧灰显符号地址）。选点自动填 标识(code=点位 key)/采集项(readType)/参数1/参数2 并展示符号地址/协议地址/建议数据类型；`pointType`/`pointKey` 为表单 model 字段。手动模式输入 readType（采集项下拉）/参数1/参数2（axis/pmc 才需参数2）。选点填入的 `code` 需在「物模型」tab 建同名属性（identifier）数据才能按 dataType 正确解析。协议路由前缀 `/business/fanucTcp`（`src/api/business/fanucFocas.js`）。
- **组件/协议页面**：`src/views/business/component/index.vue` 与 `src/views/business/protocol/index.vue` 的协议类型下拉均含 `FANUC_TCP`；组件动态配置模板含 服务器IP/端口(默认8193)/连接超时/fwlib32库路径(可选，不填自动搜索常见目录)。设备/产品详情页出现 `Fanuc_TCP配置` tab（`v-if="component?.netType == 'FANUC_TCP'"`）。

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
