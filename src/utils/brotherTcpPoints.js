/**
 * Brother NC（BROTHER_TCP）协议点位表（PDSP / WKCNTR / PRD3 / MEM / PANEL / MONT / PRDC2 / PRGN / ALARM 数据区）
 *
 * 作用：把"实际意义的点位"映射成协议地址（数据区.行号.字段序号），
 * 前端 Brother 配置抽屉据此做语义点位选择，选点后自动填充 标识/数据区/行号/字段序号。
 *
 * 数据来源：
 *   - PDSP：开源项目 Lathejockey81/BrotherAdapter（MTConnect Adapter for Brother CNC）
 *     BrotherConnection/ProductionData3.json（FileName=PDSP），与 Brother NC 通讯手册交叉核对。
 *     注意：真机 LOD PDSP 的 G01/M01 行序与表内不完全一致（真机 G01 15 组 / M01 28 组，表内为适配器机型的 16/30 组），
 *     坐标 P01-P04 与 X01（13 字段）已用真机实测核对一致。
 *   - WKCNTR：真机 LOD WKCNTR 实测结构（8 行 A01-A04/B01-B04，每行 4 字段），字段名对照机床工件计数画面（计数/当前值/终值/结束报警）。
 *   - PRD3：真机 LOD PRD3 实测结构（A01 生产汇总 / C01 最近加工记录）；B0001~ 逐件加工流水行号随加工新增而移动，不收录为固定点位。
 *   - MEM：真机 LOD MEM 实测（A01 运行状态汇总 6 字段：程序号/加工状态/内托盘/备件/模式/扩展运转；E01 报警代码历史，语义待确认未收录）。
 *   - PANEL：真机 LOD PANEL 实测（D01 门状态 / K01 面板开关 / S01 倍率+急停+门互锁+数据保护）。
 *   - VER：真机 LOD VER 实测（机型/版本/机身号），静态信息未收录进点位表。
 *   - MONT / PRDC2 / PRGN / ALARM：参照树根 RootCloud 解包（RootLink.DC.Protocol.BrotherTcp.dll）补齐（2026-08-26）。
 *     树根读取方法 ReadPowerOnTime/ReadOperateTime→GetMontrParams(MONT)、ReadCuttingTime→GetPrdc2Info(PRDC2)、
 *     ReadProgramLineNumber/ReadProgramContent→GetPrgn(PRGN)、ReadAlarm→GetAlarmState+GetMem(ALARM)，
 *     字段位置从反汇编推断（行内字段序号：总运行≈2、上电≈3、切削≈3、程序内容≈1、程序行号≈2、报警≈1），
 *     行号按标准单行假设取 1。⚠️ 本机 LOD MONT/PRGN/PLCD/TOLSD/PRDC2 返回空帧，这些点位在本机读不到数据，
 *     地址（行号/字段序号）待支持机型真机 LOD 采样确认后修正；PLCD/TOLSD 无对应读取方法，仍不收录。
 * 地址约定（与后端 BrotherTcpDataReader 一致）：
 *   - 行号 = LOD 响应中数据行顺序（rows.get(0) 为 % 帧头，行号 1 起）
 *   - 字段序号 = 该行 Symbol 后第 1 个值（1 起），如 P01 行字段 1 = 机械坐标 X
 * ALARM 数据区：已按树根参照补入「当前报警」点位（机床无活动报警时 LOD ALARM 返回空帧，真实行结构待机床报警时实测捕获后修正）。
 *
 * 每个点位字段：
 *   key       建议的物模型属性标识（选点后自动填入 code，可编辑）
 *   name      下拉显示名
 *   dataArea  数据区名
 *   rowNumber 行号（1 起）
 *   fieldIndex 字段序号（1 起）
 *   dataType  建议数据类型（建物模型属性时参考，不强制）
 *   symbol    符号地址（仅展示）
 *   desc      一行说明
 */

// PDSP 坐标行（P01 机械 / P02 相对 / P03 绝对 / P04 剩余）共用的轴列表：
// [标识后缀, 显示名] —— X/Y/Z 直线轴 + 4~8 旋转轴 + P1~P4
const COORD_AXES = [
  ["x", "X"],
  ["y", "Y"],
  ["z", "Z"],
  ["axis4", "4轴"],
  ["axis5", "5轴"],
  ["axis6", "6轴"],
  ["axis7", "7轴"],
  ["axis8", "8轴"],
  ["p1", "P1轴"],
  ["p2", "P2轴"],
  ["p3", "P3轴"],
  ["p4", "P4轴"],
];

// 按轴列表生成一整行坐标点位
function coordRow(keyPrefix, namePrefix, rowNumber, symbol) {
  return COORD_AXES.map((axis, i) => {
    return {
      key: keyPrefix + "_" + axis[0],
      name: namePrefix + " " + axis[1],
      dataArea: "PDSP",
      rowNumber: rowNumber,
      fieldIndex: i + 1,
      dataType: "float",
      symbol: symbol + "." + axis[1],
      desc: "",
    };
  });
}

// 第 1 行 L01：语言模式
const L01 = [
  {
    key: "language_mode",
    name: "语言模式(NC/对话)",
    dataArea: "PDSP",
    rowNumber: 1,
    fieldIndex: 1,
    dataType: "int",
    symbol: "L01",
    desc: "0=NC 1=对话",
  },
];

// 第 2 行 G01：G 代码组（16 组）
const G_GROUPS = [
  "G00", "G17", "G22", "G40", "G49", "G50", "G50.1", "G54", "G64",
  "G67", "G69", "G80", "G90", "G94", "G97", "G98",
];
const G01 = G_GROUPS.map((g, i) => {
  return {
    key: "g_group_" + g.toLowerCase().replace(".", "_"),
    name: g + " 组",
    dataArea: "PDSP",
    rowNumber: 2,
    fieldIndex: i + 1,
    dataType: "int",
    symbol: "G01." + g,
    desc: "当前 " + g + " 组模态值",
  };
});

// 第 3 行 M01：M 代码组（30 组）
const M_GROUPS = [
  "M05", "M09", "M97", "M141", "M221", "M222", "M223", "M224", "M230", "M239",
  "M252", "M269", "M270", "M290", "M305", "M401", "M403", "M405", "M407", "M409",
  "M419", "M431", "M435", "M441", "M443", "M445", "M481", "M483", "M485", "M487",
  "M495",
];
const M01 = M_GROUPS.map((m, i) => {
  return {
    key: "m_group_" + m.toLowerCase(),
    name: m + " 组",
    dataArea: "PDSP",
    rowNumber: 3,
    fieldIndex: i + 1,
    dataType: "int",
    symbol: "M01." + m,
    desc: "当前 " + m + " 组模态值",
  };
});

// 第 4~7 行：P01 机械坐标 / P02 相对坐标 / P03 绝对坐标 / P04 剩余距离
const P01 = coordRow("machine", "机械坐标", 4, "P01");
const P02 = coordRow("relative", "相对坐标", 5, "P02");
const P03 = coordRow("absolute", "绝对坐标", 6, "P03");
const P04 = coordRow("remaining", "剩余距离", 7, "P04");

// 第 8 行 X01：加工状态（进给/主轴/刀具/门/倍率）
const X01 = [
  { key: "feedrate", name: "进给速率", dataArea: "PDSP", rowNumber: 8, fieldIndex: 1, dataType: "float", symbol: "X01.Feedrate", desc: "" },
  { key: "spindle_speed", name: "主轴转速", dataArea: "PDSP", rowNumber: 8, fieldIndex: 2, dataType: "float", symbol: "X01.SpindleSpeed", desc: "" },
  { key: "inner_pallet", name: "内托盘", dataArea: "PDSP", rowNumber: 8, fieldIndex: 3, dataType: "int", symbol: "X01.InnerPallet", desc: "0=未索引 1=内侧1 2=内侧2" },
  { key: "spindle_tool_no", name: "主轴刀具号", dataArea: "PDSP", rowNumber: 8, fieldIndex: 4, dataType: "int", symbol: "X01.SpindleToolNo", desc: "" },
  { key: "next_tool_no", name: "下一刀具号", dataArea: "PDSP", rowNumber: 8, fieldIndex: 5, dataType: "int", symbol: "X01.NextToolNo", desc: "" },
  { key: "pot_no", name: "刀库刀套号", dataArea: "PDSP", rowNumber: 8, fieldIndex: 6, dataType: "int", symbol: "X01.PotNo", desc: "" },
  { key: "door_interlock", name: "门互锁", dataArea: "PDSP", rowNumber: 8, fieldIndex: 7, dataType: "int", symbol: "X01.DoorInterlock", desc: "0=禁用 1=启用" },
  { key: "outer_door", name: "外门", dataArea: "PDSP", rowNumber: 8, fieldIndex: 8, dataType: "int", symbol: "X01.OuterDoor", desc: "0=关 1=开" },
  { key: "inner_door", name: "内门", dataArea: "PDSP", rowNumber: 8, fieldIndex: 9, dataType: "int", symbol: "X01.InnerDoor", desc: "0=关 1=开" },
  { key: "side_door", name: "侧门", dataArea: "PDSP", rowNumber: 8, fieldIndex: 10, dataType: "int", symbol: "X01.SideDoor", desc: "0=关 1=开" },
  { key: "rapid_override", name: "快速进给倍率", dataArea: "PDSP", rowNumber: 8, fieldIndex: 11, dataType: "int", symbol: "X01.RapidOverride", desc: "百分比，如 100" },
  { key: "feedrate_override", name: "进给倍率", dataArea: "PDSP", rowNumber: 8, fieldIndex: 12, dataType: "int", symbol: "X01.FeedrateOverride", desc: "百分比，如 100" },
  { key: "spindle_override", name: "主轴倍率", dataArea: "PDSP", rowNumber: 8, fieldIndex: 13, dataType: "int", symbol: "X01.SpindleOverride", desc: "百分比，如 100" },
];

// ===== 工件计数 WKCNTR =====
// 真机 LOD WKCNTR 实测：8 行 A01-A04 / B01-B04，每行 Symbol 后 4 个数值字段
// 例：A01,0,0,1000,999 —— 字段1=数量(计数) 字段2=当前值 字段3=终值(目标) 字段4=结束报警
// 字段名对照机床工件计数画面；B01-B04 与 A01-A04 的关系（计数器 5-8 或另一套计数）以机床画面为准
const WKCNTR_ROWS = ["A01", "A02", "A03", "A04", "B01", "B02", "B03", "B04"];
const WKCNTR_FIELDS = [
  ["count", "数量", "Count", "工件计数器的计数值"],
  ["current", "当前值", "Current", "工件计数器当前计数值"],
  ["end", "目标值", "EndValue", "工件计数器目标(终值)计数值"],
  ["endalarm", "结束报警", "EndAlarm", "到达目标前的报警提示值"],
];
const WKCNTR = [];
WKCNTR_ROWS.forEach((row, r) => {
  WKCNTR_FIELDS.forEach((f, i) => {
    WKCNTR.push({
      key: "wkcntr_" + row.toLowerCase() + "_" + f[0],
      name: "工件计数" + row + " " + f[1],
      dataArea: "WKCNTR",
      rowNumber: r + 1,
      fieldIndex: i + 1,
      dataType: "int",
      symbol: row + "." + f[2],
      desc: f[3],
    });
  });
});

// ===== 生产数据 PRD3 =====
// 真机 LOD PRD3 实测：A01 生产汇总 + C01 最近加工记录 + B0001~ 逐件加工历史流水
// 例：A01,1274,1274,2（汇总） / C01,20260821142146,2,0,6161（时间+值2+值3+程序号）
// 注意：B 行（B0001~）为逐件加工流水，每加工一件行号整体下移，不能作固定点位，故不收录
const PRD3 = [
  { key: "prd3_finished", name: "生产汇总 完成数", dataArea: "PRD3", rowNumber: 1, fieldIndex: 1, dataType: "int", symbol: "A01.完成数", desc: "真机采样 1274（语义待与机床确认）" },
  { key: "prd3_planned", name: "生产汇总 计划数", dataArea: "PRD3", rowNumber: 1, fieldIndex: 2, dataType: "int", symbol: "A01.计划数", desc: "真机采样 1274（语义待与机床确认）" },
  { key: "prd3_abnormal", name: "生产汇总 异常数", dataArea: "PRD3", rowNumber: 1, fieldIndex: 3, dataType: "int", symbol: "A01.异常数", desc: "真机采样 2（语义待与机床确认）" },
  { key: "prd3_last_time", name: "最近加工时间", dataArea: "PRD3", rowNumber: 2, fieldIndex: 1, dataType: "string", symbol: "C01.时间", desc: "格式 yyyyMMddHHmmss" },
  { key: "prd3_last_value", name: "最近加工值", dataArea: "PRD3", rowNumber: 2, fieldIndex: 2, dataType: "int", symbol: "C01.值2", desc: "真机采样 2（语义待确认，疑为加工时间/循环数）" },
  { key: "prd3_last_result", name: "最近加工结果", dataArea: "PRD3", rowNumber: 2, fieldIndex: 3, dataType: "int", symbol: "C01.结果", desc: "真机采样 0（语义待确认，疑为正常标记）" },
  { key: "prd3_last_program", name: "最近加工程序号", dataArea: "PRD3", rowNumber: 2, fieldIndex: 4, dataType: "int", symbol: "C01.程序号", desc: "真机采样 6161" },
];

// ===== 设备状态 MEM =====
// 真机 LOD MEM 实测：A01 运行状态汇总（程序号/加工状态/内托盘/备件/模式/扩展运转）
// 例：A01,6161,0,0,0,2,0 —— 程序号6161 加工停止 内托盘0 备件0 模式2=自动 扩展运转0
// 加工状态字段（field2）：真机待机为 0，加工中取值待机床加工时实测确认
const MEM = [
  { key: "mem_op_program", name: "运行程序号", dataArea: "MEM", rowNumber: 1, fieldIndex: 1, dataType: "int", symbol: "A01.程序号", desc: "当前运行程序号（真机 6161）" },
  { key: "mem_op_state", name: "加工状态", dataArea: "MEM", rowNumber: 1, fieldIndex: 2, dataType: "int", symbol: "A01.加工状态", desc: "真机待机 0（加工中取值待实测确认）" },
  { key: "mem_inner_pallet", name: "内托盘状态", dataArea: "MEM", rowNumber: 1, fieldIndex: 3, dataType: "int", symbol: "A01.内托盘", desc: "真机 0（语义待确认）" },
  { key: "mem_spare_part", name: "备件使用", dataArea: "MEM", rowNumber: 1, fieldIndex: 4, dataType: "int", symbol: "A01.备件", desc: "真机 0（语义待确认）" },
  { key: "mem_mode", name: "操作模式", dataArea: "MEM", rowNumber: 1, fieldIndex: 5, dataType: "int", symbol: "A01.模式", desc: "真机 2=自动（语义待确认）" },
  { key: "mem_extended_op", name: "扩展运转", dataArea: "MEM", rowNumber: 1, fieldIndex: 6, dataType: "int", symbol: "A01.扩展运转", desc: "真机 0（语义待确认）" },
];

// ===== 面板状态 PANEL =====
// 真机 LOD PANEL 实测：D01 门状态 / K01 面板开关 / S01 倍率+急停+门互锁+数据保护
// 例：D01,0,0,0（三门全关）/ K01,2,4,0,0,0,0,0,1,0,1,0（模式2 画面4 冷却1 照明1）/ S01,3,200,100,0,1,0,1（急停0 门互锁1 数据保护1）
const PANEL = [
  { key: "panel_door_outer", name: "外门状态", dataArea: "PANEL", rowNumber: 1, fieldIndex: 1, dataType: "int", symbol: "D01.外门", desc: "0=关 1=开（真机 0）" },
  { key: "panel_door_inner", name: "内门状态", dataArea: "PANEL", rowNumber: 1, fieldIndex: 2, dataType: "int", symbol: "D01.内门", desc: "0=关 1=开（真机 0）" },
  { key: "panel_door_side", name: "侧门状态", dataArea: "PANEL", rowNumber: 1, fieldIndex: 3, dataType: "int", symbol: "D01.侧门", desc: "0=关 1=开（真机 0）" },
  { key: "panel_mode", name: "操作模式", dataArea: "PANEL", rowNumber: 2, fieldIndex: 1, dataType: "int", symbol: "K01.模式", desc: "真机 2=自动（语义待确认）" },
  { key: "panel_screen", name: "画面号", dataArea: "PANEL", rowNumber: 2, fieldIndex: 2, dataType: "int", symbol: "K01.画面", desc: "真机 4（语义待确认）" },
  { key: "panel_block_skip", name: "跳段", dataArea: "PANEL", rowNumber: 2, fieldIndex: 3, dataType: "int", symbol: "K01.跳段", desc: "0=关 1=开" },
  { key: "panel_opt_stop", name: "选择停止", dataArea: "PANEL", rowNumber: 2, fieldIndex: 4, dataType: "int", symbol: "K01.选择停止", desc: "0=关 1=开" },
  { key: "panel_single_op", name: "单段运行", dataArea: "PANEL", rowNumber: 2, fieldIndex: 5, dataType: "int", symbol: "K01.单段", desc: "0=关 1=开" },
  { key: "panel_dry_run", name: "空运转", dataArea: "PANEL", rowNumber: 2, fieldIndex: 6, dataType: "int", symbol: "K01.空运转", desc: "0=关 1=开" },
  { key: "panel_machine_lock", name: "机械锁定", dataArea: "PANEL", rowNumber: 2, fieldIndex: 7, dataType: "int", symbol: "K01.机械锁定", desc: "0=关 1=开" },
  { key: "panel_coolant", name: "冷却开关", dataArea: "PANEL", rowNumber: 2, fieldIndex: 8, dataType: "int", symbol: "K01.冷却", desc: "0=关 1=开（真机 1）" },
  { key: "panel_chip_flow", name: "排屑开关", dataArea: "PANEL", rowNumber: 2, fieldIndex: 9, dataType: "int", symbol: "K01.排屑", desc: "0=关 1=开" },
  { key: "panel_light", name: "照明开关", dataArea: "PANEL", rowNumber: 2, fieldIndex: 10, dataType: "int", symbol: "K01.照明", desc: "0=关 1=开（真机 1）" },
  { key: "panel_pallet_select", name: "托盘选择", dataArea: "PANEL", rowNumber: 2, fieldIndex: 11, dataType: "int", symbol: "K01.托盘选择", desc: "0=未选择 1=选择（真机 0）" },
  { key: "panel_rapid_override", name: "快速进给倍率", dataArea: "PANEL", rowNumber: 3, fieldIndex: 1, dataType: "int", symbol: "S01.快速倍率", desc: "真机 3（量纲待确认，与 PDSP X01 同值）" },
  { key: "panel_feed_override", name: "切削进给倍率", dataArea: "PANEL", rowNumber: 3, fieldIndex: 2, dataType: "int", symbol: "S01.切削倍率", desc: "百分比，真机 200" },
  { key: "panel_spindle_override", name: "主轴倍率", dataArea: "PANEL", rowNumber: 3, fieldIndex: 3, dataType: "int", symbol: "S01.主轴倍率", desc: "百分比，真机 100" },
  { key: "panel_estop", name: "急停", dataArea: "PANEL", rowNumber: 3, fieldIndex: 4, dataType: "int", symbol: "S01.急停", desc: "0=未急停 1=急停（真机 0）" },
  { key: "panel_door_interlock", name: "门互锁", dataArea: "PANEL", rowNumber: 3, fieldIndex: 5, dataType: "int", symbol: "S01.门互锁", desc: "0=禁用 1=启用（真机 1）" },
  { key: "panel_mode_change", name: "模式切换", dataArea: "PANEL", rowNumber: 3, fieldIndex: 6, dataType: "int", symbol: "S01.模式切换", desc: "真机 0（语义待确认）" },
  { key: "panel_data_protect", name: "数据保护", dataArea: "PANEL", rowNumber: 3, fieldIndex: 7, dataType: "int", symbol: "S01.数据保护", desc: "0=关 1=开（真机 1）" },
];

// ===== 计时数据 MONT =====
// 树根 ReadPowerOnTime/ReadOperateTime → GetMontrParams(MONT)。字段位置从反汇编推断：
// 总运行时间(TotalOperateTime)≈行内字段2、上电时间(PowerOnTime)≈字段3（树根解析行偏移 5/6，行号按标准单行假设 1）。
// ⚠️ 本机 MONT 返回空帧，地址待支持机型真机 LOD 采样确认。
const MONT = [
  { key: "mont_operate_time", name: "总运行时间", dataArea: "MONT", rowNumber: 1, fieldIndex: 2, dataType: "string", symbol: "MONT.总运行时间", desc: "树根读总运行时间(TotalOperateTime)；本机 MONT 空帧，地址待真机 LOD 采样确认" },
  { key: "mont_power_on_time", name: "上电时间", dataArea: "MONT", rowNumber: 1, fieldIndex: 3, dataType: "string", symbol: "MONT.上电时间", desc: "树根读上电时间(PowerOnTime)；本机 MONT 空帧，地址待真机 LOD 采样确认" },
];

// ===== 切削计时 PRDC2 =====
// 树根 ReadCuttingTime → GetPrdc2Info(PRDC2)，切削时间(CuttingTime)≈行内字段3（循环时间 CycleTime≈字段2，同区）。
// ⚠️ 本机 PRDC2 返回空帧，地址待支持机型真机 LOD 采样确认。
const PRDC2 = [
  { key: "prdc2_cutting_time", name: "切削时间", dataArea: "PRDC2", rowNumber: 1, fieldIndex: 3, dataType: "string", symbol: "PRDC2.切削时间", desc: "树根读切削时间(CuttingTime)；本机 PRDC2 空帧，地址待真机 LOD 采样确认" },
];

// ===== 程序 PRGN =====
// 树根 ReadProgramLineNumber/ReadProgramContent → GetPrgn(PRGN)：程序内容(RowData)≈字段1、程序行号(RowNumber)≈字段2。
// ⚠️ 本机 PRGN 返回空帧，地址待支持机型真机 LOD 采样确认。
const PRGN = [
  { key: "prgn_content", name: "程序内容", dataArea: "PRGN", rowNumber: 1, fieldIndex: 1, dataType: "string", symbol: "PRGN.程序内容", desc: "树根读程序内容(RowData)；本机 PRGN 空帧，地址待真机 LOD 采样确认" },
  { key: "prgn_line_number", name: "程序行号", dataArea: "PRGN", rowNumber: 1, fieldIndex: 2, dataType: "int", symbol: "PRGN.程序行号", desc: "树根读程序行号(RowNumber)；本机 PRGN 空帧，地址待真机 LOD 采样确认" },
];

// ===== 报警 ALARM =====
// 树根 ReadAlarm → GetAlarmState+GetMem(ALARM)，报警文本(AlmMsg)≈字段1。无活动报警时 LOD ALARM 返回空帧。
// ⚠️ 行结构待机床报警时真机实测捕获后修正。
const ALARM = [
  { key: "alarm_text", name: "当前报警", dataArea: "ALARM", rowNumber: 1, fieldIndex: 1, dataType: "string", symbol: "ALARM.报警", desc: "树根读报警文本(AlmMsg)；无报警时空帧，行结构待有报警时真机实测确认" },
];

// 完整点位表（顺序即分组顺序）
export const BROTHER_TCP_POINT_TABLE = [].concat(L01, G01, M01, P01, P02, P03, P04, X01, WKCNTR, PRD3, MEM, PANEL, MONT, PRDC2, PRGN, ALARM);

// 每行分组展示名（点位下拉分组标题），按数据区分组
export const BROTHER_TCP_ROW_LABELS = {
  PDSP: {
    1: "L01 语言",
    2: "G01 G代码组",
    3: "M01 M代码组",
    4: "P01 机械坐标",
    5: "P02 相对坐标",
    6: "P03 绝对坐标",
    7: "P04 剩余距离",
    8: "X01 加工状态",
  },
  WKCNTR: {
    1: "A01 工件计数1",
    2: "A02 工件计数2",
    3: "A03 工件计数3",
    4: "A04 工件计数4",
    5: "B01 工件计数5",
    6: "B02 工件计数6",
    7: "B03 工件计数7",
    8: "B04 工件计数8",
  },
  PRD3: {
    1: "A01 生产汇总",
    2: "C01 最近加工",
  },
  MEM: {
    1: "A01 运行状态",
  },
  PANEL: {
    1: "D01 门状态",
    2: "K01 面板开关",
    3: "S01 倍率/保护",
  },
  MONT: {
    1: "MONT 计时",
  },
  PRDC2: {
    1: "PRDC2 切削计时",
  },
  PRGN: {
    1: "PRGN 程序",
  },
  ALARM: {
    1: "ALARM 报警",
  },
};

/**
 * 按协议地址反向查找点位（编辑配置回显用）
 * @param dataArea 数据区名
 * @param rowNumber 行号
 * @param fieldIndex 字段序号
 * @returns 点位对象；未命中返回 null
 */
export function findBrotherTcpPoint(dataArea, rowNumber, fieldIndex) {
  if (dataArea == null || rowNumber == null || fieldIndex == null) {
    return null;
  }
  return (
    BROTHER_TCP_POINT_TABLE.find(
      (p) =>
        p.dataArea == dataArea &&
        p.rowNumber == rowNumber &&
        p.fieldIndex == fieldIndex
    ) || null
  );
}

/**
 * 协议地址字符串（数据区.行号.字段序号，如 PDSP.4.1）
 * @param point 点位对象
 * @returns 地址串
 */
export function brotherTcpAddress(point) {
  if (!point) {
    return "";
  }
  return point.dataArea + "." + point.rowNumber + "." + point.fieldIndex;
}
