<template>
  <div class="modbus-config">
    <div class="tab-content">
      <div class="tab-header">
        <div class="tab-title">MITSUBISHI_TCP配置</div>
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
            @click="addMitsubishiTcpConfig"
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
            <el-input v-model="mitsubishiTcpParams.code"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              icon="el-icon-search"
              @click="getMitsubishiTcpConfigByDeviceSn()"
              class="search-btn"
              >查询
            </el-button>
          </el-form-item>
        </el-form>
      </div>
      <el-table
        :data="mitsubishiTcpList"
        style="width: 100%"
        class="data-table"
        stripe
      >
        <el-table-column prop="code" label="标识" width="150" />
        <el-table-column prop="protocolMode" label="协议类型" width="110">
          <template slot-scope="scope">
            {{ protocolModeName(scope.row.protocolMode) }}
          </template>
        </el-table-column>
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
              @click="editMitsubishiTcpConfig(scope.row)"
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
        :current-page="mitsubishiTcpParams.pageNum"
        :page-size="mitsubishiTcpParams.pageSize"
        :total="mitsubishiTcpParams.total"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="(pageNum) => { mitsubishiTcpParams.pageNum = pageNum; getMitsubishiTcpConfigByDeviceSn(); }"
        @size-change="(size) => { mitsubishiTcpParams.pageSize = size; mitsubishiTcpParams.pageNum = 1; getMitsubishiTcpConfigByDeviceSn(); }"
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
          ref="mitsubishiTcpForm"
          :model="mitsubishiTcpForm"
          label-width="140px"
        >
          <el-form-item label="标识" prop="code" required>
            <el-input
              v-model="mitsubishiTcpForm.code"
              placeholder="请输入标识"
            />
          </el-form-item>
          <el-form-item label="协议类型" prop="protocolMode" required>
            <el-select
              v-model="mitsubishiTcpForm.protocolMode"
              placeholder="请选择协议帧类型"
            >
              <el-option label="MC3E (QnA兼容3E帧)" value="3E"></el-option>
              <el-option label="MC1E (标准二进制帧)" value="1E"></el-option>
            </el-select>
            <div
              style="
                color: #999;
                font-size: 12px;
                line-height: 18px;
                margin-top: 4px;
              "
            >
              MC1E 为老式 PLC 标准二进制帧（端口 5007），协议细节待真机验证
            </div>
          </el-form-item>
          <el-form-item label="软元件" prop="areaCode" required>
            <el-select
              v-model="mitsubishiTcpForm.areaCode"
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
              v-model="mitsubishiTcpForm.startAddress"
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
              v-model="mitsubishiTcpForm.length"
              type="number"
              placeholder="字设备≤960，位设备≤2000"
            />
          </el-form-item>
          <el-form-item label="读取间隔(秒)" prop="intervalTime" required>
            <el-input
              type="number"
              v-model="mitsubishiTcpForm.intervalTime"
              placeholder="多久执行一次读取指令，如：10"
            />
          </el-form-item>
          <el-form-item label="读取后延迟(毫秒)" prop="delayTime" required>
            <el-input
              type="number"
              v-model="mitsubishiTcpForm.delayTime"
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
} from "@/api/business/mitsubishiTcp";
import { readMitsubishiTcpSwitchByDevice } from "@/api/business/mitsubishiTcp";
import { syncConfigToDevice } from "@/api/business/mitsubishiTcp";

export default {
  name: "MitsubishiTcpConfig",
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
      mitsubishiTcpParams: {
        pageNum: 1,
        pageSize: 10,
        total: 0,
        belongSn: null,
        belongType: null,
      },
      mitsubishiTcpIsEdit: false,
      mitsubishiTcpForm: {},
      mitsubishiTcpList: [],
    };
  },
  computed: {
    // X/Y 软元件地址为八进制，提示用户
    isOctalArea() {
      return (
        this.mitsubishiTcpForm.areaCode == 0x9c || this.mitsubishiTcpForm.areaCode == 0x9d
      );
    },
  },
  created() {
    this.mitsubishiTcpParams.belongSn = this.deviceSn;
    this.getMitsubishiTcpConfigByDeviceSn();
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
    async getMitsubishiTcpConfigByDeviceSn() {
      this.mitsubishiTcpParams.belongSn = this.deviceSn;
      try {
        const res = await listMitsubishiTcp(this.mitsubishiTcpParams);
        if (res?.code == 200) {
          this.mitsubishiTcpList = res?.rows;
          this.mitsubishiTcpParams.total = res?.total;
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
      this.$refs["mitsubishiTcpForm"].validate((valid) => {
        if (valid) {
          this.saveMitsubishiTcpConfig();
        }
      });
    },
    async saveMitsubishiTcpConfig() {
      this.submitLoading = true;
      try {
        if (this.mitsubishiTcpForm.id != null) {
          await updateMitsubishiTcp(this.mitsubishiTcpForm);
          this.$modal.msgSuccess("修改成功");
        } else {
          await addMitsubishiTcp(this.mitsubishiTcpForm);
          this.$modal.msgSuccess("新增成功");
        }
        this.openAddMitsubishiTcp = false;
        this.getMitsubishiTcpConfigByDeviceSn();
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
      this.resetAddMitsubishiTcpConfig();
    },
    resetAddMitsubishiTcpConfig() {
      this.mitsubishiTcpForm = {
        id: null,
        belongSn: null,
        belongType: null,
        code: null,
        createTime: null,
        protocolMode: "3E",
        areaCode: null,
        startAddress: null,
        length: null,
        intervalTime: null,
        delayTime: null,
      };
      this.resetForm("mitsubishiTcpForm");
    },
    // 协议帧模式代码转名称展示（null 默认 MC3E）
    protocolModeName(mode) {
      const modeMap = { "3E": "MC3E", "1E": "MC1E" };
      if (mode == null || mode == "") {
        return "MC3E";
      }
      return modeMap[mode] != null ? modeMap[mode] : mode;
    },
    resetForm(formName) {
      if (this.$refs[formName]) {
        this.$refs[formName].resetFields();
      }
    },
    addMitsubishiTcpConfig() {
      this.mitsubishiTcpIsEdit = false;
      this.openAddMitsubishiTcp = true;
      this.resetAddMitsubishiTcpConfig();
      this.mitsubishiTcpForm.belongSn = this.deviceSn;
      this.mitsubishiTcpForm.belongType = "0";
      this.mitsubishiTcpForm.intervalTime = 10;
      this.mitsubishiTcpForm.delayTime = 100;
      this.mitsubishiTcpForm.areaCode = 0xa8;
      this.mitsubishiTcpForm.protocolMode = "3E";
    },
    async editMitsubishiTcpConfig(item) {
      this.editLoading = item.id;
      try {
        const res = await getMitsubishiTcp(item.id);
        if (res?.code == 200) {
          this.mitsubishiTcpIsEdit = true;
          this.openAddMitsubishiTcp = true;
          this.mitsubishiTcpForm = res.data;
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
            await this.getMitsubishiTcpConfigByDeviceSn();
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
