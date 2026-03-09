<template>
  <div class="vue-cron">
    <!-- 标签页切换 -->
    <el-tabs v-model="activeTab" @tab-click="handleTabChange">
      <el-tab-pane label="秒" name="second">
        <cron-second v-model="cronArr[0]" @change="handleChange" />
      </el-tab-pane>
      <el-tab-pane label="分" name="minute">
        <cron-minute v-model="cronArr[1]" @change="handleChange" />
      </el-tab-pane>
      <el-tab-pane label="时" name="hour">
        <cron-hour v-model="cronArr[2]" @change="handleChange" />
      </el-tab-pane>
      <el-tab-pane label="日" name="day">
        <cron-day v-model="cronArr[3]" @change="handleChange" />
      </el-tab-pane>
      <el-tab-pane label="月" name="month">
        <cron-month v-model="cronArr[4]" @change="handleChange" />
      </el-tab-pane>
      <el-tab-pane label="周" name="week">
        <cron-week v-model="cronArr[5]" @change="handleChange" />
      </el-tab-pane>
      <el-tab-pane label="年" name="year">
        <cron-year v-model="cronArr[6]" @change="handleChange" />
      </el-tab-pane>
    </el-tabs>

    <!-- Cron表达式显示 -->
    <div class="cron-result">
      <el-input v-model="cronExpression" readonly>
        <template slot="prepend">Cron表达式</template>
        <el-button slot="append" @click="copyCron" type="primary">复制</el-button>
      </el-input>
      <div class="expression-valid" :class="{ 'is-invalid': !isValid }">
        <i :class="validIcon"></i>
        {{ validMessage }}
        <span v-if="!isValid" class="error-detail">{{ errorDetail }}</span>
      </div>
    </div>

    <!-- 下次执行时间预览 -->
    <div class="next-times">
      <h4>
        下次执行时间预览
        <el-tooltip content="基于当前时间计算未来执行时间" placement="top">
          <i class="el-icon-info"></i>
        </el-tooltip>
      </h4>
      <div class="time-controls">
        <el-button-group size="mini">
          <el-button @click="refreshTimes" title="刷新">
            <i class="el-icon-refresh"></i>
          </el-button>
          <el-button @click="showMore = !showMore">
            {{ showMore ? '显示5次' : '显示10次' }}
          </el-button>
        </el-button-group>
        <el-select
          v-model="timezone"
          size="mini"
          style="width: 120px"
          @change="calculateNextTimes"
        >
          <el-option label="本地时间" value="local"></el-option>
          <el-option label="UTC时间" value="utc"></el-option>
        </el-select>
      </div>
      <div v-if="isValid && nextExecuteTimes.length > 0" class="time-list">
        <div
          v-for="(time, index) in nextExecuteTimes"
          :key="index"
          class="time-item"
          :class="{ 'first-time': index === 0 }"
        >
          <i class="el-icon-time"></i>
          <span class="time-index">#{{ index + 1 }}</span>
          <span class="time-value">{{ formatTime(time.timestamp) }}</span>
          <span class="time-relative">({{ time.relative }})</span>
        </div>
      </div>
      <div v-else class="no-times">
        <i class="el-icon-warning-outline"></i>
        <span>{{ noTimesMessage }}</span>
      </div>
    </div>

    <!-- 常用表达式 -->
    <div class="quick-select">
      <h4>常用表达式</h4>
      <div class="quick-buttons">
        <el-button
          v-for="item in quickList"
          :key="item.value"
          size="small"
          @click="selectQuick(item)"
          :type="cronExpression === item.value ? 'primary' : ''"
        >
          {{ item.label }}
        </el-button>
      </div>
    </div>

    <!-- 表达式说明 -->
    <div class="cron-help">
      <el-collapse>
        <el-collapse-item title="Cron表达式说明">
          <div class="help-content">
            <p><strong>格式：</strong>秒 分 时 日 月 周 年</p>
            <p><strong>Spring Cron格式（6位）：</strong>秒 分 时 日 月 周</p>
            <p><strong>Quartz Cron格式（7位）：</strong>秒 分 时 日 月 周 年</p>
            <p><strong>特殊字符：</strong></p>
            <ul>
              <li><code>*</code>：任意值</li>
              <li><code>?</code>：不指定（仅用于日和周，二者不能同时指定）</li>
              <li><code>-</code>：范围，如 1-5</li>
              <li><code>,</code>：多个值，如 1,3,5</li>
              <li><code>/</code>：步长，如 */5 每5单位</li>
              <li><code>L</code>：最后，如 L（最后一天）</li>
              <li><code>W</code>：工作日，如 15W（15号最近的工作日）</li>
              <li><code>#</code>：第几个星期几，如 2#3（第3个星期一）</li>
            </ul>
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>
  </div>
</template>

<script>
import Vue from 'vue'
import {
  Tabs, TabPane, Input, Button, Message,
  Tooltip, Select, Option, Collapse, CollapseItem
} from 'element-ui'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.locale('zh-cn')

// 导入组件
import CronSecond from '@/components/Custom/CronSecond.vue'
import CronMinute from '@/components/Custom/CronMinute.vue'
import CronHour from '@/components/Custom/CronHour.vue'
import CronDay from '@/components/Custom/CronDay.vue'
import CronMonth from '@/components/Custom/CronMonth.vue'
import CronWeek from '@/components/Custom/CronWeek.vue'
import CronYear from '@/components/Custom/CronYear.vue'

Vue.use(Tabs)
Vue.use(TabPane)
Vue.use(Input)
Vue.use(Button)
Vue.use(Tooltip)
Vue.use(Select)
Vue.use(Option)
Vue.use(Collapse)
Vue.use(CollapseItem)

export default {
  name: 'VueCron',
  components: {
    CronSecond,
    CronMinute,
    CronHour,
    CronDay,
    CronMonth,
    CronWeek,
    CronYear
  },
  props: {
    value: {
      type: String,
      default: '* * * * * ? *'
    },
    showCount: {
      type: Number,
      default: 5
    },
    // 支持Spring格式（6位）或Quartz格式（7位）
    format: {
      type: String,
      default: 'quartz', // 'spring' 或 'quartz'
      validator: (value) => ['spring', 'quartz'].includes(value)
    }
  },
  data() {
    return {
      activeTab: 'second',
      cronArr: ['*', '*', '*', '*', '*', '?', '*'],
      nextExecuteTimes: [],
      showMore: false,
      timezone: 'local',
      isValid: true,
      errorDetail: '',
      noTimesMessage: '无有效执行时间',

      // 常用表达式列表（修正错误的表达式）
      quickList: [
        // 秒级
        { label: '每秒执行', value: '* * * * * ? *' },
        { label: '每5秒执行', value: '*/5 * * * * ? *' },
        { label: '每30秒执行', value: '*/30 * * * * ? *' },

        // 分钟级
        { label: '每分钟执行', value: '0 * * * * ? *' },
        { label: '每5分钟执行', value: '0 */5 * * * ? *' },
        { label: '每30分钟执行', value: '0 */30 * * * ? *' },

        // 小时级
        { label: '每小时执行', value: '0 0 * * * ? *' },

        // 天级
        { label: '每天0点执行', value: '0 0 0 * * ? *' },
        { label: '每天12点执行', value: '0 0 12 * * ? *' },

        // 周级
        { label: '每周一0点执行', value: '0 0 0 ? * 2 *' },
        { label: '每周一至周五9点', value: '0 0 9 ? * 2-6 *' },
        { label: '周末10点', value: '0 0 10 ? * 1,7 *' },

        // 月级
        { label: '每月1号0点', value: '0 0 0 1 * ? *' },

        // 年级
        { label: '每年1月1日0点', value: '0 0 0 1 1 ? *' },

        // 特殊
        { label: '每季度1号', value: '0 0 0 1 1,4,7,10 ? *' },
        { label: '每半年1号', value: '0 0 0 1 1,7 ? *' },

        // Spring格式（6位）
        { label: 'Spring: 每秒', value: '* * * * * ?' },
        { label: 'Spring: 每分钟', value: '0 * * * * ?' },
        { label: 'Spring: 每天12点', value: '0 0 12 * * ?' }
      ]
    }
  },
  computed: {
    cronExpression: {
      get() {
        if (this.format === 'spring') {
          // Spring格式：去掉年字段
          return this.cronArr.slice(0, 6).join(' ')
        }
        return this.cronArr.join(' ')
      },
      set(val) {
        const parts = val.split(' ')
        if (parts.length === 6 && this.format === 'spring') {
          // Spring格式转Quartz格式
          this.cronArr = [...parts, '*']
        } else if (parts.length === 7 && this.format === 'quartz') {
          this.cronArr = parts
        }
        this.$emit('input', val)
        this.$emit('change', val)
        this.validateCronExpression(val)
        this.calculateNextTimes()
      }
    },

    displayCount() {
      return this.showMore ? 10 : this.showCount
    },

    validIcon() {
      return this.isValid ? 'el-icon-success' : 'el-icon-error'
    },

    validMessage() {
      return this.isValid ? '表达式有效' : '表达式无效'
    }
  },
  watch: {
    value: {
      immediate: true,
      handler(newVal) {
        if (newVal && newVal !== this.cronExpression) {
          const parts = newVal.split(' ')
          if (parts.length === 6 && this.format === 'spring') {
            this.cronArr = [...parts, '*']
          } else if (parts.length === 7 && this.format === 'quartz') {
            this.cronArr = parts
          }
          this.validateCronExpression(newVal)
          this.calculateNextTimes()
        }
      }
    }
  },
  mounted() {
    this.validateCronExpression(this.cronExpression)
    this.calculateNextTimes()
  },
  methods: {
    handleChange() {
      this.cronExpression = this.cronArr.join(' ')
    },

    handleTabChange(tab) {
      this.activeTab = tab.name
    },

    selectQuick(item) {
      this.cronExpression = item.value
      Message.success(`已选择: ${item.label}`)
    },

    copyCron() {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(this.cronExpression)
          .then(() => Message.success('已复制到剪贴板'))
          .catch(() => this.fallbackCopy())
      } else {
        this.fallbackCopy()
      }
    },

    fallbackCopy() {
      const input = document.createElement('input')
      document.body.appendChild(input)
      input.setAttribute('value', this.cronExpression)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      Message.success('已复制到剪贴板')
    },

    refreshTimes() {
      this.calculateNextTimes()
      Message.success('时间已刷新')
    },

    formatTime(timestamp) {
      const date = dayjs(timestamp)
      return this.timezone === 'utc'
        ? date.utc().format('YYYY-MM-DD HH:mm:ss') + ' UTC'
        : date.format('YYYY-MM-DD HH:mm:ss')
    },

    calculateNextTimes() {
      this.nextExecuteTimes = []

      if (!this.isValid) {
        this.noTimesMessage = '表达式无效，无法计算执行时间'
        return
      }

      try {
        const cron = this.cronExpression
        const now = this.timezone === 'utc' ? dayjs().utc() : dayjs()
        let currentTime = now.clone()
        const count = this.displayCount

        for (let i = 0; i < count; i++) {
          const nextTime = this.getNextExecutionTime(currentTime, cron)

          if (!nextTime) {
            break
          }

          this.nextExecuteTimes.push({
            timestamp: nextTime.valueOf(),
            time: this.formatTime(nextTime.valueOf()),
            relative: this.getRelativeTime(now, nextTime)
          })

          currentTime = nextTime.add(1, 'second')
        }

        if (this.nextExecuteTimes.length === 0) {
          this.noTimesMessage = '未找到有效执行时间'
        }
      } catch (error) {
        console.error('计算执行时间失败:', error)
        this.noTimesMessage = '计算执行时间失败: ' + error.message
      }
    },

    // 改进的Cron表达式验证
    validateCronExpression(cron) {
      this.isValid = true
      this.errorDetail = ''

      if (!cron || typeof cron !== 'string') {
        this.isValid = false
        this.errorDetail = '表达式不能为空'
        return false
      }

      const parts = cron.split(' ')

      // 检查字段数量
      const expectedLength = this.format === 'spring' ? 6 : 7
      if (parts.length !== expectedLength) {
        this.isValid = false
        this.errorDetail = `应为${expectedLength}个字段，实际为${parts.length}个`
        return false
      }

      // 检查日和周的冲突（Spring/Quartz格式）
      if (parts[3] !== '?' && parts[5] !== '?') {
        this.isValid = false
        this.errorDetail = '日和周不能同时指定，其中一个必须为?'
        return false
      }

      // 验证各个字段
      const fieldConfigs = [
        { index: 0, name: '秒', min: 0, max: 59 },
        { index: 1, name: '分', min: 0, max: 59 },
        { index: 2, name: '时', min: 0, max: 23 },
        { index: 3, name: '日', min: 1, max: 31 },
        { index: 4, name: '月', min: 1, max: 12 },
        { index: 5, name: '周', min: 1, max: 7 },
        { index: 6, name: '年', min: 1970, max: 2099 }
      ]

      for (let i = 0; i < expectedLength; i++) {
        const field = parts[i]
        const config = fieldConfigs[i]

        if (!this.isValidCronField(field, config)) {
          this.isValid = false
          this.errorDetail = `${config.name}字段无效: ${field}`
          return false
        }
      }

      return true
    },

    // 验证单个Cron字段
    isValidCronField(field, config) {
      // 处理特殊值
      if (field === '*' || field === '?') {
        return true
      }

      // 处理步长表达式
      if (field.includes('/')) {
        const [range, step] = field.split('/')
        const stepNum = parseInt(step, 10)
        if (isNaN(stepNum) || stepNum < 1) {
          return false
        }
        // 检查范围部分
        return this.isValidRangeOrValue(range, config)
      }

      // 处理列表表达式
      if (field.includes(',')) {
        return field.split(',').every(item => this.isValidCronField(item, config))
      }

      // 处理范围表达式
      if (field.includes('-')) {
        return this.isValidRangeOrValue(field, config)
      }

      // 处理L、W等特殊字符
      if (field.includes('L') || field.includes('W') || field.includes('#')) {
        // 简化的特殊字符验证
        if (field === 'L' || field === 'LW') return true
        if (field.includes('#') && field.split('#').length === 2) {
          const [weekday, occurrence] = field.split('#')
          return this.isValidValue(weekday, config) &&
            !isNaN(parseInt(occurrence, 10)) &&
            parseInt(occurrence, 10) >= 1 &&
            parseInt(occurrence, 10) <= 5
        }
        if (field.endsWith('W') && field.length > 1) {
          const day = field.slice(0, -1)
          return this.isValidValue(day, config)
        }
        if (field.includes('L-') && field.split('-').length === 2) {
          const day = field.split('-')[1]
          return !isNaN(parseInt(day, 10))
        }
      }

      // 单个值验证
      return this.isValidValue(field, config)
    },

    // 验证单个值
    isValidValue(value, config) {
      const num = parseInt(value, 10)
      if (isNaN(num)) return false

      if (config.name === '月') {
        // 月份可以使用英文缩写
        const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
          'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
        if (monthNames.includes(value.toUpperCase())) return true
      }

      if (config.name === '周') {
        // 星期可以使用英文缩写
        const weekNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
        if (weekNames.includes(value.toUpperCase())) return true
      }

      return num >= config.min && num <= config.max
    },

    // 验证范围或值
    isValidRangeOrValue(field, config) {
      if (field === '*') return true

      if (field.includes('-')) {
        const [start, end] = field.split('-')
        const startNum = parseInt(start, 10)
        const endNum = parseInt(end, 10)

        if (isNaN(startNum) || isNaN(endNum)) return false
        return startNum >= config.min &&
          endNum >= startNum &&
          endNum <= config.max
      }

      return this.isValidValue(field, config)
    },

    // 计算下一次执行时间（简化的Cron计算）
    getNextExecutionTime(currentTime, cronExpression) {
      try {
        const parts = cronExpression.split(' ')
        const isSpringFormat = parts.length === 6

        // 解析各个字段
        const [secondField, minuteField, hourField, dayField, monthField, weekField, yearField] =
          isSpringFormat ? [...parts, '*'] : parts

        let time = currentTime.clone()
        let attempts = 0
        const maxAttempts = 10000 // 防止无限循环

        while (attempts < maxAttempts) {
          attempts++

          // 获取当前时间的各个部分
          const second = time.second()
          const minute = time.minute()
          const hour = time.hour()
          const day = time.date()
          const month = time.month() + 1 // dayjs月份是0-11
          const year = time.year()
          const dayOfWeek = time.day() // 0-6, 0=周日
          const cronDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek // 转换为1-7, 1=周日

          // 检查年份
          if (!this.matchesField(yearField, year, { min: 1970, max: 2099 })) {
            time = time.add(1, 'year').startOf('year')
            continue
          }

          // 检查月份
          if (!this.matchesField(monthField, month, { min: 1, max: 12 })) {
            time = time.add(1, 'month').startOf('month')
            continue
          }

          // 检查日和周
          let dayMatches = false
          if (dayField !== '?' && weekField === '?') {
            // 日指定，周不指定
            dayMatches = this.matchesDayField(dayField, day, time)
          } else if (dayField === '?' && weekField !== '?') {
            // 周指定，日不指定
            dayMatches = this.matchesWeekField(weekField, cronDayOfWeek)
          } else if (dayField === '?' && weekField === '?') {
            // 日和周都不指定，相当于任意
            dayMatches = true
          }

          if (!dayMatches) {
            time = time.add(1, 'day').startOf('day')
            continue
          }

          // 检查小时
          if (!this.matchesField(hourField, hour, { min: 0, max: 23 })) {
            time = time.add(1, 'hour').startOf('hour')
            continue
          }

          // 检查分钟
          if (!this.matchesField(minuteField, minute, { min: 0, max: 59 })) {
            time = time.add(1, 'minute').startOf('minute')
            continue
          }

          // 检查秒
          if (!this.matchesField(secondField, second, { min: 0, max: 59 })) {
            time = time.add(1, 'second')
            continue
          }

          // 所有检查通过
          return time
        }

        return null
      } catch (error) {
        console.error('计算下次执行时间失败:', error)
        return null
      }
    },

    // 匹配字段
    matchesField(field, value, config) {
      if (field === '*' || field === '?') return true

      // 处理步长
      if (field.includes('/')) {
        const [range, stepStr] = field.split('/')
        const step = parseInt(stepStr, 10)

        if (range === '*') {
          return value % step === 0
        }

        // 处理带范围的步长
        if (range.includes('-')) {
          const [start, end] = range.split('-')
          const startNum = parseInt(start, 10)
          const endNum = parseInt(end, 10)

          if (value < startNum || value > endNum) return false
          return (value - startNum) % step === 0
        }
      }

      // 处理列表
      if (field.includes(',')) {
        const values = field.split(',')
        return values.some(item => {
          const num = parseInt(item, 10)
          return !isNaN(num) && num === value
        })
      }

      // 处理范围
      if (field.includes('-')) {
        const [start, end] = field.split('-')
        const startNum = parseInt(start, 10)
        const endNum = parseInt(end, 10)
        return value >= startNum && value <= endNum
      }

      // 单个值
      const fieldNum = parseInt(field, 10)
      return !isNaN(fieldNum) && fieldNum === value
    },

    // 匹配日字段（处理L、W等特殊字符）
    matchesDayField(field, day, time) {
      // 处理最后一天
      if (field === 'L') {
        const lastDay = time.endOf('month').date()
        return day === lastDay
      }

      // 处理工作日
      if (field.endsWith('W') && field.length > 1) {
        const targetDay = parseInt(field.slice(0, -1), 10)
        // 简化处理：只检查是否为工作日
        const dayOfWeek = time.day()
        return day === targetDay && dayOfWeek >= 1 && dayOfWeek <= 5
      }

      return this.matchesField(field, day, { min: 1, max: 31 })
    },

    // 匹配周字段
    matchesWeekField(field, dayOfWeek) {
      // 处理第N个星期X，如 2#3 (第3个星期一)
      if (field.includes('#')) {
        const [weekdayStr, occurrenceStr] = field.split('#')
        const weekday = parseInt(weekdayStr, 10)
        const occurrence = parseInt(occurrenceStr, 10)

        // 简化的实现：只检查星期几是否匹配
        return weekday === dayOfWeek
      }

      // 处理最后一个星期X，如 5L (最后一个星期五)
      if (field.endsWith('L') && field.length > 1) {
        const weekday = parseInt(field.slice(0, -1), 10)
        // 简化的实现：只检查星期几是否匹配
        return weekday === dayOfWeek
      }

      return this.matchesField(field, dayOfWeek, { min: 1, max: 7 })
    },

    // 计算相对时间
    getRelativeTime(now, target) {
      const diffSeconds = target.diff(now, 'second')

      if (diffSeconds < 0) {
        return '已过去'
      } else if (diffSeconds < 60) {
        return `${diffSeconds}秒后`
      } else if (diffSeconds < 3600) {
        const minutes = Math.floor(diffSeconds / 60)
        return `${minutes}分钟后`
      } else if (diffSeconds < 86400) {
        const hours = Math.floor(diffSeconds / 3600)
        const minutes = Math.floor((diffSeconds % 3600) / 60)
        return `${hours}小时${minutes}分钟后`
      } else {
        const days = Math.floor(diffSeconds / 86400)
        const hours = Math.floor((diffSeconds % 86400) / 3600)
        if (days > 30) {
          const months = Math.floor(days / 30)
          return `${months}个月后`
        }
        return `${days}天${hours}小时后`
      }
    },

    // 测试表达式
    testExpression() {
      this.$emit('test', this.cronExpression)
    }
  }
}
</script>

<style scoped>
.vue-cron {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,.1);
  min-width: 800px;
  max-width: 1200px;
  margin: 0 auto;
}

.cron-result {
  margin: 20px 0;
}

.expression-valid {
  margin-top: 8px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.expression-valid.is-invalid {
  color: #f56c6c;
}

.expression-valid:not(.is-invalid) {
  color: #67c23a;
}

.error-detail {
  font-size: 11px;
  opacity: 0.8;
}

.next-times {
  margin: 20px 0;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 6px;
}

.time-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.time-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.time-item {
  background: #fff;
  padding: 10px 15px;
  border-radius: 4px;
  border: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s;
}

.time-item.first-time {
  background: #ecf5ff;
  border-color: #b3d8ff;
}

.time-item:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,.1);
}

.time-index {
  font-weight: bold;
  color: #409eff;
  min-width: 30px;
}

.time-value {
  flex: 1;
  font-family: 'Courier New', monospace;
  font-size: 14px;
}

.time-relative {
  color: #909399;
  font-size: 12px;
}

.no-times {
  text-align: center;
  padding: 20px;
  color: #909399;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.no-times .el-icon-warning-outline {
  font-size: 24px;
  color: #e6a23c;
}

.quick-select {
  margin-top: 20px;
}

.quick-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.quick-buttons .el-button {
  margin: 0;
}

.cron-help {
  margin-top: 20px;
}

.help-content {
  font-size: 12px;
  line-height: 1.6;
}

.help-content p {
  margin: 5px 0;
}

.help-content ul {
  margin: 5px 0;
  padding-left: 20px;
}

.help-content code {
  background: #f5f5f5;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: monospace;
  font-size: 11px;
}

.el-icon-info {
  margin-left: 5px;
  color: #909399;
  cursor: help;
}

h4 {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 14px;
  display: flex;
  align-items: center;
}

.el-tabs {
  margin-bottom: 20px;
}

/* 响应式设计 */
@media (max-width: 992px) {
  .vue-cron {
    min-width: auto;
    padding: 15px;
  }

  .quick-buttons {
    flex-direction: column;
    align-items: stretch;
  }

  .quick-buttons .el-button {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .vue-cron {
    padding: 10px;
  }

  .time-controls {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }

  .time-controls .el-select {
    width: 100%;
  }

  .time-item {
    flex-wrap: wrap;
    gap: 5px;
  }

  .time-relative {
    margin-left: auto;
  }
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.time-item {
  animation: fadeIn 0.3s ease-out;
}

.time-item:nth-child(1) { animation-delay: 0.1s; }
.time-item:nth-child(2) { animation-delay: 0.2s; }
.time-item:nth-child(3) { animation-delay: 0.3s; }
.time-item:nth-child(4) { animation-delay: 0.4s; }
.time-item:nth-child(5) { animation-delay: 0.5s; }

/* 滚动条样式 */
.time-list {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 5px;
}

.time-list::-webkit-scrollbar {
  width: 6px;
}

.time-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.time-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.time-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
