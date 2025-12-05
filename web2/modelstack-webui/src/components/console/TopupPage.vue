<template>
    <div>
        <!-- 页面标题 -->
        <div class="d-flex justify-space-between align-center mb-4">
            <div>
                <h1 class="text-h5 font-weight-bold">账户充值</h1>
                <p class="text-body-2 text-medium-emphasis mt-1">
                    多种充值方式，安全便捷
                </p>
            </div>
            <v-btn color="primary" variant="outlined" prepend-icon="mdi-history" @click="showHistory = true">
                充值记录
            </v-btn>
        </div>

        <!-- 账户统计卡片 -->
        <v-row class="mb-4">
            <!-- 当前余额 -->
            <v-col cols="12" sm="12" md="7" lg="7">
                <v-card variant="flat" class="stats-card stats-card-blue">
                    <v-card-text class="pa-5">
                        <div class="d-flex align-center">
                            <v-avatar color="blue" size="56" class="mr-4">
                                <v-icon color="white" size="28">mdi-wallet</v-icon>
                            </v-avatar>
                            <div>
                                <div class="text-body-2 text-medium-emphasis mb-1">当前余额</div>
                                <div class="text-h4 font-weight-bold">
                                    <v-skeleton-loader v-if="loading" type="text" width="120" />
                                    <span v-else>{{ formatQuota(userStore.user?.quota || 0) }}</span>
                                </div>
                            </div>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <v-row>
            <!-- 左侧充值区域 -->
            <v-col cols="12" lg="7">
                <!-- 在线充值 -->
                <v-card variant="flat" class="mb-4 pt-2 pl-1" v-if="enableOnlineTopUp || enableStripeTopUp || enableCreemTopUp">
                    <v-card-title class="d-flex align-center mb-4">
                        <v-icon class="mr-2" color="primary">mdi-credit-card</v-icon>
                        在线充值
                    </v-card-title>
                    <v-card-text>
                        <!-- 充值数量输入 -->
                        <v-row v-if="enableOnlineTopUp || enableStripeTopUp">
                            <v-col cols="12" md="6">
                                <v-text-field v-model.number="topUpCount" type="number" label="充值数量"
                                    :placeholder="`最低充值 ${minTopUp}`" :min="minTopUp" variant="outlined"
                                    density="comfortable" hide-details="auto" prepend-inner-icon="mdi-currency-usd"
                                    @update:model-value="(val: any) => handleAmountChange(Number(val))">
                                    <template v-slot:append>
                                        <v-chip color="primary" size="small" variant="tonal">
                                            {{ formatQuotaWithAmount(topUpCount || 0) }}
                                        </v-chip>
                                    </template>
                                </v-text-field>
                                <div class="mt-2 text-body-2">
                                    <span class="text-medium-emphasis">实付金额：</span>
                                    <v-skeleton-loader v-if="amountLoading" type="text" width="20" height="10"
                                        class="d-inline-block" />
                                    <span v-else class="text-error font-weight-medium">{{ actualAmount }} 元</span>
                                </div>
                            </v-col>
                            <v-col cols="12" md="6">
                                <div class="text-body-2 text-medium-emphasis mb-2">选择支付方式</div>
                                <div class="d-flex flex-wrap ga-2">
                                    <v-btn v-for="method in payMethods" :key="method.type"
                                        :color="getPayMethodColor(method.type)"
                                        :variant="payWay === method.type ? 'elevated' : 'outlined'"
                                        :loading="paymentLoading && payWay === method.type"
                                        :disabled="method.min_topup > topUpCount" @click="preTopUp(method.type)"
                                        class="text-none">
                                        <v-icon start>{{ getPayMethodIcon(method.type) }}</v-icon>
                                        {{ method.name }}
                                    </v-btn>
                                </div>
                                <div v-if="payMethods.length === 0"
                                    class="text-medium-emphasis text-body-2 pa-3 bg-grey-lighten-4 rounded">
                                    暂无可用的支付方式，请联系管理员配置
                                </div>
                            </v-col>
                        </v-row>

                        <!-- 选择充值额度 -->
                        <div class="mt-4" v-if="presetAmounts.length > 0 && (enableOnlineTopUp || enableStripeTopUp)">
                            <div class="text-body-2 text-medium-emphasis mb-2">选择充值额度</div>
                            <v-row dense>
                                <v-col v-for="(preset, index) in presetAmounts" :key="index" cols="6" sm="4" md="4">
                                    <v-card :variant="selectedPreset === preset.value ? 'elevated' : 'outlined'"
                                        :color="selectedPreset === preset.value ? 'primary' : undefined"
                                        class="cursor-pointer preset-card" @click="selectPresetAmount(preset)">
                                        <v-card-text class="pa-3">
                                            <div class="d-flex align-center mb-1">
                                                <span class="mr-2">✦</span>
                                                <span class="text-h6 font-weight-bold">{{ preset.value }}</span>
                                                <v-chip v-if="preset.discount && preset.discount < 1" color="success"
                                                    size="x-small" variant="tonal" class="ml-1">
                                                    {{ (preset.discount * 10).toFixed(1) }}折
                                                </v-chip>
                                            </div>
                                            <div class="text-body-2"
                                                :class="selectedPreset === preset.value ? '' : 'text-medium-emphasis'">
                                                实付 {{ calculatePresetPrice(preset).toFixed(2) }} 元
                                            </div>
                                        </v-card-text>
                                    </v-card>
                                </v-col>
                            </v-row>
                        </div>

                        <!-- Creem 充值 -->
                        <div class="mt-4" v-if="enableCreemTopUp && creemProducts.length > 0">
                            <div class="text-body-2 text-medium-emphasis mb-2">Creem 充值</div>
                            <v-row dense>
                                <v-col v-for="(product, index) in creemProducts" :key="index" cols="12" sm="6" md="4">
                                    <v-card variant="outlined" class="cursor-pointer" hover
                                        @click="creemPreTopUp(product)">
                                        <v-card-text class="text-center">
                                            <div class="text-h6 font-weight-medium mb-2">{{ product.name }}</div>
                                            <div class="text-body-2 text-medium-emphasis mb-2">
                                                充值额度: {{ product.quota }}
                                            </div>
                                            <div class="text-h6 font-weight-bold text-primary">
                                                {{ product.currency === 'EUR' ? '€' : '✦' }}{{ product.price }}
                                            </div>
                                        </v-card-text>
                                    </v-card>
                                </v-col>
                            </v-row>
                        </div>
                    </v-card-text>
                </v-card>

                <!-- 未开启在线充值提示 -->
                <v-alert v-if="!enableOnlineTopUp && !enableStripeTopUp && !enableCreemTopUp && !topupInfoLoading"
                    type="info" variant="tonal" class="mb-4">
                    管理员未开启在线充值功能，请联系管理员开启或使用兑换码充值。
                </v-alert>

                <!-- 兑换码充值 -->
                <v-card variant="flat" class="pt-2 pl-1">
                    <v-card-title class="d-flex align-center mb-4">
                        <v-icon class="mr-2" color="primary">mdi-gift</v-icon>
                        兑换码充值
                    </v-card-title>
                    <v-card-text>
                        <v-text-field v-model="redemptionCode" label="兑换码" placeholder="请输入兑换码" variant="outlined"
                            density="comfortable" prepend-inner-icon="mdi-ticket-confirmation" clearable
                            @keyup.enter="topUp">
                            <template v-slot:append>
                                <v-btn color="primary" :loading="isSubmitting" @click="topUp">
                                    兑换额度
                                </v-btn>
                            </template>
                        </v-text-field>
                        <div v-if="topUpLink" class="text-body-2 text-medium-emphasis mt-2">
                            在找兑换码？
                            <a :href="topUpLink" target="_blank" class="text-primary">购买兑换码</a>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>

            <!-- 右侧邀请奖励区域 -->
            <v-col cols="12" lg="5">
                <v-card variant="flat" class="pt-2 pl-1">
                    <v-card-title class="d-flex align-center mb-4">
                        <v-icon class="mr-2" color="success">mdi-account-multiple-plus</v-icon>
                        邀请奖励
                    </v-card-title>
                    <v-card-text>
                        <!-- 邀请统计 -->
                        <v-row class="mb-4">
                            <v-col cols="4" class="text-center">
                                <div class="text-h5 font-weight-bold text-primary">
                                    {{ formatQuota(userStore.user?.aff_quota || 0) }}
                                </div>
                                <div class="text-body-2 text-medium-emphasis">待使用收益</div>
                            </v-col>
                            <v-col cols="4" class="text-center">
                                <div class="text-h5 font-weight-bold text-success">
                                    {{ formatQuota(userStore.user?.aff_history_quota || 0) }}
                                </div>
                                <div class="text-body-2 text-medium-emphasis">总收益</div>
                            </v-col>
                            <v-col cols="4" class="text-center">
                                <div class="text-h5 font-weight-bold text-info">
                                    {{ userStore.user?.aff_count || 0 }}
                                </div>
                                <div class="text-body-2 text-medium-emphasis">邀请人数</div>
                            </v-col>
                        </v-row>

                        <!-- 划转按钮 -->
                        <v-btn color="primary" variant="tonal" block class="mb-4"
                            :disabled="!userStore.user?.aff_quota || userStore.user.aff_quota <= 0"
                            @click="showTransfer = true">
                            <v-icon start>mdi-swap-horizontal</v-icon>
                            划转到余额
                        </v-btn>

                        <!-- 邀请链接 -->
                        <div class="text-body-2 text-medium-emphasis mb-2">邀请链接</div>
                        <v-text-field :model-value="affLink" readonly variant="outlined" density="comfortable"
                            hide-details>
                            <template v-slot:append>
                                <v-btn color="primary" @click="copyAffLink">
                                    <v-icon start>mdi-content-copy</v-icon>
                                    复制
                                </v-btn>
                            </template>
                        </v-text-field>

                        <!-- 奖励说明 -->
                        <v-card variant="tonal" color="grey-lighten-4" class="mt-4">
                            <v-card-title class="text-body-2 text-medium-emphasis pb-0">
                                奖励说明
                            </v-card-title>
                            <v-card-text class="text-body-2 text-medium-emphasis">
                                <ul class="pl-4">
                                    <li>分享您的邀请链接给好友</li>
                                    <li>好友通过链接注册并充值后，您将获得奖励</li>
                                </ul>
                            </v-card-text>
                        </v-card>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <!-- 支付确认对话框 -->
        <v-dialog v-model="showPayConfirm" max-width="420" persistent>
            <v-card class="rounded-lg">
                <v-card-text class="pa-6">
                    <!-- 顶部图标 -->
                    <div class="text-center mb-4">
                        <v-avatar :color="getPayMethodColor(payWay)" size="64">
                            <v-icon color="white" size="32">{{ getPayMethodIcon(payWay) }}</v-icon>
                        </v-avatar>
                    </div>
                    
                    <h3 class="text-h6 font-weight-bold text-center mb-4">确认充值</h3>
                    
                    <!-- 充值信息卡片 -->
                    <v-card variant="tonal" color="grey-lighten-4" class="rounded-lg mb-4">
                        <v-card-text class="pa-4">
                            <div class="d-flex justify-space-between align-center mb-8">
                                <span class="text-medium-emphasis">充值数量</span>
                                <span class="text-medium-emphasis">✦{{ formatQuotaWithAmount(topUpCount || 0) }}</span>
                            </div>
                            <div class="d-flex justify-space-between align-center mb-3">
                                <span class="text-medium-emphasis">支付方式</span>
                                <v-chip :color="getPayMethodColor(payWay)" size="small" variant="tonal">
                                    <v-icon start size="14">{{ getPayMethodIcon(payWay) }}</v-icon>
                                    {{ getPayMethodName(payWay) }}
                                </v-chip>
                            </div>
                            <v-divider class="my-3" />
                            <div class="d-flex justify-space-between align-center">
                                <span class="text-medium-emphasis">实付金额</span>
                                <span class="font-weight-bold" style="font-size: 1.5rem; color: rgb(var(--v-theme-error));">¥{{ actualAmount }}</span>
                            </div>
                        </v-card-text>
                    </v-card>
                    
                    <p class="text-body-2 text-medium-emphasis text-center mb-0">
                        点击确认后将跳转到支付页面
                    </p>
                </v-card-text>
                <v-card-actions class="pa-6 pt-0">
                    <v-btn variant="outlined" color="grey" class="flex-grow-1" @click="showPayConfirm = false">
                        取消
                    </v-btn>
                    <v-btn color="primary" variant="tonal" class="flex-grow-1" :loading="confirmLoading" @click="onlineTopUp">
                        <v-icon start>mdi-check</v-icon>
                        确认支付
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Creem 确认对话框 -->
        <v-dialog v-model="showCreemConfirm" max-width="420" persistent>
            <v-card class="rounded-xl">
                <v-card-text class="pa-6">
                    <!-- 顶部图标 -->
                    <div class="text-center mb-4">
                        <v-avatar color="indigo" size="64">
                            <v-icon color="white" size="32">mdi-lightning-bolt</v-icon>
                        </v-avatar>
                    </div>
                    
                    <h3 class="text-h6 font-weight-bold text-center mb-4">Creem 充值确认</h3>
                    
                    <v-card v-if="selectedCreemProduct" variant="tonal" color="grey-lighten-4" class="rounded-lg mb-4">
                        <v-card-text class="pa-4">
                            <div class="d-flex justify-space-between align-center mb-3">
                                <span class="text-medium-emphasis">产品名称</span>
                                <span class="font-weight-bold">{{ selectedCreemProduct.name }}</span>
                            </div>
                            <div class="d-flex justify-space-between align-center mb-3">
                                <span class="text-medium-emphasis">充值额度</span>
                                <v-chip color="success" size="small" variant="tonal">
                                    {{ selectedCreemProduct.quota }}
                                </v-chip>
                            </div>
                            <v-divider class="my-3" />
                            <div class="d-flex justify-space-between align-center">
                                <span class="text-medium-emphasis">支付金额</span>
                                <span class="font-weight-bold" style="font-size: 1.5rem; color: rgb(var(--v-theme-error));">
                                    {{ selectedCreemProduct.currency === 'EUR' ? '€' : '✦' }}{{ selectedCreemProduct.price }}
                                </span>
                            </div>
                        </v-card-text>
                    </v-card>
                    
                    <p class="text-body-2 text-medium-emphasis text-center mb-0">
                        点击确认后将跳转到 Creem 支付页面
                    </p>
                </v-card-text>
                <v-card-actions class="pa-6 pt-0">
                    <v-btn variant="outlined" color="grey" class="flex-grow-1" @click="showCreemConfirm = false">
                        取消
                    </v-btn>
                    <v-btn color="indigo" variant="elevated" class="flex-grow-1" :loading="confirmLoading" @click="onlineCreemTopUp">
                        <v-icon start>mdi-check</v-icon>
                        确认支付
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- 划转对话框 -->
        <v-dialog v-model="showTransfer" max-width="420">
            <v-card class="rounded-xl">
                <v-card-text class="pa-6">
                    <!-- 顶部图标 -->
                    <div class="text-center mb-4">
                        <v-avatar color="success" size="64">
                            <v-icon color="white" size="32">mdi-swap-horizontal</v-icon>
                        </v-avatar>
                    </div>
                    
                    <h3 class="text-h6 font-weight-bold text-center mb-4">划转邀请收益</h3>
                    
                    <v-card variant="tonal" color="green-lighten-5" class="rounded-lg mb-4">
                        <v-card-text class="pa-4 text-center">
                            <div class="text-body-2 text-medium-emphasis mb-1">当前可划转收益</div>
                            <div class="font-weight-bold" style="font-size: 2rem; color: rgb(var(--v-theme-success));">
                                {{ formatQuota(userStore.user?.aff_quota || 0) }}
                            </div>
                        </v-card-text>
                    </v-card>
                    
                    <v-text-field v-model.number="transferAmount" type="number" label="划转金额" :min="quotaPerUnit"
                        variant="outlined" density="comfortable" hide-details="auto"
                        prepend-inner-icon="mdi-currency-usd"
                        :rules="[v => v >= quotaPerUnit || `最低划转金额为 ${formatQuota(quotaPerUnit)}`]" />
                    
                    <p class="text-body-2 text-medium-emphasis text-center mt-3 mb-0">
                        划转后将直接添加到账户余额
                    </p>
                </v-card-text>
                <v-card-actions class="pa-6 pt-0">
                    <v-btn variant="outlined" color="grey" class="flex-grow-1" @click="showTransfer = false">
                        取消
                    </v-btn>
                    <v-btn color="success" variant="elevated" class="flex-grow-1" @click="transfer">
                        确认划转
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- 充值记录对话框 -->
        <v-dialog v-model="showHistory" max-width="800">
            <v-card class="rounded-lg">
                <v-card-title class="d-flex align-center pa-5">
                    <v-avatar color="primary" size="40" class="mr-3">
                        <v-icon color="white">mdi-history</v-icon>
                    </v-avatar>
                    <span class="text-h6 font-weight-bold">充值记录</span>
                    <v-spacer />
                    <v-btn icon variant="text" size="small" @click="showHistory = false">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </v-card-title>
                <v-divider />
                <v-card-text class="pa-4">
                    <v-data-table :headers="historyHeaders" :items="historyData" :loading="historyLoading"
                        density="comfortable" class="elevation-0 rounded-lg">
                        <template v-slot:item.amount="{ item }">
                            <span class="font-weight-medium text-success">{{ formatQuota(item.amount) }}</span>
                        </template>
                        <template v-slot:item.money="{ item }">
                            <span class="font-weight-medium">¥{{ (item.money || 0).toFixed(2) }}</span>
                        </template>
                        <template v-slot:item.status="{ item }">
                            <v-chip :color="getStatusColor(item.status)" size="small" variant="tonal">
                                <v-icon start size="12">{{ item.status === 'completed' || item.status === 1 ? 'mdi-check-circle' : (item.status === 'failed' ? 'mdi-close-circle' : 'mdi-clock-outline') }}</v-icon>
                                {{ getStatusText(item.status) }}
                            </v-chip>
                        </template>
                        <template v-slot:item.create_time="{ item }">
                            <span class="text-medium-emphasis">{{ formatTime(item.create_time) }}</span>
                        </template>
                        <template v-slot:no-data>
                            <div class="text-center py-12">
                                <v-avatar color="grey-lighten-3" size="80" class="mb-4">
                                    <v-icon size="40" color="grey">mdi-receipt-text-outline</v-icon>
                                </v-avatar>
                                <p class="text-h6 text-medium-emphasis mb-1">暂无充值记录</p>
                                <p class="text-body-2 text-medium-emphasis">完成首次充值后，记录将显示在这里</p>
                            </div>
                        </template>
                    </v-data-table>
                </v-card-text>
            </v-card>
        </v-dialog>

        <!-- Snackbar 消息提示 -->
        <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
            {{ snackbar.message }}
        </v-snackbar>
    </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useUserStore } from '@/stores/user'
import { API } from '@/utils/api'

const userStore = useUserStore()

// 状态
const loading = ref(false)
const topupInfoLoading = ref(true)

// 充值配置
const enableOnlineTopUp = ref(false)
const enableStripeTopUp = ref(false)
const enableCreemTopUp = ref(false)
const minTopUp = ref(1)
const priceRatio = ref(1)
const topUpLink = ref('')
const payMethods = ref<any[]>([])
const presetAmounts = ref<any[]>([])
const creemProducts = ref<any[]>([])
const topupInfo = ref<{ amount_options: number[], discount: Record<number, number> }>({
    amount_options: [],
    discount: {}
})

// 充值表单
const topUpCount = ref(1)
const selectedPreset = ref<number | null>(null)
const actualAmount = ref(0)
const amountLoading = ref(false)
const payWay = ref('')
const paymentLoading = ref(false)
const confirmLoading = ref(false)

// 兑换码
const redemptionCode = ref('')
const isSubmitting = ref(false)

// Creem
const selectedCreemProduct = ref<any>(null)

// 邀请
const affLink = ref('')
const transferAmount = ref(0)
const quotaPerUnit = ref(500000) // 1美元 = 500000

// 对话框
const showPayConfirm = ref(false)
const showCreemConfirm = ref(false)
const showTransfer = ref(false)
const showHistory = ref(false)

// 充值记录
const historyLoading = ref(false)
const historyData = ref<any[]>([])
const historyHeaders = [
    { title: '订单号', key: 'trade_no', sortable: false },
    { title: '充值额度', key: 'amount', sortable: true },
    { title: '实付金额', key: 'money', sortable: true },
    { title: '状态', key: 'status', sortable: false },
    { title: '时间', key: 'create_time', sortable: true },
]

// Snackbar
const snackbar = ref({
    show: false,
    message: '',
    color: 'success'
})

function showMessage(message: string, color = 'success') {
    snackbar.value = { show: true, message, color }
}

// 格式化额度
function formatQuota(quota: number): string {
    if (quota === undefined || quota === null) return '✦0.00'
    const quotaPerDollar = 500000
    const dollars = quota / quotaPerDollar
    if (dollars >= 1000) {
        return `✦${(dollars / 1000).toFixed(2)}k`
    }
    return `✦${dollars.toFixed(4)}`
}

// 格式化充值数量（带单位）
function formatQuotaWithAmount(amount: number): string {
    return `${amount.toFixed(2)}`
}

// 计算预设价格
function calculatePresetPrice(preset: { value: number, discount?: number }): number {
    const discount = preset.discount || topupInfo.value.discount[preset.value] || 1.0
    return preset.value * priceRatio.value * discount
}

// 获取支付方式图标
function getPayMethodIcon(type: string): string {
    switch (type) {
        case 'alipay': return 'mdi-alpha-a-circle'
        case 'wxpay': return 'mdi-wechat'
        case 'stripe': return 'mdi-credit-card'
        default: return 'mdi-credit-card-outline'
    }
}

// 获取支付方式颜色
function getPayMethodColor(type: string): string {
    switch (type) {
        case 'alipay': return 'blue'
        case 'wxpay': return 'green'
        case 'stripe': return 'purple'
        default: return 'primary'
    }
}

// 获取支付方式名称
function getPayMethodName(type: string): string {
    const method = payMethods.value.find(m => m.type === type)
    return method?.name || type
}

// 获取状态颜色
function getStatusColor(status: string | number): string {
    if (status === 'completed' || status === 1) return 'success'  // 已完成
    if (status === 'pending' || status === 0) return 'warning'  // 待支付
    if (status === 'failed') return 'error'  // 失败
    return 'grey'
}

// 获取状态文本
function getStatusText(status: string | number): string {
    if (status === 'completed' || status === 1) return '已完成'
    if (status === 'pending' || status === 0) return '待支付'
    if (status === 'failed') return '失败'
    return '未知'
}

// 格式化时间
function formatTime(timestamp: number): string {
    if (!timestamp) return '-'
    const date = new Date(timestamp * 1000)
    return date.toLocaleString('zh-CN')
}

// 获取充值配置
async function getTopupInfo() {
    topupInfoLoading.value = true
    try {
        const res = await API.get('/api/user/topup/info')
        if (res.data.success) {
            const data = res.data.data

            topupInfo.value = {
                amount_options: data.amount_options || [],
                discount: data.discount || {}
            }

            // 处理支付方式
            let methods = data.pay_methods || []
            if (typeof methods === 'string') {
                try {
                    methods = JSON.parse(methods)
                } catch {
                    methods = []
                }
            }

            if (Array.isArray(methods) && methods.length > 0) {
                methods = methods.filter((m: any) => m.name && m.type).map((m: any) => ({
                    ...m,
                    min_topup: Number(m.min_topup) || 0
                }))
            } else {
                methods = []
            }
            payMethods.value = methods

            enableOnlineTopUp.value = data.enable_online_topup || false
            enableStripeTopUp.value = data.enable_stripe_topup || false
            enableCreemTopUp.value = data.enable_creem_topup || false

            const minTopUpValue = enableOnlineTopUp.value
                ? data.min_topup
                : enableStripeTopUp.value
                    ? data.stripe_min_topup
                    : 1
            minTopUp.value = minTopUpValue || 1
            topUpCount.value = minTopUp.value

            // Creem 产品
            try {
                const products = JSON.parse(data.creem_products || '[]')
                creemProducts.value = products
            } catch {
                creemProducts.value = []
            }

            // 预设充值额度
            if (data.amount_options && data.amount_options.length > 0) {
                presetAmounts.value = data.amount_options.map((amount: number) => ({
                    value: amount,
                    discount: data.discount?.[amount] || 1.0
                }))
            } else {
                presetAmounts.value = generatePresetAmounts(minTopUp.value)
            }

            // 获取初始实付金额
            await getAmount(minTopUp.value)
        }
    } catch (error) {
        console.error('获取充值配置失败:', error)
    } finally {
        topupInfoLoading.value = false
    }
}

// 生成预设充值额度
function generatePresetAmounts(minAmount: number) {
    const multipliers = [1, 5, 10, 30, 50, 100]
    return multipliers.map(multiplier => ({
        value: minAmount * multiplier,
        discount: 1.0
    }))
}

// 获取实付金额
async function getAmount(value?: number) {
    const amount = value ?? topUpCount.value
    amountLoading.value = true
    try {
        const res = await API.post('/api/user/amount', { amount: parseFloat(String(amount)) })
        if (res.data.message === 'success') {
            actualAmount.value = parseFloat(res.data.data)
        } else {
            actualAmount.value = 0
        }
    } catch (error) {
        console.error('获取金额失败:', error)
        actualAmount.value = 0
    } finally {
        amountLoading.value = false
    }
}

// 处理充值数量变化
async function handleAmountChange(value: number | null) {
    if (value && value >= 1) {
        selectedPreset.value = null
        await getAmount(value)
    }
}

// 选择预设充值额度
async function selectPresetAmount(preset: { value: number, discount?: number }) {
    topUpCount.value = preset.value
    selectedPreset.value = preset.value
    await getAmount(preset.value)
}

// 预充值
async function preTopUp(payment: string) {
    if (payment === 'stripe') {
        if (!enableStripeTopUp.value) {
            showMessage('管理员未开启 Stripe 充值！', 'error')
            return
        }
    } else {
        if (!enableOnlineTopUp.value) {
            showMessage('管理员未开启在线充值！', 'error')
            return
        }
    }

    payWay.value = payment
    paymentLoading.value = true

    try {
        if (payment === 'stripe') {
            await getStripeAmount()
        } else {
            await getAmount()
        }

        if (topUpCount.value < minTopUp.value) {
            showMessage(`充值数量不能小于 ${minTopUp.value}`, 'error')
            return
        }

        showPayConfirm.value = true
    } finally {
        paymentLoading.value = false
    }
}

// 获取 Stripe 金额
async function getStripeAmount(value?: number) {
    const amount = value ?? topUpCount.value
    amountLoading.value = true
    try {
        const res = await API.post('/api/user/stripe/amount', { amount: parseFloat(String(amount)) })
        if (res.data.message === 'success') {
            actualAmount.value = parseFloat(res.data.data)
        } else {
            actualAmount.value = 0
        }
    } catch (error) {
        console.error('获取 Stripe 金额失败:', error)
    } finally {
        amountLoading.value = false
    }
}

// 在线充值
async function onlineTopUp() {
    if (topUpCount.value < minTopUp.value) {
        showMessage(`充值数量不能小于 ${minTopUp.value}`, 'error')
        return
    }

    confirmLoading.value = true
    try {
        let res
        if (payWay.value === 'stripe') {
            res = await API.post('/api/user/stripe/pay', {
                amount: parseInt(String(topUpCount.value)),
                payment_method: 'stripe'
            })
        } else {
            res = await API.post('/api/user/pay', {
                amount: parseInt(String(topUpCount.value)),
                payment_method: payWay.value
            })
        }

        if (res?.data?.message === 'success') {
            if (payWay.value === 'stripe') {
                window.open(res.data.data.pay_link, '_blank')
            } else {
                // 表单提交
                const params = res.data.data
                const url = res.data.url
                const form = document.createElement('form')
                form.action = url
                form.method = 'POST'
                form.target = '_blank'

                for (const key in params) {
                    const input = document.createElement('input')
                    input.type = 'hidden'
                    input.name = key
                    input.value = params[key]
                    form.appendChild(input)
                }

                document.body.appendChild(form)
                form.submit()
                document.body.removeChild(form)
            }
        } else {
            showMessage(res?.data?.data || '支付请求失败', 'error')
        }
    } catch (error) {
        console.error('支付请求失败:', error)
        showMessage('支付请求失败', 'error')
    } finally {
        showPayConfirm.value = false
        confirmLoading.value = false
    }
}

// Creem 预充值
function creemPreTopUp(product: any) {
    if (!enableCreemTopUp.value) {
        showMessage('管理员未开启 Creem 充值！', 'error')
        return
    }
    selectedCreemProduct.value = product
    showCreemConfirm.value = true
}

// Creem 在线充值
async function onlineCreemTopUp() {
    if (!selectedCreemProduct.value?.productId) {
        showMessage('产品配置错误，请联系管理员', 'error')
        return
    }

    confirmLoading.value = true
    try {
        const res = await API.post('/api/user/creem/pay', {
            product_id: selectedCreemProduct.value.productId,
            payment_method: 'creem'
        })

        if (res?.data?.message === 'success') {
            window.open(res.data.data.checkout_url, '_blank')
        } else {
            showMessage(res?.data?.data || '支付请求失败', 'error')
        }
    } catch (error) {
        console.error('支付请求失败:', error)
        showMessage('支付请求失败', 'error')
    } finally {
        showCreemConfirm.value = false
        confirmLoading.value = false
    }
}

// 兑换码充值
async function topUp() {
    if (!redemptionCode.value) {
        showMessage('请输入兑换码！', 'warning')
        return
    }

    isSubmitting.value = true
    try {
        const res = await API.post('/api/user/topup', { key: redemptionCode.value })
        if (res.data.success) {
            showMessage('兑换成功！', 'success')
            redemptionCode.value = ''
            // 刷新用户信息
            await userStore.fetchUserSelf()
        } else {
            showMessage(res.data.message || '兑换失败', 'error')
        }
    } catch (error) {
        console.error('兑换失败:', error)
        showMessage('请求失败', 'error')
    } finally {
        isSubmitting.value = false
    }
}

// 获取邀请链接
async function getAffLink() {
    try {
        const res = await API.get('/api/user/aff')
        if (res.data.success) {
            affLink.value = `${window.location.origin}/register?aff=${res.data.data}`
        }
    } catch (error) {
        console.error('获取邀请链接失败:', error)
    }
}

// 复制邀请链接
async function copyAffLink() {
    try {
        await navigator.clipboard.writeText(affLink.value)
        showMessage('邀请链接已复制到剪贴板', 'success')
    } catch (error) {
        showMessage('复制失败', 'error')
    }
}

// 划转邀请收益
async function transfer() {
    if (transferAmount.value < quotaPerUnit.value) {
        showMessage(`划转金额最低为 ${formatQuota(quotaPerUnit.value)}`, 'error')
        return
    }

    try {
        const res = await API.post('/api/user/aff_transfer', { quota: transferAmount.value })
        if (res.data.success) {
            showMessage(res.data.message || '划转成功', 'success')
            showTransfer.value = false
            await userStore.fetchUserSelf()
        } else {
            showMessage(res.data.message || '划转失败', 'error')
        }
    } catch (error) {
        console.error('划转失败:', error)
        showMessage('请求失败', 'error')
    }
}

// 获取充值记录
async function getTopupHistory() {
    historyLoading.value = true
    try {
        const res = await API.get('/api/user/topup/self')
        if (res.data.success) {
            historyData.value = res.data.data?.items || []
        }
    } catch (error) {
        console.error('获取充值记录失败:', error)
    } finally {
        historyLoading.value = false
    }
}

// 监听充值记录对话框
watch(showHistory, (val) => {
    if (val) {
        getTopupHistory()
    }
})

// 获取系统状态中的价格比例
async function getSystemStatus() {
    try {
        const statusStr = localStorage.getItem('status')
        if (statusStr) {
            const status = JSON.parse(statusStr)
            priceRatio.value = status.price || 1
            topUpLink.value = status.top_up_link || ''
        }
    } catch (error) {
        console.error('获取系统状态失败:', error)
    }
}

// 初始化
onMounted(async () => {
    loading.value = true
    try {
        await Promise.all([
            getSystemStatus(),
            getTopupInfo(),
            getAffLink(),
            userStore.fetchUserSelf()
        ])
        transferAmount.value = quotaPerUnit.value
    } finally {
        loading.value = false
    }
})
</script>

<style scoped>
.stats-card {
    border-radius: 16px !important;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stats-card-blue {
    background: linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(33, 150, 243, 0.05) 100%);
}

.stats-card-purple {
    background: linear-gradient(135deg, rgba(156, 39, 176, 0.1) 0%, rgba(156, 39, 176, 0.05) 100%);
}

.stats-card-green {
    background: linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%);
}

.preset-card {
    transition: all 0.2s ease;
}

.cursor-pointer {
    cursor: pointer;
}
</style>
