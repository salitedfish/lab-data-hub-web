<template>
  <div class="cron-unit">
    <el-radio-group v-model="type" @change="onTypeChange">
      <el-radio label="every">每年</el-radio>
      <el-radio label="interval">周期</el-radio>
      <el-radio label="specific">指定年份</el-radio>
      <el-radio label="range">范围</el-radio>
    </el-radio-group>

    <div class="options">
      <!-- 周期 -->
      <div v-if="type === 'interval'" class="option-row">
        <span>从</span>
        <el-input-number
          v-model="intervalStart"
          :min="1970"
          :max="2099"
          :step="1"
          size="small"
          controls-position="right"
          @change="onIntervalChange"
        />
        <span>年开始，每</span>
        <el-input-number
          v-model="intervalValue"
          :min="1"
          :max="100"
          :step="1"
          size="small"
          controls-position="right"
          @change="onIntervalChange"
        />
        <span>年执行一次</span>
      </div>

      <!-- 指定 -->
      <div v-if="type === 'specific'">
        <div class="option-row">
          <el-button-group>
            <el-button size="mini" @click="selectRecentYears">最近5年</el-button>
            <el-button size="mini" @click="clearAllYears">清除</el-button>
          </el-button-group>
          <el-input
            v-model="yearInput"
            size="small"
            placeholder="输入年份，用逗号分隔"
            style="width: 200px"
            @blur="parseYearInput"
          />
        </div>
        <div class="year-tags">
          <el-tag
            v-for="year in specificValues"
            :key="year"
            size="small"
            closable
            @close="removeYear(year)"
          >
            {{ year }}
          </el-tag>
        </div>
      </div>

      <!-- 范围 -->
      <div v-if="type === 'range'" class="option-row">
        <span>从</span>
        <el-input-number
          v-model="rangeStart"
          :min="1970"
          :max="2099"
          :step="1"
          size="small"
          controls-position="right"
          @change="onRangeChange"
        />
        <span>到</span>
        <el-input-number
          v-model="rangeEnd"
          :min="rangeStart+1"
          :max="2100"
          :step="1"
          size="small"
          controls-position="right"
          @change="onRangeChange"
        />
        <span>年</span>
      </div>
    </div>
  </div>
</template>

<script>
import { RadioGroup, Radio, InputNumber, Tag, Input, ButtonGroup, Button } from 'element-ui'
import Vue from 'vue'

Vue.use(RadioGroup)
Vue.use(Radio)
Vue.use(InputNumber)
Vue.use(Tag)
Vue.use(Input)
Vue.use(ButtonGroup)
Vue.use(Button)

export default {
  name: 'CronYear',
  props: {
    value: {
      type: String,
      default: '*'
    }
  },
  data() {
    const currentYear = new Date().getFullYear()
    return {
      type: 'every',
      intervalStart: currentYear,
      intervalValue: 1,
      specificValues: [],
      rangeStart: currentYear,
      rangeEnd: currentYear + 10,
      yearInput: ''
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
        this.intervalStart = parseInt(parts[0]) || this.intervalStart
        this.intervalValue = parseInt(parts[1]) || 1
      } else if (val.includes('-')) {
        const parts = val.split('-')
        this.type = 'range'
        this.rangeStart = parseInt(parts[0])
        this.rangeEnd = parseInt(parts[1])
      } else if (val.includes(',')) {
        this.type = 'specific'
        this.specificValues = val.split(',').map(Number).filter(year => !isNaN(year))
      } else {
        this.type = 'specific'
        this.specificValues = [parseInt(val)]
      }
    },

    selectRecentYears() {
      const currentYear = new Date().getFullYear()
      this.specificValues = Array.from({ length: 5 }, (_, i) => currentYear + i)
      this.onSpecificChange()
    },

    clearAllYears() {
      this.specificValues = []
      this.onSpecificChange()
    },

    parseYearInput() {
      if (this.yearInput.trim()) {
        const years = this.yearInput.split(',')
          .map(year => parseInt(year.trim()))
          .filter(year => !isNaN(year) && year >= 1970 && year <= 2100)

        this.specificValues = [...new Set([...this.specificValues, ...years])].sort((a, b) => a - b)
        this.yearInput = ''
        this.onSpecificChange()
      }
    },

    removeYear(year) {
      this.specificValues = this.specificValues.filter(y => y !== year)
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

.year-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 4px;
  min-height: 60px;
}

.el-tag {
  margin: 0;
}

.el-input-number {
  width: 100px;
}
</style>
