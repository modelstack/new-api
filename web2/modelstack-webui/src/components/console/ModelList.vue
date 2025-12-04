<template>
    <!-- 页面标题 -->
    <div class="d-flex justify-space-between align-center mb-4">
        <div>
            <h1 class="text-h5 font-weight-bold">可用模型</h1>
            <p class="text-body-2 text-medium-emphasis mt-1">
                浏览并选择适合您需求的模型
            </p>
        </div>
    </div>
    <div>
        <!-- 搜索栏 -->
        <div class="d-flex flex-column flex-sm-row align-center ga-2 ga-sm-3 mb-3 mb-sm-4">
            <v-text-field v-model="searchQuery" placeholder="搜索模型名称..." prepend-inner-icon="mdi-magnify"
                variant="outlined" density="comfortable" hide-details clearable class="search-field flex-grow-1 w-100"
                :style="{ maxWidth: $vuetify.display.smAndUp ? '500px' : '100%' }" />
        </div>

        <!-- 结果统计 -->
        <div class="text-caption text-medium-emphasis mb-2 mb-sm-3">
            共 {{ filteredModels.length }} 个模型
            <span v-if="hasActiveFilters" class="ml-2">(已筛选)</span>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="d-flex justify-center py-16">
            <v-progress-circular indeterminate color="primary" size="48" />
        </div>

        <!-- 表格视图 -->
        <v-card v-else variant="text" class="overflow-hidden">
            <v-data-table :headers="tableHeaders" :items="filteredModels" :items-per-page="20" class="model-table"
                hover>
                <template #item.model_name="{ item }">
                    <div class="d-flex align-center ga-2 py-2">
                        <v-avatar size="32" color="surface-variant">
                            <v-img v-if="getModelIcon(item)" :src="getModelIcon(item)" :alt="item.model_name" />
                            <v-icon v-else size="18" color="primary">mdi-cube-outline</v-icon>
                        </v-avatar>
                        <div>
                            <div class="font-weight-medium">{{ item.model_name }}</div>
                            <div class="text-caption text-medium-emphasis text-truncate" style="max-width: 500px;">
                                {{ item.description || '-' }}
                            </div>
                        </div>
                    </div>
                </template>

                <template #item.tags="{ item }">
                    <v-chip v-if="item.tags" size="x-small" color="primary" variant="tonal">
                        {{ item.tags }}
                    </v-chip>
                    <span v-else class="text-disabled">-</span>
                </template>

                <template #item.quota_type="{ item }">
                    <v-chip size="x-small" :color="item.quota_type === 0 ? 'success' : 'warning'" variant="tonal">
                        {{ item.quota_type === 0 ? '按量计费' : '按次计费' }}
                    </v-chip>
                </template>

                <template #item.price="{ item }">
                    <div>
                        <div class="text-caption">
                            <span class="text-medium-emphasis">输入:</span>
                            <span class="font-weight-medium ml-1">✦{{ formatPrice(item.model_ratio) }}/M</span>
                        </div>
                        <div class="text-caption">
                            <span class="text-medium-emphasis">输出:</span>
                            <span class="font-weight-medium ml-1">✦{{ formatPrice(item.model_ratio *
                                item.completion_ratio) }}/M</span>
                        </div>
                    </div>
                </template>

                <template #item.actions="{ item }">
                    <v-btn variant="text" icon size="small" @click="copyModelName(item.model_name)">
                        <v-icon size="small">mdi-content-copy</v-icon>
                        <v-tooltip activator="parent" location="top">复制模型名称</v-tooltip>
                    </v-btn>
                </template>

                <!-- 空状态 -->
                <template #no-data>
                    <div class="text-center pa-8">
                        <v-icon size="48" color="medium-emphasis" class="mb-4">mdi-cube-off-outline</v-icon>
                        <div class="text-body-1 text-medium-emphasis mb-2">未找到模型</div>
                        <div class="text-body-2 text-disabled">尝试调整搜索关键词</div>
                    </div>
                </template>
            </v-data-table>
        </v-card>

        <!-- 复制成功提示 -->
        <v-snackbar v-model="showCopySnackbar" :timeout="2000" color="success">
            <v-icon start>mdi-check</v-icon>
            已复制到剪贴板
        </v-snackbar>
    </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'

// 类型定义
interface Model {
    model_name: string
    vendor_id?: number
    quota_type: number
    model_ratio: number
    model_price: number
    owner_by: string
    completion_ratio: number
    enable_groups: string[]
    supported_endpoint_types: string[]
    description?: string
    icon?: string
    tags?: string
}

interface Vendor {
    id: number
    name: string
    icon: string
}

interface PricingResponse {
    success: boolean
    data: Model[]
    vendors: Vendor[]
    auto_groups: string[]
    group_ratio: Record<string, number>
    usable_group: Record<string, string>
    supported_endpoint: Record<string, { path: string; method: string }>
}

// 状态
const loading = ref(true)
const models = ref<Model[]>([])
const vendors = ref<Vendor[]>([])
const searchQuery = ref('')
const showCopySnackbar = ref(false)

// 表格列定义
const tableHeaders = [
    { title: '模型名称', key: 'model_name', sortable: true },
    { title: '标签', key: 'tags', sortable: false },
    { title: '计费类型', key: 'quota_type', sortable: true },
    { title: '价格', key: 'price', sortable: true },
    { title: '操作', key: 'actions', sortable: false, align: 'center' as const },
]

// 计算属性
const hasActiveFilters = computed(() => {
    return searchQuery.value && searchQuery.value.trim() !== ''
})

const filteredModels = computed(() => {
    let result = [...models.value]

    // 搜索过滤
    if (searchQuery.value && searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase().trim()
        result = result.filter(model =>
            model.model_name.toLowerCase().includes(query) ||
            (model.description && model.description.toLowerCase().includes(query))
        )
    }

    return result
})

// 方法
const getIconUrl = (icon: string | undefined): string => {
    if (!icon) return ''
    // 转换 Gemini.Color -> gemini-color
    const slug = icon.toLowerCase().replace('.', '-')
    return `https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/${slug}.svg`
}

const getVendorIcon = (vendorId: number | undefined): string => {
    if (!vendorId) return ''
    const vendor = vendors.value.find(v => v.id === vendorId)
    return vendor?.icon || ''
}

const getModelIcon = (model: Model): string => {
    // 优先使用模型自己的图标
    if (model.icon) {
        return getIconUrl(model.icon)
    }
    // 否则使用供应商图标
    return getIconUrl(getVendorIcon(model.vendor_id))
}

const formatPrice = (ratio: number): string => {
    // 将倍率转换为价格（假设基准价格为 $0.002/1K tokens = $2/M tokens）
    const basePrice = 2
    const price = ratio * basePrice
    if (price < 0.01) {
        return price.toFixed(4)
    } else if (price < 1) {
        return price.toFixed(3)
    }
    return price.toFixed(2)
}

const copyModelName = async (name: string) => {
    try {
        await navigator.clipboard.writeText(name)
        showCopySnackbar.value = true
    } catch (err) {
        console.error('Failed to copy:', err)
    }
}

const fetchPricing = async () => {
    loading.value = true
    try {
        const response = await fetch('/api/pricing')
        const data: PricingResponse = await response.json()
        if (data.success) {
            models.value = data.data
            vendors.value = data.vendors
        }
    } catch (error) {
        console.error('Failed to fetch pricing:', error)
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    fetchPricing()
})
</script>

<style scoped>
.search-field {
    width: 100%;
}

@media (min-width: 600px) {
    .search-field {
        width: auto;
    }
}

.model-table :deep(.v-data-table__td) {
    padding-top: 8px !important;
    padding-bottom: 8px !important;
}

/* 移动端表格优化 */
@media (max-width: 599px) {
    .model-table :deep(.v-data-table__td) {
        padding: 8px 4px !important;
    }

    .model-table :deep(.v-data-table__th) {
        padding: 8px 4px !important;
    }
}
</style>
