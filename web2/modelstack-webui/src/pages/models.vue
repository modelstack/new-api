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
                <ModelList 
                    :selected-vendors="selectedVendors"
                    :selected-tags="selectedTags"
                    :selected-quota-type="selectedQuotaType"
                    @update:vendors="vendors = $event"
                    @update:models="models = $event"
                />
            </v-col>
        </v-row>

        <!-- 移动端筛选器抽屉 -->
        <v-bottom-sheet v-model="showFilterDrawer" inset>
            <v-card class="rounded-t-xl">
                <v-card-title class="d-flex align-center justify-space-between pa-4 mt-2">
                    <span class="font-weight-bold">
                        筛选器
                    </span>
                    <v-btn icon variant="text" size="small" @click="showFilterDrawer = false">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </v-card-title>

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
    </v-container>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import ModelList from '@/components/console/ModelList.vue'

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

// 状态
const models = ref<Model[]>([])
const vendors = ref<Vendor[]>([])
const selectedVendors = ref<number[]>([])
const selectedTags = ref<string[]>([])
const selectedQuotaType = ref<number>(-1)
const showFilterDrawer = ref(false)

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
        selectedQuotaType.value !== -1
})

// 方法
const getIconUrl = (icon: string | undefined): string => {
    if (!icon) return ''
    const slug = icon.toLowerCase().replace('.', '-')
    return `https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/${slug}.svg`
}

const clearFilters = () => {
    selectedVendors.value = []
    selectedTags.value = []
    selectedQuotaType.value = -1
}
</script>

<style scoped>
.filter-card {
    background: transparent;
}

.sticky-filter {
    position: sticky;
    top: 80px;
}
</style>
