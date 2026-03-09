<template>
  <div class="cron-unit">
    <el-radio-group v-model="type" @change="onTypeChange">
      <el-radio label="every">每秒</el-radio>
      <el-radio label="interval">周期</el-radio>
      <el-radio label="specific">指定</el-radio>
      <el-radio label="range">范围</el-radio>
    </el-radio-group>

    <div class="options">
      <!-- 周期 -->
      <div v-if="type === 'interval'">
        <span>从</span>
        <el-input-number
          v-model="intervalStart"
          :min="0"
          :max="58"
          size="small"
          @change="onIntervalChange"
        />
        <span>秒开始，每</span>
        <el-input-number
          v-model="intervalValue"
          :min="1"
          :max="59"
          size="small"
          @change="onIntervalChange"
        />
        <span>秒执行一次</span>
      </div>

      <!-- 指定 -->
      <div v-if="type === 'specific'">
        <el-checkbox-group v-model="specificValues" @change="onSpecificChange">
          <div class="checkboxes">
            <el-checkbox
              v-for="n in 60"
              :key="n-1"
              :label="n-1"
              size="small"
            >
              {{ n-1 < 10 ? '0' + (n-1) : n-1 }}
            </el-checkbox>
          </div>
        </el-checkbox-group>
      </div>

      <!-- 范围 -->
      <div v-if="type === 'range'">
        <span>从</span>
        <el-input-number
          v-model="rangeStart"
          :min="0"
          :max="58"
          size="small"
          @change="onRangeChange"
        />
        <span>到</span>
        <el-input-number
          v-model="rangeEnd"
          :min="rangeStart+1"
          :max="59"
          size="small"
          @change="onRangeChange"
        />
        <span>秒</span>
      </div>
    </div>
  </div>
</template>

<script>
import { RadioGroup, Radio, InputNumber, CheckboxGroup, Checkbox } from 'element-ui'
import Vue from 'vue'

Vue.use(RadioGroup)
Vue.use(Radio)
Vue.use(InputNumber)
Vue.use(CheckboxGroup)
Vue.use(Checkbox)

export default {
  name: 'CronSecond',
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
      intervalValue: 1,
      specificValues: [],
      rangeStart: 0,
      rangeEnd: 59
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
        this.intervalStart = parseInt(parts[0])
        this.intervalValue = parseInt(parts[1])
      } else if (val.includes('-')) {
        const parts = val.split('-')
        this.type = 'range'
        this.rangeStart = parseInt(parts[0])
        this.rangeEnd = parseInt(parts[1])
      } else if (val.includes(',')) {
        this.type = 'specific'
        this.specificValues = val.split(',').map(Number)
      } else {
        this.type = 'specific'
        this.specificValues = [parseInt(val)]
      }
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

.checkboxes {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 4px;
}

.el-checkbox {
  margin: 0;
}
</style>
