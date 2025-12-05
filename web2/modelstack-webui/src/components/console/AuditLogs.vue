<template>
  <div>
    <!-- 页面标题 -->
    <div class="d-flex justify-space-between align-center mb-4">
      <div>
        <h1 class="text-h5 font-weight-bold">审计日志</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">
          查看 API 调用日志和使用详情
        </p>
      </div>
      <div class="d-flex align-center ga-4">
        <!-- RPM 和 TPM 显示 -->
        <div class="d-flex align-center ga-3" v-if="statData">
          <v-chip color="orange" variant="tonal" size="small">
            <v-icon start size="14">mdi-speedometer</v-icon>
            RPM: {{ formatNumber(statData.rpm || 0) }}
          </v-chip>
          <v-chip color="purple" variant="tonal" size="small">
            <v-icon start size="14">mdi-chart-timeline-variant</v-icon>
            TPM: {{ formatNumber(statData.tpm || 0) }}
          </v-chip>
        </div>
        <v-btn
          color="primary"
          variant="outlined"
          prepend-icon="mdi-refresh"
          :loading="loading"
          @click="refreshData"
        >
          刷新
        </v-btn>
      </div>
    </div>

    <!-- 筛选卡片 -->
    <v-card variant="flat" class="mb-4">
      <v-card-text class="pa-3">
        <v-row dense>
          <v-col cols="12" sm="6" md="3">
            <v-text-field
              v-model="filters.token_name"
              prepend-inner-icon="mdi-key-variant"
              placeholder="令牌名称"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-select
              v-model="filters.type"
              :items="logTypeOptions"
              prepend-inner-icon="mdi-filter-variant"
              placeholder="日志类型"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-select
              v-model="filters.timeRange"
              :items="timeRangeOptions"
              prepend-inner-icon="mdi-clock-outline"
              placeholder="时间范围"
              variant="outlined"
              density="compact"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-btn
              color="primary"
              variant="tonal"
              block
              @click="refreshData"
            >
              <v-icon start>mdi-magnify</v-icon>
              搜索
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- 日志数据表格 -->
    <v-card variant="flat">
      <v-data-table-server
        v-model:items-per-page="itemsPerPage"
        v-model:page="page"
        :headers="headers"
        :items="logs"
        :items-length="totalItems"
        :loading="loading"
        class="elevation-0"
        @update:options="loadLogs"
        item-value="id"
        v-model:expanded="expanded"
        show-expand
      >
        <!-- 时间列 -->
        <template v-slot:item.created_at="{ item }">
          <span class="text-body-2">{{ formatTime(item.created_at) }}</span>
        </template>

        <!-- 模型列 -->
        <template v-slot:item.model_name="{ item }">
          <v-chip size="small" color="primary" variant="tonal">
            {{ item.model_name }}
          </v-chip>
        </template>

        <!-- 令牌列 -->
        <template v-slot:item.token_name="{ item }">
          <span class="font-weight-medium">{{ item.token_name || '-' }}</span>
        </template>

        <!-- 类型列 -->
        <template v-slot:item.type="{ item }">
          <v-chip
            :color="getTypeColor(item.type)"
            size="small"
            variant="tonal"
          >
            {{ getTypeText(item.type) }}
          </v-chip>
        </template>

        <!-- Tokens 列 -->
        <template v-slot:item.tokens="{ item }">
          <div class="text-body-2">
            <span class="text-blue">↑{{ formatNumber(item.prompt_tokens) }}</span>
            <span class="mx-1">/</span>
            <span class="text-green">↓{{ formatNumber(item.completion_tokens) }}</span>
          </div>
        </template>

        <!-- 耗时列 -->
        <template v-slot:item.use_time="{ item }">
          <span :class="getUseTimeClass(item.use_time)">
            {{ item.use_time }}s
          </span>
        </template>

        <!-- 消耗列 -->
        <template v-slot:item.quota="{ item }">
          <span class="font-weight-medium text-orange">
            {{ formatQuota(item.quota) }}
          </span>
        </template>

        <!-- 展开行内容 -->
        <template v-slot:expanded-row="{ columns, item }">
          <tr>
            <td :colspan="columns.length" class="pa-4 bg-grey-lighten-5">
              <v-row dense>
                <v-col cols="12" md="6">
                  <div class="mb-3">
                    <div class="text-body-2 text-medium-emphasis mb-1">请求路径</div>
                    <code class="text-body-2 bg-grey-lighten-3 px-2 py-1 rounded">
                      {{ getOtherField(item.other, 'request_path') || '-' }}
                    </code>
                  </div>
                  <div class="mb-3" v-if="item.ip">
                    <div class="text-body-2 text-medium-emphasis mb-1">IP 地址</div>
                    <span>{{ item.ip }}</span>
                  </div>
                  <div class="mb-3">
                    <div class="text-body-2 text-medium-emphasis mb-1">流式</div>
                    <v-chip
                      :color="item.is_stream ? 'success' : 'grey'"
                      size="small"
                      variant="tonal"
                    >
                      <v-icon start size="14">
                        {{ item.is_stream ? 'mdi-check-circle' : 'mdi-close-circle' }}
                      </v-icon>
                      {{ item.is_stream ? '是' : '否' }}
                    </v-chip>
                  </div>
                </v-col>
                <v-col cols="12" md="6">
                  <div class="mb-3">
                    <div class="text-body-2 text-medium-emphasis mb-1">计费过程</div>
                    <div class="text-body-2 billing-detail">
                      <div class="billing-line" v-if="item.prompt_tokens > 0">
                        <span class="label">输入:</span>
                        <span class="calc">{{ formatNumber(item.prompt_tokens) }} tokens × {{ getInputPrice(item) }}/M</span>
                        <span class="result">= {{ formatQuota(calculateInputCost(item)) }}</span>
                      </div>
                      <div class="billing-line" v-if="item.completion_tokens > 0">
                        <span class="label">输出:</span>
                        <span class="calc">{{ formatNumber(item.completion_tokens) }} tokens × {{ getOutputPrice(item) }}/M</span>
                        <span class="result">= {{ formatQuota(calculateOutputCost(item)) }}</span>
                      </div>
                      <div class="billing-line" v-if="getOtherField(item.other, 'cache_tokens') > 0">
                        <span class="label">缓存:</span>
                        <span class="calc">{{ formatNumber(getOtherField(item.other, 'cache_tokens')) }} tokens × {{ getCachePrice(item) }}/M</span>
                        <span class="result">= {{ formatQuota(calculateCacheCost(item)) }}</span>
                      </div>
                      <v-divider class="my-2" />
                      <div class="billing-line total">
                        <span class="label">合计:</span>
                        <span class="result text-orange font-weight-bold">{{ formatQuota(item.quota) }}</span>
                      </div>
                    </div>
                  </div>
                  <div v-if="item.content">
                    <div class="text-body-2 text-medium-emphasis mb-1">备注</div>
                    <span class="text-body-2">{{ item.content }}</span>
                  </div>
                </v-col>
              </v-row>
            </td>
          </tr>
        </template>

        <!-- 空状态 -->
        <template v-slot:no-data>
          <div class="text-center py-8">
            <v-icon size="64" color="grey-lighten-1">mdi-history</v-icon>
            <p class="text-body-1 text-medium-emphasis mt-4">暂无日志记录</p>
            <p class="text-body-2 text-disabled">API 调用记录将在这里显示</p>
          </div>
        </template>

        <!-- 加载状态 -->
        <template v-slot:loading>
          <v-skeleton-loader type="table-row@5" />
        </template>
      </v-data-table-server>
    </v-card>

    <!-- Snackbar 消息提示 -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { API } from '@/utils/api'

// 日志项接口
interface LogItem {
  id: number
  user_id: number
  created_at: number
  type: number
  content: string
  username: string
  token_name: string
  model_name: string
  quota: number
  prompt_tokens: number
  completion_tokens: number
  use_time: number
  is_stream: boolean
  channel: number
  channel_name: string
  token_id: number
  group: string
  ip: string
  other: string
}

// 统计数据接口
interface StatData {
  quota: number
  token: number
  rpm: number
  tpm: number
}

// 状态
const loading = ref(false)
const logs = ref<LogItem[]>([])
const totalItems = ref(0)
const page = ref(1)
const itemsPerPage = ref(10)
const expanded = ref<string[]>([])
const statData = ref<StatData | null>(null)

// 筛选条件
const filters = reactive({
  token_name: '',
  model_name: '',
  type: null as number | null,
  timeRange: 'today' as string,
})

// 时间范围选项
const timeRangeOptions = [
  { title: '当天', value: 'today' },
  { title: '最近一天', value: '1day' },
  { title: '最近两天', value: '2days' },
  { title: '最近一周', value: '1week' },
  { title: '最近一个月', value: '1month' },
]

// 日志类型选项
const logTypeOptions = [
  { title: '全部', value: null },
  { title: '充值', value: 1 },
  { title: '消费', value: 2 },
  { title: '管理', value: 3 },
  { title: '系统', value: 4 },
]

// 表头配置
const headers = [
  { title: '时间', key: 'created_at', width: '130px' },
  { title: '模型', key: 'model_name', width: '140px' },
  { title: '令牌', key: 'token_name', width: '140px' },
  { title: '类型', key: 'type', width: '80px' },
  { title: 'Tokens', key: 'tokens', width: '140px', sortable: false },
  { title: '耗时', key: 'use_time', width: '80px' },
  { title: '消耗', key: 'quota', width: '100px' },
  { title: '', key: 'data-table-expand', width: '50px' },
]

// Snackbar
const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
})

function showMessage(text: string, color = 'success') {
  snackbar.value = { show: true, text, color }
}

// 获取今天开始的时间戳
function getTodayStartTimestamp(): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.floor(now.getTime() / 1000)
}

// 获取当前时间戳（加1小时）
function getCurrentEndTimestamp(): number {
  return Math.floor(Date.now() / 1000) + 3600
}

// 根据时间范围获取开始时间戳
function getStartTimestampByRange(): number {
  const now = new Date()
  const currentTimestamp = Math.floor(now.getTime() / 1000)
  
  switch (filters.timeRange) {
    case 'today':
      // 当天：从今天0点开始
      now.setHours(0, 0, 0, 0)
      return Math.floor(now.getTime() / 1000)
    case '1day':
      // 最近一天：24小时前
      return currentTimestamp - 24 * 60 * 60
    case '2days':
      // 最近两天：48小时前
      return currentTimestamp - 2 * 24 * 60 * 60
    case '1week':
      // 最近一周：7天前
      return currentTimestamp - 7 * 24 * 60 * 60
    case '1month':
      // 最近一个月：30天前
      return currentTimestamp - 30 * 24 * 60 * 60
    default:
      // 默认当天
      now.setHours(0, 0, 0, 0)
      return Math.floor(now.getTime() / 1000)
  }
}

// 加载日志数据
async function loadLogs(options?: { page: number; itemsPerPage: number }) {
  loading.value = true
  
  try {
    const currentPage = options?.page || page.value
    const pageSize = options?.itemsPerPage || itemsPerPage.value
    
    const startTimestamp = getStartTimestampByRange()
    const endTimestamp = getCurrentEndTimestamp()
    
    let url = `/api/log/self/?p=${currentPage}&page_size=${pageSize}&type=${filters.type || 0}`
    url += `&token_name=${encodeURIComponent(filters.token_name || '')}`
    url += `&model_name=${encodeURIComponent(filters.model_name || '')}`
    url += `&start_timestamp=${startTimestamp}`
    url += `&end_timestamp=${endTimestamp}`
    
    const res = await API.get(url)
    
    if (res.data.success) {
      const data = res.data.data
      logs.value = data.items || []
      totalItems.value = data.total || 0
      page.value = data.page || 1
      itemsPerPage.value = data.page_size || 10
    } else {
      showMessage(res.data.message || '加载日志失败', 'error')
    }
  } catch (error: any) {
    console.error('Load logs error:', error)
    showMessage(error.message || '加载日志失败', 'error')
  } finally {
    loading.value = false
  }
}

// 加载统计数据
async function loadStat() {
  try {
    const startTimestamp = getStartTimestampByRange()
    const endTimestamp = getCurrentEndTimestamp()
    
    let url = `/api/log/self/stat?type=${filters.type || 0}`
    url += `&token_name=${encodeURIComponent(filters.token_name || '')}`
    url += `&model_name=${encodeURIComponent(filters.model_name || '')}`
    url += `&start_timestamp=${startTimestamp}`
    url += `&end_timestamp=${endTimestamp}`
    
    const res = await API.get(url)
    
    if (res.data.success) {
      statData.value = res.data.data
    }
  } catch (error) {
    console.error('Load stat error:', error)
  }
}

// 刷新数据
async function refreshData() {
  page.value = 1
  await Promise.all([loadLogs(), loadStat()])
}

// 格式化额度
function formatQuota(quota: number): string {
  if (quota === undefined || quota === null) return '$0.000000'
  
  // quota 以 500000 = $1 的单位存储
  const quotaPerDollar = 500000
  const dollars = quota / quotaPerDollar
  
  if (dollars >= 1000) {
    return `✦${(dollars / 1000).toFixed(2)}k`
  }
  return `✦${dollars.toFixed(6)}`
}

// 格式化数字
function formatNumber(num: number): string {
  if (num === undefined || num === null) return '0'
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'K'
  }
  return num.toString()
}

// 格式化时间
function formatTime(timestamp: number): string {
  if (timestamp <= 0) return '-'
  const date = new Date(timestamp * 1000)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

// 获取类型颜色
function getTypeColor(type: number): string {
  switch (type) {
    case 1: return 'success' // 充值
    case 2: return 'primary' // 消费
    case 3: return 'warning' // 管理
    case 4: return 'info'    // 系统
    default: return 'grey'
  }
}

// 获取类型文本
function getTypeText(type: number): string {
  switch (type) {
    case 1: return '充值'
    case 2: return '消费'
    case 3: return '管理'
    case 4: return '系统'
    default: return '未知'
  }
}

// 获取耗时样式类
function getUseTimeClass(useTime: number): string {
  if (useTime <= 3) return 'text-success'
  if (useTime <= 10) return 'text-warning'
  return 'text-error'
}

// 解析并获取 other 字段
function getOtherField(other: string, field: string): any {
  if (!other) return null
  try {
    const parsed = JSON.parse(other)
    return parsed[field]
  } catch {
    return null
  }
}

// 获取输入单价 (每百万 tokens)
function getInputPrice(item: LogItem): string {
  const other = item.other
  const modelRatio = getOtherField(other, 'model_ratio') || 1
  const groupRatio = getOtherField(other, 'group_ratio') || 1
  // 基础价格: $0.002/1K tokens = $2/M tokens
  const basePrice = 2
  const price = basePrice * modelRatio * groupRatio
  return `✦${price.toFixed(6)}`
}

// 获取输出单价 (每百万 tokens)
function getOutputPrice(item: LogItem): string {
  const other = item.other
  const modelRatio = getOtherField(other, 'model_ratio') || 1
  const completionRatio = getOtherField(other, 'completion_ratio') || 1
  const groupRatio = getOtherField(other, 'group_ratio') || 1
  // 基础价格: $0.002/1K tokens = $2/M tokens
  const basePrice = 2
  const price = basePrice * modelRatio * completionRatio * groupRatio
  return `✦${price.toFixed(6)}`
}

// 获取缓存单价 (每百万 tokens)
function getCachePrice(item: LogItem): string {
  const other = item.other
  const modelRatio = getOtherField(other, 'model_ratio') || 1
  const cacheRatio = getOtherField(other, 'cache_ratio') || 0.5
  const groupRatio = getOtherField(other, 'group_ratio') || 1
  // 基础价格: $0.002/1K tokens = $2/M tokens
  const basePrice = 2
  const price = basePrice * modelRatio * cacheRatio * groupRatio
  return `✦${price.toFixed(6)}`
}

// 计算输入费用 (返回 quota 单位)
function calculateInputCost(item: LogItem): number {
  const other = item.other
  const modelRatio = getOtherField(other, 'model_ratio') || 1
  const groupRatio = getOtherField(other, 'group_ratio') || 1
  // tokens / 1M * 基础quota * 倍率
  const baseQuotaPerM = 1000000 // 500000 * 2 = $2/M
  return (item.prompt_tokens / 1000000) * baseQuotaPerM * modelRatio * groupRatio
}

// 计算输出费用 (返回 quota 单位)
function calculateOutputCost(item: LogItem): number {
  const other = item.other
  const modelRatio = getOtherField(other, 'model_ratio') || 1
  const completionRatio = getOtherField(other, 'completion_ratio') || 1
  const groupRatio = getOtherField(other, 'group_ratio') || 1
  const baseQuotaPerM = 1000000
  return (item.completion_tokens / 1000000) * baseQuotaPerM * modelRatio * completionRatio * groupRatio
}

// 计算缓存费用 (返回 quota 单位)
function calculateCacheCost(item: LogItem): number {
  const other = item.other
  const cacheTokens = getOtherField(other, 'cache_tokens') || 0
  const modelRatio = getOtherField(other, 'model_ratio') || 1
  const cacheRatio = getOtherField(other, 'cache_ratio') || 0.5
  const groupRatio = getOtherField(other, 'group_ratio') || 1
  const baseQuotaPerM = 1000000
  return (cacheTokens / 1000000) * baseQuotaPerM * modelRatio * cacheRatio * groupRatio
}

// 组件挂载时加载数据
onMounted(() => {
  refreshData()
})
</script>

<style scoped>
.text-blue {
  color: #1976d2;
}

.text-green {
  color: #4caf50;
}

.text-orange {
  color: #ff9800;
}

.billing-detail {
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  padding: 12px;
}

.billing-line {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-family: monospace;
}

.billing-line .label {
  min-width: 48px;
  color: #666;
}

.billing-line .calc {
  flex: 1;
  color: #888;
}

.billing-line .result {
  font-weight: 500;
}

.billing-line.total {
  padding-top: 8px;
}
</style>
