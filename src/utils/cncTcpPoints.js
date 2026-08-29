/**
 * 三菱 CNC TCP（MITSUBISHI_CNC_TCP，MELDAS MOCHA）协议点位表
 *
 * 作用：把"实际意义的点位"映射成协议寻址（采集项 readType + 轴号 axisNo），
 * 前端 MitsubishiCNC 配置抽屉据此做语义点位选择，选点后自动填充 标识/采集项/轴号。
 *
 * 地址模型与后端 MitsubishiCncDataReader 一致：
 *   协议地址 = readType（非轴点） / readType.axisNo（轴类点位，如 mechpos.1 = 1 轴机械坐标）
 *   - readType 采集项类型：axc/pst/opm/al/fre/pn/spn/cc/sl1/ss1/tn/stn/po/opt/cut/ct/sv/fv/st
 *     （树根 19 键）+ 轴点 mechpos/currpos/remapos/cu/sp
 *   - axisNo 轴号 1-6（对应 X/Y/Z/A/B/C），仅轴类点位有效
 *
 * 分组结构（group 为"点位类型"下拉的标题，与点位名错开，避免两级下拉名称重复）：
 *   coord   坐标        axc 整体轴坐标 + 机械/当前/相对坐标（轴点）
 *   state   运行信息    程序状态/运行模式/报警/状态1/状态2/温度状态
 *   prog    程序与刀具  程序号/主轴号/刀具号
 *   speed   速度与倍率  进给速度/主轴速度/主轴转速/进给倍率/操作倍率/切削
 *   poscnt  位置与计数  位置/计数（总）/计数（当前）
 *   load    轴负载      轴电流/轴速度（轴点）
 *
 * 数据来源：树根 RootLink.DC.Protocol.MitsubishiNcTcpPacket.dll（未混淆，IL 逐条提取），
 *   见 TestFwlib/cnc_tcp_protocol.md。数据类型 DataType：
 *   - 3/5/6 double（坐标/转速/倍率/状态），4 long/int（计数），16 字符串（程序号/主轴号）
 *   - 1（轴坐标 axc）、2（程序状态 pst/运行模式 opm/报警 al）结构未知，暂不支持，标注待真机验证
 *   - 帧结构（GIOPHead+MessageHead+操作名+GetDataBody）与坐标点位数据布局待真机校准
 *   - cc/ct 逆向文档均记"计数"，此处按 Section 位置区分命名（cc=126.8002、ct=40.8），待真机验证后按实测语义改名
 *
 * 每个点位字段：
 *   key       建议的物模型属性标识（选点后自动填入 code，可编辑）
 *   name      下拉显示名
 *   group     点位类型分组（点位类型下拉标题）
 *   readType  采集项类型（树根点位键）
 *   axisNo    轴号（仅轴类点位有值，非轴点留空）
 *   dataType  建议数据类型（建物模型属性时参考，不强制）
 *   symbol    符号地址（仅展示）
 *   desc      一行说明
 */

// ===== 分组定义（点位类型下拉标题，group key → 组名） =====
export const CNC_TCP_GROUPS = {
  coord: "坐标",
  state: "运行信息",
  prog: "程序与刀具",
  speed: "速度与倍率",
  poscnt: "位置与计数",
  load: "轴负载",
};

// 采集项语义名（手动指定地址模式的"采集项"下拉用，readType → 语义名）
export const CNC_TCP_READTYPE_NAMES = {
  axc: "整体轴坐标",
  pst: "程序状态",
  opm: "运行模式",
  al: "报警",
  fre: "进给速度",
  pn: "程序号",
  spn: "主轴号",
  cc: "计数（总）",
  sl1: "状态1",
  ss1: "状态2",
  tn: "刀具号",
  stn: "主轴转速",
  po: "位置",
  opt: "操作倍率",
  cut: "切削",
  ct: "计数（当前）",
  sv: "主轴速度",
  fv: "进给倍率",
  st: "温度/状态",
  mechpos: "机械坐标",
  currpos: "当前坐标",
  remapos: "相对坐标",
  cu: "轴电流",
  sp: "轴速度",
};

// ===== 非轴点位（树根 19 键） =====
const STATIC_POINTS = [
  { key: "cnc_axc", name: "整体轴坐标", group: "coord", readType: "axc", dataType: "int", symbol: "axc", desc: "轴坐标（多轴整体，Section35.10 datatype1），结构未知，待真机验证" },
  { key: "cnc_pst", name: "程序状态", group: "state", readType: "pst", dataType: "int", symbol: "pst", desc: "程序状态（datatype2，可能为位掩码/枚举），待真机校准" },
  { key: "cnc_opm", name: "运行模式", group: "state", readType: "opm", dataType: "int", symbol: "opm", desc: "运行模式（datatype2，可能为位掩码/枚举），待真机校准" },
  { key: "cnc_al", name: "报警", group: "state", readType: "al", dataType: "int", symbol: "al", desc: "报警（datatype2，可能为位掩码/枚举），待真机校准" },
  { key: "cnc_sl1", name: "状态1", group: "state", readType: "sl1", dataType: "float", symbol: "sl1", desc: "状态1（Section63.4 datatype3 double）" },
  { key: "cnc_ss1", name: "状态2", group: "state", readType: "ss1", dataType: "float", symbol: "ss1", desc: "状态2（Section63.3 datatype3 double）" },
  { key: "cnc_st", name: "温度/状态", group: "state", readType: "st", dataType: "float", symbol: "st", desc: "温度/状态（Section63.221 datatype3 double）" },
  { key: "cnc_fre", name: "进给速度", group: "speed", readType: "fre", dataType: "float", symbol: "fre", desc: "进给速度（Section33.1 datatype6 float）" },
  { key: "cnc_pn", name: "程序号", group: "prog", readType: "pn", dataType: "string", symbol: "pn", desc: "程序号（Section45.101 datatype16 字符串）" },
  { key: "cnc_spn", name: "主轴号", group: "prog", readType: "spn", dataType: "string", symbol: "spn", desc: "主轴号（Section45.201 datatype16 字符串）" },
  { key: "cnc_tn", name: "刀具号", group: "prog", readType: "tn", dataType: "float", symbol: "tn", desc: "刀具号（Section21.1 datatype3 double）" },
  { key: "cnc_stn", name: "主轴转速", group: "speed", readType: "stn", dataType: "float", symbol: "stn", desc: "主轴转速（Section45.103 datatype3 double）" },
  { key: "cnc_sv", name: "主轴速度", group: "speed", readType: "sv", dataType: "float", symbol: "sv", desc: "主轴速度（Section43.1 datatype3 double）" },
  { key: "cnc_fv", name: "进给倍率", group: "speed", readType: "fv", dataType: "float", symbol: "fv", desc: "进给倍率（Section42.1 datatype3 double）" },
  { key: "cnc_opt", name: "操作倍率", group: "speed", readType: "opt", dataType: "float", symbol: "opt", desc: "操作倍率（Section40.2 datatype3 double）" },
  { key: "cnc_cut", name: "切削", group: "speed", readType: "cut", dataType: "float", symbol: "cut", desc: "切削（Section40.3 datatype3，与位置/倍率同区，可能为切削速度，待真机验证）" },
  { key: "cnc_cc", name: "计数（总）", group: "poscnt", readType: "cc", dataType: "int", symbol: "cc", desc: "计数（Section126.8002 datatype4 long，可能为累计/总计数，逆向仅记'计数'，待真机验证）" },
  { key: "cnc_ct", name: "计数（当前）", group: "poscnt", readType: "ct", dataType: "float", symbol: "ct", desc: "计数（Section40.8 datatype3 double，与位置/倍率同区，可能为当前加工计数，待真机验证）" },
  { key: "cnc_po", name: "位置", group: "poscnt", readType: "po", dataType: "float", symbol: "po", desc: "位置（Section40.1 datatype3 double）" },
];

// ===== 轴类点位（mechpos/currpos/remapos/cu/sp，轴号 1-6 = X/Y/Z/A/B/C） =====
const AXIS_LIST = [
  [1, "X"],
  [2, "Y"],
  [3, "Z"],
  [4, "A"],
  [5, "B"],
  [6, "C"],
];
const AXIS_POINT_DEFS = [
  { readType: "mechpos", name: "机械坐标", group: "coord", dataType: "float", symbol: "mechpos", desc: "机械坐标（Section37.1 datatype5，坐标 double 在数据区末尾）" },
  { readType: "currpos", name: "当前坐标", group: "coord", dataType: "float", symbol: "currpos", desc: "当前坐标（Section37.2 datatype5，坐标 double 在数据区末尾）" },
  { readType: "remapos", name: "相对坐标", group: "coord", dataType: "float", symbol: "remapos", desc: "相对坐标（Section37.3 datatype5，坐标 double 在数据区末尾）" },
  { readType: "cu", name: "轴电流", group: "load", dataType: "float", symbol: "cu", desc: "轴电流（Section59.4 datatype3 double）" },
  { readType: "sp", name: "轴速度", group: "load", dataType: "float", symbol: "sp", desc: "轴速度（Section59.3 datatype3 double）" },
];
const AXIS_POINTS = [];
AXIS_POINT_DEFS.forEach((def) => {
  AXIS_LIST.forEach((ax) => {
    AXIS_POINTS.push({
      key: "cnc_" + def.readType + "_" + ax[1].toLowerCase(),
      name: def.name + " " + ax[1],
      group: def.group,
      readType: def.readType,
      axisNo: ax[0],
      dataType: def.dataType,
      symbol: def.symbol + "." + ax[0],
      desc: "轴" + ax[0] + "（" + ax[1] + "）" + def.desc,
    });
  });
});

export const CNC_TCP_POINT_TABLE = [].concat(STATIC_POINTS, AXIS_POINTS);

// 点位类型分组展示名（点位类型下拉标题），与 CNC_TCP_GROUPS 一致
export const CNC_TCP_ROW_LABELS = CNC_TCP_GROUPS;

/**
 * 按协议地址反向查找点位（编辑配置回显用）
 * @param readType 采集项类型
 * @param axisNo 轴号（仅轴类点位有效，非轴点传 null/undefined）
 * @returns 点位对象；未命中返回 null
 */
export function findCncTcpPoint(readType, axisNo) {
  if (readType == null) {
    return null;
  }
  const a = axisNo == null ? "" : String(axisNo);
  return (
    CNC_TCP_POINT_TABLE.find((p) => {
      const q = p.axisNo == null ? "" : String(p.axisNo);
      return p.readType == readType && q == a;
    }) || null
  );
}

/**
 * 协议地址字符串（采集项类型[.轴号]，如 mechpos.1 = 1 轴机械坐标；非轴点省略轴号）
 * @param point 点位对象
 * @returns 地址串
 */
export function cncTcpAddress(point) {
  if (!point) {
    return "";
  }
  let addr = point.readType;
  if (point.axisNo != null) {
    addr += "." + point.axisNo;
  }
  return addr;
}

/**
 * 是否为轴类点位（需要轴号）
 * @param readType 采集项类型
 * @returns true-轴类点位
 */
export function isAxisReadType(readType) {
  return readType == "mechpos" || readType == "currpos" || readType == "remapos"
    || readType == "cu" || readType == "sp";
}
