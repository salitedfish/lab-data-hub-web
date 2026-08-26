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
 *   - FANUC FOCAS2 官方函数库 fwlib32 读取函数族（cnc_rdaxisdata / cnc_acts /
 *     cnc_rdspload / cnc_actf / cnc_statinfo / cnc_rdprgnum / cnc_rdalmmsg /
 *     cnc_rdmacro / cnc_rdtimer / pmc_rdpmcrng）。
 *     注：FOCAS2 无 cnc_rdspindle / cnc_rdact / cnc_rdtcode / cnc_rdopmode / pmc_rdpmc，
 *     主轴转速/进给/刀具/操作模式分别由 cnc_acts / cnc_actf / 宏变量(#3901/#3902) / cnc_statinfo 读取。
 *   - 坐标轴序 1-6 = X/Y/Z/A/B/C；坐标类型 param2：1=机械 2=绝对 3=相对 4=剩余，
 *     后端映射 fwlib type（1=机械 0=绝对 2=相对 3=剩余），值 = data/10^dec。
 *   - 操作模式/运行状态来自 cnc_statinfo 的 ODBST.aut/run（0i-D/F 语义见 mode/status 点位 desc）。
 *   - 主轴倍率 FOCAS2 无直接读取函数，需按机床 PMC 梯形图用 pmc 分组读 G 区倍率地址（点位表不预置）。
 *   - 顺序号 FOCAS2 无直接读取函数，sequence_no 点位保留但不可读（后端返回 null）。
 *   - 刀具号经系统宏变量读取：#3901 当前刀具、#3902 程序指定下一把刀具（FOCAS2 无直接读刀具函数）。
 *   - 时间参数 1=运行 2=切削 3=循环 4=上电（cnc_rdtimer type 1/2/3/0，单位分钟）。
 *   - 宏变量 1-9999（常用 500+ 用户宏变量，数值可含小数，值=mcr_val/10^dec_val）。
 *   - PMC 信号：param1=1(F)/2(G)/3(X)/4(Y)，param2=字节地址号；读整字节，位需自行按位解析；
 *     具体 F/G/X/Y 地址以机床 PMC 梯形图为准，点位表先给常见几个，**完整 PMC 点位待真机验证后补充**。
 *   - JNA 结构体字段偏移为 FOCAS2 对接最关键环节，第一次真机/NCGuide 验证后需核对修正。
 *   - 真机实测（台丽 0i-MF Plus，2026-08-26，cnc_rdaxisdata len 输出确认受控轴 4 根）：
 *     · 本机轴序为 X/Y/Z/A（4 根），B/C 在此机读取返回 null（点位保留，供多轴机使用）；
 *     · 四类坐标（机械/绝对/相对/剩余）均实测有效，dec=3（0.001mm），值 = data/10^dec；
 *     · #3901 当前刀具 dec_val=7（刀具 44 存为 mcr_val=440000000），刀具号必须按 10^dec 换算；
 *     · 未使用的宏变量 #500+ 实测返回 0（不报错）；F1/F0/G8 实测字节值 0x80/0x40/0x31，
 *       位含义需按机床 PMC 梯形图确认（点位表 pmc 分组为占位示例）；
 *     · cnc_actf 官方单位 0.1mm/min，后端已除以 10 换算 mm/min；cnc_acts 单位 rpm 为原值。
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
      desc: "轴" + ax[2] + "（" + ax[1] + "）" + ct[1] + "（cnc_rdaxisdata type=" + ct[2] + "），单位 mm（含小数）",
    });
  });
});

// ===== 主轴 spindle（param1=1转速 2倍率 3负载 4报警） =====
const SPINDLE = [
  { key: "spindle_speed", name: "主轴转速", readType: "spindle", param1: 1, param2: null, dataType: "float", symbol: "S", desc: "主轴实际转速（cnc_acts），单位 rpm" },
  { key: "spindle_override", name: "主轴倍率", readType: "spindle", param1: 2, param2: null, dataType: "int", symbol: "S%", desc: "主轴倍率百分比（FOCAS2 无直接读取函数，需按机床梯形图用 pmc 分组读 G 区倍率地址）" },
  { key: "spindle_load", name: "主轴负载", readType: "spindle", param1: 3, param2: null, dataType: "int", symbol: "S-Load", desc: "主轴电机负载（cnc_rdspload，负载在 data[0]），百分比" },
  { key: "spindle_alarm", name: "主轴报警", readType: "spindle", param1: 4, param2: null, dataType: "int", symbol: "S-Alm", desc: "主轴报警状态（cnc_rdalmmsg type=9；0=无报警 1=有报警）" },
];

// ===== 进给 feed（param1=1 实际进给；进给倍率 FOCAS2 无直接函数，需走 PMC） =====
const FEED = [
  { key: "feedrate_actual", name: "实际进给速度", readType: "feed", param1: 1, param2: null, dataType: "float", symbol: "F", desc: "实际进给速度（cnc_actf），单位随 G94/G95：mm/min 或 mm/rev；进给倍率需 PMC 读取" },
];

// ===== 操作模式 mode（cnc_statinfo → ODBST.aut，0i-D/F） =====
const MODE = [
  { key: "operation_mode", name: "操作模式", readType: "mode", param1: null, param2: null, dataType: "int", symbol: "OPMODE", desc: "操作模式（0i-D/F ODBST.aut）：0=MDI 1=MEM(自动) 2=*** 3=EDIT 4=HANDLE 5=JOG 6=Teach JOG 7=Teach HANDLE 8=INC 9=REF 10=RMT 11=TEST" },
];

// ===== 运行状态 status（cnc_statinfo → ODBST.run/emergency/aut） =====
const STATUS = [
  { key: "status_run", name: "运行状态", readType: "status", param1: 1, param2: null, dataType: "int", symbol: "RUN", desc: "运行状态（run==START(3) 为 1 加工中，否则 0 待机/停止）" },
  { key: "status_stop", name: "停止", readType: "status", param1: 2, param2: null, dataType: "int", symbol: "STOP", desc: "机床停止（run==STOP(1) 为 1，否则 0）" },
  { key: "status_emergency", name: "急停", readType: "status", param1: 3, param2: null, dataType: "int", symbol: "EMG", desc: "急停状态（0=未急停 1=急停/复位中）" },
  { key: "status_automatic", name: "自动方式", readType: "status", param1: 4, param2: null, dataType: "int", symbol: "AUTO", desc: "自动方式（aut==MEM(1) 为 1，否则 0）" },
];

// ===== 程序 prgnum（param1=1程序号 2顺序号） =====
const PRGNUM = [
  { key: "program_no", name: "当前程序号", readType: "prgnum", param1: 1, param2: null, dataType: "int", symbol: "O", desc: "当前运行程序号（cnc_rdprgnum）" },
  { key: "sequence_no", name: "当前顺序号", readType: "prgnum", param1: 2, param2: null, dataType: "int", symbol: "N", desc: "当前程序段顺序号（FOCAS2 无直接读取函数，暂不可读）" },
];

// ===== 报警 alarm（param1=1报警数量 2报警文本） =====
const ALARM = [
  { key: "alarm_no", name: "报警数量", readType: "alarm", param1: 1, param2: null, dataType: "int", symbol: "ALM-NO", desc: "当前报警数量（cnc_rdalmmsg type=-1 的 num 输出条数；当前无报警为0）" },
  { key: "alarm_msg", name: "报警文本", readType: "alarm", param1: 2, param2: null, dataType: "string", symbol: "ALM-MSG", desc: "当前报警文本（多条时取最后一条，GBK 解码）" },
];

// ===== 刀具 tcode（param1=1当前刀具 2程序指定下一把刀具） =====
const TCODE = [
  { key: "tool_no_current", name: "当前刀具号", readType: "tcode", param1: 1, param2: null, dataType: "int", symbol: "T", desc: "当前使用刀具号（FOCAS2 无 cnc_rdtcode，读系统宏变量 #3901）" },
  { key: "tool_no_last", name: "下一把刀具号", readType: "tcode", param1: 2, param2: null, dataType: "int", symbol: "T-Next", desc: "程序指定下一把刀具号（读系统宏变量 #3902；FOCAS2 无直接读上一把刀具的函数，保留此点位表示 #3902 值）" },
];

// ===== 时间 timer（param1=1运行 2切削 3循环 4上电，单位分钟） =====
const TIMER = [
  { key: "time_run", name: "运行时间", readType: "timer", param1: 1, param2: null, dataType: "int", symbol: "TIME-RUN", desc: "累计运行时间（cnc_rdtimer type=1），单位分钟" },
  { key: "time_cut", name: "切削时间", readType: "timer", param1: 2, param2: null, dataType: "int", symbol: "TIME-CUT", desc: "累计切削时间（cnc_rdtimer type=2），单位分钟" },
  { key: "time_cycle", name: "循环时间", readType: "timer", param1: 3, param2: null, dataType: "int", symbol: "TIME-CYC", desc: "累计循环时间（cnc_rdtimer type=3），单位分钟" },
  { key: "time_poweron", name: "上电时间", readType: "timer", param1: 4, param2: null, dataType: "int", symbol: "TIME-ON", desc: "累计通电时间（cnc_rdtimer type=0），单位分钟" },
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
    desc: "宏变量 #" + n + "（可含小数，值=mcr_val/10^dec_val；未使用的宏变量实测返回 0 而非报错）",
  });
}

// ===== PMC 信号 pmc（param1=1(F) 2(G) 3(X) 4(Y)，param2=字节地址号；整字节返回，位需自行按位解析） =====
// 台丽 0i-MF Plus 真机实测（2026-08-26）：F1=0x80、F0=0x40、G8=0x31（机床 MEM 待机态）。
// 每个位代表什么信号只能以该机床 PMC 梯形图为准（F/G 区含义由梯形图定义，非 FOCAS2 固定），
// 建议用平台 pmc 点位 + 机床梯形图逐一核对后再把 bit 映射固化成业务点位。
const PMC = [
  { key: "pmc_f1_auto", name: "F1 自动运行信号", readType: "pmc", param1: 1, param2: 1, dataType: "int", symbol: "F1", desc: "F 区地址 1 整字节（台丽实测 0x80，待机态；自动运行信号一般在 F1.0/F1.1，具体以机床 PMC 梯形图为准）" },
  { key: "pmc_f0_estop", name: "F0 急停信号", readType: "pmc", param1: 1, param2: 0, dataType: "int", symbol: "F0", desc: "F 区地址 0 整字节（台丽实测 0x40；急停/报警相关位以机床 PMC 梯形图为准）" },
  { key: "pmc_g8_spindle", name: "G8 主轴信号", readType: "pmc", param1: 2, param2: 8, dataType: "int", symbol: "G8", desc: "G 区地址 8 整字节（台丽实测 0x31；主轴相关位以机床 PMC 梯形图为准）" },
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
