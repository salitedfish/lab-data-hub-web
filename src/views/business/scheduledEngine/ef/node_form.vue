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
          <el-form :model="configData" ref="dataForm" label-width="80px" v-if="componentType === 'common'">
            <el-divider>定时配置</el-divider>
            <el-form-item label="Cron表达式" required>
              <el-input v-model="configData.cronValue" disabled>
                <template #suffix>
                  <i
                    class="el-icon-setting"
                    style="cursor: pointer; padding: 0 5px;"
                    @click="cronConfig"
                  ></i>
                </template>
              </el-input>
            </el-form-item>
          </el-form>
          <el-form :model="configData" ref="dataForm" label-width="80px" v-show="componentType === 'function'">
            <el-divider>动作配置</el-divider>
            <el-form-item label="产品" required>
              <el-select v-model="configData.productSn">
                <el-option v-for="item in configData.productList"
                           :label="item.productName"
                           :value="item.productSn"
                           :key="item.productSn"
                ></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="设备范围" required>
              <el-radio-group v-model="configData.deviceScope">
                <el-radio label="all" >所有设备</el-radio>
                <el-radio label="part" >部分设备</el-radio>
                <el-radio label="singe" >单个设备</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="设备" required v-if="configData.deviceScope==='singe'">
              <el-select v-model="configData.deviceSn">
                <el-option v-for="item in configData.deviceList"
                           :label="item.deviceName"
                           :value="item.deviceSn"
                           :key="item.deviceSn"
                ></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="设备" required v-if="configData.deviceScope==='part'">
              <el-select v-model="deviceSnArray" multiple filterable clearable >
                <el-option v-for="item in configData.deviceList"
                           :label="item.deviceName"
                           :value="item.deviceSn"
                           :key="item.deviceSn"
                ></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="指令" required>
              <el-select v-model="configData.functionCode">
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
    <el-dialog title="Cron表达式配置" :visible.sync="cronOpen">
      <vue-cron v-model="configData.cronValue" @change="onCronChange" />
    </el-dialog>
  </div>

</template>

<script>
import {cloneDeep} from 'lodash'
import {listProduct} from "@/api/business/product"
import {getDeviceByProductSn} from "@/api/business/device"
import {listProperties} from "@/api/business/properties";
import {listFunction} from "@/api/business/function";
import VueCron from "@/components/Custom/VueCron";

export default {
  data() {
    return {
      visible: true,
      // node 或 line
      type: 'node',
      componentType: 'HTTP',
      node: {},
      line: {},
      configData: {
        cronValue: '0 0 12 * * ? *',
      },
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
      cronOpen:false,
      needProductSign:['function'],
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
      initSign:false
    }
  },
  watch: {
    // 监听 productSn 变化，处理初始化数据
    'configData.productSn': {
      immediate: true, // 立即执行一次
      handler(newVal, oldVal) {
        // 只有在有值且不是初始空值时执行
        if (newVal) {
          this.$nextTick(() => {
            if(this.initSign===true){
              this.configData.deviceSn = '';
              this.configData.functionCode = '';
              this.configData.functionParams = '';
            }
            this.getDeviceByProductSn();
          });
        }
      }
    },

    // 监听 deviceSn 变化
    'configData.deviceSn': {
      immediate: true,
      handler(newVal) {
        if (newVal && this.configData.deviceScope === 'singe') {
          this.$nextTick(() => {
            if(this.initSign===true){
              this.configData.functionCode = '';
              this.configData.functionParams = '';
            }
            this.getFunctionByDeviceSn();
          });
        }
      }
    },

    // 监听 deviceSn 变化
    'configData.functionCode': {
      immediate: true,
      handler(newVal) {
        if (newVal) {
          this.$nextTick(() => {
            this.setFunctionParams();
          });
        }
      }
    },

    // 监听 deviceScope 变化
    'configData.deviceScope': {
      immediate: true,
      handler(newVal) {
        if (newVal && this.configData.productSn) {
          this.$nextTick(() => {
            if(this.initSign===true){
              this.configData.deviceSn = '';
              this.configData.functionCode = '';
              this.configData.functionParams = '';
            }
            if (newVal === 'all' || newVal === 'part') {
              this.getFunctionByProductSn();
            }
            if (newVal === 'singe' && this.configData.deviceSn) {
              this.getFunctionByDeviceSn();
            }
            if(newVal === 'part' || newVal === 'singe'){
              this.getDeviceByProductSn();
            }
          });
        }
      }
    }
  },
  components: {
    VueCron
  },
  computed: {
    // 创建一个计算属性来双向绑定
    deviceSnArray: {
      get() {
        // 从字符串转换为数组
        return this.configData.deviceSn ? this.configData.deviceSn.split(',') : [];
      },
      set(value) {
        // 从数组转换为字符串
        this.configData.deviceSn = value.join(',');
      }
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
              this.initSign = true;
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
      if(this.configData.deviceScope==='part'||this.configData.deviceScope==='singe'){
        getDeviceByProductSn(this.configData.productSn).then(res => {
          this.configData.deviceList = res?.data
        })
      }
      if(this.configData.deviceScope==='all'){
        this.getFunctionByProductSn();
      }
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
    getFunctionByProductSn() {
      listFunction({belongSn:this.configData.productSn,pageSize:10000,pageNum:1}).then(res => {
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
          node.configData = this.configData
          this.$emit('repaintEverything')
        }
      })
    },
    cronConfig() {
      this.cronOpen = true;
    },
    onCronChange(){
      console.log('Cron表达式改变:', this.configData.cronValue)
    }
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
