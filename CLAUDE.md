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

- `src/utils/brotherTcpPoints.js` 内置 Brother NC 点位表，覆盖 **PDSP / WKCNTR / PRD3 / MEM / PANEL / MONT / PRDC2 / PRGN / ALARM** 九个数据区（语义点位 → 协议地址 数据区.行号.字段序号）。数据来源：PDSP 来自开源 BrotherAdapter 的 ProductionData3.json（与通讯手册交叉核对；注意真机 G01/M01 行序与表内不完全一致，坐标/倍率已真机核对）；WKCNTR、PRD3、**MEM**（A01 运行状态：程序号/加工状态/内托盘/模式）、**PANEL**（D01 门 / K01 面板开关 / S01 倍率+急停+门互锁+数据保护）来自**真机 LOD 实测结构**。地址约定与后端 `BrotherTcpDataReader` 一致：行号 1 起、字段序号为 Symbol 后第 1 个值起。**MONT/PRDC2/PRGN/ALARM 四个区为树根参照补齐（2026-08-26）**：树根 `RootLink.DC.Protocol.BrotherTcp.dll` 的 ReadPowerOnTime/ReadOperateTime→GetMontrParams(MONT)、ReadCuttingTime→GetPrdc2Info(PRDC2)、ReadProgramLineNumber/ReadProgramContent→GetPrgn(PRGN)、ReadAlarm→GetAlarmState+GetMem(ALARM)，字段位置反汇编推断、行号按标准单行取 1；**本机 LOD MONT/PRGN/PRDC2 返回空帧（PLCD/TOLSD 亦空帧），这些点位在本机读不到数据，地址待支持机型真机 LOD 采样确认；ALARM 无报警时空帧**，真实行结构待有报警时实测。VER 区为静态机型/版本/机身号，未收录点位，手动地址模式可选（`VER.1.1` 机型 / `VER.3.1` 机身号）。
- `components/BrotherTcpConfig.vue` 配置抽屉据此提供**两级语义点位选择**：先选「点位类型」（按 数据区.行号 分组，`pointType` 值为 `数据区|行号`，如 `PDSP|4` P01 机械坐标 / `WKCNTR|1` A01 工件计数1），再选「点位」下拉（按分组过滤，选项右侧灰显符号地址）。选点自动填 标识(code=点位 key)/数据区/行号/字段序号 并展示符号地址/协议地址/建议数据类型；`pointType`/`pointKey` 为表单 model 字段（均有 `prop`，避免必填项校验报 undefined）。ALARM 及自定义地址走「手动指定地址」模式。选点填入的 `code` 需在「物模型」tab 建同名属性（identifier）数据才能按 dataType 正确解析。
- **设备详情页**（`src/views/business/device/detail.vue`）：「实时数据」tab 实时值由 `/ws/device/{sn}` WebSocket 推送更新（WS 地址跟随页面地址），初始值由 `getDeviceLastData` 拉取；「历史数据」弹窗表格含 **属性名/属性值** 两列（解析日志 `properties` JSON 中 `DecodeMessage.properties` 对象，标识符映射物模型显示名），查询的「属性名称」过滤项传 `propertyName`（物模型 identifier）给后端 `/business/deviceLogs/list` 过滤。定时读取开关状态来自后端 `device.modbusRead`（切换时由后端 `readSwitchByDevice` 持久化）。

## PLC 协议配置组件（Modbus / S7-1200 / OMRONFINS / 三菱 MC）

PLC 寄存器协议不能预置点位表（见下「设计原则」），四个配置抽屉都是**手动地址录入**。本次「读」能力补全后：

- `components/ModbusConfig.vue`：新增「功能码」下拉（**01线圈 / 02离散输入 / 03保持寄存器 / 04输入寄存器**，默认 03），列表列 + 编辑回显带；提交时 JS 校验功能码 ∈ 上述四值。「读取后延迟」`prop="delayTime"`（原错标为 `intervalTime`，配置的延迟实际不生效）。`registerRange` 只允许单个区间（`0` 或 `0-3`），后端会把一个 code 的多区间合并为 `[minStart, maxEnd]` 单块读取，保证该 code 只出一个属性值。
- `components/S71200TcpConfig.vue`：新增「区类型」下拉（**DB数据块 / M标志位 / I输入区 / Q输出区**，默认 DB），列表列 + 编辑回显带；映射后端 `area_type` 列 → `DaveArea`（DB/FLAGS/INPUTS/OUTPUTS）。「读取后延迟」`prop="delayTime"` 修复。
- `components/OmronFinsTcpConfig.vue`：存储区 `areaCode` 从裸十六进制数字输入改为「存储区」下拉（**DM区 0x82 / CIO区 0x30 / WR区 0xB1 / H区 0x32 / IR区 0x88 / LR区 0x98 / EM区 0xA0**，默认 DM区），列表列显示区名（`areaCodeName` 数字→区名映射）；标题修复为 `OMRONFINS_TCP配置`；开关 `prop="enabled"`（原拼错 `evalnabled`，开关恒关）；「读取后延迟」`prop="delayTime"` 修复。**区码勘误**：H 区标准码 0x32（0x31 是 WR 的位码）、IR 区非标准 0x80 改为 0x88，下拉与 `areaCodeName` 映射均已同步。
- `components/MitsubishiTcpConfig.vue`：新增三菱 MC 配置组件。软元件 `areaCode` 用「软元件类型」下拉（**字设备 D/W/R/ZR/SD；位设备 M/L/B/X/Y/S/SM/F**，值=十六进制代码，默认 D），列表列显示软元件名（`areaCodeName` 数字→名称映射）；选 X/Y 软元件时起始地址下方提示「X/Y 地址为八进制」；**2026-08-29 起加「协议类型」下拉（MC3E=QnA兼容3E帧 `3E` / MC1E=标准二进制帧 `1E`，默认 MC3E，`null` 回显 MC3E；MC1E 老式 PLC 端口 5007 标准帧，提示"待真机验证"）**，列表列带「协议类型」列（`protocolModeName`：3E→MC3E/1E→MC1E）；标题 `MITSUBISHI_TCP配置`；路由前缀 `/business/mitsubishiTcp`（`src/api/business/mitsubishiTcp.js`）；组件/协议页下拉均含 `MITSUBISHI_TCP`，组件动态配置默认端口 5007；设备/产品详情页出现 `Mitsubishi_TCP配置` tab（`v-if="component?.netType == 'MITSUBISHI_TCP'"`）。三菱 MC 是 PLC 寄存器协议，**不能预置点位表**，手动地址录入。

三个组件定时读取开关状态来自后端 `device.modbusRead`（切换时 `readSwitchByDevice` 持久化），消费端均消费 `delayTime`（读取后延迟毫秒）。**编码收敛（六个配置组件 Modbus/S7/Fins/Mitsubishi/Brother/Fanuc 一致）**：异步一律 `async/await` + `try/catch/finally`（禁止 `.then()`）；等值判断用 `==`；表格行操作按钮（编辑/删除）用 `editLoading == row.id` / `deleteLoading == row.id` 独立 loading + `disabled`（避免点一行整列一起转圈）；抽屉提交按钮带 `submitLoading`；分页 `@current-change`/`@size-change` 写回 `pageNum`/`pageSize`（size 变化重置 pageNum=1），修复翻页/改每页条数不生效问题。

## FANUC FOCAS2 协议点位表

- `src/utils/fanucTcpPoints.js` 内置 FANUC FOCAS2（台丽 CNC / FANUC 0i-MF Plus）点位表，覆盖 **axis 坐标 / spindle 主轴 / feed 进给 / mode 操作模式 / status 运行状态 / prgnum 程序 / exeprgname 主程序名 / alarm 报警 / tcode 刀具 / timer 时间 / count 产量 / diag 诊断号 / override 倍率 / macro 宏变量(#500-#999) / pmc PMC信号** 共 554 个语义点位。**FOCAS2 官方语义（2026-08-25 按官方 Fwlib64.h 全面修正）**：坐标 `axis` param2=1 机械 2 绝对 3 相对 4 剩余，后端映射 fwlib type 1/0/2/3（值 = data/10^dec）；操作模式 `mode` = `ODBST.aut`（0=MDI 1=MEM 2=*** 3=EDIT 4=HANDLE 5=JOG 6=Teach JOG 7=Teach HANDLE 8=INC 9=REF 10=RMT 11=TEST）；`status` 运行/停止/急停/自动分别按 run==START/run==STOP、emergency、aut==MEM 判定；`alarm` 报警数量 = `cnc_rdalmmsg` 的 num 输出条数（不是报警号），报警文本多条取最后一条（GBK 解码）；`tcode` 刀具号经系统宏变量 **#3901 当前刀具 / #3902 下一把** 读取（FOCAS2 无直接读刀具函数），**宏值必须按 10^dec_val 换算（#3901 刀具 44 存为 mcr_val=440000000/dec=7）**；**主轴倍率按 FANUC 标准梯形图约定读 PMC G30**（SOV0-SOV7，值即百分比，后端 `spindle` param1=2 直接 pmc_rdpmcrng 读 G30，台丽真机实测 G30=100）；**进给/快速倍率同约定读 PMC G12/G14**（`override` 点位，后端 pmc_rdpmcrng 读整字节，值即百分比）；**顺序号 `cnc_rdseqnum`、主程序名 `cnc_exeprgname`**（此前误标"无直接读取函数"，2026-08-26 起已实现读取）；**产量 `count`**（param1=0 総加工数/总产量 1 稼働程序加工数/当日产量 2 特定加工数/目标产量，对应树根 WorkPartAllCount / WorkPartCount / RequiredPartCount）——**2026-08-26 起后端改自研 FOCAS2 报文客户端读系统参数 6712（总）/6711（当日）/6713（目标）**（fwlib cnc_rdcount 返回+3、cnc_rdparam 返回+4 被台丽机拒绝；报文负载第 3 字段 len 必须为 0 才被机床接受——这是树根能读、fwlib 不能读的根因，详见 api CLAUDE.md FANUC 段落）。**真机验证（2026-08-26）**：6711=44（当日加工 44 件）/6712=2989（总产量，昨 2946+今 43≈2989）/6713=0（目标）；**主轴温度 `diag` 读诊断号 403**（cnc_diagnoss，树根实际配置值；标准 0i 中 403 常为第 4 轴负载，台丽机是否为主轴温度待真机确认）。**真机实测（2026-08-26 台丽 0i-MF Plus）**：受控轴 4 根 X/Y/Z/A（cnc_rdaxisdata len 输出确认，B/C 返回 null）、四类坐标均有效（dec=3）、#500-509 未使用宏返回 0 不报错、F1/F0/G8 实测字节 0x80/0x40/0x31（位含义以机床 PMC 梯形图为准）、**G30 实测 100（主轴倍率 100%）**。地址模型与后端 `FanucFocasDataReader` 一致：**协议地址 = 采集项类型.参数1.参数2**（如 `axis.1.1` = X 轴机械坐标，未用参数省略，如 `mode`）。数据来源为 FANUC FOCAS2 官方 fwlib32 读取函数族（cnc_rdaxisdata/cnc_acts/cnc_rdspload/cnc_actf/cnc_statinfo/cnc_rdprgnum/cnc_rdseqnum/cnc_exeprgname/cnc_rdalmmsg/cnc_rdmacro/cnc_rdtimer/cnc_rdcount/cnc_diagnoss/pmc_rdpmcrng）；**JNA 结构体字段偏移第一次真机/NCGuide 验证后需核对修正**；PMC 完整点位待真机验证后补充（点位表先给常见 F1/F0/G8）。
- `components/FanucTcpConfig.vue` 配置抽屉据此提供**两级语义点位选择**：先选「点位类型」（按采集项 readType 分组，如 axis 坐标 / spindle 主轴 / macro 宏变量），再选「点位」下拉（选项右侧灰显符号地址）。选点自动填 标识(code=点位 key)/采集项(readType)/参数1/参数2 并展示符号地址/协议地址/建议数据类型；`pointType`/`pointKey` 为表单 model 字段。手动模式输入 readType（采集项下拉）/参数1/参数2（axis/pmc 才需参数2）。选点填入的 `code` 需在「物模型」tab 建同名属性（identifier）数据才能按 dataType 正确解析。协议路由前缀 `/business/fanucTcp`（`src/api/business/fanucFocas.js`）。**count 产量 param1 允许 0（0=总产量 1=当日产量 2=目标产量），前端空值校验用 `param1 === ""` 判断（2026-08-26 修复：原 `param1 == ""` 在 JS 中 `0 == ""` 为 true，会把合法的 param1=0 误判为空拒绝保存——总产量配置报"参数1不能为空"的根因）。**
- **组件/协议页面**：`src/views/business/component/index.vue` 与 `src/views/business/protocol/index.vue` 的协议类型下拉均含 `FANUC_TCP`；组件动态配置模板含 服务器IP/端口(默认8193)/连接超时/fwlib32库路径(可选，不填自动搜索常见目录)。设备/产品详情页出现 `Fanuc_TCP配置` tab（`v-if="component?.netType == 'FANUC_TCP'"`）。
- **后续加点位从树根解包挖**：树根 RootDCService 安装包解包目录 `C:\树根平台\msi_out\`（本机）。FANUC 点位参考反汇编 `RootLink.DC.Protocol.Focas.dll`（驱动实现：函数/参数/诊断号，P/Invoke 真名在 ImplMap ImportName、调用方 ldc 常量）与 `RootLink.UI.Protocol.Focas.dll`（UI 点位清单/显示名）；Brother 用 `RootLink.DC.Protocol.BrotherTcp.dll` / `RootLink.UI.Protocol.BrotherTcp.dll`。挖掘脚本 `C:\Users\20357\AppData\Local\Temp\TestFwlib\diag_scan.py`（dnfile 扫 IL）。语义对应均需真机核对。

## Mitsubishi CNC TCP 协议点位表

- `src/utils/cncTcpPoints.js` 内置三菱 CNC MELDAS MOCHA（`MITSUBISHI_CNC_TCP`，TCP 683）点位表（2026-08-29 参照树根 `MitsubishiNcTcpPacket.dll` 逆向，见 `TestFwlib/cnc_tcp_protocol.md`，**待真机验证**），覆盖 **49 个语义点位 = 19 静态点 + 5 轴点×6 轴，按 6 个语义分组组织**（`CNC_TCP_GROUPS`：坐标/运行信息/程序与刀具/速度与倍率/位置与计数/轴负载，**2026-08-29 重构分组，组名与点位名错开，消除"类型名=点位名"与重复类型**）：静态点 `axc`(整体轴坐标 datatype1)/`pst`(程序状态 datatype2)/`opm`(运行模式 datatype2)/`al`(报警 datatype2)/`fre`(进给速度 datatype6)/`pn`(程序号 datatype16 GBK)/`spn`(主轴号 datatype16)/`cc`(计数 datatype4 long)/`sl1`(状态1 datatype3)/`ss1`(状态2 datatype3)/`tn`(刀具号 datatype3)/`stn`(主轴转速 datatype3)/`po`(位置 datatype3)/`opt`(操作倍率 datatype3)/`cut`(切削 datatype3)/`ct`(计数 datatype3)/`sv`(主轴速度 datatype3)/`fv`(进给倍率 datatype3)/`st`(温度/状态 datatype3)；**cc/ct 逆向文档均记"计数"，按 Section 区分命名"计数（总）/计数（当前）"（cc=126.8002、ct=40.8），待真机验证后按实测语义改名**；轴点 `mechpos`/`currpos`/`remapos`（机械/当前/相对坐标 Section37 datatype5）+ `cu`/`sp`（轴电流/轴速度 Section59 datatype3），axisNo 1-6=X/Y/Z/A/B/C。点位 key 格式 `cnc_<readType>`（非轴点）/`cnc_<readType>_<轴小写>`（轴点，如 `cnc_mechpos_x`）；`cncTcpAddress(point)` → `readType[.axisNo]`（协议地址）；`isAxisReadType` 判定轴类点位（前端用它控制轴号输入框显示）。**datatype 1/2 点位（axc/pst/opm/al）DataReader 暂不支持返回 null，前端点表已标注"待真机验证"**。地址模型与后端 `MitsubishiCncDataReader` 一致：**协议地址 = readType 或 readType.轴号**。
- `components/MitsubishiCncTcpConfig.vue` 配置抽屉据此提供**两级语义点位选择**（同 FanucTcpConfig.vue）：先选「点位类型」（6 语义分组，`pointType`=group），再选「点位」下拉（轴点选项右侧灰显轴名）。选点自动填 标识(code=点位 key)/采集项(readType)/轴号 并展示协议地址/建议数据类型；手动模式输入 readType（采集项下拉）+ 轴号（轴类点位才需要，`isAxisReadType` 判定）；提交时 JS 校验 readType 必填、轴类点位轴号 1-6。标题 `Mitsubishi_CNC_TCP配置`；路由前缀 `/business/mitsubishiCncTcp`（`src/api/business/mitsubishiCncTcp.js`）；组件/协议页下拉均含 `MITSUBISHI_CNC_TCP`，组件动态配置默认端口 683；设备/产品详情页出现 `Mitsubishi_CNC_TCP配置` tab（`v-if="component?.netType == 'MITSUBISHI_CNC_TCP'"`）。选点填入的 `code` 需在「物模型」tab 建同名属性（identifier）数据才能按 dataType 正确解析。

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
