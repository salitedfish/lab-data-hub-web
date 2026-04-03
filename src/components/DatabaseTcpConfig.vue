<template>
  <div class="database-config">
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
            @change="handleDatabaseStatusChange"
            class="status-switch"
          />
        </div>
        <div class="tab-actions">
          <el-button
            type="primary"
            icon="el-icon-plus"
            class="action-btn"
            @click="addDatabaseConfig"
            >添加配置</el-button
          >
        </div>
      </div>
      <div class="filter-bar">
        <el-form :inline="true" class="filter-form">
          <el-form-item label="标识">
            <el-input v-model="databaseParams.code"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              icon="el-icon-search"
              @click="getDatabaseConfigByDeviceSn()"
              class="search-btn"
              >查询
            </el-button>
          </el-form-item>
        </el-form>
      </div>
      <el-table
        :data="databaseList"
        style="width: 100%"
        class="data-table"
        stripe
      >
        <el-table-column prop="code" label="标识" width="150" />
        <el-table-column prop="code" label="字段编码" width="180" />
        <el-table-column prop="fieldType" label="字段类型" width="180" />
        <el-table-column prop="fieldLength" label="字段长度" width="180" />
        <el-table-column prop="fieldComment" label="字段备注" width="200" />
        <el-table-column prop="intervalTime" label="读取间隔(s)" width="180" />
        <el-table-column prop="delayTime" label="读取后延迟(ms)" width="180" />
        <el-table-column label="操作" width="250" fixed="right">
          <template slot-scope="scope">
            <el-button
              size="mini"
              icon="el-icon-edit"
              type="primary"
              @click="editDatabaseConfig(scope.row)"
              class="table-action"
              >编辑
            </el-button>
            <el-button
              size="mini"
              icon="el-icon-delete"
              type="danger"
              @click="deleteDatabase(scope.row.id)"
              class="table-action"
              >删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        class="pagination"
        :current-page="databaseParams.pageNum"
        :page-size="databaseParams.pageSize"
        :total="databaseParams.total"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="getDatabaseConfigByDeviceSn"
      />
    </div>
    <el-drawer
      :title="'新增配置'"
      :visible.sync="openAddDatabase"
      direction="rtl"
      size="40%"
      :before-close="closeDatabase"
      class="component-drawer"
    >
      <div class="drawer-content">
        <!-- 添加或修改设备对话框 -->
        <el-form ref="databaseForm" :model="databaseForm" label-width="140px">
          <el-form-item label="数据库字段" prop="code" required>
            <el-select
              v-model="databaseForm.code"
              @change="handleRegisterRangeChange"
              placeholder="请选择数据库字段"
            >
              <el-option
                v-for="item in databaseTableColumns"
                :key="item.code"
                :label="item.code + ' ( ' + item.fieldComment + ' ) '"
                :value="item.code"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="字段编码" prop="code">
            <el-input
              v-model="databaseForm.code"
              readonly
              placeholder="请选择数据类型"
            />
          </el-form-item>
          <el-form-item label="字段类型" prop="fieldType">
            <el-input
              v-model="databaseForm.fieldType"
              readonly
              placeholder="请选择数据类型"
            />
          </el-form-item>
          <el-form-item label="字段备注" prop="fieldComment">
            <el-input
              v-model="databaseForm.fieldComment"
              readonly
              placeholder="请选择数据类型"
            />
          </el-form-item>
          <el-form-item label="字段长度" prop="fieldLength">
            <el-input
              v-model="databaseForm.fieldLength"
              readonly
              placeholder="请选择数据类型"
            />
          </el-form-item>
          <el-form-item label="读取间隔(s)" prop="intervalTime" required>
            <el-input
              type="number"
              v-model="databaseForm.intervalTime"
              placeholder="同一个串口服务器每次读取间隔，如：1000"
            />
          </el-form-item>
          <el-form-item label="读取后延迟(毫秒)" prop="delayTime" required>
            <el-input
              type="number"
              v-model="databaseForm.delayTime"
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
          <el-button type="primary" @click="submitDatabaseForm"
            >确 定</el-button
          >
          <!-- 可选：加间距，按钮更美观 -->
          <el-button @click="closeDatabase" style="margin-left: 12px"
            >取 消</el-button
          >
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import {
  listDatabase,
  delDatabase,
  updateDatabase,
  addDatabase,
  getDatabase,
  listDatabaseTableColumns,
} from "@/api/business/database";
import { readDatabaseSwitchByDevice } from "@/api/business/database";

export default {
  name: "DatabaseConfig",
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
    componentId: {
      type: String,
      default: null,
    },
  },
  data() {
    return {
      timeEnabled: this.enabled,
      openAddDatabase: false,
      databaseParams: {
        pageNum: 1,
        pageSize: 10,
        total: 0,
        belongSn: null,
        belongType: null,
      },
      databaseIsEdit: false,
      databaseForm: {},
      databaseList: [],
      databaseTableColumns: [],
    };
  },
  created() {
    this.databaseParams.belongSn = this.deviceSn;
    this.getDatabaseConfigByDeviceSn();
  },
  methods: {
    getDatabaseConfigByDeviceSn() {
      this.databaseParams.belongSn = this.deviceSn;
      listDatabase(this.databaseParams).then((res) => {
        if (res?.code == 200) {
          this.databaseList = res?.rows;
          this.databaseParams.total = res?.total;
        }
      });
    },
    // Database功能开关切换事件
    handleDatabaseStatusChange(enabled) {
      readDatabaseSwitchByDevice({
        deviceSn: this.deviceSn,
        isOpen: enabled == true ? "1" : "0",
      }).then((res) => {
        if (res?.code == 200) {
          this.$message.success("操作成功");
        }
      });
    },
    /** 提交按钮 */
    submitDatabaseForm() {
      this.$refs["databaseForm"].validate((valid) => {
        if (valid) {
          if (this.databaseForm.id != null) {
            updateDatabase(this.databaseForm).then((response) => {
              this.$modal.msgSuccess("修改成功");
              this.openAddDatabase = false;
              this.getDatabaseConfigByDeviceSn();
            });
          } else {
            addDatabase(this.databaseForm).then((response) => {
              this.$modal.msgSuccess("新增成功");
              this.openAddDatabase = false;
              this.getDatabaseConfigByDeviceSn();
            });
          }
        }
      });
    },
    // 取消按钮
    closeDatabase() {
      this.openAddDatabase = false;
      this.resetAddDatabaseConfig();
    },
    resetAddDatabaseConfig() {
      this.databaseForm = {
        id: null,
        belongSn: null,
        belongType: null,
        code: null,
        createTime: null,
        fieldType: null,
        fieldComment: null,
        fieldLength: null,
        intervalTime: null,
        delayTime: null,
      };
      this.resetForm("databaseForm");
    },
    resetForm(formName) {
      if (this.$refs[formName]) {
        this.$refs[formName].resetFields();
      }
    },
    addDatabaseConfig() {
      this.databaseIsEdit = false;
      this.openAddDatabase = true;
      this.resetAddDatabaseConfig();
      this.getDatabaseTableColumns();
      this.databaseForm.belongSn = this.deviceSn;
      this.databaseForm.belongType = "0";
      this.databaseForm.intervalTime = 10;
      this.databaseForm.delayTime = 100;
    },
    // 查询db协议读取配置表字段
    getDatabaseTableColumns() {
      listDatabaseTableColumns({
        componentId: this.componentId,
      }).then((response) => {
        if (response?.code === 200) {
          this.databaseTableColumns = response.data;
        }
      });
    },
    handleRegisterRangeChange(val) {
      const column = this.databaseTableColumns.find(
        (item) => item.code === val
      );
      if (column) {
        this.databaseForm.code = column.code;
        this.databaseForm.fieldType = column.fieldType;
        this.databaseForm.fieldComment = column.fieldComment;
        this.databaseForm.fieldLength = column.fieldLength;
      }
    },
    editDatabaseConfig(item) {
      this.getDatabaseTableColumns();
      this.databaseIsEdit = true;
      this.openAddDatabase = true;
      getDatabase(item.id).then((response) => {
        this.databaseForm = response.data;
      });
    },
    deleteDatabase(id) {
      this.$confirm("确定要删除此配置吗?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }).then(() => {
        delDatabase(id).then((res) => {
          if (res?.code === 200) {
            this.getDatabaseConfigByDeviceSn();
            this.$message.success("删除成功");
          }
        });
      });
    },
  },
};
</script>

<style scoped>
.database-config {
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
