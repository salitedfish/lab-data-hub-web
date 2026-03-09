<template>
  <div>
    <div class="ef-node-form">
      <div class="ef-node-form-header">
        编辑
      </div>
      <div class="ef-node-form-body">
        <el-form :model="node" ref="dataForm" label-width="80px" v-show="type === 'node'">
          <el-divider>节点配置</el-divider>
          <el-form-item label="节点名称" required>
            <el-input v-model="node.name"></el-input>
          </el-form-item>
          <el-divider>属性配置</el-divider>
          <el-form :model="configData" ref="configForm" label-width="80px" v-show="componentType === 'deviceProperty'">
            <el-form-item label="产品" required>
              <el-select v-model="configData.productSn" @change="getDeviceByProductSn">
                <el-option v-for="item in configData.productList"
                           :label="item.productName"
                           :value="item.productSn"
                           :key="item.productSn"
                ></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="设备" required>
              <el-select v-model="configData.deviceSn" @change="getPropertyByDeviceSn">
                <el-option v-for="item in configData.deviceList"
                           :label="item.deviceName"
                           :value="item.deviceSn"
                           :key="item.deviceSn"
                ></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="属性" required>
              <el-select v-model="configData.attribute">
                <el-option v-for="item in configData.propertyList"
                           :label="item.name"
                           :value="item.identifier"
                           :key="item.identifier"
                ></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="比较符" required>
              <el-select v-model="configData.operator">
                <el-option v-for="item in operatorOptions"
                           :label="item.label"
                           :value="item.value"
                           :key="item.value"
                ></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="值" required>
                <el-input v-model="configData.value"></el-input>
            </el-form-item>
          </el-form>
          <el-form :model="configData" ref="dataForm" label-width="80px" v-show="componentType === 'currentStatus'">
            <el-form-item label="产品" required>
              <el-select v-model="configData.productSn" @change="getDeviceByProductSn">
                <el-option v-for="item in configData.productList"
                           :label="item.productName"
                           :value="item.productSn"
                           :key="item.productSn"
                ></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="设备" required>
              <el-select v-model="configData.deviceSn">
                <el-option v-for="item in configData.deviceList"
                           :label="item.deviceName"
                           :value="item.deviceSn"
                           :key="item.deviceSn"
                ></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="当前状态" required>
              <el-select v-model="configData.currentStatus">
                <el-option label="在线" value="1"></el-option>
                <el-option label="离线" value="0"></el-option>
              </el-select>
            </el-form-item>
          </el-form>
          <el-form :model="configData" ref="dataForm" label-width="80px" v-show="componentType === 'changeStatus'">
            <el-form-item label="产品" required>
              <el-select v-model="configData.productSn" @change="getDeviceByProductSn">
                <el-option v-for="item in configData.productList"
                           :label="item.productName"
                           :value="item.productSn"
                           :key="item.productSn"
                ></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="设备" required>
              <el-select v-model="configData.deviceSn">
                <el-option v-for="item in configData.deviceList"
                           :label="item.deviceName"
                           :value="item.deviceSn"
                           :key="item.deviceSn"
                ></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="状态变化" required>
              <el-select v-model="configData.changeStatus">
                <el-option label="上线" value="1"></el-option>
                <el-option label="下线" value="0"></el-option>
              </el-select>
            </el-form-item>
          </el-form>
          <el-form :model="configData" ref="dataForm" label-width="80px" v-show="componentType === 'and' || componentType === 'or'">
            <el-form-item label="关系" required>
              <el-input
                :value="componentType === 'and' ? '并且' : '或者'"
                disabled
              >
              </el-input>
            </el-form-item>
          </el-form>

<!--          <el-form :model="configData" ref="dataForm" label-width="80px" v-show="componentType === 'warn'">-->
<!--            <el-form-item label="告警等级" required>-->
<!--              <el-select v-model="configData.warnLevel" class="filter-select">-->
<!--                <el-option label="紧急" value="1" />-->
<!--                <el-option label="严重" value="2" />-->
<!--                <el-option label="警告" value="3" />-->
<!--                <el-option label="正常" value="4" />-->
<!--              </el-select>-->
<!--            </el-form-item>-->
<!--            <el-form-item label="告警内容" required>-->
<!--              <el-input v-model="configData.warnMessage"></el-input>-->
<!--            </el-form-item>-->
<!--          </el-form>-->

          <el-form :model="configData" ref="dataForm" label-width="80px" v-show="componentType === 'function'">
            <el-form-item label="产品" required>
              <el-select v-model="configData.productSn" @change="getDeviceByProductSn">
                <el-option v-for="item in configData.productList"
                           :label="item.productName"
                           :value="item.productSn"
                           :key="item.productSn"
                ></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="设备" required>
              <el-select v-model="configData.deviceSn" @change="getFunctionByDeviceSn">
                <el-option v-for="item in configData.deviceList"
                           :label="item.deviceName"
                           :value="item.deviceSn"
                           :key="item.deviceSn"
                ></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="指令" required>
              <el-select v-model="configData.functionCode" @change="setFunctionParams">
                <el-option v-for="item in configData.functionList"
                           :label="item.functionName"
                           :value="item.functionCode"
                           :key="item.functionCode"
                ></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="参数" required>
              <el-input v-model="configData.functionParams"></el-input>
            </el-form-item>
          </el-form>

          <el-divider>其他配置</el-divider>
          <el-form-item label="备注">
            <el-input v-model="configData.remark"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="el-icon-check" @click="save">保存</el-button>
          </el-form-item>
        </el-form>

        <el-form :model="line" ref="dataForm" label-width="80px" v-show="type === 'line'">
          <el-form-item label="条件">
            <el-input v-model="line.label"></el-input>
          </el-form-item>
          <el-form-item>
<!--            <el-button icon="el-icon-close">重置</el-button>-->
            <el-button type="primary" icon="el-icon-check" @click="saveLine">保存</el-button>
          </el-form-item>
        </el-form>
      </div>
      <!--            <div class="el-node-form-tag"></div>-->
    </div>
  </div>

</template>

<script>
import {cloneDeep} from 'lodash'
import {listProduct} from "@/api/business/product"
import {getDeviceByProductSn} from "@/api/business/device"
import {listProperties} from "@/api/business/properties";
import {listFunction} from "@/api/business/function";

export default {
  data() {
    return {
      visible: true,
      // node 或 line
      type: 'node',
      componentType: '',
      node: {},
      line: {},
      configData: {},
      data: {},
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
      needProductSign:['deviceProperty','currentStatus','changeStatus','warn','function'],
      operatorOptions: [
        { label: '大于', value: 'gt' },
        { label: '大于等于', value: 'ge' },
        { label: '等于', value: 'eq' },
        { label: '不等于', value: 'ne' },
        { label: '小于', value: 'lt' },
        { label: '小于等于', value: 'le' },
        { label: '包含', value: 'contains' },
        { label: '不包含', value: 'notContains' },
        { label: '被包含', value: 'like' },
        { label: '不被包含', value: 'notLike' },
        { label: '在列表中', value: 'in' },
        { label: '不在列表中', value: 'notIn' }
      ],
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
          if (this.componentType !== 'and' && this.componentType !== 'or') {
            this.configData = node.configData ? node.configData : this.getDefaultConfigData()
          }
          if (this.needProductSign.includes(this.componentType)) {
            listProduct({pageNum: 1, pageSize: 100000}).then(res => {
              this.configData.productList = res?.rows;
            })
          }
        }
      })
    },
    // 获取默认配置数据
    getDefaultConfigData() {
      return {
        productList: [],
        deviceList: [],
        propertyList: [],
        deviceSn:null,
        productSn:null,
        currentStatus:null,
        changeStatus:null,
        warnMessage:null,
        functionList:[],
        functionParams:null
      };
    },
    getDeviceByProductSn() {
      getDeviceByProductSn(this.configData.productSn).then(res => {
        this.configData.deviceList = res?.data
      })
    },
    getPropertyByDeviceSn() {
      listProperties({belongSn:this.configData.deviceSn,pageSize:10000,pageNum:1}).then(res => {
        this.configData.propertyList = res?.rows
      })
    },
    getFunctionByDeviceSn() {
      listFunction({belongSn:this.configData.deviceSn,pageSize:10000,pageNum:1}).then(res => {
        this.configData.functionList = res?.rows
      })
    },
    setFunctionParams() {
      let action = this.configData.functionList.find(data=>data.functionCode === this.configData.functionCode)
      this.configData.functionParams = action.functionParams;
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
    save() {
      this.data.nodeList.filter((node) => {
        if (node.id === this.node.id) {
          node.name = this.node.name
          node.left = this.node.left
          node.top = this.node.top
          node.ico = this.node.ico
          node.state = this.node.state
          //清空产品和设备缓存
          this.configData.productList = null
          this.configData.deviceList = null
          this.configData.propertyList = null
          this.configData.functionList = null
          node.configData = this.configData
          this.$emit('repaintEverything')
        }
      })
    }
  },
  watch: {
    'configData.productSn'(newVal, oldVal) {
      this.getDeviceByProductSn()
    },
    'configData.deviceSn'(newVal, oldVal) {
      if(this.componentType==='deviceProperty'){
        this.getPropertyByDeviceSn()
      }
      if(this.componentType==='function'){
        this.getFunctionByDeviceSn()
      }
    },
  }
}
</script>

<style>
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
