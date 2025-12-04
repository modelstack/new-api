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
        <!-- 搜索栏和视图切换 -->
        <div class="d-flex flex-column flex-sm-row align-center ga-2 ga-sm-3 mb-3 mb-sm-4">
            <v-text-field v-model="searchQuery" placeholder="搜索模型名称..." prepend-inner-icon="mdi-magnify"
                variant="outlined" density="comfortable" hide-details clearable class="search-field flex-grow-1 w-100"
                :style="{ maxWidth: $vuetify.display.smAndUp ? '500px' : '100%' }" />
            <v-btn-toggle v-model="viewMode" mandatory density="comfortable" variant="outlined" divided class="ga-2">
                <v-btn value="card" icon>
                    <v-icon>mdi-view-grid</v-icon>
                    <v-tooltip activator="parent" location="bottom">卡片视图</v-tooltip>
                </v-btn>
                <v-btn value="table" icon>
                    <v-icon>mdi-table</v-icon>
                    <v-tooltip activator="parent" location="bottom">表格视图</v-tooltip>
                </v-btn>
            </v-btn-toggle>
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

        <!-- 卡片视图 -->
        <template v-else-if="viewMode === 'card'">
            <v-row v-if="filteredModels.length > 0" class="pt-4">
                <v-col v-for="model in filteredModels" :key="model.model_name" cols="12" class="pa-0">
                    <v-card variant="text" class="model-card" @click="openModelDetail(model)">
                        <v-card-text class="pa-3 pa-sm-4">
                            <div class="d-flex flex-column flex-sm-row align-start ga-2 ga-sm-3 align-sm-center">
                                <!-- 模型信息 -->
                                <div class="flex-grow-1 min-width-0 w-100">
                                    <!-- 模型名称和复制按钮 -->
                                    <div class="d-flex align-center ga-1 mb-1">
                                        <h2 class="font-weight-bold text-truncate model-name">
                                            {{ model.model_name }}
                                        </h2>
                                        <v-btn variant="text" icon size="x-small" @click.stop="copyModelName(model.model_name)">
                                            <v-icon size="14">mdi-content-copy</v-icon>
                                            <v-tooltip activator="parent" location="top">复制模型名称</v-tooltip>
                                        </v-btn>
                                    </div>
                                    <!-- 描述 -->
                                    <div class="text-caption text-medium-emphasis mb-4 mt-2 model-description">
                                        {{ model.description || '暂无描述' }}
                                    </div>
                                    <!-- 图标和标签行 -->
                                    <div class="d-flex align-center flex-wrap tags-row">
                                        <v-avatar size="20" class="model-icon-small mr-2 mb-1">
                                            <v-img v-if="getModelIcon(model)" :src="getModelIcon(model)"
                                                :alt="model.model_name" />
                                            <v-icon v-else size="14" color="primary">mdi-cube-outline</v-icon>
                                        </v-avatar>
                                        <v-chip v-if="model.tags" size="x-small" color="primary"
                                            variant="tonal" class="mr-1 mb-1">
                                            {{ model.tags }}
                                        </v-chip>
                                        <v-chip size="x-small"
                                            :color="model.quota_type === 0 ? 'success' : 'warning'"
                                            variant="tonal" class="mr-1 mb-1">
                                            {{ model.quota_type === 0 ? '按量计费' : '按次计费' }}
                                        </v-chip>
                                        <v-chip v-if="getVendorName(model.vendor_id)" size="x-small"
                                            variant="tonal" color="default" class="mb-1">
                                            <v-avatar start size="14">
                                                <v-img :src="getIconUrl(getVendorIcon(model.vendor_id))"
                                                    :alt="getVendorName(model.vendor_id)" />
                                            </v-avatar>
                                            {{ getVendorName(model.vendor_id) }}
                                        </v-chip>
                                    </div>
                                </div>

                                <!-- 价格信息 -->
                                <div class="price-section flex-shrink-0 d-flex d-sm-block ga-3 mt-1 mt-sm-0">
                                    <div class="text-caption">
                                        <span class="text-medium-emphasis" style="font-size: 14px;">输入:</span>
                                        <span class="font-weight-medium ml-1" style="font-size: 14px;">✦{{ formatPrice(model.model_ratio) }}/M</span>
                                    </div>
                                    <div class="text-caption">
                                        <span class="text-medium-emphasis" style="font-size: 14px;">输出:</span>
                                        <span class="font-weight-medium ml-1" style="font-size: 14px;">✦{{ formatPrice(model.model_ratio * model.completion_ratio) }}/M</span>
                                    </div>
                                </div>
                            </div>
                        </v-card-text>
                    </v-card>
                    <v-divider class=" my-sm-4" />
                </v-col>
            </v-row>

            <!-- 空状态 -->
            <v-card v-else variant="flat" class="text-center pa-16">
                <v-icon size="64" color="medium-emphasis" class="mb-4">mdi-cube-off-outline</v-icon>
                <div class="text-h6 text-medium-emphasis mb-2">未找到模型</div>
                <div class="text-body-2 text-disabled">
                    尝试调整搜索关键词
                </div>
            </v-card>
        </template>

        <!-- 表格视图 -->
        <v-card v-else variant="text" class="overflow-hidden">
            <v-data-table :headers="tableHeaders" :items="filteredModels" :items-per-page="20" class="model-table"
                hover @click:row="(_event: Event, { item }: { item: Model }) => openModelDetail(item)">
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
                    <v-btn variant="text" icon size="small" @click.stop="copyModelName(item.model_name)">
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

        <!-- 模型详情弹窗 -->
        <v-dialog v-model="showDetailDialog" max-width="680" scrollable>
            <v-card v-if="selectedModel" class="model-detail-card">
                <!-- 头部区域 -->
                <div class="detail-header">
                    <div class="d-flex align-start justify-space-between">
                        <div class="d-flex align-center ga-3">
                            <v-avatar size="56" class="model-avatar">
                                <v-img v-if="getModelIcon(selectedModel)" :src="getModelIcon(selectedModel)" :alt="selectedModel.model_name" />
                                <v-icon v-else size="28" color="primary">mdi-cube-outline</v-icon>
                            </v-avatar>
                            <div>
                                <div class="d-flex align-center ga-2">
                                    <h2 class="text-h5 font-weight-bold">{{ selectedModel.model_name }}</h2>
                                    <v-btn icon variant="text" size="small" @click.stop="copyModelName(selectedModel.model_name)">
                                        <v-icon size="18">mdi-content-copy</v-icon>
                                        <v-tooltip activator="parent" location="top">复制模型名称</v-tooltip>
                                    </v-btn>
                                </div>
                                <div class="d-flex align-center ga-2 flex-wrap mt-1">
                                    <v-chip v-if="selectedModel.tags" size="small" color="primary" variant="tonal">
                                        {{ selectedModel.tags }}
                                    </v-chip>
                                    <v-chip size="small" :color="selectedModel.quota_type === 0 ? 'success' : 'warning'" variant="tonal">
                                        {{ selectedModel.quota_type === 0 ? '按量计费' : '按次计费' }}
                                    </v-chip>
                                </div>
                            </div>
                        </div>
                        <v-btn icon variant="text" @click="showDetailDialog = false">
                            <v-icon>mdi-close</v-icon>
                        </v-btn>
                    </div>
                </div>

                <v-divider />

                <!-- 内容区域 -->
                <v-card-text class="pa-0">
                    <!-- 描述 -->
                    <div class="detail-section">
                        <div class="section-label">
                            <v-icon size="18" class="mr-2">mdi-text-box-outline</v-icon>
                            描述
                        </div>
                        <p class="text-body-1 mt-2" style="line-height: 1.7;">
                            {{ selectedModel.description || '暂无描述信息' }}
                        </p>
                    </div>

                    <v-divider />

                    <!-- 价格信息 -->
                    <div class="detail-section">
                        <div class="section-label">
                            <v-icon size="18" class="mr-2">mdi-currency-usd</v-icon>
                            定价信息
                        </div>
                        <v-row class="mt-2" dense>
                            <v-col cols="6">
                                <div class="price-card">
                                    <div class="price-card-label">输入价格</div>
                                    <div class="price-card-value">
                                        <span class="price-symbol">✦</span>
                                        {{ formatPrice(selectedModel.model_ratio) }}
                                        <span class="price-unit">/M tokens</span>
                                    </div>
                                </div>
                            </v-col>
                            <v-col cols="6">
                                <div class="price-card">
                                    <div class="price-card-label">输出价格</div>
                                    <div class="price-card-value">
                                        <span class="price-symbol">✦</span>
                                        {{ formatPrice(selectedModel.model_ratio * selectedModel.completion_ratio) }}
                                        <span class="price-unit">/M tokens</span>
                                    </div>
                                </div>
                            </v-col>
                        </v-row>
                    </div>

                    <v-divider />

                    <!-- 模型信息 -->
                    <div class="detail-section">
                        <div class="section-label">
                            <v-icon size="18" class="mr-2">mdi-information-outline</v-icon>
                            模型信息
                        </div>
                        <div class="info-grid mt-3">
                            <div class="info-item">
                                <span class="info-label">供应商</span>
                                <span class="info-value d-flex align-center ga-1">
                                    <v-avatar v-if="getVendorIcon(selectedModel.vendor_id)" size="20">
                                        <v-img :src="getIconUrl(getVendorIcon(selectedModel.vendor_id))" />
                                    </v-avatar>
                                    {{ getVendorName(selectedModel.vendor_id) || '-' }}
                                </span>
                            </div>
                        </div>
                    </div>
                </v-card-text>

                <v-divider />

                <!-- 底部操作区 -->
                <v-card-actions class="pa-4">
                    <v-spacer />
                    <v-btn variant="text" @click="showDetailDialog = false">
                        关闭
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue'

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

// Props
const props = withDefaults(defineProps<{
    selectedVendors?: number[]
    selectedTags?: string[]
    selectedQuotaType?: number
}>(), {
    selectedVendors: () => [],
    selectedTags: () => [],
    selectedQuotaType: -1
})

// Emits
const emit = defineEmits<{
    'update:vendors': [vendors: Vendor[]]
    'update:models': [models: Model[]]
}>()

// 状态
const loading = ref(true)
const models = ref<Model[]>([])
const vendors = ref<Vendor[]>([])
const searchQuery = ref('')
const viewMode = ref<'card' | 'table'>('card')
const showCopySnackbar = ref(false)
const showDetailDialog = ref(false)
const selectedModel = ref<Model | null>(null)

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
    return (searchQuery.value && searchQuery.value.trim() !== '') ||
        props.selectedVendors.length > 0 ||
        props.selectedTags.length > 0 ||
        props.selectedQuotaType !== -1
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

    // 供应商过滤
    if (props.selectedVendors.length > 0) {
        result = result.filter(model =>
            model.vendor_id && props.selectedVendors.includes(model.vendor_id)
        )
    }

    // 标签过滤
    if (props.selectedTags.length > 0) {
        result = result.filter(model => {
            if (!model.tags) return false
            const modelTags = model.tags.split(',').map(t => t.trim())
            return props.selectedTags.some(tag => modelTags.includes(tag))
        })
    }

    // 计费类型过滤
    if (props.selectedQuotaType !== -1) {
        result = result.filter(model => model.quota_type === props.selectedQuotaType)
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

const getVendorName = (vendorId: number | undefined): string => {
    if (!vendorId) return ''
    const vendor = vendors.value.find(v => v.id === vendorId)
    return vendor?.name || ''
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

const openModelDetail = (model: Model) => {
    selectedModel.value = model
    showDetailDialog.value = true
}

const fetchPricing = async () => {
    loading.value = true
    try {
        const response = await fetch('/api/pricing')
        const data: PricingResponse = await response.json()
        if (data.success) {
            models.value = data.data
            vendors.value = data.vendors
            // 通知父组件数据已加载
            emit('update:models', data.data)
            emit('update:vendors', data.vendors)
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

.model-card {
    transition: all 0.2s ease;
    cursor: pointer;
}

.model-card:hover {
    border-color: rgb(var(--v-theme-primary));
    background: rgba(var(--v-theme-primary), 0.04);
}

/* 模型详情弹窗样式 */
.model-detail-card {
    border-radius: 16px !important;
    overflow: hidden;
}

.detail-header {
    padding: 24px;
}

.detail-section {
    padding: 20px 24px;
}

.section-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: rgba(var(--v-theme-on-surface), 0.7);
    display: flex;
    align-items: center;
}

.price-card {
    background: rgba(var(--v-theme-surface-variant), 0.5);
    border-radius: 12px;
    padding: 16px;
    text-align: center;
    border: 1px solid rgba(var(--v-theme-outline), 0.12);
}

.price-card-label {
    font-size: 0.75rem;
    color: rgba(var(--v-theme-on-surface), 0.6);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
}

.price-card-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: rgb(var(--v-theme-primary));
}

.price-symbol {
    font-size: 1.25rem;
}

.price-unit {
    font-size: 0.75rem;
    font-weight: 400;
    color: rgba(var(--v-theme-on-surface), 0.6);
}

.price-card-ratio {
    font-size: 0.75rem;
    color: rgba(var(--v-theme-on-surface), 0.5);
    margin-top: 4px;
}

.info-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
}

@media (min-width: 600px) {
    .info-grid {
        grid-template-columns: 1fr 1fr;
    }
}

.info-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.info-label {
    font-size: 0.75rem;
    color: rgba(var(--v-theme-on-surface), 0.5);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 2px;
}

.info-value {
    font-size: 0.875rem;
    font-weight: 500;
}

.model-icon-small {
    flex-shrink: 0;
}

.model-description {
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.5;
}

.model-name {
    font-size: 1rem;
}

.min-width-0 {
    min-width: 0;
}

.price-section {
    min-width: auto;
}

@media (min-width: 600px) {
    .model-name {
        font-size: 1.25rem;
    }
    
    .price-section {
        min-width: 140px;
        text-align: right;
    }
}

@media (min-width: 960px) {
    .price-section {
        min-width: 180px;
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
