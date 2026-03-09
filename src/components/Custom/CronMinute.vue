<template>
  <div class="cron-unit">
    <el-radio-group v-model="type" @change="onTypeChange">
      <el-radio label="every">每分钟</el-radio>
      <el-radio label="interval">周期</el-radio>
      <el-radio label="specific">指定分钟</el-radio>
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
          :max="58"
          :step="1"
          size="small"
          controls-position="right"
          @change="onIntervalChange"
        />
        <span>分钟开始，每</span>
        <el-input-number
          v-model="intervalValue"
          :min="1"
          :max="59"
          :step="1"
          size="small"
          controls-position="right"
          @change="onIntervalChange"
        />
        <span>分钟执行一次</span>
      </div>

      <!-- 指定 -->
      <div v-if="type === 'specific'">
        <div class="option-row">
          <el-button-group>
            <el-button size="mini" @click="selectAllMinutes">全选</el-button>
            <el-button size="mini" @click="clearAllMinutes">清除</el-button>
          </el-button-group>
        </div>
        <el-checkbox-group v-model="specificValues" @change="onSpecificChange">
          <div class="checkboxes">
            <el-checkbox
              v-for="n in 60"
              :key="n-1"
              :label="n-1"
              size="small"
              class="checkbox-item"
            >
              {{ n-1 < 10 ? '0' + (n-1) : n-1 }}
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
          :max="58"
          :step="1"
          size="small"
          controls-position="right"
          @change="onRangeChange"
        />
        <span>到</span>
        <el-input-number
          v-model="rangeEnd"
          :min="rangeStart+1"
          :max="59"
          :step="1"
          size="small"
          controls-position="right"
          @change="onRangeChange"
        />
        <span>分钟</span>
      </div>

      <!-- 最后 -->
      <div v-if="type === 'last'" class="option-row">
        <span>每小时的最后</span>
        <el-input-number
          v-model="lastValue"
          :min="1"
          :max="59"
          :step="1"
          size="small"
          controls-position="right"
          @change="onLastChange"
        />
        <span>分钟</span>
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
  name: 'CronMinute',
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
      intervalValue: 5,
      specificValues: [],
      rangeStart: 0,
      rangeEnd: 59,
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

    selectAllMinutes() {
      this.specificValues = Array.from({ length: 60 }, (_, i) => i)
      this.onSpecificChange()
    },

    clearAllMinutes() {
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
.cron-unit {
  padding: 15px;
}

.options {
  margin-top: 15px;
}

.option-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.checkboxes {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
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
  min-width: 40px;
}

.el-input-number {
  width: 80px;
}
</style>
