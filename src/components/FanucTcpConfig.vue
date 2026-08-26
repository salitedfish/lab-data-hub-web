<template>
  <div class="modbus-config">
    <div class="tab-content">
      <div class="tab-header">
        <div class="tab-title">Fanuc_TCP配置</div>
        <div class="tab-actions" style="right: 20px" v-if="!isProductIn">
          <span style="font-weight: 800; align-items: center; gap: 4px">
            <!-- 感叹号图标 + 悬浮提示 -->
            <el-tooltip
              class="item"
              effect="dark"
              :content="'修改定时配置都需要关闭再开启才会生效'"
              placement="top"
            >
              <i
                class="el-icon-warning"
                style="color: #a2a2a2; font-size: 14px; cursor: pointer"
              ></i>
            </el-tooltip>
            {{ timeEnabled ? "定时读取已开启" : "定时读取已关闭" }}
          </span>
          <el-switch
            v-model="timeEnabled"
            active-text=""
            inactive-text=""
            active-color="#13ce66"
            inactive-color="#ff4949"
            @change="handleFanucTcpStatusChange"
            class="status-switch"
          />
        </div>
        <div class="tab-actions">
          <el-button
            type="primary"
            icon="el-icon-plus"
            class="action-btn"
            @click="addFanucTcpConfig"
            >添加配置</el-button
          >
        </div>
      </div>
      <div class="filter-bar">
        <el-form :inline="true" class="filter-form">
          <el-form-item label="标识">
            <el-input v-model="fanucTcpParams.code"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              icon="el-icon-search"
              @click="getFanucTcpConfigByDeviceSn()"
              class="search-btn"
              >查询
            </el-button>
          </el-form-item>
        </el-form>
      </div>
      <el-table
        :data="fanucTcpList"
        style="width: 100%"
        class="data-table"
        stripe
      >
        <el-table-column prop="code" label="标识" width="150" />
        <el-table-column label="点位" width="180">
          <template slot-scope="scope">
            {{ fanucPointName(scope.row) }}
          </template>
        </el-table-column>
        <el-table-column prop="param1" label="参数1" width="100" />
        <el-table-column prop="param2" label="参数2" width="100" />
        <el-table-column prop="intervalTime" label="读取间隔(s)" width="130" />
        <el-table-column prop="delayTime" label="读取后延迟(ms)" width="140" />
        <el-table-column label="操作" width="200" fixed="right">
          <template slot-scope="scope">
            <el-button
              size="mini"
              icon="el-icon-edit"
              type="primary"
              :loading="editLoading == scope.row.id"
              :disabled="editLoading == scope.row.id"
              @click="editFanucTcpConfig(scope.row)"
              class="table-action"
              >编辑
            </el-button>
            <el-button
              size="mini"
              icon="el-icon-delete"
              type="danger"
              :loading="deleteLoading == scope.row.id"
              :disabled="deleteLoading == scope.row.id"
              @click="deleteFanucTcp(scope.row.id)"
              class="table-action"
              >删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        class="pagination"
        :current-page="fanucTcpParams.pageNum"
        :page-size="fanucTcpParams.pageSize"
        :total="fanucTcpParams.total"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="(pageNum) => { fanucTcpParams.pageNum = pageNum; getFanucTcpConfigByDeviceSn(); }"
        @size-change="(size) => { fanucTcpParams.pageSize = size; fanucTcpParams.pageNum = 1; getFanucTcpConfigByDeviceSn(); }"
      />
    </div>
    <el-drawer
      :title="fanucTcpIsEdit ? '修改配置' : '新增配置'"
      :visible.sync="openAddFanucTcp"
      direction="rtl"
      size="45%"
      :before-close="closeFanucTcp"
      class="component-drawer"
    >
      <div class="drawer-content">
        <!-- 添加或修改配置 -->
        <el-form
          ref="fanucTcpForm"
          :model="fanucTcpForm"
          label-width="140px"
        >
          <!-- 语义点位选择：先选点位类型（采集项），再选具体点位，自动填 标识/采集项/参数1/参数2 -->
          <el-form-item label="点位类型" prop="pointType" required v-if="!manualMode">
            <el-select
              v-model="fanucTcpForm.pointType"
              placeholder="先选择点位类型，如：坐标 / 主轴"
              style="width: 100%"
              @change="onPointTypeChange"
            >
              <el-option
                v-for="t in pointTypes"
                :key="t.value"
                :label="t.label"
                :value="t.value"
              ></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="点位" prop="pointKey" required v-if="!manualMode">
            <el-select
              v-model="fanucTcpForm.pointKey"
              placeholder="再选择具体点位，如：机械坐标 X / 主轴转速"
              filterable
              clearable
              style="width: 100%"
              @change="onPointKeyChange"
            >
              <el-option
                v-for="p in pointsByType"
                :key="p.key"
                :label="p.name"
                :value="p.key"
              >
                <span>{{ p.name }}</span>
                <span class="pt-symbol">{{ p.symbol }}</span>
              </el-option>
            </el-select>
            <div class="point-tip">
              选点后自动填入「标识 / 采集项 / 参数」并展示下方地址信息，无需了解 FOCAS2 细节；可按名称搜索。
            </div>
          </el-form-item>
          <!-- 选中点位背后的地址信息展示 -->
          <div class="point-address" v-if="!manualMode && selectedPoint">
            <div class="addr-row">
              <span class="addr-label">符号地址</span>{{ selectedPoint.symbol }}
            </div>
            <div class="addr-row">
              <span class="addr-label">协议地址</span
              >{{ fanucTcpAddress(selectedPoint) }}
            </div>
            <div class="addr-row">
              <span class="addr-label">建议类型</span>{{ selectedPoint.dataType }}
            </div>
            <div class="addr-row" v-if="selectedPoint.desc">
              <span class="addr-label">说明</span>{{ selectedPoint.desc }}
            </div>
          </div>
          <el-form-item label="标识" prop="code" required>
            <el-input
              v-model="fanucTcpForm.code"
              placeholder="选点位后自动填入，如 machine_x"
            />
            <div class="code-tip">
              标识需与「物模型」tab 中属性标识一致。选点位后已自动填入建议标识，请在物模型里新建同名属性（数据类型参考上方建议值）。
            </div>
          </el-form-item>
          <!-- 手动指定地址入口（PMC 及自定义采集项走这里） -->
          <div class="manual-toggle">
            <el-link type="primary" :underline="false" @click="toggleManualMode">
              {{ manualMode ? "返回点选点位" : "需要自定义地址？手动指定" }}
            </el-link>
          </div>
          <el-form-item label="采集项" prop="readType" required v-if="manualMode">
            <el-select
              v-model="fanucTcpForm.readType"
              placeholder="请选择采集项类型"
              style="width: 100%"
              @change="onReadTypeChange"
            >
              <!-- 采集项下拉：从 readTypeOptions 渲染，value 即 FOCAS2 采集项类型 -->
              <el-option
                v-for="item in readTypeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              ></el-option>
            </el-select>
            <div class="data-area-tip" v-if="fanucTcpForm.readType">
              采集项说明：{{ readTypeDesc }}
            </div>
          </el-form-item>
          <el-form-item label="参数1" prop="param1" required v-if="manualMode">
            <el-input
              v-model="fanucTcpForm.param1"
              type="number"
              placeholder="随采集项含义变化，如 1；mode 无需参数可留空"
            />
          </el-form-item>
          <el-form-item
            label="参数2"
            prop="param2"
            required
            v-if="manualMode && needParam2"
          >
            <el-input
              v-model="fanucTcpForm.param2"
              type="number"
              placeholder="axis=坐标类型(1机械 2绝对 3相对 4剩余)；pmc=字节地址号"
            />
          </el-form-item>
          <el-form-item label="读取间隔(秒)" prop="intervalTime" required>
            <el-input
              type="number"
              v-model="fanucTcpForm.intervalTime"
              placeholder="多久执行一次读取指令，如：10"
            />
          </el-form-item>
          <el-form-item label="读取后延迟(毫秒)" prop="delayTime" required>
            <el-input
              type="number"
              v-model="fanucTcpForm.delayTime"
              placeholder="同一机床每次读取间隔，如：100"
            />
          </el-form-item>
        </el-form>
        <div
          style="
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            margin-top: 20px;
          "
        >
          <el-button
            type="primary"
            :loading="submitLoading"
            :disabled="submitLoading"
            @click="submitFanucTcpForm"
            >确 定</el-button
          >
          <el-button @click="closeFanucTcp" style="margin-left: 12px"
            >取 消</el-button
          >
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import {
  listFanucFocas,
  delFanucFocas,
  updateFanucFocas,
  addFanucFocas,
  getFanucFocas,
} from "@/api/business/fanucFocas";
import { readFanucFocasSwitchByDevice } from "@/api/business/fanucFocas";
// 内置 FOCAS2 点位表：语义点位 → 协议地址（采集项.参数1.参数2），数据来源见 utils/fanucTcpPoints.js
import {
  FANUC_TCP_POINT_TABLE,
  FANUC_TCP_ROW_LABELS,
  findFanucTcpPoint,
  fanucTcpAddress as toAddress,
} from "@/utils/fanucTcpPoints";

export default {
  name: "FanucTcpConfig",
  props: {
    deviceSn: {
      type: String,
      required: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    // 产品还是设备进入
    isProductIn: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      timeEnabled: this.enabled,
      openAddFanucTcp: false,
      fanucTcpIsEdit: false,
      submitLoading: false,
      // 每行独立 loading 状态（用行 id 区分，避免点击一行导致整列按钮一起 loading）
      editLoading: null,
      deleteLoading: null,
      // 点位选择模式：false=点选点位（自动填地址），true=手动输入采集项/参数1/参数2
      manualMode: false,
      // 当前选中的点位对象（用于地址信息展示）
      selectedPoint: null,
      fanucTcpParams: {
        pageNum: 1,
        pageSize: 10,
        total: 0,
        belongSn: null,
        belongType: null,
        code: null,
      },
      fanucTcpForm: {},
      fanucTcpList: [],
      // 采集项选项及含义说明（对应 FOCAS2 fwlib32 读取函数族）
      readTypeOptions: [
        { value: "axis", label: "axis 坐标", desc: "坐标：param1=轴号(1 X 2 Y 3 Z 4 A 5 B 6 C)，param2=坐标类型(1机械 2绝对 3相对 4剩余)" },
        { value: "spindle", label: "spindle 主轴", desc: "主轴：param1=1转速(cnc_acts) 2倍率(无直接函数需PMC) 3负载(cnc_rdspload) 4报警(cnc_rdalmmsg type=9)" },
        { value: "feed", label: "feed 进给", desc: "进给：param1=1实际进给(cnc_actf，单位随G94/G95 mm/min或mm/rev)；进给倍率需 PMC 读取" },
        { value: "mode", label: "mode 操作模式", desc: "操作模式：无参数（ODBST.aut：0=MDI 1=MEM 2=*** 3=EDIT 4=HANDLE 5=JOG 6=Teach JOG 7=Teach HANDLE 8=INC 9=REF 10=RMT 11=TEST）" },
        { value: "status", label: "status 运行状态", desc: "运行状态：param1=1运行/加工中(run==START) 2停止(run==STOP) 3急停(emergency) 4自动方式(aut==MEM)" },
        { value: "prgnum", label: "prgnum 程序", desc: "程序：param1=1程序号(cnc_rdprgnum)；2顺序号(cnc_rdseqnum)" },
        { value: "exeprgname", label: "exeprgname 主程序名", desc: "主程序名：无参数（cnc_exeprgname，当前执行中的程序名，最长32字节）" },
        { value: "alarm", label: "alarm 报警", desc: "报警：param1=1报警数量(cnc_rdalmmsg num输出) 2报警文本(多条取最后一条，GBK)" },
        { value: "tcode", label: "tcode 刀具", desc: "刀具：param1=1当前刀具(宏#3901) 2下一把刀具(宏#3902)；FOCAS2无直接读刀具函数" },
        { value: "macro", label: "macro 宏变量", desc: "宏变量：param1=宏变量号(1-9999，常用 500+)，值=mcr_val/10^dec_val" },
        { value: "timer", label: "timer 时间", desc: "时间：param1=1运行 2切削 3循环 4上电（cnc_rdtimer type 1/2/3/0，单位分钟）" },
        { value: "count", label: "count 产量", desc: "产量：param1=0总加工数 1稼働程序加工数(当日产量) 2特定加工数(目标产量)（cnc_rdcount CntDataNo 0/1/2；对应树根 WorkPartAllCount/WorkPartCount/RequiredPartCount 语义，待真机核对）" },
        { value: "diag", label: "diag 诊断号", desc: "诊断号：param1=诊断号（cnc_diagnoss；主轴温度等机床特有数据，主轴温度按树根配置=403，待真机确认）" },
        { value: "override", label: "override 倍率", desc: "倍率：param1=1进给倍率(G12) 2快速倍率(G14)（PMC 读，FANUC 标准梯形图约定，同主轴倍率 G30 做法，地址以机床梯形图为准）" },
        { value: "pmc", label: "pmc PMC信号", desc: "PMC信号：param1=1(F区) 2(G区) 3(X区) 4(Y区)，param2=字节地址号；读整字节，具体地址以机床 PMC 梯形图为准，待真机验证" },
      ],
    };
  },
  computed: {
    // 当前所选采集项的含义说明
    readTypeDesc() {
      const item = this.readTypeOptions.find(
        (o) => o.value == this.fanucTcpForm.readType
      );
      return item ? item.desc : "";
    },
    // 参数2是否必填（axis 坐标类型 / pmc 字节地址号）
    needParam2() {
      const rt = this.fanucTcpForm.readType;
      return rt == "axis" || rt == "pmc";
    },
    // 点位类型列表（按采集项分组，如 axis 坐标 / spindle 主轴 / macro 宏变量）
    pointTypes() {
      const types = [];
      FANUC_TCP_POINT_TABLE.forEach((p) => {
        if (!types.find((t) => t.value == p.readType)) {
          types.push({
            value: p.readType,
            label: FANUC_TCP_ROW_LABELS[p.readType] || p.readType,
          });
        }
      });
      return types;
    },
    // 当前点位类型下的点位列表（未选类型时展示全部）
    pointsByType() {
      if (
        this.fanucTcpForm.pointType == null ||
        this.fanucTcpForm.pointType == ""
      ) {
        return FANUC_TCP_POINT_TABLE;
      }
      return FANUC_TCP_POINT_TABLE.filter(
        (p) => p.readType == this.fanucTcpForm.pointType
      );
    },
  },
  created() {
    this.fanucTcpParams.belongSn = this.deviceSn;
    this.getFanucTcpConfigByDeviceSn();
  },
  methods: {
    // 点位名称（命中点位表显示语义名，未命中显示协议地址 readType.param1.param2）
    fanucPointName(row) {
      if (!row) {
        return "";
      }
      const p = findFanucTcpPoint(row.readType, row.param1, row.param2);
      return p ? p.name : toAddress(row);
    },
    async getFanucTcpConfigByDeviceSn() {
      try {
        this.fanucTcpParams.belongSn = this.deviceSn;
        const res = await listFanucFocas(this.fanucTcpParams);
        if (res?.code == 200) {
          this.fanucTcpList = res?.rows;
          this.fanucTcpParams.total = res?.total;
        }
      } catch (e) {
        console.error("查询FANUC配置失败", e);
      }
    },
    // Fanuc定时读取开关切换事件
    async handleFanucTcpStatusChange(enabled) {
      try {
        const res = await readFanucFocasSwitchByDevice({
          deviceSn: this.deviceSn,
          isOpen: enabled == true ? "1" : "0",
        });
        if (res?.code == 200) {
          this.$message.success("操作成功");
        }
      } catch (e) {
        console.error("FANUC读取开关切换失败", e);
      }
    },
    /** 提交按钮（JS 校验必填，不使用表单 rules） */
    async submitFanucTcpForm() {
      if (!this.manualMode && !this.selectedPoint) {
        this.$message.error("请选择点位");
        return;
      }
      if (this.fanucTcpForm.code == null || this.fanucTcpForm.code == "") {
        this.$message.error("标识不能为空");
        return;
      }
      if (
        this.fanucTcpForm.readType == null ||
        this.fanucTcpForm.readType == ""
      ) {
        this.$message.error("采集项不能为空");
        return;
      }
      // 参数1：mode/exeprgname 无参数概念可留空，其余采集项必填（count.0 总产量为 0 合法）
      // 注意：空字符串判定必须用 ===，否则 JS 中 0 == "" 为 true 会把合法的 param1=0 误判为空
      if (
        this.fanucTcpForm.readType != "mode" &&
        this.fanucTcpForm.readType != "exeprgname" &&
        (this.fanucTcpForm.param1 == null || this.fanucTcpForm.param1 === "")
      ) {
        this.$message.error("参数1不能为空");
        return;
      }
      // 参数2：axis/pmc 必填
      if (
        this.needParam2 &&
        (this.fanucTcpForm.param2 == null || this.fanucTcpForm.param2 == "")
      ) {
        this.$message.error("参数2不能为空");
        return;
      }
      if (
        this.fanucTcpForm.intervalTime == null ||
        this.fanucTcpForm.intervalTime == ""
      ) {
        this.$message.error("读取间隔不能为空");
        return;
      }
      this.submitLoading = true;
      try {
        if (this.fanucTcpForm.id != null) {
          const res = await updateFanucFocas(this.fanucTcpForm);
          if (res?.code == 200) {
            this.$modal.msgSuccess("修改成功");
            this.openAddFanucTcp = false;
            await this.getFanucTcpConfigByDeviceSn();
          }
        } else {
          const res = await addFanucFocas(this.fanucTcpForm);
          if (res?.code == 200) {
            this.$modal.msgSuccess("新增成功");
            this.openAddFanucTcp = false;
            await this.getFanucTcpConfigByDeviceSn();
          }
        }
      } catch (e) {
        console.error("保存FANUC配置失败", e);
      } finally {
        this.submitLoading = false;
      }
    },
    // 取消按钮
    closeFanucTcp() {
      this.openAddFanucTcp = false;
      this.resetAddFanucTcpConfig();
    },
    resetAddFanucTcpConfig() {
      this.fanucTcpForm = {
        id: null,
        belongSn: null,
        belongType: null,
        code: null,
        createTime: null,
        readType: null,
        param1: null,
        param2: null,
        pointType: null,
        pointKey: null,
        intervalTime: null,
        delayTime: null,
      };
      // 默认走点位选择模式，清空已选点位
      this.manualMode = false;
      this.selectedPoint = null;
      this.resetForm("fanucTcpForm");
    },
    // 切换点位类型（值为采集项 readType）：清空已选点位，等待用户重选
    onPointTypeChange(value) {
      this.fanucTcpForm.pointKey = null;
      this.selectedPoint = null;
    },
    // 点位选择：自动填 标识/采集项/参数1/参数2
    onPointKeyChange(key) {
      if (key == null || key == "") {
        // 用户清空选择，仅清空点位
        this.selectedPoint = null;
        return;
      }
      const p = FANUC_TCP_POINT_TABLE.find((x) => x.key == key);
      if (!p) {
        return;
      }
      this.selectedPoint = p;
      this.fanucTcpForm.readType = p.readType;
      this.fanucTcpForm.param1 = p.param1;
      this.fanucTcpForm.param2 = p.param2;
      this.fanucTcpForm.code = p.key;
    },
    // 手动模式切换采集项：清理残留参数，避免旧值带入新采集项
    onReadTypeChange(value) {
      this.fanucTcpForm.param1 = null;
      this.fanucTcpForm.param2 = null;
    },
    // 手动/点位模式切换；切回点位模式时若当前地址命中点表则预选
    toggleManualMode() {
      this.manualMode = !this.manualMode;
      if (!this.manualMode) {
        const p = findFanucTcpPoint(
          this.fanucTcpForm.readType,
          this.fanucTcpForm.param1,
          this.fanucTcpForm.param2
        );
        if (p) {
          this.selectedPoint = p;
          this.fanucTcpForm.pointType = p.readType;
          this.fanucTcpForm.pointKey = p.key;
        } else {
          this.selectedPoint = null;
          this.fanucTcpForm.pointType = null;
          this.fanucTcpForm.pointKey = null;
        }
      }
    },
    // 协议地址字符串（采集项.参数1.参数2，如 axis.1.1），模板展示用
    fanucTcpAddress(point) {
      return toAddress(point);
    },
    resetForm(formName) {
      if (this.$refs[formName]) {
        this.$refs[formName].resetFields();
      }
    },
    addFanucTcpConfig() {
      this.fanucTcpIsEdit = false;
      this.openAddFanucTcp = true;
      this.resetAddFanucTcpConfig();
      this.fanucTcpForm.belongSn = this.deviceSn;
      this.fanucTcpForm.belongType = "0";
      // 默认预选 axis.1.1 机械坐标 X，便于体验点选
      const defaultPoint = findFanucTcpPoint("axis", 1, 1);
      this.selectedPoint = defaultPoint;
      this.fanucTcpForm.pointType = defaultPoint.readType;
      this.fanucTcpForm.pointKey = defaultPoint.key;
      this.fanucTcpForm.readType = "axis";
      this.fanucTcpForm.param1 = 1;
      this.fanucTcpForm.param2 = 1;
      this.fanucTcpForm.code = defaultPoint.key;
      this.fanucTcpForm.intervalTime = 10;
      this.fanucTcpForm.delayTime = 100;
    },
    async editFanucTcpConfig(item) {
      this.editLoading = item.id;
      try {
        const res = await getFanucFocas(item.id);
        if (res?.code == 200) {
          this.fanucTcpIsEdit = true;
          this.openAddFanucTcp = true;
          this.fanucTcpForm = Object.assign(
            { pointKey: null, pointType: null },
            res.data || {}
          );
          // 地址命中点表则预选点位并展示地址；未命中（自定义采集项/PMC 自定义地址）走手动输入
          const p = findFanucTcpPoint(
            this.fanucTcpForm.readType,
            this.fanucTcpForm.param1,
            this.fanucTcpForm.param2
          );
          if (p) {
            this.manualMode = false;
            this.selectedPoint = p;
            this.fanucTcpForm.pointType = p.readType;
            this.fanucTcpForm.pointKey = p.key;
            // 保留用户已有标识；标识为空时补建议标识
            if (!this.fanucTcpForm.code) {
              this.fanucTcpForm.code = p.key;
            }
          } else {
            this.manualMode = true;
            this.selectedPoint = null;
            this.fanucTcpForm.pointType = null;
            this.fanucTcpForm.pointKey = null;
          }
        }
      } catch (e) {
        console.error("查询FANUC配置失败", e);
      } finally {
        this.editLoading = null;
      }
    },
    async deleteFanucTcp(id) {
      this.deleteLoading = id;
      let confirmed = false;
      try {
        await this.$confirm("确定要删除此配置吗?", "提示", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        });
        confirmed = true;
      } catch (e) {
        // 用户取消，不做处理
        console.error("删除确认取消", e);
      }
      if (confirmed) {
        try {
          const res = await delFanucFocas(id);
          if (res?.code == 200) {
            await this.getFanucTcpConfigByDeviceSn();
            this.$message.success("删除成功");
          }
        } catch (e) {
          console.error("删除FANUC配置失败", e);
        }
      }
      this.deleteLoading = null;
    },
  },
};
</script>

<style scoped>
.modbus-config {
  width: 100%;
}

.tab-content {
  padding: 20px;
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.tab-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.filter-bar {
  margin-bottom: 20px;
}

.data-table {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.action-btn {
  margin-left: 10px;
}

.status-switch {
  margin-left: 10px;
}

.drawer-content {
  padding: 20px;
}

/* 选中点位后的地址信息展示块（左对齐表单输入区，label 宽 140px） */
.point-address {
  margin: -4px 0 12px 140px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.8;
  color: #333;
}

.addr-row {
  display: flex;
}

.addr-label {
  display: inline-block;
  width: 70px;
  color: #999;
  flex-shrink: 0;
}

/* 标识与物模型属性一致性的提示 */
.code-tip {
  margin-top: 6px;
  color: #999;
  font-size: 12px;
  line-height: 1.6;
}

/* 点位下拉选项：名称 + 符号地址（右侧灰显） */
.pt-symbol {
  float: right;
  color: #999;
  font-size: 12px;
  padding-left: 16px;
}

/* 点位选择下方提示 */
.point-tip {
  margin-top: 6px;
  color: #999;
  font-size: 12px;
  line-height: 1.6;
}

/* 手动/点位模式切换入口 */
.manual-toggle {
  margin: 0 0 12px 140px;
}

.data-area-tip {
  margin-top: 6px;
  color: #999;
  font-size: 12px;
  line-height: 1.6;
}
</style>
