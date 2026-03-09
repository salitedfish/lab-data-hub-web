<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="130px">
      <el-form-item label="告警配置名称" prop="configName">
        <el-input
          v-model="queryParams.configName"
          placeholder="请输入告警配置名称"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="设备SN" prop="triggerSnList">
        <el-input
          v-model="queryParams.triggerSnList"
          placeholder="请输入设备SN"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="告警等级" prop="warnLevel">
        <el-select
          v-model="queryParams.warnLevel"
          placeholder="请选择告警等级"
          clearable
        >
          <el-option label="紧急" value="1"></el-option>
          <el-option label="严重" value="2"></el-option>
          <el-option label="一般" value="3"></el-option>
          <el-option label="警告" value="4"></el-option>
          <el-option label="正常" value="5"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>


    <el-table v-loading="loading" :data="linkageRecordList" @selection-change="handleSelectionChange">
      <el-table-column label="告警配置名称" align="center" prop="configName" />
      <el-table-column label="告警内容" align="center" prop="warnMessage" />
      <el-table-column label="告警设备SN列表" align="center" prop="triggerSnList" />
      <el-table-column label="告警设备名称列表" align="center" prop="triggerNameList" />
      <el-table-column label="告警等级" align="center" prop="warnLevel">
        <template slot-scope="scope">
          <el-tag :type="getLevelType(scope.row.warnLevel)" size="small">
            {{ getLevelText(scope.row.warnLevel) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status">
        <template slot-scope="scope">
          <el-tag :type="getStatusType(scope.row.status)" size="small">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="触发时间" align="center" prop="createTime" />
      <el-table-column label="操作" width="300" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleStatus(scope.row)"
          >标记处理</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-info"
            @click="viewDetail(scope.row)"
          >详细数据</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
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

    <!-- 上报消息弹窗 -->
    <el-dialog
      title="上报消息"
      :visible.sync="jsonViewerVisible"
      width="80%"
      top="5vh"
      class="json-viewer-dialog"
    >
      <json-viewer
        :value="JSON.parse(jsonStr)"
        :expand-depth="5"
        boxed
        sort
        :show-array-index="false"
        copyable
        class="custom-json-viewer"
      >
        <template slot="copy">
          <i class="el-icon-document-copy" title="复制"></i>
        </template>
      </json-viewer>

      <div slot="footer" class="dialog-footer">
        <el-button @click="jsonViewerVisible = false">关闭</el-button>
        <el-button type="primary" @click="jsonViewerVisible = false">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listLinkageRecord, getLinkageRecord, delLinkageRecord, addLinkageRecord, updateLinkageRecord, dealLinkageRecord } from "@/api/business/linkageRecord"

export default {
  name: "LinkageRecord",
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
      // 设备联动告警记录表格数据
      linkageRecordList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        configId: null,
        configName: null,
        warnMessage: null,
        warnData: null,
        triggerSnList: null,
        triggerNameList: null,
        warnLevel: null,
        status: null
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
      },
      jsonViewerVisible:false,
      jsonStr:null
    }
  },
  created() {
    this.getList()
  },
  methods: {
    /** 查询设备联动告警记录列表 */
    getList() {
      this.loading = true
      listLinkageRecord(this.queryParams).then(response => {
        this.linkageRecordList = response.rows
        this.total = response.total
        this.loading = false
      })
    },
    // 取消按钮
    cancel() {
      this.open = false
      this.reset()
    },
    viewDetail(row) {
      console.log(row)
      this.jsonStr = row?.warnData
      this.jsonViewerVisible = true;
    },
    getLevelType(level) {
      const typeMap = {
        '1': 'danger',     // 紧急 - 红色
        '2': 'warning',    // 严重 - 橙色
        '3': 'warning',    // 一般 - 橙色
        '4': 'normal',       // 警告 - 蓝色
        '5': 'success'     // 正常 - 绿色
      };
      return typeMap[level] || 'info';
    },
    getLevelText(level) {
      const textMap = {
        '1': '紧急',
        '2': '严重',
        '3': '一般',
        '4': '警告',
        '5': '正常'
      };
      return textMap[level] || '未知';
    },
    getStatusText(status) {
      const textMap = {
        '0': '未处理',
        '1': '已处理'
      };
      return textMap[status] || '未知';
    },
    getStatusType(status) {
      const typeMap = {
        '0': 'danger',     //红色
        '1': 'success'     // 绿色
      };
      return typeMap[status] || 'info';
    },
    // 表单重置
    reset() {
      this.form = {
        id: null,
        configId: null,
        configName: null,
        warnMessage: null,
        warnData: null,
        triggerSnList: null,
        triggerNameList: null,
        createTime: null,
        warnLevel: null,
        status: null
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
      this.title = "添加设备联动告警记录"
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      const id = row.id || this.ids
      getLinkageRecord(id).then(response => {
        this.form = response.data
        this.open = true
        this.title = "修改设备联动告警记录"
      })
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != null) {
            updateLinkageRecord(this.form).then(response => {
              this.$modal.msgSuccess("修改成功")
              this.open = false
              this.getList()
            })
          } else {
            addLinkageRecord(this.form).then(response => {
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
      this.$modal.confirm('是否确认删除设备联动告警记录编号为"' + ids + '"的数据项？').then(function() {
        return delLinkageRecord(ids)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess("删除成功")
      }).catch(() => {})
    },
    /** 处理按钮操作 */
    handleStatus(row) {
      dealLinkageRecord(row?.id).then(() => {
        this.getList()
        this.$modal.msgSuccess("操作成功")
      }).catch(() => {})
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('business/linkageRecord/export', {
        ...this.queryParams
      }, `linkageRecord_${new Date().getTime()}.xlsx`)
    }
  }
}
</script>
