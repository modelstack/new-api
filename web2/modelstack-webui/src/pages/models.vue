<template>
    <v-container fluid class="pa-2 pa-sm-4 pa-md-6" style="max-width: 1920px;">
        <v-row>
            <!-- 移动端筛选器按钮 -->
            <v-col cols="12" class="d-md-none pb-0">
                <v-btn variant="tonal" block @click="showFilterDrawer = true" class="mb-2">
                    <v-icon start>mdi-filter-variant</v-icon>
                    筛选器
                    <v-chip v-if="activeFilterCount > 0" size="x-small" color="primary" class="ml-2">
                        {{ activeFilterCount }}
                    </v-chip>
                </v-btn>
            </v-col>

            <!-- 左侧筛选器 (桌面端) -->
            <v-col cols="12" md="3" lg="3" class="d-none d-md-block">
                <v-card variant="flat" class="filter-card sticky-filter">
                    <v-card-title class="text-subtitle-1 font-weight-bold pb-2">
                        <v-icon start size="small">mdi-filter-variant</v-icon>
                        筛选器
                    </v-card-title>

                    <!-- 供应商筛选 -->
                    <v-card-text class="pb-2">
                        <div class="text-caption text-medium-emphasis mb-2 font-weight-medium">供应商</div>
                        <v-chip-group v-model="selectedVendors" multiple column selected-class="text-primary">
                            <v-chip v-for="vendor in availableVendors" :key="vendor.id" :value="vendor.id" filter variant="tonal"
                                size="small" class="ma-1">
                                <v-avatar start size="18" class="mr-1">
                                    <v-img :src="getIconUrl(vendor.icon)" :alt="vendor.name" />
                                </v-avatar>
                                {{ vendor.name }}
                            </v-chip>
                        </v-chip-group>
                    </v-card-text>

                    <v-divider class="mx-4" />

                    <!-- 标签筛选 -->
                    <v-card-text class="pb-2">
                        <div class="text-caption text-medium-emphasis mb-2 font-weight-medium">标签</div>
                        <v-chip-group v-model="selectedTags" multiple column selected-class="text-primary">
                            <v-chip v-for="tag in allTags" :key="tag" :value="tag" filter variant="tonal" size="small"
                                class="ma-1">
                                {{ tag }}
                            </v-chip>
                        </v-chip-group>
                        <div v-if="allTags.length === 0" class="text-caption text-disabled">
                            暂无标签
                        </div>
                    </v-card-text>

                    <v-divider class="mx-4" />

                    <!-- 计费类型筛选 -->
                    <v-card-text>
                        <div class="text-caption text-medium-emphasis mb-2 font-weight-medium">计费类型</div>
                        <v-chip-group v-model="selectedQuotaType" column selected-class="text-primary">
                            <v-chip :value="-1" filter variant="tonal" size="small" class="ma-1">
                                全部
                            </v-chip>
                            <v-chip :value="0" filter variant="tonal" size="small" class="ma-1">
                                <v-icon start size="14">mdi-chart-line</v-icon>
                                按量计费
                            </v-chip>
                            <v-chip :value="1" filter variant="tonal" size="small" class="ma-1">
                                <v-icon start size="14">mdi-currency-usd</v-icon>
                                按次计费
                            </v-chip>
                        </v-chip-group>
                    </v-card-text>

                    <!-- 清除筛选 -->
                    <v-card-actions class="px-4 pb-4">
                        <v-btn variant="outlined" size="small" block @click="clearFilters"
                            :disabled="!hasActiveFilters">
                            <v-icon start size="small">mdi-filter-remove</v-icon>
                            清除筛选
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-col>

            <!-- 右侧内容区 -->
            <v-col cols="12" md="9" lg="9">
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
                    <span v-if="hasActiveFilters" class="ml-2">
                        (已筛选)
                    </span>
                </div>

                <!-- 加载状态 -->
                <div v-if="loading" class="d-flex justify-center py-16">
                    <v-progress-circular indeterminate color="primary" size="48" />
                </div>

                <!-- 卡片视图 -->
                <template v-else-if="viewMode === 'card'">
                    <v-row v-if="filteredModels.length > 0">
                        <v-col v-for="model in filteredModels" :key="model.model_name" cols="12">
                            <v-card variant="text" class="model-card">
                                <v-card-text class="pa-3 pa-sm-4">
                                    <div class="d-flex flex-column flex-sm-row align-start ga-2 ga-sm-3 align-sm-center">
                                        <!-- 模型信息 -->
                                        <div class="flex-grow-1 min-width-0 w-100">
                                            <!-- 模型名称和复制按钮 -->
                                            <div class="d-flex align-center ga-1 mb-1">
                                                <h2 class="font-weight-bold text-truncate model-name">
                                                    {{ model.model_name }}
                                                </h2>
                                                <v-btn variant="text" icon size="x-small" @click="copyModelName(model.model_name)">
                                                    <v-icon size="14">mdi-content-copy</v-icon>
                                                    <v-tooltip activator="parent" location="top">复制模型名称</v-tooltip>
                                                </v-btn>
                                            </div>
                                            <!-- 描述 -->
                                            <div class="text-caption text-medium-emphasis mb-2 model-description">
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
                            <v-divider class="my-2 my-sm-4" />
                        </v-col>
                    </v-row>

                    <!-- 空状态 -->
                    <v-card v-else variant="flat" class="text-center pa-16">
                        <v-icon size="64" color="medium-emphasis" class="mb-4">mdi-cube-off-outline</v-icon>
                        <div class="text-h6 text-medium-emphasis mb-2">未找到模型</div>
                        <div class="text-body-2 text-disabled">
                            尝试调整筛选条件或搜索关键词
                        </div>
                    </v-card>
                </template>

                <!-- 表格视图 -->
                <v-card v-else variant="text" class="overflow-hidden">
                    <v-data-table :headers="tableHeaders" :items="filteredModels" :items-per-page="20"
                        class="model-table" hover>
                        <template #item.model_name="{ item }">
                            <div class="d-flex align-center ga-2 py-2">
                                <v-avatar size="32" color="surface-variant">
                                    <v-img v-if="getModelIcon(item)" :src="getModelIcon(item)" :alt="item.model_name" />
                                    <v-icon v-else size="18" color="primary">mdi-cube-outline</v-icon>
                                </v-avatar>
                                <div>
                                    <div class="font-weight-medium">{{ item.model_name }}</div>
                                    <div class="text-caption text-medium-emphasis text-truncate"
                                        style="max-width: 500px;">
                                        {{ item.description || '-' }}
                                    </div>
                                </div>
                            </div>
                        </template>

                        <!-- <template #item.vendor_id="{ item }">
                            <v-chip v-if="getVendorName(item.vendor_id)" size="small" variant="flat"
                                color="surface-variant">
                                <v-avatar start size="16">
                                    <v-img :src="getIconUrl(getVendorIcon(item.vendor_id))"
                                        :alt="getVendorName(item.vendor_id)" />
                                </v-avatar>
                                {{ getVendorName(item.vendor_id) }}
                            </v-chip>
                            <span v-else class="text-disabled">-</span>
                        </template> -->

                        <template #item.tags="{ item }">
                            <v-chip v-if="item.tags" size="x-small" color="primary" variant="tonal">
                                {{ item.tags }}
                            </v-chip>
                            <span v-else class="text-disabled">-</span>
                        </template>

                        <template #item.quota_type="{ item }">
                            <v-chip size="x-small" :color="item.quota_type === 0 ? 'success' : 'warning'"
                                variant="tonal">
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
                                    <span class="font-weight-medium ml-1">✦{{ formatPrice(item.model_ratio * item.completion_ratio) }}/M</span>
                                </div>
                            </div>
                        </template>

                        <template #item.actions="{ item }">
                            <v-btn variant="text" icon size="small" @click="copyModelName(item.model_name)">
                                <v-icon size="small">mdi-content-copy</v-icon>
                                <v-tooltip activator="parent" location="top">复制模型名称</v-tooltip>
                            </v-btn>
                        </template>
                    </v-data-table>
                </v-card>
            </v-col>
        </v-row>

        <!-- 移动端筛选器抽屉 -->
        <v-bottom-sheet v-model="showFilterDrawer" inset>
            <v-card class="rounded-t-xl">
                <v-card-title class="d-flex align-center justify-space-between pa-4">
                    <span class="text-subtitle-1 font-weight-bold">
                        <v-icon start size="small">mdi-filter-variant</v-icon>
                        筛选器
                    </span>
                    <v-btn icon variant="text" size="small" @click="showFilterDrawer = false">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </v-card-title>

                <v-divider />

                <v-card-text class="pa-4" style="max-height: 60vh; overflow-y: auto;">
                    <!-- 供应商筛选 -->
                    <div class="mb-4">
                        <div class="text-caption text-medium-emphasis mb-2 font-weight-medium">供应商</div>
                        <v-chip-group v-model="selectedVendors" multiple column selected-class="text-primary">
                            <v-chip v-for="vendor in availableVendors" :key="vendor.id" :value="vendor.id" filter variant="tonal"
                                size="small" class="ma-1">
                                <v-avatar start size="18" class="mr-1">
                                    <v-img :src="getIconUrl(vendor.icon)" :alt="vendor.name" />
                                </v-avatar>
                                {{ vendor.name }}
                            </v-chip>
                        </v-chip-group>
                    </div>

                    <!-- 标签筛选 -->
                    <div class="mb-4">
                        <div class="text-caption text-medium-emphasis mb-2 font-weight-medium">标签</div>
                        <v-chip-group v-model="selectedTags" multiple column selected-class="text-primary">
                            <v-chip v-for="tag in allTags" :key="tag" :value="tag" filter variant="tonal" size="small"
                                class="ma-1">
                                {{ tag }}
                            </v-chip>
                        </v-chip-group>
                        <div v-if="allTags.length === 0" class="text-caption text-disabled">
                            暂无标签
                        </div>
                    </div>

                    <!-- 计费类型筛选 -->
                    <div>
                        <div class="text-caption text-medium-emphasis mb-2 font-weight-medium">计费类型</div>
                        <v-chip-group v-model="selectedQuotaType" column selected-class="text-primary">
                            <v-chip :value="-1" filter variant="tonal" size="small" class="ma-1">
                                全部
                            </v-chip>
                            <v-chip :value="0" filter variant="tonal" size="small" class="ma-1">
                                <v-icon start size="14">mdi-chart-line</v-icon>
                                按量计费
                            </v-chip>
                            <v-chip :value="1" filter variant="tonal" size="small" class="ma-1">
                                <v-icon start size="14">mdi-currency-usd</v-icon>
                                按次计费
                            </v-chip>
                        </v-chip-group>
                    </div>
                </v-card-text>

                <v-divider />

                <v-card-actions class="pa-4">
                    <v-btn variant="outlined" class="flex-grow-1" @click="clearFilters" :disabled="!hasActiveFilters">
                        <v-icon start size="small">mdi-filter-remove</v-icon>
                        清除筛选
                    </v-btn>
                    <v-btn variant="tonal" color="primary" class="flex-grow-1" @click="showFilterDrawer = false">
                        <v-icon start size="small">mdi-check</v-icon>
                        确定
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-bottom-sheet>

        <!-- 复制成功提示 -->
        <v-snackbar v-model="showCopySnackbar" :timeout="2000" color="success">
            <v-icon start>mdi-check</v-icon>
            已复制到剪贴板
        </v-snackbar>
    </v-container>
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
const viewMode = ref<'card' | 'table'>('card')
const selectedVendors = ref<number[]>([])
const selectedTags = ref<string[]>([])
const selectedQuotaType = ref<number>(-1)
const showCopySnackbar = ref(false)
const showFilterDrawer = ref(false)

// 表格列定义
const tableHeaders = [
    { title: '模型名称', key: 'model_name', sortable: true },
    // { title: '供应商', key: 'vendor_id', sortable: true },
    { title: '标签', key: 'tags', sortable: false },
    { title: '计费类型', key: 'quota_type', sortable: true },
    { title: '价格', key: 'price', sortable: true },
    { title: '操作', key: 'actions', sortable: false, align: 'center' as const },
]

// 计算属性
const allTags = computed(() => {
    const tags = new Set<string>()
    models.value.forEach(model => {
        if (model.tags) {
            model.tags.split(',').forEach(tag => tags.add(tag.trim()))
        }
    })
    return Array.from(tags)
})

// 只显示模型中实际存在的供应商
const availableVendors = computed(() => {
    const vendorIds = new Set<number>()
    models.value.forEach(model => {
        if (model.vendor_id) {
            vendorIds.add(model.vendor_id)
        }
    })
    return vendors.value.filter(vendor => vendorIds.has(vendor.id))
})

const activeFilterCount = computed(() => {
    let count = 0
    if (selectedVendors.value.length > 0) count += selectedVendors.value.length
    if (selectedTags.value.length > 0) count += selectedTags.value.length
    if (selectedQuotaType.value !== -1) count += 1
    return count
})

const hasActiveFilters = computed(() => {
    return selectedVendors.value.length > 0 ||
        selectedTags.value.length > 0 ||
        selectedQuotaType.value !== -1 ||
        (searchQuery.value && searchQuery.value.trim() !== '')
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
    if (selectedVendors.value.length > 0) {
        result = result.filter(model =>
            model.vendor_id && selectedVendors.value.includes(model.vendor_id)
        )
    }

    // 标签过滤
    if (selectedTags.value.length > 0) {
        result = result.filter(model => {
            if (!model.tags) return false
            const modelTags = model.tags.split(',').map(t => t.trim())
            return selectedTags.value.some(tag => modelTags.includes(tag))
        })
    }

    // 计费类型过滤
    if (selectedQuotaType.value !== -1) {
        result = result.filter(model => model.quota_type === selectedQuotaType.value)
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

const clearFilters = () => {
    selectedVendors.value = []
    selectedTags.value = []
    selectedQuotaType.value = -1
    searchQuery.value = ''
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
.filter-card {
    background: transparent;
}

.sticky-filter {
    position: sticky;
    top: 80px;
}

.model-card {
    transition: all 0.2s ease;
}

.model-card:hover {
    border-color: rgb(var(--v-theme-primary));
}

.model-avatar {
    flex-shrink: 0;
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

.search-field {
    width: 100%;
}

@media (min-width: 600px) {
    .search-field {
        width: auto;
    }
    
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
