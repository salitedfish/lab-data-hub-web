<template>
  <div class="cron-unit">
    <el-radio-group v-model="type" @change="onTypeChange">
      <el-radio label="every">每月</el-radio>
      <el-radio label="interval">周期</el-radio>
      <el-radio label="specific">指定月份</el-radio>
      <el-radio label="range">范围</el-radio>
      <el-radio label="last">最后</el-radio>
    </el-radio-group>

    <div class="options">
      <!-- 周期 -->
      <div v-if="type === 'interval'" class="option-row">
        <span>从</span>
        <el-select
          v-model="intervalStart"
          size="small"
          style="width: 100px"
          @change="onIntervalChange"
        >
          <el-option
            v-for="month in monthOptions"
            :key="month.value"
            :label="month.label"
            :value="month.value"
          />
        </el-select>
        <span>月开始，每</span>
        <el-input-number
          v-model="intervalValue"
          :min="1"
          :max="11"
          :step="1"
          size="small"
          controls-position="right"
          @change="onIntervalChange"
        />
        <span>月执行一次</span>
      </div>

      <!-- 指定 -->
      <div v-if="type === 'specific'">
        <div class="option-row">
          <el-button-group>
            <el-button size="mini" @click="selectAllMonths">全选</el-button>
            <el-button size="mini" @click="clearAllMonths">清除</el-button>
            <el-button size="mini" @click="selectQuarter">按季度</el-button>
          </el-button-group>
        </div>
        <el-checkbox-group v-model="specificValues" @change="onSpecificChange">
          <div class="checkboxes">
            <el-checkbox
              v-for="month in monthOptions"
              :key="month.value"
              :label="month.value"
              size="small"
              class="checkbox-item"
            >
              {{ month.label }}
            </el-checkbox>
          </div>
        </el-checkbox-group>
      </div>

      <!-- 范围 -->
      <div v-if="type === 'range'" class="option-row">
        <span>从</span>
        <el-select
          v-model="rangeStart"
          size="small"
          style="width: 100px"
          @change="onRangeChange"
        >
          <el-option
            v-for="month in monthOptions"
            :key="month.value"
            :label="month.label"
            :value="month.value"
          />
        </el-select>
        <span>到</span>
        <el-select
          v-model="rangeEnd"
          size="small"
          style="width: 100px"
          @change="onRangeChange"
        >
          <el-option
            v-for="month in monthOptions"
            :key="month.value"
            :label="month.label"
            :value="month.value"
          />
        </el-select>
      </div>

      <!-- 最后 -->
      <div v-if="type === 'last'" class="option-row">
        <span>每年的最后</span>
        <el-input-number
          v-model="lastValue"
          :min="1"
          :max="12"
          :step="1"
          size="small"
          controls-position="right"
          @change="onLastChange"
        />
        <span>个月</span>
      </div>
    </div>
  </div>
</template>

<script>
import { RadioGroup, Radio, InputNumber, CheckboxGroup, Checkbox, ButtonGroup, Button, Select, Option } from 'element-ui'
import Vue from 'vue'

Vue.use(RadioGroup)
Vue.use(Radio)
Vue.use(InputNumber)
Vue.use(CheckboxGroup)
Vue.use(Checkbox)
Vue.use(ButtonGroup)
Vue.use(Button)
Vue.use(Select)
Vue.use(Option)

export default {
  name: 'CronMonth',
  props: {
    value: {
      type: String,
      default: '*'
    }
  },
  data() {
    return {
      type: 'every',
      intervalStart: 1,
      intervalValue: 1,
      specificValues: [],
      rangeStart: 1,
      rangeEnd: 12,
      lastValue: 1,
      monthOptions: [
        { label: '一月', value: 1 },
        { label: '二月', value: 2 },
        { label: '三月', value: 3 },
        { label: '四月', value: 4 },
        { label: '五月', value: 5 },
        { label: '六月', value: 6 },
        { label: '七月', value: 7 },
        { label: '八月', value: 8 },
        { label: '九月', value: 9 },
        { label: '十月', value: 10 },
        { label: '十一月', value: 11 },
        { label: '十二月', value: 12 }
      ]
    }
  },
  computed: {
    monthLabels() {
      return this.monthOptions.reduce((acc, cur) => {
        acc[cur.value] = cur.label
        return acc
      }, {})
    }
  },
  watch: {
    value: {
      immediate: true,
      handler(newVal) {
        this.parseValue(newVal)
      }
    }
  },
  methods: {
    parseValue(val) {
      if (val === '*') {
        this.type = 'every'
      } else if (val.includes('/')) {
        const parts = val.split('/')
        this.type = 'interval'
        this.intervalStart = parseInt(parts[0]) || 1
        this.intervalValue = parseInt(parts[1]) || 1
      } else if (val.includes('-')) {
        const parts = val.split('-')
        this.type = 'range'
        this.rangeStart = parseInt(parts[0])
        this.rangeEnd = parseInt(parts[1])
      } else if (val.includes(',')) {
        this.type = 'specific'
        this.specificValues = val.split(',').map(Number)
      } else if (val.startsWith('L')) {
        this.type = 'last'
        this.lastValue = parseInt(val.substring(1)) || 1
      } else {
        this.type = 'specific'
        this.specificValues = [parseInt(val)]
      }
    },

    selectAllMonths() {
      this.specificValues = Array.from({ length: 12 }, (_, i) => i + 1)
      this.onSpecificChange()
    },

    clearAllMonths() {
      this.specificValues = []
      this.onSpecificChange()
    },

    selectQuarter() {
      // 选择每季度的月份
      this.specificValues = [1, 4, 7, 10]
      this.onSpecificChange()
    },

    onTypeChange() {
      this.generateCron()
    },

    onIntervalChange() {
      this.generateCron()
    },

    onSpecificChange() {
      this.generateCron()
    },

    onRangeChange() {
      this.generateCron()
    },

    onLastChange() {
      this.generateCron()
    },

    generateCron() {
      let result = ''

      switch (this.type) {
        case 'every':
          result = '*'
          break
        case 'interval':
          result = `${this.intervalStart}/${this.intervalValue}`
          break
        case 'specific':
          if (this.specificValues.length === 0) {
            result = '*'
          } else if (this.specificValues.length === 1) {
            result = this.specificValues[0].toString()
          } else {
            result = this.specificValues.sort((a, b) => a - b).join(',')
          }
          break
        case 'range':
          result = `${this.rangeStart}-${this.rangeEnd}`
          break
        case 'last':
          result = `L${this.lastValue}`
          break
      }

      this.$emit('input', result)
      this.$emit('change')
    }
  }
}
</script>

<style scoped>
.checkboxes {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  max-height: 150px;
  overflow-y: auto;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 4px;
  margin-top: 10px;
}

.checkbox-item {
  margin: 0;
  min-width: 80px;
}

.el-input-number {
  width: 80px;
}
</style>
