<template>
  <div class="modbus-config">
    <div class="tab-content">
      <div class="tab-header">
        <div class="tab-title">Modbus配置</div>
        <div class="tab-actions" style="right: 20px" v-if="!isProductIn">
          <span style="font-weight: 800; align-items: center; gap: 4px">
            <!-- 感叹号图标 + 悬浮提示 -->
            <el-tooltip
              class="item"
              effect="dark"
              :content="'修改定时配置或修改从站ID都需要关闭再开启才会生效'"
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
            @change="handleModbusStatusChange"
            class="status-switch"
          />
        </div>
        <div class="tab-actions">
          <el-button
            type="primary"
            icon="el-icon-plus"
            class="action-btn"
            @click="addModbusConfig"
            >添加配置</el-button
          >
        </div>
      </div>
      <div class="filter-bar">
        <el-form :inline="true" class="filter-form">
          <el-form-item label="标识">
            <el-input v-model="modbusParams.code"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              icon="el-icon-search"
              @click="getModbusConfigByDeviceSn()"
              class="search-btn"
              >查询
            </el-button>
          </el-form-item>
        </el-form>
      </div>
      <el-table
        :data="modbusList"
        style="width: 100%"
        class="data-table"
        stripe
      >
        <el-table-column prop="code" label="标识" width="150" />
        <el-table-column prop="registerRange" label="寄存器范围" width="180" />
        <el-table-column prop="intervalTime" label="读取间隔(s)" width="180" />
        <el-table-column prop="delayTime" label="读取后延迟(ms)" width="180" />
        <el-table-column label="操作" width="250" fixed="right">
          <template slot-scope="scope">
            <el-button
              size="mini"
              icon="el-icon-edit"
              type="primary"
              @click="editModbusConfig(scope.row)"
              class="table-action"
              >编辑
            </el-button>
            <el-button
              size="mini"
              icon="el-icon-delete"
              type="danger"
              @click="deleteModbus(scope.row.id)"
              class="table-action"
              >删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        class="pagination"
        :current-page="modbusParams.pageNum"
        :page-size="modbusParams.pageSize"
        :total="modbusParams.total"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="getModbusConfigByDeviceSn"
      />
    </div>
    <el-drawer
      :title="'新增配置'"
      :visible.sync="openAddModbus"
      direction="rtl"
      size="40%"
      :before-close="closeModbus"
      class="component-drawer"
    >
      <div class="drawer-content">
        <!-- 添加或修改设备对话框 -->
        <el-form ref="modbusForm" :model="modbusForm" label-width="140px">
          <el-form-item label="标识" prop="code" required>
            <el-input v-model="modbusForm.code" placeholder="请输入标识" />
          </el-form-item>
          <el-form-item label="寄存器范围" prop="registerRange" required>
            <el-input
              v-model="modbusForm.registerRange"
              placeholder="单个区间，如：0 或 0-3（一个字一个 16 位，浮点/32 位整数占 2 个字）"
            />
          </el-form-item>
          <el-form-item label="读取间隔(秒)" prop="intervalTime" required>
            <el-input
              type="number"
              v-model="modbusForm.intervalTime"
              placeholder="多久执行一次读取指令，如：10"
            />
          </el-form-item>
          <el-form-item label="读取后延迟(毫秒)" prop="intervalTime" required>
            <el-input
              type="number"
              v-model="modbusForm.delayTime"
              placeholder="同一个串口服务器每次读取间隔，如：1000"
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
          <el-button type="primary" @click="submitModbusForm">确 定</el-button>
          <!-- 可选：加间距，按钮更美观 -->
          <el-button @click="closeModbus" style="margin-left: 12px"
            >取 消</el-button
          >
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import {
  listModbus,
  delModbus,
  updateModbus,
  addModbus,
  getModbus,
} from "@/api/business/modbus";
import { readSwitchByDevice } from "@/api/business/modbus";

export default {
  name: "ModbusConfig",
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
      openAddModbus: false,
      modbusParams: {
        pageNum: 1,
        pageSize: 10,
        total: 0,
        belongSn: null,
        belongType: null,
      },
      modbusIsEdit: false,
      modbusForm: {},
      modbusList: [],
    };
  },
  created() {
    this.modbusParams.belongSn = this.deviceSn;
    this.getModbusConfigByDeviceSn();
  },
  methods: {
    getModbusConfigByDeviceSn() {
      this.modbusParams.belongSn = this.deviceSn;
      listModbus(this.modbusParams).then((res) => {
        if (res?.code == 200) {
          this.modbusList = res?.rows;
          this.modbusParams.total = res?.total;
        }
      });
    },
    // Modbus功能开关切换事件
    handleModbusStatusChange(enabled) {
      readSwitchByDevice({
        deviceSn: this.deviceSn,
        isOpen: enabled == true ? "1" : "0",
      }).then((res) => {
        if (res?.code == 200) {
          this.$message.success("操作成功");
        }
      });
    },
    /** 提交按钮 */
    submitModbusForm() {
      // 校验寄存器范围：一个标识只对应一个读取点位，只允许单段区间（如 0 或 0-3）
      const range = this.modbusForm.registerRange == null
        ? ""
        : this.modbusForm.registerRange.trim();
      const rangeParts = range.split("-");
      const rangeValid =
        range != "" &&
        rangeParts.length <= 2 &&
        /^\d+$/.test(rangeParts[0]) &&
        (rangeParts.length == 1 || /^\d+$/.test(rangeParts[1])) &&
        (rangeParts.length == 1 ||
          parseInt(rangeParts[1]) >= parseInt(rangeParts[0]));
      if (!rangeValid) {
        this.$message.error(
          "寄存器范围格式不正确，请输入单个区间，如：0 或 0-3"
        );
        return;
      }
      this.$refs["modbusForm"].validate((valid) => {
        if (valid) {
          if (this.modbusForm.id != null) {
            updateModbus(this.modbusForm).then((response) => {
              this.$modal.msgSuccess("修改成功");
              this.openAddModbus = false;
              this.getModbusConfigByDeviceSn();
            });
          } else {
            addModbus(this.modbusForm).then((response) => {
              this.$modal.msgSuccess("新增成功");
              this.openAddModbus = false;
              this.getModbusConfigByDeviceSn();
            });
          }
        }
      });
    },
    // 取消按钮
    closeModbus() {
      this.openAddModbus = false;
      this.resetAddModbusConfig();
    },
    resetAddModbusConfig() {
      this.modbusForm = {
        id: null,
        belongSn: null,
        belongType: null,
        code: null,
        createTime: null,
        registerRange: null,
        intervalTime: null,
        delayTime: null,
      };
      this.resetForm("modbusForm");
    },
    resetForm(formName) {
      if (this.$refs[formName]) {
        this.$refs[formName].resetFields();
      }
    },
    addModbusConfig() {
      this.modbusIsEdit = false;
      this.openAddModbus = true;
      this.resetAddModbusConfig();
      this.modbusForm.belongSn = this.deviceSn;
      this.modbusForm.belongType = "0";
      this.modbusForm.intervalTime = 10;
      this.modbusForm.delayTime = 100;
    },
    editModbusConfig(item) {
      this.modbusIsEdit = true;
      this.openAddModbus = true;
      getModbus(item.id).then((response) => {
        this.modbusForm = response.data;
      });
    },
    deleteModbus(id) {
      this.$confirm("确定要删除此配置吗?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }).then(() => {
        delModbus(id).then((res) => {
          if (res?.code === 200) {
            this.getModbusConfigByDeviceSn();
            this.$message.success("删除成功");
          }
        });
      });
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
</style>
