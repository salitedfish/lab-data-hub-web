<template>
  <div class="app-container">
    <el-divider></el-divider>
    <!-- 搜索区域保持不变 -->
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="配置名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入配置名称"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
          v-hasPermi="['business:component:add']"
        >新增
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <!-- 卡片展示区域保持不变 -->
    <div class="component-card-container">
      <!-- 使用CSS Grid替代Element UI栅格系统 -->
      <div class="card-grid">
        <el-card
          v-for="(item, index) in scheduledList"
          :key="index"
          class="component-card"
          shadow="hover"
          :class="item.isEnable == 1 ? 'active-status' : 'inactive-status'"
        >
          <!-- 梯形状态标识 -->
          <div class="status-trapezoid" :class="item.isEnable == 1 ? 'active' : 'inactive'">
            {{ item.isEnable == 1 ? '启用' : '停用' }}
          </div>
          <div slot="header" class="card-header">
            <h4 class="component-name">{{ item.name }}</h4>
          </div>
          <div class="card-content">
            <div class="card-item">
              <i>备注：</i>
              <span class="value">{{ item.remark}}</span>
            </div>
            <div class="card-item">
              <i>创建时间：</i>
              <span class="value">{{ item.createTime}}</span>
            </div>
          </div>
          <div class="card-actions">
            <!-- 状态切换按钮 -->
            <el-button
              size="mini"
              class="action-btn status-btn"
              :class="item.isEnable == 1 ? 'stop-btn' : 'start-btn'"
              :icon="item.isEnable == 1 ? 'el-icon-switch-button' : 'el-icon-open'"
              @click.stop="toggleStatus(item)"
            >
              {{ item.isEnable == 1 ? '停止' : '启动' }}
            </el-button>
            <el-button
              size="mini"
              class="action-btn edit-btn"
              icon="el-icon-edit"
              @click.stop="handleUpdate(item)"
            >编辑
            </el-button>
            <el-button
              size="mini"
              class="action-btn debug-btn"
              icon="el-icon-connection"
              @click.stop="showEngineDetail(item)"
            >配置
            </el-button>
            <el-button
              size="mini"
              class="action-btn delete-btn"
              icon="el-icon-delete"
              @click.stop="handleDelete(item)"
            >删除
            </el-button>
          </div>
        </el-card>
      </div>
    </div>

    <div class="pagination-wrapper">
      <pagination
        v-show="total>0"
        :total="total"
        :page-sizes="[12, 24, 48, 96]"
        :page.sync="queryParams.pageNum"
        :limit.sync="queryParams.pageSize"
        @pagination="getList"
      />
    </div>

    <!-- 抽屉组件 -->
    <el-drawer
      :title="title"
      :visible.sync="open"
      direction="rtl"
      size="40%"
      :before-close="cancel"
      class="component-drawer"
    >
      <div class="drawer-content">
        <el-form ref="form" :model="form" label-width="120px">
          <el-form-item label="配置名称" prop="name">
            <el-input v-model="form.name" placeholder="请输入配置名称" required/>
          </el-form-item>
          <el-form-item label="备注" prop="remark">
            <el-input v-model="form.remark" type="textarea" placeholder="请输入备注信息" required/>
          </el-form-item>
        </el-form>
        <div class="drawer-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import {addScheduledEngine,getScheduledEngine,delScheduledEngine,updateScheduledEngine,listScheduledEngine,control} from "@/api/business/scheduledEngine";

export default {
  name: "EngineView",
  data() {
    return {
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      // 选中的卡片
      selectedCards: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 规则配置表格数据
      scheduledList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 12,
        name: null,
        isEnable: null
      },
      // 表单参数
      form: {
      },
      config: {},
    }
  },
  created() {
    this.getList()
  },
  methods: {
    /** 查询规则配置列表 */
    getList() {
      this.loading = true
      listScheduledEngine(this.queryParams).then(response => {
        this.scheduledList = response.rows
        this.total = response.total
        this.loading = false
      })
    },
    // 取消按钮
    cancel() {
      this.open = false
      this.reset()
    },
    // 表单重置
    reset() {
      this.form = {
        id: null,
        name: null,
        isEnable: null,
        remark: null,
      }
      // 重置动态配置
      this.dynamicConfig = {}
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm")
      this.handleQuery()
    },
    // 卡片选择变化
    handleCardSelectionChange(selection) {
      this.ids = selection
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset()
      this.open = true
      this.form.status = '1'
      this.title = "添加规则配置"
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      const id = row.id || this.ids[0]
      getScheduledEngine(id).then(response => {
        this.form = response.data
        this.open = true
        this.title = "修改规则配置"
      })
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != null) {
            updateScheduledEngine(this.form).then(response => {
              this.$modal.msgSuccess("修改成功")
              this.open = false
              this.getList()
            })
          } else {
            addScheduledEngine(this.form).then(response => {
              this.$modal.msgSuccess("新增成功")
              this.open = false
              this.getList()
            })
          }
        }
      })
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids
      this.$modal.confirm('是否确认删除当前规则配置').then(function () {
        return delScheduledEngine(ids)
      }).then(() => {
        this.getList()
        this.selectedCards = []
        this.$modal.msgSuccess("删除成功")
      }).catch(() => {
      })
    },
    toggleStatus(item){
      control({id:item.id,isEnable:item.isEnable==1?0:1}).then(res=>{
        if(res?.code==200){
          this.$message.success("操作成功")
          this.getList()
        }
      })
    },
    showEngineDetail(engine) {
      this.$router.push({
        path: '/componentManage/scheduledEngine/detail/index',
        query: {
          id: engine.id
        }
      });
    },
  }
}
</script>

<style scoped>
.component-card-container {
  margin-bottom: 30px;
}

/* 使用 Grid 布局替代 Element UI 栅格 */
.card-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr); /* 每行4个卡片 */
  gap: 20px;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .card-grid {
    grid-template-columns: repeat(3, 1fr); /* 每行3个 */
  }
}

@media (max-width: 992px) {
  .card-grid {
    grid-template-columns: repeat(2, 1fr); /* 每行2个 */
  }
}

@media (max-width: 576px) {
  .card-grid {
    grid-template-columns: 1fr; /* 每行1个 */
  }
}

.card-col {
  margin-bottom: 0; /* Grid布局使用gap控制间距 */
  transition: transform 0.3s;
}

.card-col:hover {
  transform: translateY(-5px);
}

.card-checkbox {
  display: block;
  width: 100%;
  position: relative;
}

.card-checkbox ::v-deep .el-checkbox__label {
  width: 100%;
  padding: 0;
}

.component-card {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
  border: 1px solid #e6e8eb;
  background: #fff;
}

.component-card:hover {
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.1);
  border-color: #c0c4cc;
}

/* 启用状态渐变背景 */
.component-card.active-status {
  position: relative;
  overflow: hidden;
}

.component-card.active-status::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.15) 0%, rgba(64, 158, 255, 0.05) 20%, rgba(64, 158, 255, 0) 40%);
  pointer-events: none;
  z-index: 1;
}

/* 停用状态渐变背景 */
.component-card.inactive-status {
  position: relative;
  overflow: hidden;
}

.component-card.inactive-status::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(245, 108, 108, 0.1) 0%, rgba(245, 108, 108, 0.05) 15%, rgba(245, 108, 108, 0) 30%);
  pointer-events: none;
  z-index: 1;
}

/* 梯形状态标识 */
.status-trapezoid {
  position: absolute;
  top: 12px;
  right: -18px;
  width: 70px;
  padding: 4px 0;
  color: white;
  text-align: center;
  font-size: 12px;
  font-weight: bold;
  transform: rotate(45deg);
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.status-trapezoid.active {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
}

.status-trapezoid.inactive {
  background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
}

.card-header {
  padding: 15px;
  border-bottom: 1px solid #f0f2f5;
  position: relative;
  z-index: 2;
}

.component-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-content {
  padding: 15px;
  position: relative;
  z-index: 2;
}

.card-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  font-size: 13px;
}

.card-item i {
  margin-right: 8px;
  color: #909399;
  font-size: 14px;
}

.card-item .value {
  color: #606266;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-actions {
  padding: 12px 15px;
  border-top: 1px solid #f0f2f5;
  text-align: center;
  display: flex;
  justify-content: space-around;
  position: relative;
  z-index: 2;
}

.action-btn {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 6px 10px;
  transition: all 0.2s;
  font-size: 12px;
}

.edit-btn {
  background: linear-gradient(to bottom, #f0f9ff, #e6f7ff);
  border-color: #91d5ff;
  color: #1890ff;
}

.edit-btn:hover {
  background: linear-gradient(to bottom, #e6f7ff, #d3eefe);
  border-color: #69c0ff;
  color: #096dd9;
}

.delete-btn {
  background: linear-gradient(to bottom, #fff2f0, #fff0ed);
  border-color: #ffccc7;
  color: #ff4d4f;
}

.delete-btn:hover {
  background: linear-gradient(to bottom, #fff0ed, #ffeae8);
  border-color: #ffa39e;
  color: #f5222d;
}

/* 添加分页容器样式 */
.pagination-wrapper {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 10px 15px;
  z-index: 1000;
}

/* 调整卡片容器底部边距，避免内容被分页遮挡 */
.product-card-container {
  margin-bottom: 80px;
}

/* 可选：如果需要进一步美化分页组件本身 */
::v-deep .el-pagination {
  background: transparent;
}

::v-deep .el-pagination .btn-prev,
::v-deep .el-pagination .btn-next,
::v-deep .el-pagination .number {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
}

::v-deep .el-pagination .number.active {
  background: #409EFF;
  color: #fff;
  border-color: #409EFF;
}

/* 抽屉样式 */
.component-drawer ::v-deep .el-drawer {
  overflow-y: auto;
}

.drawer-content {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.drawer-footer {
  margin-top: auto;
  padding: 20px 0;
  text-align: right;
}
/* 动态配置区域样式 */
.dynamic-config-section {
  margin: 20px 0;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 15px;
  padding-bottom: 8px;
  border-bottom: 2px solid #409EFF;
}

.dynamic-config-fields {
  background: white;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #e6e8eb;
}

/* 响应式调整 */
@media screen and (max-width: 768px) {
  .component-drawer ::v-deep .el-drawer {
    width: 85% !important;
  }

  .dynamic-config-section {
    margin: 15px 0;
    padding: 10px;
  }

  .dynamic-config-fields {
    padding: 10px;
  }
}
</style>
