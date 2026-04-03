<template>
  <div class="modbus-config">
    <div class="tab-content">
      <div class="tab-header">
        <div class="tab-title">Database_TCP配置</div>
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
            @change="handleOmronFinsTcpStatusChange"
            class="status-switch"
          />
        </div>
        <div class="tab-actions">
          <el-button
            type="primary"
            icon="el-icon-plus"
            class="action-btn"
            @click="addOmronFinsTcpConfig"
            >添加配置</el-button
          >
        </div>
      </div>
      <div class="filter-bar">
        <el-form :inline="true" class="filter-form">
          <el-form-item label="标识">
            <el-input v-model="omronFinsTcpParams.code"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              icon="el-icon-search"
              @click="getOmronFinsTcpConfigByDeviceSn()"
              class="search-btn"
              >查询
            </el-button>
          </el-form-item>
        </el-form>
      </div>
      <el-table
        :data="omronFinsTcpList"
        style="width: 100%"
        class="data-table"
        stripe
      >
        <el-table-column prop="code" label="标识" width="150" />
        <el-table-column prop="areaCode" label="存储区代码" width="180" />
        <el-table-column prop="startAddress" label="起始地址" width="180" />
        <el-table-column prop="length" label="读取数量" width="180" />
        <el-table-column prop="intervalTime" label="读取间隔(s)" width="180" />
        <el-table-column prop="delayTime" label="读取后延迟(ms)" width="180" />
        <el-table-column label="操作" width="250" fixed="right">
          <template slot-scope="scope">
            <el-button
              size="mini"
              icon="el-icon-edit"
              type="primary"
              @click="editOmronFinsTcpConfig(scope.row)"
              class="table-action"
              >编辑
            </el-button>
            <el-button
              size="mini"
              icon="el-icon-delete"
              type="danger"
              @click="deleteOmronFinsTcp(scope.row.id)"
              class="table-action"
              >删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        class="pagination"
        :current-page="omronFinsTcpParams.pageNum"
        :page-size="omronFinsTcpParams.pageSize"
        :total="omronFinsTcpParams.total"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="getOmronFinsTcpConfigByDeviceSn"
      />
    </div>
    <el-drawer
      :title="'新增配置'"
      :visible.sync="openAddOmronFinsTcp"
      direction="rtl"
      size="40%"
      :before-close="closeOmronFinsTcp"
      class="component-drawer"
    >
      <div class="drawer-content">
        <!-- 添加或修改设备对话框 -->
        <el-form
          ref="omronFinsTcpForm"
          :model="omronFinsTcpForm"
          label-width="140px"
        >
          <el-form-item label="标识" prop="code" required>
            <el-input
              v-model="omronFinsTcpForm.code"
              placeholder="请输入标识"
            />
          </el-form-item>
          <el-form-item label="存储区代码" prop="areaCode" required>
            <el-input
              v-model="omronFinsTcpForm.areaCode"
              type="number"
              placeholder="请输入存储区代码"
            />
          </el-form-item>
          <el-form-item label="起始地址" prop="startAddress" required>
            <el-input
              v-model="omronFinsTcpForm.startAddress"
              type="number"
              placeholder="请输入起始地址"
            />
          </el-form-item>
          <el-form-item label="读取数量" prop="length" required>
            <el-input
              v-model="omronFinsTcpForm.length"
              type="number"
              placeholder="请输入读取数量"
            />
          </el-form-item>
          <el-form-item label="读取间隔(秒)" prop="intervalTime" required>
            <el-input
              type="number"
              v-model="omronFinsTcpForm.intervalTime"
              placeholder="多久执行一次读取指令，如：10"
            />
          </el-form-item>
          <el-form-item label="读取后延迟(毫秒)" prop="intervalTime" required>
            <el-input
              type="number"
              v-model="omronFinsTcpForm.delayTime"
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
          <el-button type="primary" @click="submitOmronFinsTcpForm"
            >确 定</el-button
          >
          <!-- 可选：加间距，按钮更美观 -->
          <el-button @click="closeOmronFinsTcp" style="margin-left: 12px"
            >取 消</el-button
          >
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import {
  listOmronFinsTcp,
  delOmronFinsTcp,
  updateOmronFinsTcp,
  addOmronFinsTcp,
  getOmronFinsTcp,
} from "@/api/business/omronFins";
import { readOmronFinsTcpSwitchByProduct } from "@/api/business/omronFins";

export default {
  name: "OmronFinsTcpConfig",
  props: {
    deviceSn: {
      type: String,
      required: true,
    },
    evalnabled: {
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
      openAddOmronFinsTcp: false,
      omronFinsTcpParams: {
        pageNum: 1,
        pageSize: 10,
        total: 0,
        belongSn: null,
        belongType: null,
      },
      omronFinsTcpIsEdit: false,
      omronFinsTcpForm: {},
      omronFinsTcpList: [],
    };
  },
  created() {
    this.omronFinsTcpParams.belongSn = this.deviceSn;
    this.getOmronFinsTcpConfigByDeviceSn();
  },
  methods: {
    getOmronFinsTcpConfigByDeviceSn() {
      this.omronFinsTcpParams.belongSn = this.deviceSn;
      listOmronFinsTcp(this.omronFinsTcpParams).then((res) => {
        if (res?.code == 200) {
          this.omronFinsTcpList = res?.rows;
          this.omronFinsTcpParams.total = res?.total;
        }
      });
    },
    // OmronFinsTcp功能开关切换事件
    handleOmronFinsTcpStatusChange(enabled) {
      readOmronFinsTcpSwitchByProduct({
        deviceSn: this.deviceSn,
        isOpen: enabled == true ? "1" : "0",
      }).then((res) => {
        if (res?.code == 200) {
          this.$message.success("操作成功");
        }
      });
    },
    /** 提交按钮 */
    submitOmronFinsTcpForm() {
      this.$refs["omronFinsTcpForm"].validate((valid) => {
        if (valid) {
          if (this.omronFinsTcpForm.id != null) {
            updateOmronFinsTcp(this.omronFinsTcpForm).then((response) => {
              this.$modal.msgSuccess("修改成功");
              this.openAddOmronFinsTcp = false;
              this.getOmronFinsTcpConfigByDeviceSn();
            });
          } else {
            addOmronFinsTcp(this.omronFinsTcpForm).then((response) => {
              this.$modal.msgSuccess("新增成功");
              this.openAddOmronFinsTcp = false;
              this.getOmronFinsTcpConfigByDeviceSn();
            });
          }
        }
      });
    },
    // 取消按钮
    closeOmronFinsTcp() {
      this.openAddOmronFinsTcp = false;
      this.resetAddOmronFinsTcpConfig();
    },
    resetAddOmronFinsTcpConfig() {
      this.omronFinsTcpForm = {
        id: null,
        belongSn: null,
        belongType: null,
        code: null,
        createTime: null,
        areaCode: null,
        startAddress: null,
        length: null,
        intervalTime: null,
        delayTime: null,
      };
      this.resetForm("omronFinsTcpForm");
    },
    resetForm(formName) {
      if (this.$refs[formName]) {
        this.$refs[formName].resetFields();
      }
    },
    addOmronFinsTcpConfig() {
      this.omronFinsTcpIsEdit = false;
      this.openAddOmronFinsTcp = true;
      this.resetAddOmronFinsTcpConfig();
      this.omronFinsTcpForm.belongSn = this.deviceSn;
      this.omronFinsTcpForm.belongType = "0";
      this.omronFinsTcpForm.intervalTime = 10;
      this.omronFinsTcpForm.delayTime = 100;
    },
    editOmronFinsTcpConfig(item) {
      this.omronFinsTcpIsEdit = true;
      this.openAddOmronFinsTcp = true;
      getOmronFinsTcp(item.id).then((response) => {
        this.omronFinsTcpForm = response.data;
      });
    },
    deleteOmronFinsTcp(id) {
      this.$confirm("确定要删除此配置吗?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }).then(() => {
        delOmronFinsTcp(id).then((res) => {
          if (res?.code === 200) {
            this.getOmronFinsTcpConfigByDeviceSn();
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
