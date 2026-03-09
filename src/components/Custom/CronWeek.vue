<template>
  <div class="cron-unit">
    <el-radio-group v-model="type" @change="onTypeChange">
      <el-radio label="every">每周</el-radio>
      <el-radio label="interval">周期</el-radio>
      <el-radio label="specific">指定星期</el-radio>
      <el-radio label="range">范围</el-radio>
      <el-radio label="last">最后</el-radio>
      <el-radio label="workday">工作日</el-radio>
      <el-radio label="weekend">周末</el-radio>
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
            v-for="day in dayOptions"
            :key="day.value"
            :label="day.label"
            :value="day.value"
          />
        </el-select>
        <span>开始，每</span>
        <el-input-number
          v-model="intervalValue"
          :min="1"
          :max="6"
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
            <el-button size="mini" @click="selectWorkdays">工作日</el-button>
            <el-button size="mini" @click="selectWeekend">周末</el-button>
          </el-button-group>
        </div>
        <el-checkbox-group v-model="specificValues" @change="onSpecificChange">
          <div class="checkboxes">
            <el-checkbox
              v-for="day in dayOptions"
              :key="day.value"
              :label="day.value"
              size="small"
              class="checkbox-item"
            >
              {{ day.label }}
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
            v-for="day in dayOptions"
            :key="day.value"
            :label="day.label"
            :value="day.value"
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
            v-for="day in dayOptions"
            :key="day.value"
            :label="day.label"
            :value="day.value"
          />
        </el-select>
      </div>

      <!-- 最后 -->
      <div v-if="type === 'last'" class="option-row">
        <span>每月的最后</span>
        <el-select
          v-model="lastValue"
          size="small"
          style="width: 100px"
          @change="onLastChange"
        >
          <el-option
            v-for="day in dayOptions"
            :key="day.value"
            :label="day.label"
            :value="day.value"
          />
        </el-select>
      </div>

      <!-- 工作日 -->
      <div v-if="type === 'workday'" class="option-row">
        <span>周一到周五</span>
      </div>

      <!-- 周末 -->
      <div v-if="type === 'weekend'" class="option-row">
        <span>周六和周日</span>
      </div>
    </div>
  </div>
</template>

<script>
import {RadioGroup, Radio, InputNumber, CheckboxGroup, Checkbox, ButtonGroup, Button, Select, Option} from 'element-ui'
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
  name: 'CronWeek',
  props: {
    value: {
      type: String,
      default: '?'
    }
  },
  data() {
    return {
      type: 'every',
      intervalStart: 2, // 周一
      intervalValue: 1,
      specificValues: [],
      rangeStart: 2,
      rangeEnd: 6,
      lastValue: 7,
      dayOptions: [
        {label: '周日', value: 1},
        {label: '周一', value: 2},
        {label: '周二', value: 3},
        {label: '周三', value: 4},
        {label: '周四', value: 5},
        {label: '周五', value: 6},
        {label: '周六', value: 7}
      ]
    }
  },
  computed: {
    dayLabels() {
      return this.dayOptions.reduce((acc, cur) => {
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
      if (val === '?' || val === '*') {
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
        this.lastValue = parseInt(val.substring(1)) || 7
      } else if (val === 'MON-FRI' || val === '2-6') {
        this.type = 'workday'
      } else if (val === '1,7' || val === 'SAT,SUN') {
        this.type = 'weekend'
      } else {
        this.type = 'specific'
        this.specificValues = [parseInt(val)]
      }
    },

    selectAllDays() {
      this.specificValues = [1, 2, 3, 4, 5, 6, 7]
      this.onSpecificChange()
    },

    clearAllDays() {
      this.specificValues = []
      this.onSpecificChange()
    },

    selectWorkdays() {
      // 周一到周五
      this.specificValues = [2, 3, 4, 5, 6]
      this.onSpecificChange()
    },

    selectWeekend() {
      // 周末
      this.specificValues = [1, 7]
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
          result = `L${this.lastValue}`
          break
        case 'workday':
          result = '2-6'
          break
        case 'weekend':
          result = '1,7'
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
  grid-template-columns: repeat(3, 1fr);
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
