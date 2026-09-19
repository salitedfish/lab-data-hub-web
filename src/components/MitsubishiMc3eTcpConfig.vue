<template>
  <div class="modbus-config">
    <div class="tab-content">
      <div class="tab-header">
        <div class="tab-title">MITSUBISHI_MC3E_TCP配置</div>
        <div class="tab-actions" style="right: 20px" v-if="!isProductIn">
          <span style="font-weight: 800; align-items: center; gap: 4px">
            <!-- 感叹号图标 + 悬浮提示 -->
            <el-tooltip
              class="item"
              effect="dark"
              :content="'修改定时配置或修改软元件地址都需要关闭再开启才会生效'"
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
            @change="handleMitsubishiTcpStatusChange"
            class="status-switch"
          />
        </div>
        <div class="tab-actions">
          <el-button
            type="primary"
            icon="el-icon-plus"
            class="action-btn"
            @click="addMitsubishiMc3eTcpConfig"
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
            <el-input v-model="mitsubishiMc3eTcpParams.code"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              icon="el-icon-search"
              @click="getMitsubishiMc3eTcpConfigByDeviceSn()"
              class="search-btn"
              >查询
            </el-button>
          </el-form-item>
        </el-form>
      </div>
      <el-table
        :data="mitsubishiMc3eTcpList"
        style="width: 100%"
        class="data-table"
        stripe
      >
        <el-table-column prop="code" label="标识" width="150" />
        <el-table-column prop="areaCode" label="软元件" width="150">
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
              @click="editMitsubishiMc3eTcpConfig(scope.row)"
              class="table-action"
              >编辑
            </el-button>
            <el-button
              size="mini"
              icon="el-icon-delete"
              type="danger"
              :loading="deleteLoading == scope.row.id"
              :disabled="deleteLoading == scope.row.id"
              @click="deleteMitsubishiTcp(scope.row.id)"
              class="table-action"
              >删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        class="pagination"
        :current-page="mitsubishiMc3eTcpParams.pageNum"
        :page-size="mitsubishiMc3eTcpParams.pageSize"
        :total="mitsubishiMc3eTcpParams.total"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="(pageNum) => { mitsubishiMc3eTcpParams.pageNum = pageNum; getMitsubishiMc3eTcpConfigByDeviceSn(); }"
        @size-change="(size) => { mitsubishiMc3eTcpParams.pageSize = size; mitsubishiMc3eTcpParams.pageNum = 1; getMitsubishiMc3eTcpConfigByDeviceSn(); }"
      />
    </div>
    <el-drawer
      :title="'新增配置'"
      :visible.sync="openAddMitsubishiTcp"
      direction="rtl"
      size="40%"
      :before-close="closeMitsubishiTcp"
      class="component-drawer"
    >
      <div class="drawer-content">
        <!-- 添加或修改设备对话框 -->
        <el-form
          ref="mitsubishiMc3eTcpForm"
          :model="mitsubishiMc3eTcpForm"
          label-width="140px"
        >
          <el-form-item label="标识" prop="code" required>
            <el-input
              v-model="mitsubishiMc3eTcpForm.code"
              placeholder="请输入标识"
            />
          </el-form-item>
          <el-form-item label="软元件" prop="areaCode" required>
            <el-select
              v-model="mitsubishiMc3eTcpForm.areaCode"
              placeholder="请选择软元件类型"
            >
              <el-option label="D 数据寄存器" :value="0xA8" />
              <el-option label="W 链接寄存器" :value="0xB4" />
              <el-option label="R 文件寄存器" :value="0xAF" />
              <el-option label="ZR 文件寄存器" :value="0xB0" />
              <el-option label="SD 特殊寄存器" :value="0xA9" />
              <el-option label="M 内部继电器" :value="0x90" />
              <el-option label="L 锁存继电器" :value="0x92" />
              <el-option label="B 链接继电器" :value="0xA0" />
              <el-option label="X 输入继电器" :value="0x9C" />
              <el-option label="Y 输出继电器" :value="0x9D" />
              <el-option label="S 步进继电器" :value="0x98" />
              <el-option label="SM 特殊继电器" :value="0x91" />
              <el-option label="F 报警器" :value="0x93" />
            </el-select>
          </el-form-item>
          <el-form-item label="起始地址" prop="startAddress" required>
            <el-input
              v-model="mitsubishiMc3eTcpForm.startAddress"
              type="number"
              placeholder="请输入起始地址"
            />
            <div
              v-if="isOctalArea"
              style="
                color: #e6a23c;
                font-size: 12px;
                line-height: 18px;
                margin-top: 4px;
              "
            >
              提示：X/Y 软元件地址为八进制，请输入八进制地址（如 17 表示第 15 位）
            </div>
          </el-form-item>
          <el-form-item label="读取数量" prop="length" required>
            <el-input
              v-model="mitsubishiMc3eTcpForm.length"
              type="number"
              placeholder="字设备≤960，位设备≤2000"
            />
          </el-form-item>
          <el-form-item label="读取间隔(秒)" prop="intervalTime" required>
            <el-input
              type="number"
              v-model="mitsubishiMc3eTcpForm.intervalTime"
              placeholder="多久执行一次读取指令，如：10"
            />
          </el-form-item>
          <el-form-item label="读取后延迟(毫秒)" prop="delayTime" required>
            <el-input
              type="number"
              v-model="mitsubishiMc3eTcpForm.delayTime"
              placeholder="同一个网络组件每次读取间隔，如：1000"
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
            @click="submitMitsubishiTcpForm"
            >确 定</el-button
          >
          <!-- 可选：加间距，按钮更美观 -->
          <el-button @click="closeMitsubishiTcp" style="margin-left: 12px"
            >取 消</el-button
          >
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import {
  listMitsubishiTcp,
  delMitsubishiTcp,
  updateMitsubishiTcp,
  addMitsubishiTcp,
  getMitsubishiTcp,
} from "@/api/business/mitsubishiMc3eTcp";
import { readMitsubishiTcpSwitchByDevice } from "@/api/business/mitsubishiMc3eTcp";
import { syncConfigToDevice } from "@/api/business/mitsubishiMc3eTcp";

export default {
  name: "MitsubishiMc3eTcpConfig",
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
      openAddMitsubishiTcp: false,
      submitLoading: false,
      // 每行独立 loading 状态（用行 id 区分，避免点击一行导致整列按钮一起 loading）
      editLoading: null,
      deleteLoading: null,
      // 下发到设备按钮 loading（产品模式下可用）
      syncLoading: false,
      mitsubishiMc3eTcpParams: {
        pageNum: 1,
        pageSize: 10,
        total: 0,
        belongSn: null,
        belongType: null,
      },
      mitsubishiMc3eTcpIsEdit: false,
      mitsubishiMc3eTcpForm: {},
      mitsubishiMc3eTcpList: [],
    };
  },
  computed: {
    // X/Y 软元件地址为八进制，提示用户
    isOctalArea() {
      return (
        this.mitsubishiMc3eTcpForm.areaCode == 0x9c || this.mitsubishiMc3eTcpForm.areaCode == 0x9d
      );
    },
  },
  created() {
    this.mitsubishiMc3eTcpParams.belongSn = this.deviceSn;
    this.getMitsubishiMc3eTcpConfigByDeviceSn();
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
    async getMitsubishiMc3eTcpConfigByDeviceSn() {
      this.mitsubishiMc3eTcpParams.belongSn = this.deviceSn;
      try {
        const res = await listMitsubishiTcp(this.mitsubishiMc3eTcpParams);
        if (res?.code == 200) {
          this.mitsubishiMc3eTcpList = res?.rows;
          this.mitsubishiMc3eTcpParams.total = res?.total;
        }
      } catch (e) {
        console.error("查询三菱配置失败", e);
      }
    },
    // MitsubishiTcp功能开关切换事件
    async handleMitsubishiTcpStatusChange(enabled) {
      try {
        const res = await readMitsubishiTcpSwitchByDevice({
          deviceSn: this.deviceSn,
          isOpen: enabled == true ? "1" : "0",
        });
        if (res?.code == 200) {
          this.$message.success("操作成功");
        }
      } catch (e) {
        console.error("三菱读取开关切换失败", e);
      }
    },
    /** 提交按钮 */
    submitMitsubishiTcpForm() {
      this.$refs["mitsubishiMc3eTcpForm"].validate((valid) => {
        if (valid) {
          this.saveMitsubishiMc3eTcpConfig();
        }
      });
    },
    async saveMitsubishiMc3eTcpConfig() {
      this.submitLoading = true;
      try {
        if (this.mitsubishiMc3eTcpForm.id != null) {
          await updateMitsubishiTcp(this.mitsubishiMc3eTcpForm);
          this.$modal.msgSuccess("修改成功");
        } else {
          await addMitsubishiTcp(this.mitsubishiMc3eTcpForm);
          this.$modal.msgSuccess("新增成功");
        }
        this.openAddMitsubishiTcp = false;
        this.getMitsubishiMc3eTcpConfigByDeviceSn();
      } catch (e) {
        console.error("保存三菱配置失败", e);
      } finally {
        this.submitLoading = false;
      }
    },
    // 软元件代码转名称展示
    areaCodeName(code) {
      const areaMap = {
        168: "D 数据寄存器",
        180: "W 链接寄存器",
        175: "R 文件寄存器",
        176: "ZR 文件寄存器",
        169: "SD 特殊寄存器",
        144: "M 内部继电器",
        146: "L 锁存继电器",
        160: "B 链接继电器",
        156: "X 输入继电器",
        157: "Y 输出继电器",
        152: "S 步进继电器",
        145: "SM 特殊继电器",
        147: "F 报警器",
      };
      return areaMap[code] != null ? areaMap[code] : code;
    },
    // 取消按钮
    closeMitsubishiTcp() {
      this.openAddMitsubishiTcp = false;
      this.resetAddMitsubishiMc3eTcpConfig();
    },
    resetAddMitsubishiMc3eTcpConfig() {
      this.mitsubishiMc3eTcpForm = {
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
      this.resetForm("mitsubishiMc3eTcpForm");
    },
    resetForm(formName) {
      if (this.$refs[formName]) {
        this.$refs[formName].resetFields();
      }
    },
    addMitsubishiMc3eTcpConfig() {
      this.mitsubishiMc3eTcpIsEdit = false;
      this.openAddMitsubishiTcp = true;
      this.resetAddMitsubishiMc3eTcpConfig();
      this.mitsubishiMc3eTcpForm.belongSn = this.deviceSn;
      this.mitsubishiMc3eTcpForm.belongType = "0";
      this.mitsubishiMc3eTcpForm.intervalTime = 10;
      this.mitsubishiMc3eTcpForm.delayTime = 100;
      this.mitsubishiMc3eTcpForm.areaCode = 0xa8;
    },
    async editMitsubishiMc3eTcpConfig(item) {
      this.editLoading = item.id;
      try {
        const res = await getMitsubishiTcp(item.id);
        if (res?.code == 200) {
          this.mitsubishiMc3eTcpIsEdit = true;
          this.openAddMitsubishiTcp = true;
          this.mitsubishiMc3eTcpForm = res.data;
        }
      } catch (e) {
        console.error("查询三菱配置失败", e);
      } finally {
        this.editLoading = null;
      }
    },
    async deleteMitsubishiTcp(id) {
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
          const res = await delMitsubishiTcp(id);
          if (res?.code == 200) {
            await this.getMitsubishiMc3eTcpConfigByDeviceSn();
            this.$message.success("删除成功");
          }
        } catch (e) {
          console.error("删除三菱配置失败", e);
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
