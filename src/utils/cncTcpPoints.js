/**
 * 三菱 CNC TCP（MITSUBISHI_CNC_TCP，MELDAS MOCHA）协议点位表
 *
 * 作用：把"实际意义的点位"映射成协议寻址（采集项 readType + 轴号 axisNo），
 * 前端 MitsubishiCNC 配置抽屉据此做语义点位选择，选点后自动填充 标识/采集项/轴号。
 *
 * 地址模型与后端 MitsubishiCncDataReader 一致：
 *   协议地址 = readType（非轴点） / readType.axisNo（轴类点位，如 mechpos.1 = 1 轴机械坐标）
 *   - readType 采集项类型：18 个非轴点 + 轴点 mechpos/currpos/remapos/cu/sp
 *   - axisNo 轴号 1-6（对应 X/Y/Z/A/B/C），仅轴类点位有效
 *
 * 分组结构（group 为"点位类型"下拉的标题，与点位名错开，避免两级下拉名称重复）：
 *   coord   坐标        机械/当前/相对坐标（轴点）
 *   state   运行状态    CNC 状态/运行模式/报警/主轴转速/主轴负载/主轴温度
 *   prog    程序与刀具  主程序名/子程序名/程序步序号/刀具号
 *   speed   速度与代码  进给速度/S 代码/F 代码
 *   timing  时间与计数  上电/运行/切削时间 + 工件总计数（+ 未证实的 ct）
 *   load    轴负载      轴电流/轴速度（轴点）
 *
 * 语义来源（2026-10-15 真机 192.168.151.103:683 校准）：
 *   树根 `RootLink.DC.Protocol.MitsubishiNcTcpPacket.dll` 里**每个读点方法自己的错误串**是这批键的权威语义
 *   （`po`→"read cnc power on time error"→上电时间、`opt`→"read cnc running time error"→运行时间、
 *   `sl1`→spindle load、`ss1`→spindle speed、`stn`→program step number、`sv`→s code、`fv`→f code、
 *   `pn`→main program、`spn`→sub program、`cc`→cycle counter、`cut`→cutting time、`st`→spindle temperature、
 *   `pst`→cnc state、`opm`→cnc mode），并与真机读值双向核对（`po`≈29.4h ≥ `opt`≈13.3h ≥ `cut`≈13.3h；
 *   `sv`=1200（S 指令）与 `ss1`=1201（实际转速）成对；`ss1` 主轴停时归 0；`fre` 回 double、`fv` 回 double）。
 *   ⚠️ 本文件早先把其中 7 个键标成了别的含义（`po`=位置、`opt`=操作倍率、`sl1`/`ss1`=状态1/状态2、
 *   `stn`=主轴转速、`sv`=主轴速度、`fv`=进给倍率），2026-10-15 按上述错误串 + 真机读值订正。
 *
 * 数据类型：⚠️ **机床会忽略请求里的 DataType，回的是该数据区真实的类型**（真机实测：`axc` 请求 1 回 2、
 *   `cc` 请求 4 回 3、`st` 请求 3 回 2、`fv` 请求 3 回 6）。故每个点的 dataType 按**实测回包类型**给参考值：
 *   1/2/3 → int（u8/u16/u32），6 → float（double 在数据区末尾 8 字节），16 → string（前 4 字节长度 + GBK）。
 *   后端 `MitsubishiCncDataReader.ADDRESS_MAP` 里那个 dataType 只用于组请求帧，不影响解析。
 *
 * 三个"树根点位表里没有的键"（本文件与后端 ADDRESS_MAP 都保留，但**语义未经证实**）：
 *   - `axc` 与 `pst` **同址**（Section 35.10，仅请求 DataType 不同 —— 而 DataType 被忽略），真机实测两者回包
 *     一模一样（respType=2、同值）。**已从语义点位表移除**，只留在采集项下拉里供回显老配置；
 *   - `al`  Section 35.203，回 u8，本机恒 0，疑似"报警状态"但无证据；
 *   - `ct`  Section 40.8，回 u32，**实测每秒 +1**（本机 15:36:34→15:37:14 走 117→157），偶有跳变与归零，
 *     不是计数、疑似某个秒级计时器，确切含义未知 —— 别再按"计数（当前）"理解它。
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
 *
 * 机型（CNC_TCP_MODELS / CNC_TCP_POINT_TABLES）：
 *   机型**不改变协议族** —— 同一套 MELDAS MOCHA 帧吃多个机型，所以机型是**连接/机型参数**
 *   （存在网络组件的 other_config 里），不是新协议。它决定**取哪张语义点位表**：不同机型的
 *   点位集合/地址可能不同，本文件按机型分开存放。
 *   ⚠️ **分表是我们自己的扩展位，树根里没有第二张表可抄**：2026-10-15 反汇编复核确认，
 *   树根 MitsubishiNc* 族只有一个机型取值 `MELDAS700m`（MitsubishiNcTcpPacket.dll 的 .NCType
 *   枚举仅此一个成员），点位表也只有机型无关的一张（AllAddressManage.InitialMazakCNCRegsiter），
 *   `_ncType` 只当 9 个读点方法的布尔门闩。此前"树根同一驱动靠 lstModel 下拉切换"的说法已作废
 *   （lstModel 是 lambda 局部捕获变量，KeyTextModel 是每个协议插件都有的通用键值下拉模型）。
 *   点位表证据：**m80 已有真机实测**（2026-10-15，192.168.151.103:683，机床面板确认是 M80）——
 *   24 个协议地址用 M70/M700 那张表全部读通、读回值自洽，所以 m80 就沿用它（`verified: true`）；
 *   m70 本身反而**没有真机对照**（本平台这张表是从树根的 MELDAS700m 驱动逆向来的，`verified: false`）。
 *   ⚠️ 这是**单机观测**：推不出"M80 全系列通用"，也推不出"M70 单机成立"。尤其别拿 `code=0`
 *   当语义正确的证据 —— 型号不同而某键语义变了的话，地址照样回 0，只会静默读回一个看着合理的错值。
 */

// ===== 分组定义（点位类型下拉标题，group key → 组名） =====
export const CNC_TCP_GROUPS = {
  coord: "坐标",
  state: "运行状态",
  prog: "程序与刀具",
  speed: "速度与代码",
  timing: "时间与计数",
  load: "轴负载",
};

// 采集项语义名（手动指定地址模式的"采集项"下拉用，readType → 语义名）
// ⚠️ 名称按树根读点方法的错误串校准（见文件头"语义来源"）；标注"未证实"的三个键树根点位表里没有
export const CNC_TCP_READTYPE_NAMES = {
  pst: "CNC 状态",
  opm: "运行模式",
  al: "报警（未证实）",
  fre: "进给速度",
  pn: "主程序名",
  spn: "子程序名",
  cc: "工件总计数",
  sl1: "主轴负载",
  ss1: "主轴转速",
  tn: "刀具号",
  stn: "程序步序号",
  po: "上电时间",
  opt: "运行时间",
  cut: "切削时间",
  ct: "计时（未证实）",
  sv: "S 代码",
  fv: "F 代码",
  st: "主轴温度",
  axc: "整体轴坐标（未证实，与 CNC 状态同址）",
  mechpos: "机械坐标",
  currpos: "当前坐标",
  remapos: "相对坐标",
  cu: "轴电流",
  sp: "轴速度",
};

// ===== 非轴点位（18 个；名称按树根读点方法的错误串校准，见文件头） =====
const STATIC_POINTS = [
  { key: "cnc_pst", name: "CNC 状态", group: "state", readType: "pst", dataType: "int", symbol: "pst", desc: "CNC 状态（Section35.10 回 u16；本机实测 3）" },
  { key: "cnc_opm", name: "运行模式", group: "state", readType: "opm", dataType: "int", symbol: "opm", desc: "运行模式（Section35.11 回 u16；本机实测 0）" },
  { key: "cnc_al", name: "报警（未证实）", group: "state", readType: "al", dataType: "int", symbol: "al", desc: "报警（Section35.203 回 u8，本机恒 0）。⚠️ 树根点位表里没有这个键，是否报警状态无证据" },
  { key: "cnc_sl1", name: "主轴负载", group: "state", readType: "sl1", dataType: "int", symbol: "sl1", desc: "主轴负载（Section63.4 回 u32；主轴停时实测 0）" },
  { key: "cnc_ss1", name: "主轴转速", group: "state", readType: "ss1", dataType: "int", symbol: "ss1", desc: "主轴转速（Section63.3 回 u32；本机实测 1201 rpm，与 S 代码 sv 成对）" },
  { key: "cnc_st", name: "主轴温度", group: "state", readType: "st", dataType: "int", symbol: "st", desc: "主轴温度（Section63.221 回 u16；本机实测 37 ℃）" },
  { key: "cnc_pn", name: "主程序名", group: "prog", readType: "pn", dataType: "string", symbol: "pn", desc: "主程序名（Section45.101 字符串 GBK；本机实测 O0613）" },
  { key: "cnc_spn", name: "子程序名", group: "prog", readType: "spn", dataType: "string", symbol: "spn", desc: "子程序名（Section45.201 字符串 GBK；本机实测 9001）。⚠️ 不是主轴号" },
  { key: "cnc_stn", name: "程序步序号", group: "prog", readType: "stn", dataType: "int", symbol: "stn", desc: "程序步序号（Section45.103 回 u32）。⚠️ 不是主轴转速" },
  { key: "cnc_tn", name: "刀具号", group: "prog", readType: "tn", dataType: "int", symbol: "tn", desc: "刀具号（Section21.1 回 u32；本机实测 0）" },
  { key: "cnc_fre", name: "进给速度", group: "speed", readType: "fre", dataType: "float", symbol: "fre", desc: "进给速度（Section33.1 回 double）" },
  { key: "cnc_sv", name: "S 代码", group: "speed", readType: "sv", dataType: "int", symbol: "sv", desc: "S 代码（主轴转速指令，Section43.1 回 u32；本机实测 1200，与主轴转速 ss1=1201 成对）" },
  { key: "cnc_fv", name: "F 代码", group: "speed", readType: "fv", dataType: "float", symbol: "fv", desc: "F 代码（进给指令，Section42.1 回 double）" },
  { key: "cnc_po", name: "上电时间", group: "timing", readType: "po", dataType: "int", symbol: "po", desc: "上电时间（Section40.1 回 u32，毫秒；本机实测 105923901 ≈ 29.4 h）" },
  { key: "cnc_opt", name: "运行时间", group: "timing", readType: "opt", dataType: "int", symbol: "opt", desc: "运行时间（Section40.2 回 u32，毫秒；本机实测 47984920 ≈ 13.3 h，≤ 上电时间）" },
  { key: "cnc_cut", name: "切削时间", group: "timing", readType: "cut", dataType: "int", symbol: "cut", desc: "切削时间（Section40.3 回 u32，毫秒；本机实测 47735719 ≈ 13.3 h，≤ 运行时间）" },
  { key: "cnc_cc", name: "工件总计数", group: "timing", readType: "cc", dataType: "int", symbol: "cc", desc: "工件总计数（Section126.8002 回 u32；本机实测 88）" },
  { key: "cnc_ct", name: "计时（未证实）", group: "timing", readType: "ct", dataType: "int", symbol: "ct", desc: "Section40.8 回 u32。⚠️ 树根点位表里没有这个键；实测**每秒 +1**（117→157 走 40 秒）、偶有跳变与归零，疑似秒级计时器，不是计数" },
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
  { readType: "mechpos", name: "机械坐标", group: "coord", dataType: "float", symbol: "mechpos", desc: "机械坐标（Section37.1 回 double，值在数据区末尾 8 字节；本机 1 轴实测 80.0）" },
  { readType: "currpos", name: "当前坐标", group: "coord", dataType: "float", symbol: "currpos", desc: "当前坐标（Section37.2 回 double；本机 1 轴实测 580.761）" },
  { readType: "remapos", name: "相对坐标", group: "coord", dataType: "float", symbol: "remapos", desc: "相对坐标（Section37.3 回 double；本机 1 轴实测 580.761）" },
  { readType: "cu", name: "轴电流", group: "load", dataType: "int", symbol: "cu", desc: "轴电流（Section59.4 回 u16；本机 1 轴实测 3）。语义按树根轴循环推断，无错误串佐证" },
  { readType: "sp", name: "轴速度", group: "load", dataType: "int", symbol: "sp", desc: "轴速度（Section59.3 回 u32；本机 1 轴实测 0）。语义按树根轴循环推断，无错误串佐证" },
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

// M70/M700 系列点位表 —— 本平台点表的实际来源（树根 MitsubishiNcTcpPacket.dll 自标 MELDAS700m）
const POINT_TABLE_M70 = [].concat(STATIC_POINTS, AXIS_POINTS);

// ===== 机型 / NC 型 =====
// 机型是「网络组件」上的一个参数（other_config.model），不是新协议也不是设备属性：
//   - 不放协议：labdatahub_protocol 一行 = 一个上传的 jar，全局共享；机型挂上去等于「这个 jar 是 M80 的」，
//     而实际只有一个 jar 吃所有机型，同一平台同时接 M70/M80 也没法表达；
//   - 不放设备：配连接的入口在产品页的「网络组件」（ip/port 就在同一份 other_config 里），
//     设备侧没有自选入口，机型与 IP 必须一起改才不会漂移；设备记录还会被自注册/复制重建。
// hasOwnTable=false 表示该机型**没有自己的专属点表**，当前按 POINT_TABLE_M70 工作；
// 日后补齐证据时，只需在这里把 table 指向它自己的点表，其余代码（抽屉、选点、回显）无需改动。
// verified 表示「该机型沿用 M70 表这件事**有真机实测证据**」—— 只看 hasOwnTable 会把两种
// 情况混成一类（"逆向来的、没上过真机" 与 "真机验过、确认可用"，两者 hasOwnTable 都是 false），
// 抽屉里就会对一台明明读得通的机床挂着"若读不到值需按厂商文档核对"的橙色警告。
export const CNC_TCP_MODELS = [
  {
    value: "m70",
    label: "M70 / M700 系列",
    desc: "MELDAS 700 系列，本平台点表的逆向来源（⚠️ M70 真机尚未对照验证）",
    hasOwnTable: true,
    verified: false,
  },
  {
    value: "m80",
    label: "M80 / M800 系列",
    desc: "MELDAS 800 系列。2026-10-15 真机（192.168.151.103:683，机床面板确认 M80）实测：沿用 M70/M700 点位表，24 个协议地址全部读通、读回值自洽",
    hasOwnTable: false,
    verified: true,
  },
  {
    value: "unknown",
    label: "未知 / 其他机型",
    desc: "机型未确认，暂用 M70/M700 点位表，待补充证据",
    hasOwnTable: false,
    verified: false,
  },
];

// 机型未设置 / 取值不认识时的兜底机型（按 M70/M700 表工作）
export const CNC_TCP_DEFAULT_MODEL = "m70";

// 机型 → 语义点位表。m80/unknown 暂无专属表，先共用 M70 表
const CNC_TCP_POINT_TABLES = {
  m70: POINT_TABLE_M70,
  m80: POINT_TABLE_M70,
  unknown: POINT_TABLE_M70,
};

/**
 * 取某机型可用的语义点位表
 * @param model 机型值（other_config.model；为空/不认识时按 CNC_TCP_DEFAULT_MODEL 兜底）
 * @returns 点位数组
 */
export function getCncTcpPointTable(model) {
  return CNC_TCP_POINT_TABLES[model] || CNC_TCP_POINT_TABLES[CNC_TCP_DEFAULT_MODEL];
}

/**
 * 按机型值找机型定义
 * @param model 机型值
 * @returns 机型对象；为空/不认识时返回兜底机型定义
 */
export function findCncTcpModel(model) {
  const hit = CNC_TCP_MODELS.find((m) => m.value == model);
  if (hit) {
    return hit;
  }
  return CNC_TCP_MODELS.find((m) => m.value == CNC_TCP_DEFAULT_MODEL);
}

export const CNC_TCP_POINT_TABLE = POINT_TABLE_M70;

// 点位类型分组展示名（点位类型下拉标题），与 CNC_TCP_GROUPS 一致
export const CNC_TCP_ROW_LABELS = CNC_TCP_GROUPS;

/**
 * 按协议地址反向查找点位（编辑配置回显用）
 * @param readType 采集项类型
 * @param axisNo 轴号（仅轴类点位有效，非轴点传 null/undefined）
 * @param model 机型值（可选；不传按兜底机型，即 M70/M700 表）
 * @returns 点位对象；未命中返回 null
 */
export function findCncTcpPoint(readType, axisNo, model) {
  if (readType == null) {
    return null;
  }
  const a = axisNo == null ? "" : String(axisNo);
  return (
    getCncTcpPointTable(model).find((p) => {
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
