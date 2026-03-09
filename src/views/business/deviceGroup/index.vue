<template>
  <div class="app-container">
    <!-- 新增 Tab 切换组件 -->
    <el-tabs v-model="activeTab" @tab-click="handleTabChange" type="card" class="mb8">
      <el-tab-pane label="产品分组" name="product">
        <div class="tab-content">
          <!-- 原有搜索表单 -->
          <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
            <el-form-item label="分组名称" prop="groupName">
              <el-input
                v-model="queryParams.groupName"
                placeholder="请输入分组名称"
                clearable
                @keyup.enter.native="handleQuery"
              />
            </el-form-item>
            <el-form-item label="唯一标识" prop="groupCode">
              <el-input
                v-model="queryParams.groupCode"
                placeholder="请输入唯一标识"
                clearable
                @keyup.enter.native="handleQuery"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
              <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>

          <!-- 原有操作按钮 -->
          <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
              <el-button
                type="primary"
                plain
                icon="el-icon-plus"
                size="mini"
                @click="handleAdd"
                v-hasPermi="['business:deviceGroup:add']"
              >新增</el-button>
            </el-col>
            <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
          </el-row>

          <!-- 原有表格 -->
          <el-table v-loading="loading" :data="deviceGroupList" @selection-change="handleSelectionChange">
<!--            <el-table-column type="selection" width="55" align="center" />-->
            <el-table-column label="分组名称" align="center" prop="groupName" />
            <el-table-column label="唯一标识" align="center" prop="groupCode" />
            <el-table-column label="类型" align="center" prop="type">
              <!-- 优化类型显示，不再显示数字 -->
              <template slot-scope="scope">
                {{ scope.row.type == 0 ? '产品' : '设备' }}
              </template>
            </el-table-column>
            <el-table-column label="排序" align="center" prop="sortNum" />
            <el-table-column label="备注" align="center" prop="remark" />
            <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
              <template slot-scope="scope">
                <el-button
                  size="mini"
                  type="text"
                  icon="el-icon-edit"
                  @click="handleUpdate(scope.row)"
                  v-hasPermi="['business:deviceGroup:edit']"
                >修改</el-button>
                <el-button
                  size="mini"
                  type="text"
                  icon="el-icon-delete"
                  @click="handleDelete(scope.row)"
                  v-hasPermi="['business:deviceGroup:remove']"
                >删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 原有分页 -->
          <pagination
            v-show="total>0"
            :total="total"
            :page.sync="queryParams.pageNum"
            :limit.sync="queryParams.pageSize"
            @pagination="getList"
          />
        </div>
      </el-tab-pane>
      <el-tab-pane label="设备分组" name="device">
        <!-- 设备分组内容和产品分组完全一致，复用相同的结构 -->
        <div class="tab-content">
          <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
            <el-form-item label="分组名称" prop="groupName">
              <el-input
                v-model="queryParams.groupName"
                placeholder="请输入分组名称"
                clearable
                @keyup.enter.native="handleQuery"
              />
            </el-form-item>
            <el-form-item label="唯一标识" prop="groupCode">
              <el-input
                v-model="queryParams.groupCode"
                placeholder="请输入唯一标识"
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
                v-hasPermi="['business:deviceGroup:add']"
              >新增</el-button>
            </el-col>
            <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
          </el-row>

          <el-table v-loading="loading" :data="deviceGroupList" @selection-change="handleSelectionChange">
            <el-table-column label="分组名称" align="center" prop="groupName" />
            <el-table-column label="唯一标识" align="center" prop="groupCode" />
            <el-table-column label="类型" align="center" prop="type">
              <template slot-scope="scope">
                {{ scope.row.type === 0 ? '产品' : '设备' }}
              </template>
            </el-table-column>
            <el-table-column label="排序" align="center" prop="sortNum" />
            <el-table-column label="备注" align="center" prop="remark" />
            <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
              <template slot-scope="scope">
                <el-button
                  size="mini"
                  type="text"
                  icon="el-icon-edit"
                  @click="handleUpdate(scope.row)"
                  v-hasPermi="['business:deviceGroup:edit']"
                >修改</el-button>
                <el-button
                  size="mini"
                  type="text"
                  icon="el-icon-delete"
                  @click="handleDelete(scope.row)"
                  v-hasPermi="['business:deviceGroup:remove']"
                >删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <pagination
            v-show="total>0"
            :total="total"
            :page.sync="queryParams.pageNum"
            :limit.sync="queryParams.pageSize"
            @pagination="getList"
          />
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 添加或修改设备分组对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="分组名称" prop="groupName">
          <el-input v-model="form.groupName" placeholder="请输入分组名称" />
        </el-form-item>
        <el-form-item label="唯一标识" prop="groupCode">
          <el-input v-model="form.groupCode" placeholder="请输入唯一标识" />
        </el-form-item>
        <el-form-item label="排序" prop="sortNum">
          <el-input v-model="form.sortNum" placeholder="请输入排序" />
        </el-form-item>
        <!-- 隐藏type字段，自动赋值 -->
        <el-form-item label="类型" prop="type" v-show="false">
          <el-input v-model="form.type" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listDeviceGroup, getDeviceGroup, delDeviceGroup, addDeviceGroup, updateDeviceGroup } from "@/api/business/deviceGroup"

export default {
  name: "DeviceGroup",
  data() {
    return {
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 设备分组表格数据
      deviceGroupList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 新增：当前激活的Tab（product=产品分组，device=设备分组）
      activeTab: "product",
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        groupName: null,
        groupCode: null,
        type: 0, // 默认产品分组
        sortNum: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        groupName: [
          { required: true, message: "分组名称不能为空", trigger: "blur" }
        ],
        groupCode: [
          { required: true, message: "唯一标识不能为空", trigger: "blur" }
        ]
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    /** 新增：Tab切换事件处理 */
    handleTabChange(tab) {
      // 根据Tab名称设置type值
      this.queryParams.type = tab.name === "product" ? 0 : 1
      // 切换Tab后重置页码为1，重新查询
      this.queryParams.pageNum = 1
      this.getList()
    },
    /** 查询设备分组列表 */
    getList() {
      this.loading = true
      listDeviceGroup(this.queryParams).then(response => {
        this.deviceGroupList = response.rows
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
        groupName: null,
        groupCode: null,
        type: this.queryParams.type, // 新增：自动赋值当前Tab对应的type
        sortNum: null,
        remark: null,
        createTime: null
      }
      this.resetForm("form")
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm")
      // 重置后保留当前Tab的type值
      const currentType = this.queryParams.type
      this.queryParams = {
        pageNum: 1,
        pageSize: 10,
        groupName: null,
        groupCode: null,
        type: currentType,
        sortNum: null,
      }
      this.handleQuery()
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset()
      this.open = true
      // 新增：根据当前Tab设置标题和type
      this.title = this.activeTab === "product" ? "添加产品分组" : "添加设备分组"
      this.form.type = this.queryParams.type
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      const id = row.id || this.ids
      getDeviceGroup(id).then(response => {
        this.form = response.data
        this.open = true
        // 新增：根据数据的type设置修改标题
        this.title = this.form.type === 0 ? "修改产品分组" : "修改设备分组"
      })
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != null) {
            updateDeviceGroup(this.form).then(response => {
              this.$modal.msgSuccess("修改成功")
              this.open = false
              this.getList()
            })
          } else {
            addDeviceGroup(this.form).then(response => {
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
      this.$modal.confirm('是否确认删除分组编号为"' + ids + '"的数据项？').then(function() {
        return delDeviceGroup(ids)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess("删除成功")
      }).catch(() => {})
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('business/deviceGroup/export', {
        ...this.queryParams
      }, `deviceGroup_${this.activeTab}_${new Date().getTime()}.xlsx`)
    }
  }
}
</script>

<style scoped>
/* 新增：Tab内容间距优化 */
.tab-content {
  padding: 10px 0;
}
.el-tabs {
  margin-bottom: 10px;
}
</style>
