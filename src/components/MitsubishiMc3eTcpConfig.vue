<template>
  <div class="modbus-config">
    <div class="tab-content">
      <div class="tab-header">
        <div class="tab-title">MITSUBISHI_MC3E 点位配置（TCP / UDP 通用）</div>
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
        <el-table-column prop="startAddress" label="起始地址" width="180">
          <template slot-scope="scope">
            {{ formatAddress(scope.row) }}
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
            <div style="display: flex; align-items: center">
              <el-input
                v-model="addressInput"
                placeholder="如 D150（读一个数值），或 D150.0（读第 0 位通断）"
                style="flex: 1"
              />
              <el-tooltip placement="right-start" effect="dark" :enterable="true" popper-class="mc-hint-popper">
                <div slot="content" style="line-height: 20px">
                  <div>
                    格式：<b>150</b>（只写数字）、<b>D150</b>（字母 + 数字）、<b>D150.0</b>（再加 .位号），字母不区分大小写。
                  </div>
                  <div style="margin-top: 6px">
                    • <b>D150</b>：读第 150 号数据寄存器里的<b>一个 16 位数值</b>。一个寄存器就是一个整数，比如转速、产量这类数。
                  </div>
                  <div style="margin-top: 4px">
                    • <b>D150.0</b>：只看这个 16 位数值里的<b>某一位</b>，读回来是 0 或 1，对应设备上某个开关 / 信号是「断」还是「通」。点后面的数字是位号，<b>只能填 0–15</b>，0 是最低位（把数值写成二进制后最右边那一位）。比如 D150 里存的是 5（二进制 0000 0000 0000 0101），则 D150.0 = 1、D150.1 = 0、D150.2 = 1。
                  </div>
                  <div style="margin-top: 4px">
                    • <b>前面的字母</b>决定软元件类型，填了字母会自动切换上面的「软元件」下拉：D / W / R / ZR / SD 是存数值的「字设备」，M / L / B / X / Y / S / SM / F 是只表示通断的「位设备」。只写数字 150 时，按下拉框选中的类型读。
                  </div>
                  <div style="margin-top: 4px">
                    • <b>D150.0 只能用在 D / W / R / ZR / SD 上</b>：三菱不允许直接按位读这几个区，平台的做法是「先读 1 个字，再取出那一位」，所以读取数量会被锁定为 1。结果按开关量（bool）建，<b>不支持写入</b>。
                  </div>
                  <div style="margin-top: 4px">
                    • <b>一条配置只对应一个采集值</b>：要分别采集 D150、D151、D152，就建 3 条配置、各填一个地址、数量都填 1；数量填 3 不会得到 3 个值，只会把 3 个字拼成一个值。
                  </div>
                </div>
                <i
                  class="el-icon-question"
                  style="color: #909399; font-size: 16px; margin-left: 8px; cursor: help"
                />
              </el-tooltip>
            </div>
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
            <div style="display: flex; align-items: center">
              <el-input
                v-model="mitsubishiMc3eTcpForm.length"
                type="number"
                :disabled="hasBitIndex"
                placeholder="从起始地址连读几个字，如：1"
                style="flex: 1"
              />
              <el-tooltip placement="right-start" effect="dark" :enterable="true" popper-class="mc-hint-popper">
                <div slot="content" style="line-height: 20px">
                  <div>
                    从起始地址起<b>连续读几个字</b>，不是读几个点位。它决定这个采集值由几个字拼成，怎么拼取决于物模型里的数据类型：
                  </div>
                  <div style="margin-top: 6px">• <b>16 位整数、开关量（bool）：填 1</b></div>
                  <div>• <b>32 位整数 / 32 位浮点：填 2</b></div>
                  <div>• <b>64 位整数 / 双精度：填 4</b></div>
                  <div>• 字符串：每 1 个字装 2 个字符，按字符数 ÷ 2 向上取整填（如 10 个字符填 5）</div>
                  <div style="margin-top: 4px">
                    • 填了带位号的地址（D150.0）时锁定为 1；上限：字设备 ≤ 960，位设备 ≤ 2000（一帧报文能读的最大范围）
                  </div>
                </div>
                <i
                  class="el-icon-question"
                  style="color: #909399; font-size: 16px; margin-left: 8px; cursor: help"
                />
              </el-tooltip>
            </div>
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
      // 起始地址输入框内容（支持 150 / D150 / D150.0，提交时解析成 areaCode + startAddress + bitIndex）
      addressInput: "",
      // 软元件字母前缀 → 软元件代码（与后端 MitsubishiMc3eProtocol 的映射一致）
      areaCodeMap: {
        D: 0xa8,
        W: 0xb4,
        R: 0xaf,
        ZR: 0xb0,
        SD: 0xa9,
        M: 0x90,
        L: 0x92,
        B: 0xa0,
        X: 0x9c,
        Y: 0x9d,
        S: 0x98,
        SM: 0x91,
        F: 0x93,
      },
      // 字设备（只有字设备支持 D150.0 这种字内位）
      wordAreaCodes: [0xa8, 0xb4, 0xaf, 0xb0, 0xa9],
    };
  },
  computed: {
    // X/Y 软元件地址为八进制，提示用户
    isOctalArea() {
      return (
        this.mitsubishiMc3eTcpForm.areaCode == 0x9c || this.mitsubishiMc3eTcpForm.areaCode == 0x9d
      );
    },
    // 起始地址带 .位号（D150.0）时，读取数量只能是 1（只读这一个字再取位）
    hasBitIndex() {
      const parsed = this.parseAddressInput(this.addressInput);
      return parsed.ok && parsed.bitIndex != null;
    },
  },
  watch: {
    // 输入地址时就地同步软元件类型；带 .位号 的地址读取数量固定为 1
    addressInput(val) {
      const parsed = this.parseAddressInput(val);
      if (!parsed.ok) {
        return;
      }
      if (parsed.letter) {
        this.mitsubishiMc3eTcpForm.areaCode = parsed.areaCode;
      }
      if (parsed.bitIndex != null) {
        this.mitsubishiMc3eTcpForm.length = 1;
      }
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
      const msg = this.validateMitsubishiForm();
      if (msg) {
        this.$message.warning(msg);
        return;
      }
      this.saveMitsubishiMc3eTcpConfig();
    },
    /**
     * 解析起始地址：支持 150 / D150 / D150.0
     * 返回 { ok, msg, letter, address, bitIndex, areaCode }
     */
    parseAddressInput(raw) {
      const text = raw == null ? "" : String(raw).trim().toUpperCase().replace(/\s+/g, "");
      if (!text) {
        return { ok: false, msg: "请输入起始地址" };
      }
      const match = text.match(/^([A-Z]{1,2})?([0-9]+)(?:\.([0-9]+))?$/);
      if (!match) {
        return { ok: false, msg: "起始地址格式不对：支持 150、D150、D150.0" };
      }
      const letter = match[1] || "";
      const address = parseInt(match[2], 10);
      const bitIndex = match[3] == null ? null : parseInt(match[3], 10);
      let areaCode = this.mitsubishiMc3eTcpForm.areaCode;
      if (letter) {
        if (this.areaCodeMap[letter] == null) {
          return { ok: false, msg: "不支持的软元件前缀「" + letter + "」" };
        }
        areaCode = this.areaCodeMap[letter];
      }
      return { ok: true, letter, address, bitIndex, areaCode };
    },
    /** 软元件代码 → 字母前缀（未知返回空串） */
    areaLetter(code) {
      for (const letter in this.areaCodeMap) {
        if (this.areaCodeMap[letter] == code) {
          return letter;
        }
      }
      return "";
    },
    /** 列表回显：拼成 D150 / D150.0 这种形式 */
    formatAddress(row) {
      if (row == null || row.startAddress == null || row.startAddress === "") {
        return "";
      }
      const base = this.areaLetter(row.areaCode) + row.startAddress;
      return row.bitIndex != null && row.bitIndex !== "" ? base + "." + row.bitIndex : base;
    },
    /** 表单校验（返回空串表示通过） */
    validateMitsubishiForm() {
      const form = this.mitsubishiMc3eTcpForm;
      if (!form.code) {
        return "请输入标识";
      }
      const parsed = this.parseAddressInput(this.addressInput);
      if (!parsed.ok) {
        return parsed.msg;
      }
      if (parsed.areaCode == null) {
        return "请选择软元件类型，或输入带字母前缀的地址（如 D150）";
      }
      if (parsed.bitIndex != null) {
        if (this.wordAreaCodes.indexOf(parsed.areaCode) < 0) {
          return "字内位地址（如 D150.0）只能用于字设备（D/W/R/ZR/SD）";
        }
        if (parsed.bitIndex < 0 || parsed.bitIndex > 15) {
          return "字内位号只能是 0-15，当前为：" + parsed.bitIndex;
        }
        form.length = 1;
      }
      if (form.length == null || form.length === "" || Number(form.length) <= 0) {
        return "请输入读取数量";
      }
      if (form.intervalTime == null || form.intervalTime === "") {
        return "请输入读取间隔";
      }
      if (form.delayTime == null || form.delayTime === "") {
        return "请输入读取后延迟";
      }
      form.areaCode = parsed.areaCode;
      form.startAddress = parsed.address;
      form.bitIndex = parsed.bitIndex;
      form.length = Number(form.length);
      form.intervalTime = Number(form.intervalTime);
      form.delayTime = Number(form.delayTime);
      return "";
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
        bitIndex: null,
        length: null,
        intervalTime: null,
        delayTime: null,
      };
      this.addressInput = "";
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
          this.addressInput = this.formatAddress(res.data);
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

<style>
/* 地址 / 读取数量 的说明气泡：popper 挂在 body 上，scoped 样式管不到，单独定义 */
.mc-hint-popper {
  max-width: 420px;
  line-height: 20px;
}
</style>
