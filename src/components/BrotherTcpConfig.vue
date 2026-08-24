<template>
  <div class="modbus-config">
    <div class="tab-content">
      <div class="tab-header">
        <div class="tab-title">Brother_TCP配置</div>
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
            @change="handleBrotherTcpStatusChange"
            class="status-switch"
          />
        </div>
        <div class="tab-actions">
          <el-button
            type="primary"
            icon="el-icon-plus"
            class="action-btn"
            @click="addBrotherTcpConfig"
            >添加配置</el-button
          >
        </div>
      </div>
      <div class="filter-bar">
        <el-form :inline="true" class="filter-form">
          <el-form-item label="标识">
            <el-input v-model="brotherTcpParams.code"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              icon="el-icon-search"
              @click="getBrotherTcpConfigByDeviceSn()"
              class="search-btn"
              >查询
            </el-button>
          </el-form-item>
        </el-form>
      </div>
      <el-table
        :data="brotherTcpList"
        style="width: 100%"
        class="data-table"
        stripe
      >
        <el-table-column prop="code" label="标识" width="150" />
        <el-table-column label="点位" width="180">
          <template slot-scope="scope">
            {{ brotherPointName(scope.row) }}
          </template>
        </el-table-column>
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
              @click="editBrotherTcpConfig(scope.row)"
              class="table-action"
              >编辑
            </el-button>
            <el-button
              size="mini"
              icon="el-icon-delete"
              type="danger"
              :loading="deleteLoading == scope.row.id"
              :disabled="deleteLoading == scope.row.id"
              @click="deleteBrotherTcp(scope.row.id)"
              class="table-action"
              >删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        class="pagination"
        :current-page="brotherTcpParams.pageNum"
        :page-size="brotherTcpParams.pageSize"
        :total="brotherTcpParams.total"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="getBrotherTcpConfigByDeviceSn"
      />
    </div>
    <el-drawer
      :title="brotherTcpIsEdit ? '修改配置' : '新增配置'"
      :visible.sync="openAddBrotherTcp"
      direction="rtl"
      size="45%"
      :before-close="closeBrotherTcp"
      class="component-drawer"
    >
      <div class="drawer-content">
        <!-- 添加或修改配置 -->
        <el-form
          ref="brotherTcpForm"
          :model="brotherTcpForm"
          label-width="140px"
        >
          <!-- 语义点位选择：先选点位类型，再选具体点位，自动填 标识/数据区/行号/字段序号 -->
          <el-form-item label="点位类型" prop="pointType" required v-if="!manualMode">
            <el-select
              v-model="brotherTcpForm.pointType"
              placeholder="先选择点位类型，如：机械坐标"
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
              v-model="brotherTcpForm.pointKey"
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
              选点后自动填入「标识 / 地址」并展示下方地址信息，无需了解协议细节；可按名称搜索。
            </div>
          </el-form-item>
          <!-- 选中点位背后的地址信息展示 -->
          <div class="point-address" v-if="!manualMode && selectedPoint">
            <div class="addr-row">
              <span class="addr-label">符号地址</span>{{ selectedPoint.symbol }}
            </div>
            <div class="addr-row">
              <span class="addr-label">协议地址</span
              >{{ brotherTcpAddress(selectedPoint) }}
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
              v-model="brotherTcpForm.code"
              placeholder="选点位后自动填入，如 machine_x"
            />
            <div class="code-tip">
              标识需与「物模型」tab 中属性标识一致。选点位后已自动填入建议标识，请在物模型里新建同名属性（数据类型参考上方建议值）。
            </div>
          </el-form-item>
          <!-- 手动指定地址入口（ALARM/PRD3/WKCNTR 及自定义地址走这里） -->
          <div class="manual-toggle">
            <el-link type="primary" :underline="false" @click="toggleManualMode">
              {{ manualMode ? "返回点选点位" : "需要自定义地址？手动指定" }}
            </el-link>
          </div>
          <el-form-item label="数据区" prop="dataArea" required v-if="manualMode">
            <el-select
              v-model="brotherTcpForm.dataArea"
              placeholder="请选择数据区"
              style="width: 100%"
            >
              <!-- 数据区下拉：从 dataAreaOptions 渲染，value 即 Brother LOD 数据区名 -->
              <el-option
                v-for="item in dataAreaOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              ></el-option>
            </el-select>
            <div class="data-area-tip" v-if="brotherTcpForm.dataArea">
              数据区说明：{{ dataAreaDesc }}
            </div>
          </el-form-item>
          <el-form-item label="行号" prop="rowNumber" required v-if="manualMode">
            <el-input
              v-model="brotherTcpForm.rowNumber"
              type="number"
              placeholder="对应数据区点表行顺序，1起，如 4"
            />
          </el-form-item>
          <el-form-item label="字段序号" prop="fieldIndex" required v-if="manualMode">
            <el-input
              v-model="brotherTcpForm.fieldIndex"
              type="number"
              placeholder="1起，字段1=行 Symbol 后第1个值，如采 X 轴填 1"
            />
          </el-form-item>
          <el-form-item label="读取间隔(秒)" prop="intervalTime" required>
            <el-input
              type="number"
              v-model="brotherTcpForm.intervalTime"
              placeholder="多久执行一次读取指令，如：10"
            />
          </el-form-item>
          <el-form-item label="读取后延迟(毫秒)" prop="delayTime" required>
            <el-input
              type="number"
              v-model="brotherTcpForm.delayTime"
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
            @click="submitBrotherTcpForm"
            >确 定</el-button
          >
          <el-button @click="closeBrotherTcp" style="margin-left: 12px"
            >取 消</el-button
          >
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import {
  listBrotherTcp,
  delBrotherTcp,
  updateBrotherTcp,
  addBrotherTcp,
  getBrotherTcp,
} from "@/api/business/brotherTcp";
import { readBrotherTcpSwitchByDevice } from "@/api/business/brotherTcp";
// 内置 PDSP 点位表：语义点位 → 协议地址（数据区.行号.字段序号），数据来源见 utils/brotherTcpPoints.js
import {
  BROTHER_TCP_POINT_TABLE,
  BROTHER_TCP_ROW_LABELS,
  findBrotherTcpPoint,
  brotherTcpAddress as toAddress,
} from "@/utils/brotherTcpPoints";

export default {
  name: "BrotherTcpConfig",
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
      openAddBrotherTcp: false,
      brotherTcpIsEdit: false,
      submitLoading: false,
      // 每行独立 loading 状态（用行 id 区分，避免点击一行导致整列按钮一起 loading）
      editLoading: null,
      deleteLoading: null,
      // 点位选择模式：false=点选点位（自动填地址），true=手动输入数据区/行号/字段序号
      manualMode: false,
      // 当前选中的点位对象（用于地址信息展示）
      selectedPoint: null,
      brotherTcpParams: {
        pageNum: 1,
        pageSize: 10,
        total: 0,
        belongSn: null,
        belongType: null,
        code: null,
      },
      brotherTcpForm: {},
      brotherTcpList: [],
      // 数据区选项及含义说明（对应 Brother NC 通讯手册各数据区点表）
      dataAreaOptions: [
        { value: "PDSP", label: "PDSP", desc: "位置显示：语言、G/M 代码组、机械/相对/绝对/剩余距离坐标、进给/主轴/刀具/倍率等状态（推荐用上方点位下拉选择）" },
        { value: "ALARM", label: "ALARM", desc: "报警：机床当前及历史报警信息" },
        { value: "PRD3", label: "PRD3", desc: "生产信息：产量、加工件数、加工时间等统计" },
        { value: "WKCNTR", label: "WKCNTR", desc: "工件计数：累计加工件数等计数器值" },
        { value: "MEM", label: "MEM", desc: "运行状态：程序号、加工状态、内托盘、操作模式等（推荐用上方点位下拉选择）" },
        { value: "PANEL", label: "PANEL", desc: "面板状态：门开关、面板开关、倍率、急停、门互锁、数据保护等（推荐用上方点位下拉选择）" },
        { value: "VER", label: "VER", desc: "设备信息：机型、版本号、机身号（静态信息，采集一次即可）" },
      ],
    };
  },
  computed: {
    // 当前所选数据区的含义说明
    dataAreaDesc() {
      const item = this.dataAreaOptions.find(
        (o) => o.value == this.brotherTcpForm.dataArea
      );
      return item ? item.desc : "";
    },
    // 点位类型列表（按 数据区.行号 分组，如 PDSP.4 P01 机械坐标 / WKCNTR.1 A01 工件计数1）
    pointTypes() {
      const types = [];
      BROTHER_TCP_POINT_TABLE.forEach((p) => {
        const value = p.dataArea + "|" + p.rowNumber;
        if (!types.find((t) => t.value == value)) {
          types.push({
            value: value,
            label:
              (BROTHER_TCP_ROW_LABELS[p.dataArea] || {})[p.rowNumber] ||
              p.dataArea + " 第" + p.rowNumber + "行",
          });
        }
      });
      return types;
    },
    // 当前点位类型下的点位列表（未选类型时展示全部）
    pointsByType() {
      if (
        this.brotherTcpForm.pointType == null ||
        this.brotherTcpForm.pointType == ""
      ) {
        return BROTHER_TCP_POINT_TABLE;
      }
      const parts = this.brotherTcpForm.pointType.split("|");
      return BROTHER_TCP_POINT_TABLE.filter(
        (p) => p.dataArea == parts[0] && p.rowNumber == parts[1]
      );
    },
  },
  created() {
    this.brotherTcpParams.belongSn = this.deviceSn;
    this.getBrotherTcpConfigByDeviceSn();
  },
  methods: {
    async getBrotherTcpConfigByDeviceSn() {
      try {
        this.brotherTcpParams.belongSn = this.deviceSn;
        const res = await listBrotherTcp(this.brotherTcpParams);
        if (res?.code == 200) {
          this.brotherTcpList = res?.rows;
          this.brotherTcpParams.total = res?.total;
        }
      } catch (e) {
        console.error("查询Brother配置失败", e);
      }
    },
    // 点位名称（命中点表显示语义名，未命中显示协议地址 数据区.行号.字段序号）
    brotherPointName(row) {
      if (!row) {
        return "";
      }
      const p = findBrotherTcpPoint(row.dataArea, row.rowNumber, row.fieldIndex);
      return p ? p.name : (row.dataArea + "." + row.rowNumber + "." + row.fieldIndex);
    },
    // Brother定时读取开关切换事件
    async handleBrotherTcpStatusChange(enabled) {
      try {
        const res = await readBrotherTcpSwitchByDevice({
          deviceSn: this.deviceSn,
          isOpen: enabled == true ? "1" : "0",
        });
        if (res?.code == 200) {
          this.$message.success("操作成功");
        }
      } catch (e) {
        console.error("Brother读取开关切换失败", e);
      }
    },
    /** 提交按钮（JS 校验必填，不使用表单 rules） */
    async submitBrotherTcpForm() {
      if (!this.manualMode && !this.selectedPoint) {
        this.$message.error("请选择点位");
        return;
      }
      if (this.brotherTcpForm.code == null || this.brotherTcpForm.code == "") {
        this.$message.error("标识不能为空");
        return;
      }
      if (
        this.brotherTcpForm.dataArea == null ||
        this.brotherTcpForm.dataArea == ""
      ) {
        this.$message.error("数据区不能为空");
        return;
      }
      if (
        this.brotherTcpForm.rowNumber == null ||
        this.brotherTcpForm.rowNumber == ""
      ) {
        this.$message.error("行号不能为空");
        return;
      }
      if (
        this.brotherTcpForm.fieldIndex == null ||
        this.brotherTcpForm.fieldIndex == ""
      ) {
        this.$message.error("字段序号不能为空");
        return;
      }
      if (
        this.brotherTcpForm.intervalTime == null ||
        this.brotherTcpForm.intervalTime == ""
      ) {
        this.$message.error("读取间隔不能为空");
        return;
      }
      this.submitLoading = true;
      try {
        if (this.brotherTcpForm.id != null) {
          const res = await updateBrotherTcp(this.brotherTcpForm);
          if (res?.code == 200) {
            this.$modal.msgSuccess("修改成功");
            this.openAddBrotherTcp = false;
            await this.getBrotherTcpConfigByDeviceSn();
          }
        } else {
          const res = await addBrotherTcp(this.brotherTcpForm);
          if (res?.code == 200) {
            this.$modal.msgSuccess("新增成功");
            this.openAddBrotherTcp = false;
            await this.getBrotherTcpConfigByDeviceSn();
          }
        }
      } catch (e) {
        console.error("保存Brother配置失败", e);
      } finally {
        this.submitLoading = false;
      }
    },
    // 取消按钮
    closeBrotherTcp() {
      this.openAddBrotherTcp = false;
      this.resetAddBrotherTcpConfig();
    },
    resetAddBrotherTcpConfig() {
      this.brotherTcpForm = {
        id: null,
        belongSn: null,
        belongType: null,
        code: null,
        createTime: null,
        dataArea: null,
        rowNumber: null,
        fieldIndex: null,
        pointType: null,
        pointKey: null,
        intervalTime: null,
        delayTime: null,
      };
      // 默认走点位选择模式，清空已选点位
      this.manualMode = false;
      this.selectedPoint = null;
      this.resetForm("brotherTcpForm");
    },
    // 切换点位类型（值形如 "PDSP|4" / "WKCNTR|1"）：清空已选点位，等待用户重选
    onPointTypeChange(value) {
      this.brotherTcpForm.pointKey = null;
      this.selectedPoint = null;
    },
    // 点位选择：自动填 标识/数据区/行号/字段序号
    onPointKeyChange(key) {
      if (key == null || key == "") {
        // 用户清空选择，仅清空点位
        this.selectedPoint = null;
        return;
      }
      const p = BROTHER_TCP_POINT_TABLE.find((x) => x.key == key);
      if (!p) {
        return;
      }
      this.selectedPoint = p;
      this.brotherTcpForm.dataArea = p.dataArea;
      this.brotherTcpForm.rowNumber = p.rowNumber;
      this.brotherTcpForm.fieldIndex = p.fieldIndex;
      this.brotherTcpForm.code = p.key;
    },
    // 手动/点位模式切换；切回点位模式时若当前地址命中点表则预选
    toggleManualMode() {
      this.manualMode = !this.manualMode;
      if (!this.manualMode) {
        const p = findBrotherTcpPoint(
          this.brotherTcpForm.dataArea,
          this.brotherTcpForm.rowNumber,
          this.brotherTcpForm.fieldIndex
        );
        if (p) {
          this.selectedPoint = p;
          this.brotherTcpForm.pointType = p.dataArea + "|" + p.rowNumber;
          this.brotherTcpForm.pointKey = p.key;
        } else {
          this.selectedPoint = null;
          this.brotherTcpForm.pointType = null;
          this.brotherTcpForm.pointKey = null;
        }
      }
    },
    // 协议地址字符串（数据区.行号.字段序号，如 PDSP.4.1），模板展示用
    brotherTcpAddress(point) {
      return toAddress(point);
    },
    resetForm(formName) {
      if (this.$refs[formName]) {
        this.$refs[formName].resetFields();
      }
    },
    addBrotherTcpConfig() {
      this.brotherTcpIsEdit = false;
      this.openAddBrotherTcp = true;
      this.resetAddBrotherTcpConfig();
      this.brotherTcpForm.belongSn = this.deviceSn;
      this.brotherTcpForm.belongType = "0";
      // 默认预选 P01.X 机械坐标 X，便于体验点选
      const defaultPoint = findBrotherTcpPoint("PDSP", 4, 1);
      this.selectedPoint = defaultPoint;
      this.brotherTcpForm.pointType = defaultPoint.dataArea + "|" + defaultPoint.rowNumber;
      this.brotherTcpForm.pointKey = defaultPoint.key;
      this.brotherTcpForm.dataArea = "PDSP";
      this.brotherTcpForm.rowNumber = 4;
      this.brotherTcpForm.fieldIndex = 1;
      this.brotherTcpForm.code = defaultPoint.key;
      this.brotherTcpForm.intervalTime = 10;
      this.brotherTcpForm.delayTime = 100;
    },
    async editBrotherTcpConfig(item) {
      this.editLoading = item.id;
      try {
        const res = await getBrotherTcp(item.id);
        if (res?.code == 200) {
          this.brotherTcpIsEdit = true;
          this.openAddBrotherTcp = true;
          this.brotherTcpForm = Object.assign(
            { pointKey: null, pointType: null },
            res.data || {}
          );
          // 地址命中点表则预选点位并展示地址；未命中（ALARM/PRD3/WKCNTR 等）走手动输入
          const p = findBrotherTcpPoint(
            this.brotherTcpForm.dataArea,
            this.brotherTcpForm.rowNumber,
            this.brotherTcpForm.fieldIndex
          );
          if (p) {
            this.manualMode = false;
            this.selectedPoint = p;
            this.brotherTcpForm.pointType = p.dataArea + "|" + p.rowNumber;
            this.brotherTcpForm.pointKey = p.key;
            // 保留用户已有标识；标识为空时补建议标识
            if (!this.brotherTcpForm.code) {
              this.brotherTcpForm.code = p.key;
            }
          } else {
            this.manualMode = true;
            this.selectedPoint = null;
            this.brotherTcpForm.pointType = null;
            this.brotherTcpForm.pointKey = null;
          }
        }
      } catch (e) {
        console.error("查询Brother配置失败", e);
      } finally {
        this.editLoading = null;
      }
    },
    async deleteBrotherTcp(id) {
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
          const res = await delBrotherTcp(id);
          if (res?.code == 200) {
            await this.getBrotherTcpConfigByDeviceSn();
            this.$message.success("删除成功");
          }
        } catch (e) {
          console.error("删除Brother配置失败", e);
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
