<template>
  <div class="modbus-config">
    <div class="tab-content">
      <div class="tab-header">
        <div class="tab-title">Mitsubishi_CNC_TCP配置</div>
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
            @change="handleMitsubishiCncTcpStatusChange"
            class="status-switch"
          />
        </div>
        <div class="tab-actions">
          <el-button
            type="primary"
            icon="el-icon-plus"
            class="action-btn"
            @click="addMitsubishiCncTcpConfig"
            >添加配置</el-button
          >
          <el-button
            v-if="isProductIn"
            type="warning"
            icon="el-icon-download"
            class="action-btn"
            :loading="syncLoading"
            :disabled="syncLoading"
            @click="syncToDevice"
            >下发到设备</el-button
          >
        </div>
      </div>
      <div class="filter-bar">
        <el-form :inline="true" class="filter-form">
          <el-form-item label="标识">
            <el-input v-model="mitsubishiCncTcpParams.code"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              icon="el-icon-search"
              @click="getMitsubishiCncTcpConfigByDeviceSn()"
              class="search-btn"
              >查询
            </el-button>
          </el-form-item>
        </el-form>
      </div>
      <el-table
        :data="mitsubishiCncTcpList"
        style="width: 100%"
        class="data-table"
        stripe
      >
        <el-table-column prop="code" label="标识" width="150" />
        <el-table-column label="点位" width="180">
          <template slot-scope="scope">
            {{ mitsubishiCncPointName(scope.row) }}
          </template>
        </el-table-column>
        <el-table-column prop="readType" label="采集项" width="120" />
        <el-table-column label="轴号" width="90">
          <template slot-scope="scope">
            {{ scope.row.axisNo != null ? scope.row.axisNo : "-" }}
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
              @click="editMitsubishiCncTcpConfig(scope.row)"
              class="table-action"
              >编辑
            </el-button>
            <el-button
              size="mini"
              icon="el-icon-delete"
              type="danger"
              :loading="deleteLoading == scope.row.id"
              :disabled="deleteLoading == scope.row.id"
              @click="deleteMitsubishiCncTcp(scope.row.id)"
              class="table-action"
              >删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        class="pagination"
        :current-page="mitsubishiCncTcpParams.pageNum"
        :page-size="mitsubishiCncTcpParams.pageSize"
        :total="mitsubishiCncTcpParams.total"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="(pageNum) => { mitsubishiCncTcpParams.pageNum = pageNum; getMitsubishiCncTcpConfigByDeviceSn(); }"
        @size-change="(size) => { mitsubishiCncTcpParams.pageSize = size; mitsubishiCncTcpParams.pageNum = 1; getMitsubishiCncTcpConfigByDeviceSn(); }"
      />
    </div>
    <el-drawer
      :title="mitsubishiCncTcpIsEdit ? '修改配置' : '新增配置'"
      :visible.sync="openAddMitsubishiCncTcp"
      direction="rtl"
      size="45%"
      :before-close="closeMitsubishiCncTcp"
      class="component-drawer"
    >
      <div class="drawer-content">
        <!-- 添加或修改配置 -->
        <el-form
          ref="mitsubishiCncTcpForm"
          :model="mitsubishiCncTcpForm"
          label-width="140px"
        >
          <!-- 语义点位选择：先选点位类型（采集项），再选具体点位，自动填 标识/采集项/轴号 -->
          <el-form-item label="点位类型" prop="pointType" required v-if="!manualMode">
            <el-select
              v-model="mitsubishiCncTcpForm.pointType"
              placeholder="先选择点位类型，如：坐标 / 速度与倍率"
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
              v-model="mitsubishiCncTcpForm.pointKey"
              placeholder="再选择具体点位，如：机械坐标 X / 进给速度"
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
              选点后自动填入「标识 / 采集项 / 轴号」并展示下方地址信息，无需了解 MOCHA 细节；可按名称搜索。
            </div>
          </el-form-item>
          <!-- 选中点位背后的地址信息展示 -->
          <div class="point-address" v-if="!manualMode && selectedPoint">
            <div class="addr-row">
              <span class="addr-label">符号地址</span>{{ selectedPoint.symbol }}
            </div>
            <div class="addr-row">
              <span class="addr-label">协议地址</span
              >{{ mitsubishiCncTcpAddress(selectedPoint) }}
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
              v-model="mitsubishiCncTcpForm.code"
              placeholder="选点位后自动填入，如 cnc_mechpos_x"
            />
            <div class="code-tip">
              标识需与「物模型」tab 中属性标识一致。选点位后已自动填入建议标识，请在物模型里新建同名属性（数据类型参考上方建议值）。
            </div>
          </el-form-item>
          <!-- 手动指定地址入口（自定义采集项走这里） -->
          <div class="manual-toggle">
            <el-link type="primary" :underline="false" @click="toggleManualMode">
              {{ manualMode ? "返回点选点位" : "需要自定义地址？手动指定" }}
            </el-link>
          </div>
          <el-form-item label="采集项" prop="readType" required v-if="manualMode">
            <el-select
              v-model="mitsubishiCncTcpForm.readType"
              placeholder="请选择采集项类型"
              style="width: 100%"
              @change="onReadTypeChange"
            >
              <!-- 采集项下拉：从 readTypeOptions 渲染，value 即 MOCHA 点位键 -->
              <el-option
                v-for="item in readTypeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              ></el-option>
            </el-select>
            <div class="data-area-tip" v-if="mitsubishiCncTcpForm.readType">
              采集项说明：{{ readTypeDesc }}
            </div>
          </el-form-item>
          <el-form-item
            label="轴号"
            prop="axisNo"
            required
            v-if="manualMode && needAxisNo"
          >
            <el-input
              v-model="mitsubishiCncTcpForm.axisNo"
              type="number"
              placeholder="轴类点位必填：1=X 2=Y 3=Z 4=A 5=B 6=C"
            />
          </el-form-item>
          <el-form-item label="读取间隔(秒)" prop="intervalTime" required>
            <el-input
              type="number"
              v-model="mitsubishiCncTcpForm.intervalTime"
              placeholder="多久执行一次读取指令，如：10"
            />
          </el-form-item>
          <el-form-item label="读取后延迟(毫秒)" prop="delayTime" required>
            <el-input
              type="number"
              v-model="mitsubishiCncTcpForm.delayTime"
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
            @click="submitMitsubishiCncTcpForm"
            >确 定</el-button
          >
          <el-button @click="closeMitsubishiCncTcp" style="margin-left: 12px"
            >取 消</el-button
          >
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import {
  listMitsubishiCncTcp,
  delMitsubishiCncTcp,
  updateMitsubishiCncTcp,
  addMitsubishiCncTcp,
  getMitsubishiCncTcp,
} from "@/api/business/mitsubishiCncTcp";
import { readMitsubishiCncTcpSwitchByDevice } from "@/api/business/mitsubishiCncTcp";
import { syncConfigToDevice } from "@/api/business/mitsubishiCncTcp";
// 内置 MOCHA 点位表：语义点位 → 协议地址（采集项[.轴号]），数据来源见 utils/cncTcpPoints.js
import {
  CNC_TCP_POINT_TABLE,
  CNC_TCP_ROW_LABELS,
  CNC_TCP_READTYPE_NAMES,
  findCncTcpPoint,
  cncTcpAddress as toAddress,
  isAxisReadType,
} from "@/utils/cncTcpPoints";

export default {
  name: "MitsubishiCncTcpConfig",
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
      openAddMitsubishiCncTcp: false,
      mitsubishiCncTcpIsEdit: false,
      submitLoading: false,
      // 每行独立 loading 状态（用行 id 区分，避免点击一行导致整列按钮一起 loading）
      editLoading: null,
      deleteLoading: null,
      // 下发到设备按钮 loading（产品模式下可用）
      syncLoading: false,
      // 点位选择模式：false=点选点位（自动填地址），true=手动输入采集项/轴号
      manualMode: false,
      // 当前选中的点位对象（用于地址信息展示）
      selectedPoint: null,
      mitsubishiCncTcpParams: {
        pageNum: 1,
        pageSize: 10,
        total: 0,
        belongSn: null,
        belongType: null,
        code: null,
      },
      mitsubishiCncTcpForm: {},
      mitsubishiCncTcpList: [],
      // 采集项选项（手动模式下拉，value 即 MOCHA 点位键，label 用语义名）
      readTypeOptions: Object.keys(CNC_TCP_READTYPE_NAMES).map((key) => ({
        value: key,
        label: CNC_TCP_READTYPE_NAMES[key],
      })),
    };
  },
  computed: {
    // 当前所选采集项的含义说明（取点表中该类型的首条 desc）
    readTypeDesc() {
      const p = CNC_TCP_POINT_TABLE.find(
        (o) => o.readType == this.mitsubishiCncTcpForm.readType
      );
      return p ? p.desc : "";
    },
    // 轴号是否必填（轴类点位：mechpos/currpos/remapos/cu/sp）
    needAxisNo() {
      return isAxisReadType(this.mitsubishiCncTcpForm.readType);
    },
    // 点位类型列表（按语义分组 group，组名与点位名错开避免重复）
    pointTypes() {
      const types = [];
      CNC_TCP_POINT_TABLE.forEach((p) => {
        if (p.group && !types.find((t) => t.value == p.group)) {
          types.push({
            value: p.group,
            label: CNC_TCP_ROW_LABELS[p.group] || p.group,
          });
        }
      });
      return types;
    },
    // 当前点位类型下的点位列表（未选类型时展示全部）
    pointsByType() {
      if (
        this.mitsubishiCncTcpForm.pointType == null ||
        this.mitsubishiCncTcpForm.pointType == ""
      ) {
        return CNC_TCP_POINT_TABLE;
      }
      return CNC_TCP_POINT_TABLE.filter(
        (p) => p.group == this.mitsubishiCncTcpForm.pointType
      );
    },
  },
  created() {
    this.mitsubishiCncTcpParams.belongSn = this.deviceSn;
    this.getMitsubishiCncTcpConfigByDeviceSn();
  },
  methods: {
    /** 产品模式：把该产品模板点位下发给其全部设备 */
    async syncToDevice() {
      this.syncLoading = true;
      try {
        const res = await syncConfigToDevice(this.deviceSn);
        if (res?.code == 200) {
          this.$message.success("已下发到该产品全部设备");
        }
      } catch (e) {
        console.error("下发配置到设备失败", e);
      } finally {
        this.syncLoading = false;
      }
    },
    // 点位名称（命中点位表显示语义名，未命中显示协议地址 readType[.axisNo]）
    mitsubishiCncPointName(row) {
      if (!row) {
        return "";
      }
      const p = findCncTcpPoint(row.readType, row.axisNo);
      return p ? p.name : toAddress(row);
    },
    async getMitsubishiCncTcpConfigByDeviceSn() {
      try {
        this.mitsubishiCncTcpParams.belongSn = this.deviceSn;
        const res = await listMitsubishiCncTcp(this.mitsubishiCncTcpParams);
        if (res?.code == 200) {
          this.mitsubishiCncTcpList = res?.rows;
          this.mitsubishiCncTcpParams.total = res?.total;
        }
      } catch (e) {
        console.error("查询三菱CNC配置失败", e);
      }
    },
    // MitsubishiCNC定时读取开关切换事件
    async handleMitsubishiCncTcpStatusChange(enabled) {
      try {
        const res = await readMitsubishiCncTcpSwitchByDevice({
          deviceSn: this.deviceSn,
          isOpen: enabled == true ? "1" : "0",
        });
        if (res?.code == 200) {
          this.$message.success("操作成功");
        }
      } catch (e) {
        console.error("三菱CNC读取开关切换失败", e);
      }
    },
    /** 提交按钮（JS 校验必填，不使用表单 rules） */
    async submitMitsubishiCncTcpForm() {
      if (!this.manualMode && !this.selectedPoint) {
        this.$message.error("请选择点位");
        return;
      }
      if (
        this.mitsubishiCncTcpForm.code == null ||
        this.mitsubishiCncTcpForm.code == ""
      ) {
        this.$message.error("标识不能为空");
        return;
      }
      if (
        this.mitsubishiCncTcpForm.readType == null ||
        this.mitsubishiCncTcpForm.readType == ""
      ) {
        this.$message.error("采集项不能为空");
        return;
      }
      // 轴类点位：轴号必填 1-6（非轴点无轴号）
      if (
        isAxisReadType(this.mitsubishiCncTcpForm.readType) &&
        (this.mitsubishiCncTcpForm.axisNo == null ||
          this.mitsubishiCncTcpForm.axisNo < 1 ||
          this.mitsubishiCncTcpForm.axisNo > 6)
      ) {
        this.$message.error("轴类点位轴号必须在1-6之间");
        return;
      }
      if (
        this.mitsubishiCncTcpForm.intervalTime == null ||
        this.mitsubishiCncTcpForm.intervalTime == ""
      ) {
        this.$message.error("读取间隔不能为空");
        return;
      }
      this.submitLoading = true;
      try {
        if (this.mitsubishiCncTcpForm.id != null) {
          const res = await updateMitsubishiCncTcp(this.mitsubishiCncTcpForm);
          if (res?.code == 200) {
            this.$modal.msgSuccess("修改成功");
            this.openAddMitsubishiCncTcp = false;
            await this.getMitsubishiCncTcpConfigByDeviceSn();
          }
        } else {
          const res = await addMitsubishiCncTcp(this.mitsubishiCncTcpForm);
          if (res?.code == 200) {
            this.$modal.msgSuccess("新增成功");
            this.openAddMitsubishiCncTcp = false;
            await this.getMitsubishiCncTcpConfigByDeviceSn();
          }
        }
      } catch (e) {
        console.error("保存三菱CNC配置失败", e);
      } finally {
        this.submitLoading = false;
      }
    },
    // 取消按钮
    closeMitsubishiCncTcp() {
      this.openAddMitsubishiCncTcp = false;
      this.resetAddMitsubishiCncTcpConfig();
    },
    resetAddMitsubishiCncTcpConfig() {
      this.mitsubishiCncTcpForm = {
        id: null,
        belongSn: null,
        belongType: null,
        code: null,
        name: null,
        createTime: null,
        readType: null,
        axisNo: null,
        pointType: null,
        pointKey: null,
        intervalTime: null,
        delayTime: null,
      };
      // 默认走点位选择模式，清空已选点位
      this.manualMode = false;
      this.selectedPoint = null;
      this.resetForm("mitsubishiCncTcpForm");
    },
    // 切换点位类型（值为采集项 readType）：清空已选点位，等待用户重选
    onPointTypeChange(value) {
      this.mitsubishiCncTcpForm.pointKey = null;
      this.selectedPoint = null;
    },
    // 点位选择：自动填 标识/采集项/轴号
    onPointKeyChange(key) {
      if (key == null || key == "") {
        // 用户清空选择，仅清空点位
        this.selectedPoint = null;
        return;
      }
      const p = CNC_TCP_POINT_TABLE.find((x) => x.key == key);
      if (!p) {
        return;
      }
      this.selectedPoint = p;
      this.mitsubishiCncTcpForm.readType = p.readType;
      this.mitsubishiCncTcpForm.axisNo = p.axisNo != null ? p.axisNo : null;
      this.mitsubishiCncTcpForm.code = p.key;
      // 点位名称（物模型属性名用，如"机械坐标 X"）
      this.mitsubishiCncTcpForm.name = p.name;
    },
    // 手动模式切换采集项：清理残留轴号，避免旧值带入新采集项
    onReadTypeChange(value) {
      this.mitsubishiCncTcpForm.axisNo = null;
    },
    // 手动/点位模式切换；切回点位模式时若当前地址命中点表则预选
    toggleManualMode() {
      this.manualMode = !this.manualMode;
      if (!this.manualMode) {
        const p = findCncTcpPoint(
          this.mitsubishiCncTcpForm.readType,
          this.mitsubishiCncTcpForm.axisNo
        );
        if (p) {
          this.selectedPoint = p;
          this.mitsubishiCncTcpForm.pointType = p.group;
          this.mitsubishiCncTcpForm.pointKey = p.key;
        } else {
          this.selectedPoint = null;
          this.mitsubishiCncTcpForm.pointType = null;
          this.mitsubishiCncTcpForm.pointKey = null;
        }
      }
    },
    // 协议地址字符串（采集项[.轴号]，如 mechpos.1），模板展示用
    mitsubishiCncTcpAddress(point) {
      return toAddress(point);
    },
    resetForm(formName) {
      if (this.$refs[formName]) {
        this.$refs[formName].resetFields();
      }
    },
    addMitsubishiCncTcpConfig() {
      this.mitsubishiCncTcpIsEdit = false;
      this.openAddMitsubishiCncTcp = true;
      this.resetAddMitsubishiCncTcpConfig();
      this.mitsubishiCncTcpForm.belongSn = this.deviceSn;
      this.mitsubishiCncTcpForm.belongType = "0";
      // 默认预选 mechpos.1 机械坐标 X，便于体验点选
      const defaultPoint = findCncTcpPoint("mechpos", 1);
      this.selectedPoint = defaultPoint;
      this.mitsubishiCncTcpForm.pointType = defaultPoint.group;
      this.mitsubishiCncTcpForm.pointKey = defaultPoint.key;
      this.mitsubishiCncTcpForm.readType = "mechpos";
      this.mitsubishiCncTcpForm.axisNo = 1;
      this.mitsubishiCncTcpForm.code = defaultPoint.key;
      this.mitsubishiCncTcpForm.name = defaultPoint.name;
      this.mitsubishiCncTcpForm.intervalTime = 10;
      this.mitsubishiCncTcpForm.delayTime = 100;
    },
    async editMitsubishiCncTcpConfig(item) {
      this.editLoading = item.id;
      try {
        const res = await getMitsubishiCncTcp(item.id);
        if (res?.code == 200) {
          this.mitsubishiCncTcpIsEdit = true;
          this.openAddMitsubishiCncTcp = true;
          this.mitsubishiCncTcpForm = Object.assign(
            { pointKey: null, pointType: null },
            res.data || {}
          );
          // 地址命中点表则预选点位并展示地址；未命中（自定义采集项）走手动输入
          const p = findCncTcpPoint(
            this.mitsubishiCncTcpForm.readType,
            this.mitsubishiCncTcpForm.axisNo
          );
          if (p) {
            this.manualMode = false;
            this.selectedPoint = p;
            this.mitsubishiCncTcpForm.pointType = p.group;
            this.mitsubishiCncTcpForm.pointKey = p.key;
            // 保留用户已有标识；标识为空时补建议标识
            if (!this.mitsubishiCncTcpForm.code) {
              this.mitsubishiCncTcpForm.code = p.key;
            }
            // 点位名称为空时补点位表语义名（旧数据未存 name）
            if (!this.mitsubishiCncTcpForm.name) {
              this.mitsubishiCncTcpForm.name = p.name;
            }
          } else {
            this.manualMode = true;
            this.selectedPoint = null;
            this.mitsubishiCncTcpForm.pointType = null;
            this.mitsubishiCncTcpForm.pointKey = null;
          }
        }
      } catch (e) {
        console.error("查询三菱CNC配置失败", e);
      } finally {
        this.editLoading = null;
      }
    },
    async deleteMitsubishiCncTcp(id) {
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
          const res = await delMitsubishiCncTcp(id);
          if (res?.code == 200) {
            await this.getMitsubishiCncTcpConfigByDeviceSn();
            this.$message.success("删除成功");
          }
        } catch (e) {
          console.error("删除三菱CNC配置失败", e);
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
