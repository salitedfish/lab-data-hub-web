<template>
  <div class="cron-unit">
    <el-radio-group v-model="type" @change="onTypeChange">
      <el-radio label="every">每日</el-radio>
      <el-radio label="interval">周期</el-radio>
      <el-radio label="specific">指定日期</el-radio>
      <el-radio label="range">范围</el-radio>
      <el-radio label="last">最后</el-radio>
      <el-radio label="weekday">工作日</el-radio>
      <el-radio label="nearestWeekday">最近工作日</el-radio>
    </el-radio-group>

    <div class="options">
      <!-- 周期 -->
      <div v-if="type === 'interval'" class="option-row">
        <span>从</span>
        <el-input-number
          v-model="intervalStart"
          :min="1"
          :max="30"
          :step="1"
          size="small"
          controls-position="right"
          @change="onIntervalChange"
        />
        <span>日开始，每</span>
        <el-input-number
          v-model="intervalValue"
          :min="1"
          :max="31"
          :step="1"
          size="small"
          controls-position="right"
          @change="onIntervalChange"
        />
        <span>天执行一次</span>
      </div>

      <!-- 指定 -->
      <div v-if="type === 'specific'">
        <div class="option-row">
          <el-button-group>
            <el-button size="mini" @click="selectAllDays">全选</el-button>
            <el-button size="mini" @click="clearAllDays">清除</el-button>
          </el-button-group>
        </div>
        <el-checkbox-group v-model="specificValues" @change="onSpecificChange">
          <div class="checkboxes">
            <el-checkbox
              v-for="n in 31"
              :key="n"
              :label="n"
              size="small"
              class="checkbox-item"
            >
              {{ n }}日
            </el-checkbox>
          </div>
        </el-checkbox-group>
      </div>

      <!-- 范围 -->
      <div v-if="type === 'range'" class="option-row">
        <span>从</span>
        <el-input-number
          v-model="rangeStart"
          :min="1"
          :max="30"
          :step="1"
          size="small"
          controls-position="right"
          @change="onRangeChange"
        />
        <span>到</span>
        <el-input-number
          v-model="rangeEnd"
          :min="rangeStart+1"
          :max="31"
          :step="1"
          size="small"
          controls-position="right"
          @change="onRangeChange"
        />
        <span>日</span>
      </div>

      <!-- 最后 -->
      <div v-if="type === 'last'" class="option-row">
        <span>每月的最后</span>
        <el-input-number
          v-model="lastValue"
          :min="1"
          :max="31"
          :step="1"
          size="small"
          controls-position="right"
          @change="onLastChange"
        />
        <span>天</span>
      </div>

      <!-- 工作日 -->
      <div v-if="type === 'weekday'" class="option-row">
        <span>每月的工作日（周一到周五）</span>
      </div>

      <!-- 最近工作日 -->
      <div v-if="type === 'nearestWeekday'" class="option-row">
        <span>指定日期的最远工作日：</span>
        <el-input-number
          v-model="nearestValue"
          :min="1"
          :max="31"
          :step="1"
          size="small"
          controls-position="right"
          @change="onNearestChange"
        />
        <span>日</span>
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
  name: 'CronDay',
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
      rangeEnd: 31,
      lastValue: 1,
      nearestValue: 15
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
      if (val === '*' || val === '?') {
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
        this.lastValue = parseInt(val.substring(1)) || 0
      } else if (val.startsWith('W')) {
        this.type = 'nearestWeekday'
        this.nearestValue = parseInt(val.substring(1)) || 15
      } else if (val === 'W') {
        this.type = 'weekday'
      } else {
        this.type = 'specific'
        this.specificValues = [parseInt(val)]
      }
    },

    selectAllDays() {
      this.specificValues = Array.from({ length: 31 }, (_, i) => i + 1)
      this.onSpecificChange()
    },

    clearAllDays() {
      this.specificValues = []
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

    onNearestChange() {
      this.generateCron()
    },

    generateCron() {
      let result = ''

      switch (this.type) {
        case 'every':
          result = '?'
          break
        case 'interval':
          result = `${this.intervalStart}/${this.intervalValue}`
          break
        case 'specific':
          if (this.specificValues.length === 0) {
            result = '?'
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
          result = this.lastValue === 0 ? 'L' : `L-${this.lastValue}`
          break
        case 'weekday':
          result = 'W'
          break
        case 'nearestWeekday':
          result = `${this.nearestValue}W`
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
  grid-template-columns: repeat(7, 1fr);
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
  min-width: 50px;
}

.el-input-number {
  width: 80px;
}
</style>
