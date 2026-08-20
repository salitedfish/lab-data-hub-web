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
        <el-table-column prop="dataArea" label="数据区" width="120" />
        <el-table-column prop="rowNumber" label="行号" width="100" />
        <el-table-column prop="fieldIndex" label="字段序号" width="110" />
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
          <el-form-item label="标识" prop="code" required>
            <el-input
              v-model="brotherTcpForm.code"
              placeholder="物模型属性标识，如 PDSP.4.1"
            />
          </el-form-item>
          <el-form-item label="数据区" prop="dataArea" required>
            <el-select
              v-model="brotherTcpForm.dataArea"
              placeholder="请选择数据区"
              style="width: 100%"
            >
              <el-option label="PDSP" value="PDSP"></el-option>
              <el-option label="ALARM" value="ALARM"></el-option>
              <el-option label="PRD3" value="PRD3"></el-option>
              <el-option label="WKCNTR" value="WKCNTR"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="行号" prop="rowNumber" required>
            <el-input
              v-model="brotherTcpForm.rowNumber"
              type="number"
              placeholder="对应点表行顺序，1起，如 4"
            />
          </el-form-item>
          <el-form-item label="字段序号" prop="fieldIndex" required>
            <el-input
              v-model="brotherTcpForm.fieldIndex"
              type="number"
              placeholder="行内第几个值，1起，如 1"
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
        <!-- PDSP 点表参考 -->
        <el-collapse v-model="pointTableOpen" class="point-table">
          <el-collapse-item
            title="PDSP 点表行号参考（LOD PDSP 整块读取，按行号+字段序号取值）"
            name="1"
          >
            <el-table :data="pdspPointTable" size="mini" border>
              <el-table-column prop="rowNumber" label="行号" width="60" />
              <el-table-column prop="symbol" label="Symbol" width="70" />
              <el-table-column prop="desc" label="说明" />
            </el-table>
            <div class="point-tip">
              字段序号：行内第1个值=字段1（如 P01 行字段1=X 轴机械坐标），依次类推
            </div>
          </el-collapse-item>
        </el-collapse>
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
      pointTableOpen: ["1"],
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
      // PDSP 点表行号参考（LOD PDSP 返回行按点表 Number 顺序排列，行号=Number）
      pdspPointTable: [
        { rowNumber: 1, symbol: "L01", desc: "局部坐标" },
        { rowNumber: 2, symbol: "G01", desc: "G 坐标" },
        { rowNumber: 3, symbol: "M01", desc: "机械相对坐标" },
        { rowNumber: 4, symbol: "P01", desc: "机械坐标 P01" },
        { rowNumber: 5, symbol: "P02", desc: "机械坐标 P02" },
        { rowNumber: 6, symbol: "P03", desc: "机械坐标 P03" },
        { rowNumber: 7, symbol: "P04", desc: "机械坐标 P04" },
        { rowNumber: 8, symbol: "X01", desc: "X01 行" },
      ],
    };
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
        intervalTime: null,
        delayTime: null,
      };
      this.resetForm("brotherTcpForm");
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
      // 默认 PDSP.P01.X 机械坐标，便于对照点表
      this.brotherTcpForm.dataArea = "PDSP";
      this.brotherTcpForm.rowNumber = 4;
      this.brotherTcpForm.fieldIndex = 1;
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
          this.brotherTcpForm = res.data;
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

.point-table {
  margin: 20px 0;
}

.point-tip {
  margin-top: 8px;
  color: #999;
  font-size: 12px;
  line-height: 1.6;
}
</style>
