<template>
  <div class="cron-unit">
    <el-radio-group v-model="type" @change="onTypeChange">
      <el-radio label="every">每小时</el-radio>
      <el-radio label="interval">周期</el-radio>
      <el-radio label="specific">指定小时</el-radio>
      <el-radio label="range">范围</el-radio>
      <el-radio label="last">最后</el-radio>
    </el-radio-group>

    <div class="options">
      <!-- 周期 -->
      <div v-if="type === 'interval'" class="option-row">
        <span>从</span>
        <el-input-number
          v-model="intervalStart"
          :min="0"
          :max="22"
          :step="1"
          size="small"
          controls-position="right"
          @change="onIntervalChange"
        />
        <span>小时开始，每</span>
        <el-input-number
          v-model="intervalValue"
          :min="1"
          :max="23"
          :step="1"
          size="small"
          controls-position="right"
          @change="onIntervalChange"
        />
        <span>小时执行一次</span>
      </div>

      <!-- 指定 -->
      <div v-if="type === 'specific'">
        <div class="option-row">
          <el-button-group>
            <el-button size="mini" @click="selectAllHours">全选</el-button>
            <el-button size="mini" @click="clearAllHours">清除</el-button>
            <el-button size="mini" @click="selectWorkingHours">工作时间</el-button>
          </el-button-group>
        </div>
        <el-checkbox-group v-model="specificValues" @change="onSpecificChange">
          <div class="checkboxes">
            <el-checkbox
              v-for="n in 24"
              :key="n-1"
              :label="n-1"
              size="small"
              class="checkbox-item"
            >
              {{ n-1 < 10 ? '0' + (n-1) : n-1 }}时
            </el-checkbox>
          </div>
        </el-checkbox-group>
      </div>

      <!-- 范围 -->
      <div v-if="type === 'range'" class="option-row">
        <span>从</span>
        <el-input-number
          v-model="rangeStart"
          :min="0"
          :max="22"
          :step="1"
          size="small"
          controls-position="right"
          @change="onRangeChange"
        />
        <span>到</span>
        <el-input-number
          v-model="rangeEnd"
          :min="rangeStart+1"
          :max="23"
          :step="1"
          size="small"
          controls-position="right"
          @change="onRangeChange"
        />
        <span>小时</span>
      </div>

      <!-- 最后 -->
      <div v-if="type === 'last'" class="option-row">
        <span>每天的最后</span>
        <el-input-number
          v-model="lastValue"
          :min="1"
          :max="23"
          :step="1"
          size="small"
          controls-position="right"
          @change="onLastChange"
        />
        <span>小时</span>
      </div>
    </div>
  </div>
</template>

<script>
import { RadioGroup, Radio, InputNumber, CheckboxGroup, Checkbox, ButtonGroup, Button } from 'element-ui'
import Vue from 'vue'

Vue.use(RadioGroup)
Vue.use(Radio)
Vue.use(InputNumber)
Vue.use(CheckboxGroup)
Vue.use(Checkbox)
Vue.use(ButtonGroup)
Vue.use(Button)

export default {
  name: 'CronHour',
  props: {
    value: {
      type: String,
      default: '*'
    }
  },
  data() {
    return {
      type: 'every',
      intervalStart: 0,
      intervalValue: 2,
      specificValues: [],
      rangeStart: 9,
      rangeEnd: 17,
      lastValue: 1
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
        this.intervalStart = parseInt(parts[0]) || 0
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

    selectAllHours() {
      this.specificValues = Array.from({ length: 24 }, (_, i) => i)
      this.onSpecificChange()
    },

    clearAllHours() {
      this.specificValues = []
      this.onSpecificChange()
    },

    selectWorkingHours() {
      // 选择工作时间 9-18
      this.specificValues = Array.from({ length: 10 }, (_, i) => i + 9)
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
  grid-template-columns: repeat(6, 1fr);
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
  min-width: 60px;
}

.el-input-number {
  width: 80px;
}
</style>
