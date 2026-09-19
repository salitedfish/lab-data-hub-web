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
        <el-table-column prop="startAddress" label="起始地址" width="120" />
        <el-table-column prop="bitAddress" label="位号" width="80">
          <template slot-scope="scope">
            {{ scope.row.bitAddress == null ? "—" : scope.row.bitAddress }}
          </template>
        </el-table-column>
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
              @change="handleAreaCodeChange"
            >
              <el-option-group
                v-for="group in areaOptions"
                :key="group.label"
                :label="group.label"
              >
                <el-option
                  v-for="item in group.items"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-option-group>
            </el-select>
          </el-form-item>
          <el-form-item label="起始地址" prop="startAddress" required>
            <el-input
              v-model="omronFinsTcpForm.startAddress"
              type="number"
              placeholder="起始字地址（0-65535）"
            />
          </el-form-item>
          <el-form-item
            v-if="isBitAreaSelected"
            label="位号"
            prop="bitAddress"
            required
          >
            <el-input
              v-model="omronFinsTcpForm.bitAddress"
              type="number"
              placeholder="位号 0-15（位区必填，是地址的第 3 字节）"
            />
          </el-form-item>
          <el-form-item label="读取数量" prop="length" required>
            <el-input
              v-model="omronFinsTcpForm.length"
              type="number"
              placeholder="字区=字个数(1-1000)，位区=位个数(恒为1)"
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
import { syncConfigToDevice } from "@/api/business/omronFins";

// ============ FINS 标准内存区码（W342 内存区指定表） ============
// 字区码与位区码成对出现，区码决定地址第 3 字节是「位号」还是恒为 0：
//   区           字访问   位访问
//   CIO         0xB0    0x30
//   WR          0xB1    0x31
//   HR(H)       0xB2    0x32
//   AR(A)       0xB3    0x33
//   DM          0x82    0x02
//   EM 当前库    0x98    0x18
//   EM 库 0-15   0xA0-AF 0x20-2F
// ⚠️ 旧的「IR区 0x88」「H区 0x32」是错的：0x88 实为 CNT 计数器区（CS/CJ 没有 IR 区），
//    0x32 是 HR 的位码。区码填错设备不报错、只会静默读到另一个区，所以这里按标准卡死，
//    与后端 FinsDataReader.BIT_AREA_CODES / LabdatahubOmronFinsConfigController#checkConfig 保持一致。
const WORD_AREA_ITEMS = [
  { label: "CIO区", value: 0xb0 },
  { label: "WR区", value: 0xb1 },
  { label: "H区(HR)", value: 0xb2 },
  { label: "A区(AR)", value: 0xb3 },
  { label: "DM区", value: 0x82 },
  { label: "EM当前库", value: 0x98 },
];
const BIT_AREA_ITEMS = [
  { label: "CIO位", value: 0x30 },
  { label: "WR位", value: 0x31 },
  { label: "H位(HR)", value: 0x32 },
  { label: "A位(AR)", value: 0x33 },
  { label: "DM位", value: 0x02 },
  { label: "EM当前库位", value: 0x18 },
];
// EM 库 0-15 逐库展开（字区 0xA0-0xAF、位区 0x20-0x2F），手写 32 行没必要
for (let bank = 0; bank < 16; bank++) {
  WORD_AREA_ITEMS.push({ label: "EM库" + bank, value: 0xa0 + bank });
  BIT_AREA_ITEMS.push({ label: "EM库" + bank + "位", value: 0x20 + bank });
}

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
      // 下发到设备按钮 loading（产品模式下可用）
      syncLoading: false,
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
  computed: {
    // 存储区下拉的两组选项。下拉与列表列名共用同一份数据，避免两处各写一份映射后对不上
    areaOptions() {
      return [
        { label: "字区（按字读写）", items: WORD_AREA_ITEMS },
        { label: "位区（按位读写）", items: BIT_AREA_ITEMS },
      ];
    },
    // 区码 → 区名（列表「存储区」列展示用）
    areaNameMap() {
      const map = {};
      for (const item of WORD_AREA_ITEMS.concat(BIT_AREA_ITEMS)) {
        map[item.value] = item.label;
      }
      return map;
    },
    // 当前选中的是否位区：决定是否显示「位号」输入框
    isBitAreaSelected() {
      const code = this.omronFinsTcpForm.areaCode;
      return BIT_AREA_ITEMS.some((item) => item.value == code);
    },
  },
  created() {
    this.omronFinsTcpParams.belongSn = this.deviceSn;
    this.getOmronFinsTcpConfigByDeviceSn();
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
      if (!this.checkOmronFinsTcpForm()) {
        return;
      }
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
      return this.areaNameMap[code] != null ? this.areaNameMap[code] : code;
    },
    // 切换存储区：字区/位区与位号必须自洽，否则后端会拒（配错了不是报错而是读写到别处去）
    handleAreaCodeChange(areaCode) {
      const isBit = BIT_AREA_ITEMS.some((item) => item.value == areaCode);
      if (isBit) {
        this.omronFinsTcpForm.bitAddress = null;
        // 位区一次只能读写 1 个位，顺手带上，省得用户填了 8 再被拒
        this.omronFinsTcpForm.length = 1;
      } else {
        // 字区不能带位号，残留位号会让后端报「字区不应填写位号」
        this.omronFinsTcpForm.bitAddress = null;
      }
    },
    /** 提交前的一致性校验：拦住后端一定会拒的组合，提示比后端的中文错误更早更准 */
    checkOmronFinsTcpForm() {
      const form = this.omronFinsTcpForm;
      if (form.areaCode == null) {
        this.$message.error("请选择存储区");
        return false;
      }
      if (this.isBitAreaSelected) {
        if (form.bitAddress == null || form.bitAddress === "") {
          this.$message.error("位区必须填写位号（0-15）");
          return false;
        }
        if (Number(form.bitAddress) < 0 || Number(form.bitAddress) > 15) {
          this.$message.error("位号必须在 0-15 之间");
          return false;
        }
        if (form.length != 1) {
          this.$message.error("位区一次只读 1 个位，读取数量必须为 1");
          return false;
        }
      } else if (form.length < 1 || form.length > 1000) {
        this.$message.error("读取数量必须在 1-1000 之间");
        return false;
      }
      if (
        form.startAddress == null ||
        form.startAddress === "" ||
        Number(form.startAddress) < 0 ||
        Number(form.startAddress) > 65535
      ) {
        this.$message.error("起始字地址必须在 0-65535 之间");
        return false;
      }
      return true;
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
        bitAddress: null,
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
