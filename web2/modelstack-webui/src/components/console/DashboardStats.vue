<template>
  <div>
    <!-- 页面标题 -->
    <div class="d-flex justify-space-between align-center mb-4">
      <div>
        <h1 class="text-h5 font-weight-bold">数据看板</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">
          查看您的账户使用情况和消费统计
        </p>
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

    <!-- 统计卡片 -->
    <v-row class="mb-4">
      <!-- 当前余额 -->
      <v-col cols="12" sm="6" md="4">
        <v-card variant="flat" class="stats-card stats-card-blue">
          <v-card-text class="pa-5">
            <div class="d-flex align-center justify-space-between">
              <div class="d-flex align-center">
                <v-avatar color="blue" size="56" class="mr-4">
                  <v-icon color="white" size="28">mdi-wallet</v-icon>
                </v-avatar>
                <div>
                  <div class="text-body-2 text-medium-emphasis mb-1">当前余额</div>
                  <div class="text-h4 font-weight-bold">
                    <v-skeleton-loader
                      v-if="loading"
                      type="text"
                      width="120"
                    />
                    <span v-else>{{ formatQuota(userStore.user?.quota || 0) }}</span>
                  </div>
                </div>
              </div>
              <v-btn
                color="blue"
                variant="tonal"
                size="default"
                rounded="pill"
                @click="$router.push('/topup')"
              >
                充值
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- 已用额度 -->
      <v-col cols="12" sm="6" md="4">
        <v-card variant="flat" class="stats-card stats-card-purple">
          <v-card-text class="pa-5">
            <div class="d-flex align-center">
              <v-avatar color="purple" size="56" class="mr-4">
                <v-icon color="white" size="28">mdi-chart-bar</v-icon>
              </v-avatar>
              <div>
                <div class="text-body-2 text-medium-emphasis mb-1">历史消耗</div>
                <div class="text-h4 font-weight-bold">
                  <v-skeleton-loader
                    v-if="loading"
                    type="text"
                    width="120"
                  />
                  <span v-else>{{ formatQuota(userStore.user?.used_quota || 0) }}</span>
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- 今日消耗 -->
      <v-col cols="12" sm="6" md="4">
        <v-card variant="flat" class="stats-card stats-card-green">
          <v-card-text class="pa-5">
            <div class="d-flex align-center">
              <v-avatar color="green" size="56" class="mr-4">
                <v-icon color="white" size="28">mdi-calendar-today</v-icon>
              </v-avatar>
              <div>
                <div class="text-body-2 text-medium-emphasis mb-1">今日消耗</div>
                <div class="text-h4 font-weight-bold">
                  <v-skeleton-loader
                    v-if="loading"
                    type="text"
                    width="120"
                  />
                  <span v-else>{{ formatQuota(todayQuota) }}</span>
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 模型消耗分布图表 -->
    <v-card variant="flat" class="mb-4 pa-2">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2" color="primary">mdi-chart-bar-stacked</v-icon>
        模型消耗分布
      </v-card-title>
      <v-card-text class="pa-2 mt-2">
        <div class="chart-container">
          <v-skeleton-loader
            v-if="loading && quotaData.length === 0"
            type="image"
            height="300"
          />
          <div v-else-if="quotaData.length === 0" class="text-center py-8">
            <v-icon size="64" color="grey-lighten-1">mdi-chart-bar</v-icon>
            <p class="text-body-1 text-medium-emphasis mt-4">暂无消耗数据</p>
          </div>
          <div v-else ref="chartRef" class="chart" style="height: 350px;"></div>
        </div>
      </v-card-text>
    </v-card>

    <!-- 每小时消耗详情表格 -->
    <v-card variant="flat" class="pa-2">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2" color="primary">mdi-clock-outline</v-icon>
        每小时消耗详情
      </v-card-title>
      <v-card-text class="pa-2 mt-2">
        <v-data-table
          :headers="hourlyTableHeaders"
          :items="hourlyTableData"
          :loading="hourlyLoading"
          density="compact"
          class="elevation-0"
        >
          <template v-slot:item.time="{ item }">
            <span class="font-weight-medium">{{ item.time }}</span>
          </template>
          <template v-slot:item.quota="{ item }">
            {{ formatQuota(item.quota) }}
          </template>
          <template v-slot:item.token_used="{ item }">
            {{ item.token_used.toLocaleString() }}
          </template>
          <template v-slot:item.count="{ item }">
            {{ item.count.toLocaleString() }}
          </template>
          <template v-slot:no-data>
            <div class="text-center py-8">
              <v-icon size="48" color="grey-lighten-1">mdi-table-off</v-icon>
              <p class="text-body-2 text-medium-emphasis mt-2">暂无数据</p>
            </div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- 提示消息 -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch, nextTick, onUnmounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { API } from '@/utils/api'
import * as echarts from 'echarts'

const userStore = useUserStore()

// 状态
const loading = ref(false)
const chartRef = ref<HTMLElement | null>(null)
let chartInstance: echarts.ECharts | null = null

// 数据
const quotaData = ref<any[]>([])
const todayQuota = ref(0)
const hourlyData = ref<any[]>([])
const hourlyLoading = ref(false)

// Snackbar
const snackbar = ref({
  show: false,
  message: '',
  color: 'success'
})

// 表格配置
const hourlyTableHeaders = [
  { title: '时间', key: 'time', sortable: true },
  { title: '消耗额度', key: 'quota', sortable: true },
  { title: 'Token 使用量', key: 'token_used', sortable: true },
  { title: '调用次数', key: 'count', sortable: true },
]

// 模型颜色映射
const modelColors: Record<string, string> = {
  'gpt-4': '#10a37f',
  'gpt-4-turbo': '#0ea5e9',
  'gpt-4o': '#8b5cf6',
  'gpt-4o-mini': '#a855f7',
  'gpt-3.5-turbo': '#22c55e',
  'claude-3-opus': '#d97706',
  'claude-3-sonnet': '#f59e0b',
  'claude-3-haiku': '#fbbf24',
  'claude-3.5-sonnet': '#ea580c',
  'gemini-pro': '#4285f4',
  'gemini-1.5-pro': '#34a853',
  'deepseek-chat': '#6366f1',
  'deepseek-coder': '#8b5cf6',
  'qwen-turbo': '#ef4444',
  'qwen-plus': '#f97316',
}

// 默认颜色列表
const defaultColors = [
  '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
  '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#48b8d0'
]

// 获取模型颜色
function getModelColor(model: string): string {
  if (modelColors[model]) return modelColors[model]
  
  // 根据模型名生成一致的颜色
  let hash = 0
  for (let i = 0; i < model.length; i++) {
    hash = model.charCodeAt(i) + ((hash << 5) - hash)
  }
  return defaultColors[Math.abs(hash) % defaultColors.length] || '#5470c6'
}

// 格式化额度
function formatQuota(quota: number): string {
  if (quota === undefined || quota === null) return '$0.00'
  
  // 假设 quota 是以 500000 = $1 的单位存储
  const quotaPerDollar = 500000
  const dollars = quota / quotaPerDollar
  
  if (dollars >= 1000) {
    return `✦${(dollars / 1000).toFixed(2)}k`
  }
  return `✦${dollars.toFixed(4)}`
}

// 计算饼图数据
const pieData = computed(() => {
  if (!quotaData.value || quotaData.value.length === 0) return []
  
  // 按模型聚合
  const modelMap = new Map<string, { quota: number; count: number }>()
  
  quotaData.value.forEach((item: any) => {
    const model = item.model_name || '未知模型'
    const existing = modelMap.get(model) || { quota: 0, count: 0 }
    modelMap.set(model, {
      quota: existing.quota + (item.quota || 0),
      count: existing.count + (item.count || 0)
    })
  })
  
  return Array.from(modelMap.entries())
    .map(([model, data]) => ({
      model,
      quota: data.quota,
      count: data.count
    }))
    .sort((a, b) => b.quota - a.quota)
})

// 每小时消耗表格数据
const hourlyTableData = computed(() => {
  if (!hourlyData.value || hourlyData.value.length === 0) return []
  
  // 按小时聚合
  const hourlyMap = new Map<number, { quota: number; token_used: number; count: number }>()
  
  hourlyData.value.forEach((item: any) => {
    const time = item.created_at
    const existing = hourlyMap.get(time) || { quota: 0, token_used: 0, count: 0 }
    hourlyMap.set(time, {
      quota: existing.quota + (item.quota || 0),
      token_used: existing.token_used + (item.token_used || 0),
      count: existing.count + (item.count || 0)
    })
  })
  
  return Array.from(hourlyMap.entries())
    .map(([time, data]) => ({
      time: formatHourlyTime(time),
      timestamp: time,
      quota: data.quota,
      token_used: data.token_used,
      count: data.count
    }))
    .sort((a, b) => b.timestamp - a.timestamp)
})

// 加载数据
async function loadData() {
  loading.value = true
  try {
    // 获取今天的时间戳范围
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endTimestamp = Math.floor(now.getTime() / 1000) + 3600

    // 获取近24小时的数据（按小时粒度）
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const dayStartTimestamp = Math.floor(dayAgo.getTime() / 1000)

    const res = await API.get(`/api/data/self/?start_timestamp=${dayStartTimestamp}&end_timestamp=${endTimestamp}&default_time=hour`)
    
    if (res.data.success) {
      quotaData.value = res.data.data || []
      
      // 计算今日消耗
      const todayData = quotaData.value.filter((item: any) => {
        const itemDate = new Date(item.created_at * 1000)
        return itemDate >= todayStart
      })
      todayQuota.value = todayData.reduce((sum: number, item: any) => sum + (item.quota || 0), 0)
    } else {
      showMessage(res.data.message || '加载数据失败', 'error')
    }
  } catch (error: any) {
    console.error('Load data error:', error)
    showMessage('加载数据失败', 'error')
  } finally {
    loading.value = false
  }
}

// 加载每小时数据
async function loadHourlyData() {
  hourlyLoading.value = true
  try {
    const now = new Date()
    const endTimestamp = Math.floor(now.getTime() / 1000) + 3600
    
    // 获取近24小时的数据
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const dayStartTimestamp = Math.floor(dayAgo.getTime() / 1000)

    const res = await API.get(`/api/data/self/?start_timestamp=${dayStartTimestamp}&end_timestamp=${endTimestamp}&default_time=hour`)
    
    if (res.data.success) {
      hourlyData.value = res.data.data || []
    } else {
      showMessage(res.data.message || '加载每小时数据失败', 'error')
    }
  } catch (error: any) {
    console.error('Load hourly data error:', error)
    showMessage('加载每小时数据失败', 'error')
  } finally {
    hourlyLoading.value = false
  }
}

// 刷新数据
async function refreshData() {
  await userStore.fetchUserSelf()
  await Promise.all([loadData(), loadHourlyData()])
  showMessage('数据已刷新', 'success')
}

// 显示消息
function showMessage(message: string, color = 'success') {
  snackbar.value = { show: true, message, color }
}

// 初始化图表
function initChart() {
  if (!chartRef.value || quotaData.value.length === 0) return

  if (chartInstance) {
    chartInstance.dispose()
  }

  chartInstance = echarts.init(chartRef.value)
  updateChart()
}

// 格式化时间显示（小时粒度）
function formatTimeLabel(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hour = date.getHours().toString().padStart(2, '0')
  return `${month}-${day} ${hour}:00`
}

// 格式化小时时间显示
function formatHourlyTime(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hour = date.getHours().toString().padStart(2, '0')
  return `${month}-${day} ${hour}:00`
}

// 更新图表 - 堆叠柱状图
function updateChart() {
  if (!chartInstance || quotaData.value.length === 0) return

  // 按时间分组数据，每个时间点包含所有模型的消耗
  const timeModelMap = new Map<number, Map<string, number>>()
  const allModels = new Set<string>()

  // 遍历数据，按 created_at 和 model_name 分组
  quotaData.value.forEach((item: any) => {
    const time = item.created_at
    const model = item.model_name || '未知模型'
    const quota = item.quota || 0

    allModels.add(model)

    if (!timeModelMap.has(time)) {
      timeModelMap.set(time, new Map())
    }
    const modelMap = timeModelMap.get(time)!
    modelMap.set(model, (modelMap.get(model) || 0) + quota)
  })

  // 按时间排序
  let sortedTimes = Array.from(timeModelMap.keys()).sort((a, b) => a - b)
  
  // 如果数据不够24条，向前补齐
  const targetCount = 24
  if (sortedTimes.length < targetCount && sortedTimes.length > 0) {
    const minTime = sortedTimes[0]!
    const hourInSeconds = 60 * 60
    const missingCount = targetCount - sortedTimes.length
    
    // 向前补充缺失的小时
    for (let i = missingCount; i >= 1; i--) {
      const newTime = minTime - i * hourInSeconds
      if (!timeModelMap.has(newTime)) {
        timeModelMap.set(newTime, new Map())
        sortedTimes.unshift(newTime)
      }
    }
    // 重新排序
    sortedTimes = sortedTimes.sort((a, b) => a - b)
  }
  const sortedModels = Array.from(allModels)

  // 为每个模型生成颜色
  const modelColorList = sortedModels.map(model => getModelColor(model))

  // 生成 X 轴数据（时间标签）
  const xAxisData = sortedTimes.map(time => formatTimeLabel(time))

  // 生成每个模型的 series
  const series: echarts.BarSeriesOption[] = sortedModels.map((model, index) => ({
    name: model,
    type: 'bar',
    stack: 'total',
    emphasis: {
      focus: 'series'
    },
    itemStyle: {
      color: modelColorList[index]
    },
    data: sortedTimes.map(time => {
      const modelMap = timeModelMap.get(time)
      return modelMap?.get(model) || 0
    })
  }))

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params: any) => {
        if (!Array.isArray(params) || params.length === 0) return ''
        
        const time = params[0].axisValue
        let total = 0
        let content = `<div style="font-weight: bold; margin-bottom: 8px;">${time}</div>`
        
        // 按消耗额度排序
        const sortedParams = [...params].sort((a, b) => (b.value || 0) - (a.value || 0))
        
        sortedParams.forEach((item: any) => {
          if (item.value > 0) {
            total += item.value
            content += `<div style="display: flex; align-items: center; margin: 4px 0;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${item.color}; margin-right: 8px;"></span>
              <span style="flex: 1;">${item.seriesName}</span>
              <span style="font-weight: 500; margin-left: 12px;">${formatQuota(item.value)}</span>
            </div>`
          }
        })
        
        content += `<div style="border-top: 1px solid #eee; margin-top: 8px; padding-top: 8px; font-weight: bold;">
          总计: ${formatQuota(total)}
        </div>`
        
        return content
      }
    },
    legend: {
      type: 'scroll',
      bottom: 0,
      left: 'center',
      itemWidth: 14,
      itemHeight: 14,
      textStyle: {
        fontSize: 12
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      top: '3%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: xAxisData,
      axisLabel: {
        fontSize: 11
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => formatQuota(value)
      }
    },
    series: series
  }

  chartInstance.setOption(option, true)
}

// 响应式处理
function handleResize() {
  chartInstance?.resize()
}

// 监听数据变化
watch(quotaData, () => {
  nextTick(initChart)
}, { deep: true })

onMounted(async () => {
  await Promise.all([loadData(), loadHourlyData()])
  nextTick(initChart)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})
</script>

<style scoped>
.stats-card {
  border-radius: 16px !important;
  transition: transform 0.2s, box-shadow 0.2s;
  padding: 4px 0;
}

.stats-card-blue {
  background: rgba(33, 150, 243, 0.1) !important;
}

.stats-card-purple {
  background: rgba(156, 39, 176, 0.1) !important;
}

.stats-card-green {
  background: rgba(76, 175, 80, 0.1) !important;
}

.chart-container {
  min-height: 300px;
}

.chart {
  width: 100%;
}

.model-color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}
</style>
