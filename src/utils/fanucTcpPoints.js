/**
 * FANUC FOCAS2（FANUC_TCP）协议点位表（台丽 CNC / FANUC 0i-MF Plus）
 *
 * 作用：把"实际意义的点位"映射成协议地址（采集项类型.参数1.参数2），
 * 前端 Fanuc 配置抽屉据此做语义点位选择，选点后自动填充 标识/采集项类型/参数1/参数2。
 *
 * 地址模型与后端 FanucFocasDataReader 一致：
 *   协议地址 = readType.param1.param2（如 axis.1.1 = X 轴机械坐标）
 *   - readType 采集项类型：axis/spindle/feed/mode/status/prgnum/alarm/tcode/macro/timer/pmc
 *   - param1/param2 随类型含义不同，见下表各点位 desc；未用到的参数不填（地址中省略）
 *
 * 数据来源：
 *   - FANUC FOCAS2 官方函数库 fwlib32 的读取函数族（cnc_rdaxisdata / cnc_rdspindle /
 *     cnc_rdact / cnc_rdopmode / cnc_statinfo / cnc_rdprgnum / cnc_rdalmmsg /
 *     cnc_rdtcode / cnc_rdmacro / cnc_rdtimer / pmc_rdpmc）。
 *   - 坐标轴序 1-6 = X/Y/Z/A/B/C；坐标类型 1=机械 2=绝对 3=相对 4=剩余。
 *   - 主轴/进给/刀具的参数 1 起，映射 fwlib 内部 type 0 起。
 *   - 时间参数 1=运行 2=切削 3=循环 4=上电（单位分钟）。
 *   - 宏变量 1-999（常用 500+ 用户宏变量，数值可含小数，值=mcr_val/10^dec_val）。
 *   - PMC 信号：param1=1(F)/2(G)，param2=字节地址号；具体 F/G 地址以机床 PMC 梯形图为准，
 *     点位表先给常见几个，**完整 PMC 点位待真机验证后补充**。
 *   - JNA 结构体字段偏移为 FOCAS2 对接最关键环节，第一次真机/NCGuide 验证后需核对修正。
 *
 * 每个点位字段：
 *   key       建议的物模型属性标识（选点后自动填入 code，可编辑）
 *   name      下拉显示名
 *   readType  采集项类型
 *   param1    参数1
 *   param2    参数2
 *   dataType  建议数据类型（建物模型属性时参考，不强制）
 *   symbol    符号地址（仅展示）
 *   desc      一行说明
 */

// ===== 坐标 axis（param1=轴号 1-6，param2=坐标类型 1机械 2绝对 3相对 4剩余） =====
const AXIS_LIST = [
  ["x", "X", 1],
  ["y", "Y", 2],
  ["z", "Z", 3],
  ["a", "A", 4],
  ["b", "B", 5],
  ["c", "C", 6],
];
const COORD_TYPES = [
  ["machine", "机械坐标", 1],
  ["absolute", "绝对坐标", 2],
  ["relative", "相对坐标", 3],
  ["remaining", "剩余距离", 4],
];
// 先按坐标类型排（机械坐标 X/Y/Z/A/B/C → 绝对坐标 X/Y/Z...），同类型内按轴序
const AXIS = [];
COORD_TYPES.forEach((ct) => {
  AXIS_LIST.forEach((ax) => {
    AXIS.push({
      key: ct[0] + "_" + ax[0],
      name: ct[1] + " " + ax[1],
      readType: "axis",
      param1: ax[2],
      param2: ct[2],
      dataType: "float",
      symbol: ct[1] + " " + ax[1],
      desc: "轴" + ax[2] + "（" + ax[1] + "）" + ct[1] + "，单位 mm（含小数）",
    });
  });
});

// ===== 主轴 spindle（param1=1转速 2倍率 3负载 4报警） =====
const SPINDLE = [
  { key: "spindle_speed", name: "主轴转速", readType: "spindle", param1: 1, param2: null, dataType: "float", symbol: "S", desc: "主轴实际转速，单位 rpm" },
  { key: "spindle_override", name: "主轴倍率", readType: "spindle", param1: 2, param2: null, dataType: "int", symbol: "S%", desc: "主轴倍率，百分比，如 100" },
  { key: "spindle_load", name: "主轴负载", readType: "spindle", param1: 3, param2: null, dataType: "int", symbol: "S-Load", desc: "主轴电机负载，百分比" },
  { key: "spindle_alarm", name: "主轴报警", readType: "spindle", param1: 4, param2: null, dataType: "int", symbol: "S-Alm", desc: "主轴报警状态（0=无报警）" },
];

// ===== 进给 feed（param1=1 实际进给；进给倍率 cnc_rdact 不提供，需走 PMC 待真机验证） =====
const FEED = [
  { key: "feedrate_actual", name: "实际进给速度", readType: "feed", param1: 1, param2: null, dataType: "float", symbol: "F", desc: "实际进给速度（每分钟进给），单位 mm/min；进给倍率需 PMC 读取" },
];

// ===== 操作模式 mode =====
const MODE = [
  { key: "operation_mode", name: "操作模式", readType: "mode", param1: null, param2: null, dataType: "int", symbol: "OPMODE", desc: "0=MDI 1=AUTO 2=EDIT 3=HANDLE 4=JOG 5=INC 6=RMT 7=REF 8=TAPE" },
];

// ===== 运行状态 status（param1=1运行 2停止 3急停 4自动方式） =====
const STATUS = [
  { key: "status_run", name: "运行中", readType: "status", param1: 1, param2: null, dataType: "int", symbol: "RUN", desc: "机床运行中（0/1）" },
  { key: "status_stop", name: "停止", readType: "status", param1: 2, param2: null, dataType: "int", symbol: "STOP", desc: "机床停止（0/1）" },
  { key: "status_emergency", name: "急停", readType: "status", param1: 3, param2: null, dataType: "int", symbol: "EMG", desc: "急停状态（0=未急停 1=急停）" },
  { key: "status_automatic", name: "自动方式", readType: "status", param1: 4, param2: null, dataType: "int", symbol: "AUTO", desc: "自动方式（0/1）" },
];

// ===== 程序 prgnum（param1=1程序号 2顺序号） =====
const PRGNUM = [
  { key: "program_no", name: "当前程序号", readType: "prgnum", param1: 1, param2: null, dataType: "int", symbol: "O", desc: "当前运行程序号" },
  { key: "sequence_no", name: "当前顺序号", readType: "prgnum", param1: 2, param2: null, dataType: "int", symbol: "N", desc: "当前程序段顺序号" },
];

// ===== 报警 alarm（param1=1报警号 2报警文本） =====
const ALARM = [
  { key: "alarm_no", name: "报警号", readType: "alarm", param1: 1, param2: null, dataType: "int", symbol: "ALM-NO", desc: "当前报警号（多条时取最后一条）" },
  { key: "alarm_msg", name: "报警文本", readType: "alarm", param1: 2, param2: null, dataType: "string", symbol: "ALM-MSG", desc: "当前报警文本（多条时取最后一条）" },
];

// ===== 刀具 tcode（param1=1当前刀具 2上一把刀具） =====
const TCODE = [
  { key: "tool_no_current", name: "当前刀具号", readType: "tcode", param1: 1, param2: null, dataType: "int", symbol: "T", desc: "当前使用刀具号" },
  { key: "tool_no_last", name: "上一把刀具号", readType: "tcode", param1: 2, param2: null, dataType: "int", symbol: "T-Last", desc: "上一把使用刀具号" },
];

// ===== 时间 timer（param1=1运行 2切削 3循环 4上电，单位分钟） =====
const TIMER = [
  { key: "time_run", name: "运行时间", readType: "timer", param1: 1, param2: null, dataType: "int", symbol: "TIME-RUN", desc: "累计运行时间，单位分钟" },
  { key: "time_cut", name: "切削时间", readType: "timer", param1: 2, param2: null, dataType: "int", symbol: "TIME-CUT", desc: "累计切削时间，单位分钟" },
  { key: "time_cycle", name: "循环时间", readType: "timer", param1: 3, param2: null, dataType: "int", symbol: "TIME-CYC", desc: "累计循环时间，单位分钟" },
  { key: "time_poweron", name: "上电时间", readType: "timer", param1: 4, param2: null, dataType: "int", symbol: "TIME-ON", desc: "累计通电时间，单位分钟" },
];

// ===== 宏变量 macro（param1=宏变量号 1-999，常用 500+） =====
const MACRO = [];
for (let n = 500; n <= 999; n++) {
  MACRO.push({
    key: "macro_" + n,
    name: "#" + n + " 宏变量",
    readType: "macro",
    param1: n,
    param2: null,
    dataType: "float",
    symbol: "#" + n,
    desc: "宏变量 #" + n + "（可含小数；未使用的宏变量读取可能返回错误，建议先确认机床已使用该变量）",
  });
}

// ===== PMC 信号 pmc（param1=1(F) 2(G)，param2=字节地址号；整字节返回，位需自行按位解析） =====
const PMC = [
  { key: "pmc_f1_auto", name: "F1 自动运行信号", readType: "pmc", param1: 1, param2: 1, dataType: "int", symbol: "F1", desc: "F 区地址 1 整字节（位0=自动运行）；地址以机床 PMC 梯形图为准，待真机验证" },
  { key: "pmc_f0_estop", name: "F0 急停信号", readType: "pmc", param1: 1, param2: 0, dataType: "int", symbol: "F0", desc: "F 区地址 0 整字节（急停相关）；地址以机床 PMC 梯形图为准，待真机验证" },
  { key: "pmc_g8_spindle", name: "G8 主轴信号", readType: "pmc", param1: 2, param2: 8, dataType: "int", symbol: "G8", desc: "G 区地址 8 整字节（主轴相关）；地址以机床 PMC 梯形图为准，待真机验证" },
];

// 完整点位表（顺序即分组顺序）
export const FANUC_TCP_POINT_TABLE = [].concat(AXIS, SPINDLE, FEED, MODE, STATUS, PRGNUM, ALARM, TCODE, TIMER, MACRO, PMC);

// 每类采集项分组展示名（点位类型下拉标题），按 readType 分组
export const FANUC_TCP_ROW_LABELS = {
  axis: "坐标",
  spindle: "主轴",
  feed: "进给",
  mode: "操作模式",
  status: "运行状态",
  prgnum: "程序",
  alarm: "报警",
  tcode: "刀具",
  timer: "时间",
  macro: "宏变量",
  pmc: "PMC信号",
};

/**
 * 按协议地址反向查找点位（编辑配置回显用）
 * @param readType 采集项类型
 * @param param1 参数1
 * @param param2 参数2（未使用传 null/undefined）
 * @returns 点位对象；未命中返回 null
 */
export function findFanucTcpPoint(readType, param1, param2) {
  if (readType == null) {
    return null;
  }
  const p2 = param2 == null ? "" : String(param2);
  return (
    FANUC_TCP_POINT_TABLE.find((p) => {
      const q2 = p.param2 == null ? "" : String(p.param2);
      return (
        p.readType == readType && p.param1 == param1 && q2 == p2
      );
    }) || null
  );
}

/**
 * 协议地址字符串（采集项类型.参数1.参数2，如 axis.1.1 = X 轴机械坐标；未用参数省略）
 * @param point 点位对象
 * @returns 地址串
 */
export function fanucTcpAddress(point) {
  if (!point) {
    return "";
  }
  let addr = point.readType;
  if (point.param1 != null) {
    addr += "." + point.param1;
    if (point.param2 != null) {
      addr += "." + point.param2;
    }
  }
  return addr;
}
