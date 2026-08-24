<template>
  <div class="s71200-tcp-config">
    <div class="tab-content">
      <div class="tab-header">
        <div class="tab-title">S71200_TCP配置</div>
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
            @change="handleS71200TcpStatusChange"
            class="status-switch"
          />
        </div>
        <div class="tab-actions">
          <el-button
            type="primary"
            icon="el-icon-plus"
            class="action-btn"
            @click="addS71200TcpConfig"
            >添加配置</el-button
          >
        </div>
      </div>
      <div class="filter-bar">
        <el-form :inline="true" class="filter-form">
          <el-form-item label="标识">
            <el-input v-model="s71200TcpParams.code"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              icon="el-icon-search"
              @click="getS71200TcpConfigByDeviceSn"
              class="search-btn"
              >查询
            </el-button>
          </el-form-item>
        </el-form>
      </div>
      <el-table
        :data="s71200TcpList"
        style="width: 100%"
        class="data-table"
        stripe
      >
        <el-table-column prop="code" label="标识" width="150" />
        <el-table-column prop="dbNumber" label="DB块号" width="180" />
        <el-table-column prop="blockType" label="块类型" width="180" />
        <el-table-column prop="areaType" label="区类型" width="100" />
        <el-table-column prop="startAddress" label="起始地址" width="180" />
        <el-table-column prop="bitOffset" label="位偏移" width="180" />
        <el-table-column prop="length" label="长度" width="180" />
        <el-table-column prop="intervalTime" label="读取间隔(s)" width="180" />
        <el-table-column prop="delayTime" label="读取后延迟(ms)" width="180" />
        <el-table-column label="操作" width="250" fixed="right">
          <template slot-scope="scope">
            <el-button
              size="mini"
              icon="el-icon-edit"
              type="primary"
              @click="editS71200TcpConfig(scope.row)"
              class="table-action"
              >编辑
            </el-button>
            <el-button
              size="mini"
              icon="el-icon-delete"
              type="danger"
              @click="deleteS71200Tcp(scope.row.id)"
              class="table-action"
              >删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        class="pagination"
        :current-page="s71200TcpParams.pageNum"
        :page-size="s71200TcpParams.pageSize"
        :total="s71200TcpParams.total"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="getS71200TcpConfigByDeviceSn"
      />
    </div>
    <!-- S71200_TCP -->
    <el-drawer
      :title="'新增配置'"
      :visible.sync="openAddS71200Tcp"
      direction="rtl"
      size="40%"
      :before-close="closeS71200Tcp"
      class="component-drawer"
    >
      <div class="drawer-content">
        <!-- 添加或修改设备对话框 -->
        <el-form ref="s71200TcpForm" :model="s71200TcpForm" label-width="140px">
          <el-form-item label="标识" prop="code" required>
            <el-input v-model="s71200TcpForm.code" placeholder="请输入标识" />
          </el-form-item>
          <el-form-item label="DB块号" prop="dbNumber" required>
            <el-input
              v-model="s71200TcpForm.dbNumber"
              placeholder="DB块号"
              type="number"
            />
          </el-form-item>
          <el-form-item label="块类型" prop="blockType" required>
            <el-select
              v-model="s71200TcpForm.blockType"
              placeholder="DBW，DBX，DBD，DBB"
            >
              <el-option label="DBW" value="DBW" />
              <el-option label="DBX" value="DBX" />
              <el-option label="DBD" value="DBD" />
              <el-option label="DBB" value="DBB" />
            </el-select>
          </el-form-item>
          <el-form-item label="区类型" prop="areaType" required>
            <el-select
              v-model="s71200TcpForm.areaType"
              placeholder="DB数据块"
            >
              <el-option label="DB数据块" value="DB" />
              <el-option label="M标志位" value="M" />
              <el-option label="I输入区" value="I" />
              <el-option label="Q输出区" value="Q" />
            </el-select>
          </el-form-item>
          <el-form-item label="起始地址" prop="startAddress">
            <el-input
              v-model="s71200TcpForm.startAddress"
              placeholder=""
              type="number"
            />
          </el-form-item>
          <el-form-item
            label="位偏移"
            prop="bitOffset"
            :required="s71200TcpForm.blockType == 'DBX'"
          >
            <el-input
              v-model="s71200TcpForm.bitOffset"
              :min="0"
              :max="7"
              placeholder="0-7"
              type="number"
            />
          </el-form-item>
          <el-form-item
            label="读取长度"
            prop="length"
            :required="s71200TcpForm.blockType == 'DBB'"
          >
            <el-input
              v-model="s71200TcpForm.length"
              placeholder="字节"
              type="number"
            />
          </el-form-item>
          <el-form-item label="读取间隔(秒)" prop="intervalTime" required>
            <el-input
              type="number"
              v-model="s71200TcpForm.intervalTime"
              placeholder="多久执行一次读取指令，如：10"
            />
          </el-form-item>
          <el-form-item label="读取后延迟(毫秒)" prop="delayTime" required>
            <el-input
              type="number"
              v-model="s71200TcpForm.delayTime"
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
          <el-button type="primary" @click="submitS71200TcpForm"
            >确 定</el-button
          >
          <!-- 可选：加间距，按钮更美观 -->
          <el-button @click="closeS71200Tcp" style="margin-left: 12px"
            >取 消</el-button
          >
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import {
  listS71200Tcp,
  delS71200Tcp,
  updateS71200Tcp,
  addS71200Tcp,
  getS71200Tcp,
} from "@/api/business/s71200";
import { readS71200TcpSwitchByDevice } from "@/api/business/s71200";

export default {
  name: "S71200TcpConfig",
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
      openAddS71200Tcp: false,
      s71200TcpParams: {
        pageNum: 1,
        pageSize: 10,
        total: 0,
        belongSn: null,
        belongType: null,
      },
      s71200TcpIsEdit: false,
      s71200TcpForm: {},
      s71200TcpList: [],
    };
  },
  created() {
    this.s71200TcpParams.belongSn = this.deviceSn;
    this.getS71200TcpConfigByDeviceSn();
  },
  methods: {
    getS71200TcpConfigByDeviceSn() {
      this.s71200TcpParams.belongSn = this.deviceSn;
      listS71200Tcp(this.s71200TcpParams).then((res) => {
        if (res?.code == 200) {
          this.s71200TcpList = res?.rows;
          this.s71200TcpParams.total = res?.total;
        }
      });
    },
    // S71200_TCP功能开关切换事件
    handleS71200TcpStatusChange(enabled) {
      readS71200TcpSwitchByDevice({
        deviceSn: this.deviceSn,
        isOpen: enabled == true ? "1" : "0",
      }).then((res) => {
        if (res?.code == 200) {
          this.$message.success("操作成功");
        }
      });
    },
    submitS71200TcpForm() {
      this.$refs["s71200TcpForm"].validate((valid) => {
        if (valid) {
          if (this.s71200TcpForm.id != null) {
            updateS71200Tcp(this.s71200TcpForm).then((response) => {
              this.$modal.msgSuccess("修改成功");
              this.openAddS71200Tcp = false;
              this.getS71200TcpConfigByDeviceSn();
            });
          } else {
            addS71200Tcp(this.s71200TcpForm).then((response) => {
              this.$modal.msgSuccess("新增成功");
              this.openAddS71200Tcp = false;
              this.getS71200TcpConfigByDeviceSn();
            });
          }
        }
      });
    },
    // 取消按钮
    closeS71200Tcp() {
      this.openAddS71200Tcp = false;
      this.resetAddS71200TcpConfig();
    },
    resetAddS71200TcpConfig() {
      this.s71200TcpForm = {
        id: null,
        belongSn: null,
        belongType: null,
        code: null,
        createTime: null,
        dbNumber: null,
        blockType: null,
        areaType: null,
        startAddress: null,
        bitOffset: null,
        length: null,
        intervalTime: null,
        delayTime: null,
      };
      this.resetForm("s71200TcpForm");
    },
    resetForm(formName) {
      if (this.$refs[formName]) {
        this.$refs[formName].resetFields();
      }
    },
    addS71200TcpConfig() {
      this.s71200TcpIsEdit = false;
      this.openAddS71200Tcp = true;
      this.resetAddS71200TcpConfig();
      this.s71200TcpForm.belongSn = this.deviceSn;
      this.s71200TcpForm.belongType = "0";
      this.s71200TcpForm.intervalTime = 10;
      this.s71200TcpForm.delayTime = 100;
      this.s71200TcpForm.areaType = "DB";
    },
    editS71200TcpConfig(item) {
      this.s71200TcpIsEdit = true;
      this.openAddS71200Tcp = true;
      getS71200Tcp(item.id).then((response) => {
        this.s71200TcpForm = response.data;
      });
    },
    deleteS71200Tcp(id) {
      this.$confirm("确定要删除此配置吗?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }).then(() => {
        delS71200Tcp(id).then((res) => {
          if (res?.code === 200) {
            this.getS71200TcpConfigByDeviceSn();
            this.$message.success("删除成功");
          }
        });
      });
    },
  },
};
</script>

<style scoped>
.s71200-tcp-config {
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
