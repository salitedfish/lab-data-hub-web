<template>
  <div>
    <div class="ef-node-form">
      <div class="ef-node-form-header">
        编辑
      </div>
      <div class="ef-node-form-body">
        <el-form :model="node" ref="dataForm" label-width="80px" v-show="type === 'node'">
          <el-form :model="configData" ref="configForm" label-width="80px" v-show="componentType === 'deviceLog' || componentType === 'deviceWarn' ">
            <el-form-item label="产品范围" required>
              <!-- 产品量可能很大：不在下拉里一次灌全量，走「弹窗搜索 + 分页勾选」；
                   增删统一在弹窗里勾选/取消勾选，表单上只显示已选数量 -->
              <div class="scope-picker">
                <el-button size="mini" type="primary" plain icon="el-icon-plus" @click="openProductDialog">选择产品</el-button>
                <span class="scope-count">已选 {{ productScopeList.length }} 个</span>
                <el-button v-if="productScopeList.length" type="text" size="mini" @click="clearProductScope">清空</el-button>
              </div>
            </el-form-item>
            <el-form-item label="设备范围" required>
              <el-radio-group v-model="configData.deviceScope" @change="getDeviceByProductSnList">
                <el-radio label="all" >所有设备</el-radio>
                <el-radio label="part" >部分设备</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="设备筛选" required v-if="configData.deviceScope==='part'">
              <el-select v-model="configData.deviceSnList" multiple filterable collapse-tags
                         placeholder="输入设备名称搜索">
                <el-option v-for="item in configData.deviceList"
                           :label="item.deviceName"
                           :value="item.deviceSn"
                           :key="item.deviceSn"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-form>
          <el-form :model="configData" ref="dataForm" label-width="80px" v-show="componentType === 'HTTP'">
            <el-form-item label="接口地址">
              <el-input v-model="configData.url"></el-input>
            </el-form-item>
            <el-form-item label="请求方式">
              <el-select v-model="configData.method">
                <el-option label="POST" value="POST"></el-option>
                <el-option label="PUT" value="PUT"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="请求头KEY">
              <el-input v-model="configData.authHeaderSign" placeholder="可用于权限认证"></el-input>
            </el-form-item>
            <el-form-item label="请求头VALUE">
              <el-input v-model="configData.authToken"></el-input>
            </el-form-item>
          </el-form>
          <el-form :model="configData" ref="dataForm" label-width="80px" v-show="componentType === 'RabbitMQ'">
            <el-form-item label="IP地址" required>
              <el-input v-model="configData.host"></el-input>
            </el-form-item>
            <el-form-item label="端口" required>
              <el-input type="number" v-model="configData.port"></el-input>
            </el-form-item>
            <el-form-item label="用户名" required>
              <el-input v-model="configData.username"></el-input>
            </el-form-item>
            <el-form-item label="密码" required>
              <el-input v-model="configData.password"></el-input>
            </el-form-item>
            <el-form-item label="Exchange">
              <el-input v-model="configData.exchange" placeholder="选填，默认使用空字符串（直接发送到队列）"></el-input>
            </el-form-item>
            <el-form-item label="路由键" required>
              <el-input v-model="configData.routingKey" placeholder="必填，默认空"></el-input>
            </el-form-item>
            <el-form-item label="队列">
              <el-input v-model="configData.queue" placeholder="选填"></el-input>
            </el-form-item>
          </el-form>

          <el-form :model="configData" ref="dataForm" label-width="80px" v-show="componentType === 'Kafka'">
            <el-form-item label="IP地址" required>
              <el-input v-model="configData.host" placeholder="必填"></el-input>
            </el-form-item>
            <el-form-item label="端口" required>
              <el-input type="number" v-model="configData.port" placeholder="必填"></el-input>
            </el-form-item>
            <el-form-item label="用户名">
              <el-input v-model="configData.username" placeholder="非必填，根据kafka配置而定"></el-input>
            </el-form-item>
            <el-form-item label="密码">
              <el-input v-model="configData.password" placeholder="非必填，根据kafka配置而定"></el-input>
            </el-form-item>
            <el-form-item label="主题" required>
              <el-input v-model="configData.topic"></el-input>
            </el-form-item>
            <el-form-item label="KEY">
              <el-input v-model="configData.key" placeholder="非必填"></el-input>
            </el-form-item>
          </el-form>

          <el-form :model="configData" ref="dataForm" label-width="80px" v-show="componentType === 'RocketMQ'">
            <el-form-item label="IP地址" required>
              <el-input v-model="configData.host"></el-input>
            </el-form-item>
            <el-form-item label="端口" required>
              <el-input type="number" v-model="configData.port"></el-input>
            </el-form-item>
            <el-form-item label="用户名" required>
              <el-input v-model="configData.username"></el-input>
            </el-form-item>
            <el-form-item label="密码" required>
              <el-input v-model="configData.password"></el-input>
            </el-form-item>
            <el-form-item label="主题" required>
              <el-input v-model="configData.topic"></el-input>
            </el-form-item>
            <el-form-item label="group" required>
              <el-input v-model="configData.group"></el-input>
            </el-form-item>
            <el-form-item label="Tags" required>
              <el-input v-model="configData.tags"></el-input>
            </el-form-item>
          </el-form>

          <el-form :model="configData" ref="dataForm" label-width="80px" v-show="componentType === 'MQTT'">
            <el-form-item label="端口" required>
              <el-input type="number" v-model="configData.port"></el-input>
            </el-form-item>
            <el-form-item label="认证方式">
              <el-select v-model="configData.allowAnonymous">
                <el-option label="允许匿名" value="true"></el-option>
                <el-option label="需要认证" value="false"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="用户名" v-if="configData.allowAnonymous=='false'">
              <el-input v-model="configData.username"></el-input>
            </el-form-item>
            <el-form-item label="密码" v-if="configData.allowAnonymous=='false'">
              <el-input v-model="configData.password"></el-input>
            </el-form-item>
            <el-form-item label="topic" required>
              <el-input v-model="configData.topic"></el-input>
            </el-form-item>
          </el-form>

          <el-form-item>
            <!-- 没有「保存」：字段绑的就是 node.configData（同一个对象），改了即时进流程数据，落库统一走右上角的「保存」 -->
            <el-button icon="el-icon-close" @click="reset">重置</el-button>
          </el-form-item>
        </el-form>

        <el-form :model="line" ref="dataForm" label-width="80px" v-show="type === 'line'">
          <el-form-item label="条件">
            <el-input v-model="line.label"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button icon="el-icon-close">重置</el-button>
            <el-button type="primary" icon="el-icon-check" @click="saveLine">保存</el-button>
          </el-form-item>
        </el-form>
      </div>
      <!--            <div class="el-node-form-tag"></div>-->
    </div>

    <!-- 选择产品范围：搜索 + 分页勾选，避免把全量产品塞进下拉（产品多时页面会卡死） -->
    <el-dialog title="选择产品范围" :visible.sync="productDialogVisible" width="720px" append-to-body
               :close-on-click-modal="false">
      <div class="product-dialog-toolbar">
        <el-input v-model="productQuery.productName" size="small" clearable placeholder="输入产品名称搜索"
                  prefix-icon="el-icon-search" style="width: 260px"
                  @keyup.enter.native="queryProductPage(1)" @clear="queryProductPage(1)"></el-input>
        <el-button size="small" type="primary" icon="el-icon-search" @click="queryProductPage(1)">搜索</el-button>
        <span class="product-dialog-selected">已选 {{ productDraftCount }} 个</span>
      </div>
      <el-table :data="productTable.rows" v-loading="productTable.loading" height="360" size="small" border>
        <el-table-column label="选择" width="55" align="center">
          <!-- ⚠️ 必须用 v-slot:header（作用域插槽）：普通 slot="header" 的表头节点由父组件渲染，
               表头看不到 productDraft 的依赖，勾选变化后不会重绘，全选框会一直停在初始状态 -->
          <template v-slot:header>
            <!-- 表头全选：只作用于当前页，跨页/跨搜索的勾选互不影响 -->
            <el-tooltip content="全选本页" placement="top">
              <el-checkbox :value="pageAllChecked" :indeterminate="pageIndeterminate"
                           @change="togglePageAll"></el-checkbox>
            </el-tooltip>
          </template>
          <template slot-scope="{ row }">
            <el-checkbox :value="!!productDraft[row.productSn]"
                         @change="toggleProductDraft(row, $event)"></el-checkbox>
          </template>
        </el-table-column>
        <el-table-column prop="productName" label="产品名称" min-width="180" show-overflow-tooltip></el-table-column>
        <el-table-column prop="productSn" label="产品编号" width="220" show-overflow-tooltip></el-table-column>
      </el-table>
      <el-pagination class="product-dialog-pagination" background layout="total, prev, pager, next"
                     :total="productTable.total" :page-size="productQuery.pageSize"
                     :current-page.sync="productQuery.pageNum"
                     @current-change="queryProductPage"></el-pagination>
      <div slot="footer">
        <el-button size="small" @click="productDialogVisible = false">取消</el-button>
        <el-button size="small" type="primary" @click="confirmProductDialog">确定</el-button>
      </div>
    </el-dialog>
  </div>

</template>

<script>
import {cloneDeep} from 'lodash'
import {listProduct} from "@/api/business/product"
import {getDeviceByProductSn} from "@/api/business/device"

export default {
  data() {
    return {
      visible: true,
      // node 或 line
      type: 'node',
      componentType: 'HTTP',
      node: {},
      line: {},
      configData: {},
      data: {},
      // 产品选择弹窗
      productDialogVisible: false,
      // 弹窗内的草稿选择：productSn → productName（点「确定」才写回节点）
      productDraft: {},
      // 弹窗内的搜索条件与分页
      productQuery: {productName: '', pageNum: 1, pageSize: 10},
      // 弹窗内的产品表格数据
      productTable: {rows: [], total: 0, loading: false},
      stateList: [{
        state: 'success',
        label: '成功'
      }, {
        state: 'warning',
        label: '警告'
      }, {
        state: 'error',
        label: '错误'
      }, {
        state: 'running',
        label: '运行中'
      }],
    }
  },
  computed: {
    /** 已选产品（SN + 名称），名称来自保存时记录的名称映射，没有映射时先显示 SN */
    productScopeList() {
      const nameMap = this.configData.productNameMap || {}
      return (this.configData.productScope || []).map(sn => ({
        productSn: sn,
        productName: nameMap[sn] || sn
      }))
    },
    /** 弹窗内草稿已选数量 */
    productDraftCount() {
      return Object.keys(this.productDraft).length
    },
    /** 当前页是否已全部勾选 */
    pageAllChecked() {
      const rows = this.productTable.rows
      return rows.length > 0 && rows.every(row => !!this.productDraft[row.productSn])
    },
    /** 当前页部分勾选（表头复选框的半选态） */
    pageIndeterminate() {
      const rows = this.productTable.rows
      const checked = rows.filter(row => !!this.productDraft[row.productSn]).length
      return checked > 0 && checked < rows.length
    }
  },
  methods: {
    /**
     * 表单修改，这里可以根据传入的ID进行业务信息获取
     * @param data
     * @param id
     */
    nodeInit(data, id) {
      this.type = 'node'
      this.data = data
      data.nodeList.filter((node) => {
        if (node.id === id) {
          this.node = cloneDeep(node)
          this.componentType = node.type
          // 处理 configData，确保不为空
          if (this.componentType !== 'realTimePush' && this.componentType !== 'scheduledPush') {
            this.configData = node.configData ? node.configData : this.getDefaultConfigData()
          }
          if (this.componentType === 'deviceLog' || this.componentType === 'deviceWarn' || this.componentType === 'deviceInfo') {
            // 老节点没有名称映射：补一个响应式属性，否则已选产品只能显示 SN
            if (!this.configData.productNameMap) {
              this.$set(this.configData, 'productNameMap', {})
            }
            this.syncSelectedProducts()
          }
        }
      })
    },
    /**
     * 打开节点时同步一次已选产品：按 SN 集合查出仍存在的产品，拿回名称；
     * 产品管理里已删除的产品从这里自动剔除（连同不再属于所选产品的设备）
     */
    async syncSelectedProducts() {
      // 去掉重复 SN（历史配置可能重复写入），否则「已选 N 个」会把重复项也算进去
      const scope = (this.configData.productScope || []).filter((sn, index, arr) => arr.indexOf(sn) == index)
      if (!scope.length) {
        this.getDeviceByProductSnList()
        return
      }
      try {
        const res = await listProduct({productSnList: scope.join(','), pageNum: 1, pageSize: scope.length})
        const rows = res?.rows || []
        // 后端未按 SN 集合过滤（旧版本会忽略该参数、或参数绑定失败）时不在这里剔除，退回逐个精确查，避免误删配置。
        // 返回空结果同样不敢直接当成「全部已删除」，交给逐个查确认。
        const filtered = rows.length > 0
            && rows.every(row => scope.indexOf(row.productSn) > -1)
            && Number(res?.total || 0) <= scope.length
        if (!filtered) {
          await this.resolveProductsOneByOne(scope)
          return
        }
        // 只有接口真返回的产品才算存在：范围里查不到的 SN 就是产品管理里已删除的，自动剔除
        const nameMap = {}
        for (const row of rows) {
          nameMap[row.productSn] = row.productName
        }
        this.applySyncedProducts(Object.keys(nameMap), nameMap)
      } catch (e) {
        console.error('同步已选产品失败', e)
      }
    },
    /**
     * 逐个按 SN 精确查（兼容未支持 productSnList 的旧后端）：
     * 查得到 → 取名称；查不到 → 视为产品已删除、剔除；请求失败 → 保留，避免网络抖动误删配置
     */
    async resolveProductsOneByOne(scope) {
      const oldMap = this.configData.productNameMap || {}
      const nameMap = {}
      const missing = []
      for (const sn of scope) {
        try {
          const res = await listProduct({pageNum: 1, pageSize: 50, productSn: sn})
          const row = (res?.rows || []).find(item => item.productSn == sn)
          if (row) {
            nameMap[sn] = row.productName
          } else {
            missing.push(sn)
          }
        } catch (e) {
          console.error('查询产品失败：' + sn, e)
          nameMap[sn] = oldMap[sn] || sn
        }
      }
      this.applySyncedProducts(scope.filter(sn => missing.indexOf(sn) == -1), nameMap)
    },
    /** 把同步结果写回节点配置 */
    applySyncedProducts(existingScope, nameMap) {
      const removed = (this.configData.productScope || []).filter(sn => existingScope.indexOf(sn) == -1)
      this.configData.productScope = existingScope
      this.$set(this.configData, 'productNameMap', nameMap)
      if (removed.length) {
        console.warn('产品范围中已删除的产品已自动移除：' + removed.join(','))
      }
      this.getDeviceByProductSnList()
    },
    /** 打开产品选择弹窗：用当前已选产品初始化草稿 */
    openProductDialog() {
      const draft = {}
      for (const item of this.productScopeList) {
        draft[item.productSn] = item.productName
      }
      this.productDraft = draft
      this.productQuery = {productName: '', pageNum: 1, pageSize: 10}
      this.productTable = {rows: [], total: 0, loading: false}
      this.productDialogVisible = true
      this.queryProductPage(1)
    },
    /** 弹窗内按名称搜索/翻页 */
    async queryProductPage(pageNum) {
      this.productQuery.pageNum = pageNum || this.productQuery.pageNum
      this.productTable.loading = true
      try {
        const res = await listProduct({
          pageNum: this.productQuery.pageNum,
          pageSize: this.productQuery.pageSize,
          productName: this.productQuery.productName
        })
        this.productTable.rows = res?.rows || []
        this.productTable.total = res?.total || 0
      } catch (e) {
        console.error('查询产品列表失败', e)
      } finally {
        this.productTable.loading = false
      }
    },
    /** 勾选/取消勾选（草稿） */
    toggleProductDraft(row, checked) {
      if (checked) {
        this.$set(this.productDraft, row.productSn, row.productName)
      } else {
        this.$delete(this.productDraft, row.productSn)
      }
    },
    /** 表头全选/取消全选：作用于当前页 */
    togglePageAll(checked) {
      for (const row of this.productTable.rows) {
        if (checked) {
          this.$set(this.productDraft, row.productSn, row.productName)
        } else {
          this.$delete(this.productDraft, row.productSn)
        }
      }
    },
    /** 确定：草稿写回节点 */
    confirmProductDialog() {
      this.configData.productScope = Object.keys(this.productDraft)
      this.$set(this.configData, 'productNameMap', {...this.productDraft})
      this.productDialogVisible = false
      this.getDeviceByProductSnList()
    },
    /** 清空产品范围 */
    clearProductScope() {
      this.configData.productScope = []
      this.$set(this.configData, 'productNameMap', {})
      this.getDeviceByProductSnList()
    },
    // 获取默认配置数据
    getDefaultConfigData() {
      return {
        productScope: [],
        productList: [],
        // 已选产品 SN → 名称，随节点配置保存，回显时直接取，不用再查全量产品
        productNameMap: {},
        deviceScope: 'all',
        deviceList: [],
        deviceSnList: [],
        authHeaderSign: null,
        authToken: null,
        routingKey: null,
        exchange: '',
        topic: '',
        host: '',
        port: null,
        tags: null,
        group: null,
        url: null,
        key: null
      };
    },
    /** 按产品范围拉设备；产品范围变化后顺带剔除已不属于其中任何产品的已选设备 */
    async getDeviceByProductSnList() {
      if (this.configData.deviceScope !== 'part') {
        return
      }
      const scope = this.configData.productScope || []
      if (!scope.length) {
        this.configData.deviceList = []
        this.configData.deviceSnList = []
        return
      }
      try {
        const res = await getDeviceByProductSn(scope.join(','))
        this.configData.deviceList = res?.data || []
        const validSns = this.configData.deviceList.map(item => item.deviceSn)
        this.configData.deviceSnList = (this.configData.deviceSnList || []).filter(sn => validSns.indexOf(sn) > -1)
      } catch (e) {
        console.error('查询产品下设备失败', e)
      }
    },
    lineInit(line) {
      this.type = 'line'
      this.line = line
    },
    // 修改连线
    saveLine() {
      this.$emit('setLineLabel', this.line.from, this.line.to, this.line.label)
    },
    reset() {
      this.configData = {}
    },
  },
  watch: {
    /**
     * 编辑即时生效：面板字段直接绑在 configData 上，而 configData 就是节点的 configData（同一对象）。
     * 一旦换成新对象（打开新建节点时生成默认配置、点「重置」时清空），要同步挂回流程节点，
     * 否则改动只写在这个游离对象里，右上角「保存」落库时丢失。
     */
    configData(val) {
      if (!val || !this.node || !this.node.id || !this.data.nodeList) {
        return
      }
      const node = this.data.nodeList.find(item => item.id === this.node.id)
      if (node && node.configData !== val) {
        node.configData = val
      }
    },
    'configData.deviceScope'(newVal, oldVal) {
      console.log("deviceScope:"+newVal)
      this.getDeviceByProductSnList()
    }
  }
}
</script>

<style>
/* 产品范围：选择按钮 + 已选数量（增删都在弹窗里勾选/取消勾选） */
.scope-picker {
  display: flex;
  align-items: center;
}

.scope-count {
  margin: 0 8px 0 10px;
  font-size: 12px;
  color: #909399;
}

/* 产品选择弹窗工具栏 */
.product-dialog-toolbar {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.product-dialog-toolbar .el-button {
  margin-left: 8px;
}

.product-dialog-selected {
  margin-left: auto;
  font-size: 12px;
  color: #606266;
}

.product-dialog-pagination {
  margin-top: 10px;
  text-align: right;
}

.el-node-form-tag {
  position: absolute;
  top: 50%;
  margin-left: -15px;
  height: 40px;
  width: 15px;
  background-color: #fbfbfb;
  border: 1px solid rgb(220, 227, 232);
  border-right: none;
  z-index: 0;
}
</style>
