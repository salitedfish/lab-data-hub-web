<template>
  <div class="modbus-config">
    <div class="tab-content">
      <div class="tab-header">
        <div class="tab-title">OMRONFINS_TCP配置</div>
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
        <el-table-column prop="areaCode" label="存储区" width="120">
          <template slot-scope="scope">
            {{ areaCodeName(scope.row.areaCode) }}
          </template>
        </el-table-column>
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
              :loading="editLoading == scope.row.id"
              :disabled="editLoading == scope.row.id"
              @click="editOmronFinsTcpConfig(scope.row)"
              class="table-action"
              >编辑
            </el-button>
            <el-button
              size="mini"
              icon="el-icon-delete"
              type="danger"
              :loading="deleteLoading == scope.row.id"
              :disabled="deleteLoading == scope.row.id"
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
        @current-change="(pageNum) => { omronFinsTcpParams.pageNum = pageNum; getOmronFinsTcpConfigByDeviceSn(); }"
        @size-change="(size) => { omronFinsTcpParams.pageSize = size; omronFinsTcpParams.pageNum = 1; getOmronFinsTcpConfigByDeviceSn(); }"
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
          <el-form-item label="存储区" prop="areaCode" required>
            <el-select
              v-model="omronFinsTcpForm.areaCode"
              placeholder="DM区"
            >
              <el-option label="DM区" :value="0x82" />
              <el-option label="CIO区" :value="0x30" />
              <el-option label="WR区" :value="0xB1" />
              <el-option label="H区" :value="0x31" />
              <el-option label="IR区" :value="0x80" />
              <el-option label="LR区" :value="0x98" />
              <el-option label="EM区" :value="0xA0" />
            </el-select>
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
          <el-form-item label="读取后延迟(毫秒)" prop="delayTime" required>
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
          <el-button
            type="primary"
            :loading="submitLoading"
            :disabled="submitLoading"
            @click="submitOmronFinsTcpForm"
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
import { readOmronFinsTcpSwitchByDevice } from "@/api/business/omronFins";

export default {
  name: "OmronFinsTcpConfig",
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
      openAddOmronFinsTcp: false,
      submitLoading: false,
      // 每行独立 loading 状态（用行 id 区分，避免点击一行导致整列按钮一起 loading）
      editLoading: null,
      deleteLoading: null,
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
    async getOmronFinsTcpConfigByDeviceSn() {
      this.omronFinsTcpParams.belongSn = this.deviceSn;
      try {
        const res = await listOmronFinsTcp(this.omronFinsTcpParams);
        if (res?.code == 200) {
          this.omronFinsTcpList = res?.rows;
          this.omronFinsTcpParams.total = res?.total;
        }
      } catch (e) {
        console.error("查询FINS配置失败", e);
      }
    },
    // OmronFinsTcp功能开关切换事件
    async handleOmronFinsTcpStatusChange(enabled) {
      try {
        const res = await readOmronFinsTcpSwitchByDevice({
          deviceSn: this.deviceSn,
          isOpen: enabled == true ? "1" : "0",
        });
        if (res?.code == 200) {
          this.$message.success("操作成功");
        }
      } catch (e) {
        console.error("FINS读取开关切换失败", e);
      }
    },
    /** 提交按钮 */
    submitOmronFinsTcpForm() {
      this.$refs["omronFinsTcpForm"].validate((valid) => {
        if (valid) {
          this.saveOmronFinsTcpConfig();
        }
      });
    },
    async saveOmronFinsTcpConfig() {
      this.submitLoading = true;
      try {
        if (this.omronFinsTcpForm.id != null) {
          await updateOmronFinsTcp(this.omronFinsTcpForm);
          this.$modal.msgSuccess("修改成功");
        } else {
          await addOmronFinsTcp(this.omronFinsTcpForm);
          this.$modal.msgSuccess("新增成功");
        }
        this.openAddOmronFinsTcp = false;
        this.getOmronFinsTcpConfigByDeviceSn();
      } catch (e) {
        console.error("保存FINS配置失败", e);
      } finally {
        this.submitLoading = false;
      }
    },
    // 存储区代码转名称展示
    areaCodeName(code) {
      const areaMap = {
        130: "DM区",
        48: "CIO区",
        177: "WR区",
        49: "H区",
        128: "IR区",
        152: "LR区",
        160: "EM区",
      };
      return areaMap[code] != null ? areaMap[code] : code;
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
      this.omronFinsTcpForm.areaCode = 0x82;
    },
    async editOmronFinsTcpConfig(item) {
      this.editLoading = item.id;
      try {
        const res = await getOmronFinsTcp(item.id);
        if (res?.code == 200) {
          this.omronFinsTcpIsEdit = true;
          this.openAddOmronFinsTcp = true;
          this.omronFinsTcpForm = res.data;
        }
      } catch (e) {
        console.error("查询FINS配置失败", e);
      } finally {
        this.editLoading = null;
      }
    },
    async deleteOmronFinsTcp(id) {
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
          const res = await delOmronFinsTcp(id);
          if (res?.code == 200) {
            await this.getOmronFinsTcpConfigByDeviceSn();
            this.$message.success("删除成功");
          }
        } catch (e) {
          console.error("删除FINS配置失败", e);
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
</style>
