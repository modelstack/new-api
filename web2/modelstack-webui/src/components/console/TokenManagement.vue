<template>
    <div>
        <!-- 页面标题 -->
        <div class="d-flex justify-space-between align-center mb-4">
            <div>
                <h1 class="text-h5 font-weight-bold">令牌管理</h1>
                <p class="text-body-2 text-medium-emphasis mt-1">
                    管理您的 API 令牌，用于访问 API 接口
                </p>
            </div>
            <v-btn color="primary" prepend-icon="mdi-plus" @click="showCreateDialog = true">
                创建令牌
            </v-btn>
        </div>

        <!-- 搜索栏 -->
        <!-- <v-card variant="flat" class="mb-4">
            <v-card-text class="pa-3">
                <v-row dense>
                    <v-col cols="12" sm="6" md="4">
                        <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" placeholder="搜索令牌名称..."
                            variant="outlined" density="compact" hide-details clearable />
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card> -->

        <!-- 令牌数据表格 -->
        <v-card variant="flat">
            <v-data-table-server v-model:items-per-page="itemsPerPage" v-model:page="page" :headers="headers"
                :items="tokens" :items-length="totalItems" :loading="loading" :search="search" class="elevation-0"
                @update:options="loadTokens">
                <!-- 名称列 -->
                <template v-slot:item.name="{ item }">
                    <div class="font-weight-medium">{{ item.name }}</div>
                </template>

                <!-- 令牌 Key 列 -->
                <template v-slot:item.key="{ item }">
                    <div class="d-flex align-center pt-2 pb-2">
                        <code class="text-body-2 token-key-bg px-2 py-1 rounded token-key-text">
                            {{ showKey[item.id] ? 'sk-' + item.key : maskKey(item.key) }}
                        </code>
                        <div class="d-flex flex-shrink-0 ml-1">
                            <v-btn icon variant="text" size="x-small" @click="toggleKeyVisibility(item.id)">
                                <v-icon size="16">{{ showKey[item.id] ? 'mdi-eye-off' : 'mdi-eye' }}</v-icon>
                            </v-btn>
                            <v-btn icon variant="text" size="x-small" @click="copyKey(item.key)">
                                <v-icon size="16">mdi-content-copy</v-icon>
                            </v-btn>
                        </div>
                    </div>
                </template>

                <!-- 状态列 -->
                <template v-slot:item.status="{ item }">
                    <v-chip :color="getStatusColor(item.status)" size="small" variant="tonal">
                        {{ getStatusText(item.status) }}
                    </v-chip>
                </template>

                <!-- 额度列 -->
                <template v-slot:item.quota="{ item }">
                    <span v-if="item.unlimited_quota" class="text-success">
                        <v-icon size="small" class="mr-1">mdi-infinity</v-icon>
                        无限
                    </span>
                    <span v-else>
                        {{ formatQuota(item.remain_quota) }}
                    </span>
                </template>

                <!-- 已用额度列 -->
                <template v-slot:item.used_quota="{ item }">
                    {{ formatQuota(item.used_quota) }}
                </template>

                <!-- 创建时间列 -->
                <template v-slot:item.created_time="{ item }">
                    {{ formatTime(item.created_time) }}
                </template>

                <!-- 过期时间列 -->
                <template v-slot:item.expired_time="{ item }">
                    <span v-if="item.expired_time === -1" class="text-success">永不过期</span>
                    <span v-else :class="isExpired(item.expired_time) ? 'text-error' : ''">
                        {{ formatTime(item.expired_time) }}
                    </span>
                </template>

                <!-- 操作列 -->
                <template v-slot:item.actions="{ item }">
                    <v-btn icon variant="text" size="small" color="primary" @click="editToken(item)">
                        <v-icon size="18">mdi-pencil</v-icon>
                        <v-tooltip activator="parent" location="top">编辑</v-tooltip>
                    </v-btn>
                    <v-btn icon variant="text" size="small" color="error" @click="confirmDelete(item)">
                        <v-icon size="18">mdi-delete</v-icon>
                        <v-tooltip activator="parent" location="top">删除</v-tooltip>
                    </v-btn>
                </template>

                <!-- 空状态 -->
                <template v-slot:no-data>
                    <div class="text-center py-8">
                        <v-icon size="64" color="grey-lighten-1">mdi-key-variant</v-icon>
                        <p class="text-body-1 text-medium-emphasis mt-4">暂无令牌</p>
                        <v-btn color="primary" variant="tonal" class="mt-2" @click="showCreateDialog = true">
                            创建第一个令牌
                        </v-btn>
                    </div>
                </template>

                <!-- 加载状态 -->
                <template v-slot:loading>
                    <v-skeleton-loader type="table-row@5" />
                </template>
            </v-data-table-server>
        </v-card>

        <!-- 创建/编辑令牌对话框 -->
        <v-dialog v-model="showCreateDialog" max-width="500">
            <v-card>
                <v-card-title class="text-h6">
                    {{ editingToken ? '编辑令牌' : '创建令牌' }}
                </v-card-title>
                <v-card-text>
                    <v-form ref="formRef">
                        <v-text-field v-model="tokenForm.name" label="令牌名称" variant="outlined" density="comfortable"
                            :rules="[v => !!v || '请输入令牌名称']" class="mb-3" />
                        <v-switch v-model="tokenForm.unlimited_quota" label="无限额度" color="primary" hide-details
                            class="mb-3" />
                        <v-text-field v-if="!tokenForm.unlimited_quota" v-model.number="tokenForm.remain_quota"
                            label="额度" type="number" variant="outlined" density="comfortable" class="mb-3" />
                        <v-select v-model="tokenForm.expired_time" label="过期时间" :items="expiredOptions"
                            variant="outlined" density="comfortable" />
                    </v-form>
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn variant="text" @click="closeDialog">取消</v-btn>
                    <v-btn color="primary" @click="saveToken" :loading="saving">
                        {{ editingToken ? '保存' : '创建' }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- 删除确认对话框 -->
        <v-dialog v-model="showDeleteDialog" max-width="400">
            <v-card>
                <v-card-title class="text-h6">确认删除</v-card-title>
                <v-card-text>
                    确定要删除令牌 "<strong>{{ deletingToken?.name }}</strong>" 吗？此操作无法撤销。
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn variant="text" @click="showDeleteDialog = false">取消</v-btn>
                    <v-btn color="error" @click="deleteToken" :loading="deleting">删除</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- 提示消息 -->
        <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
            {{ snackbar.message }}
        </v-snackbar>
    </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

// 类型定义
interface Token {
    id: number
    user_id: number
    key: string
    status: number
    name: string
    created_time: number
    accessed_time: number
    expired_time: number
    remain_quota: number
    unlimited_quota: boolean
    model_limits_enabled: boolean
    model_limits: string
    allow_ips: string
    used_quota: number
    group: string
}

// 表格配置
const headers = [
    { title: '名称', key: 'name', sortable: false },
    { title: '令牌', key: 'key', sortable: false, width: '280px' },
    { title: '状态', key: 'status', sortable: false, width: '100px' },
    { title: '剩余额度', key: 'quota', sortable: false, width: '120px' },
    { title: '已用额度', key: 'used_quota', sortable: false, width: '120px' },
    { title: '创建时间', key: 'created_time', sortable: false, width: '160px' },
    { title: '过期时间', key: 'expired_time', sortable: false, width: '140px' },
    { title: '操作', key: 'actions', sortable: false, width: '120px', align: 'center' as const },
]

// 数据状态
const tokens = ref<Token[]>([])
const totalItems = ref(0)
const loading = ref(false)
const page = ref(1)
const itemsPerPage = ref(10)
const search = ref('')
const showKey = ref<Record<number, boolean>>({})

// 对话框状态
const showCreateDialog = ref(false)
const showDeleteDialog = ref(false)
const editingToken = ref<Token | null>(null)
const deletingToken = ref<Token | null>(null)
const saving = ref(false)
const deleting = ref(false)
const formRef = ref()

// 表单数据
const tokenForm = reactive({
    name: '',
    unlimited_quota: true,
    remain_quota: 0,
    expired_time: -1,
})

// 过期时间选项
const expiredOptions = [
    { title: '永不过期', value: -1 },
    { title: '1 天', value: 1 },
    { title: '7 天', value: 7 },
    { title: '30 天', value: 30 },
    { title: '90 天', value: 90 },
    { title: '365 天', value: 365 },
]

// 提示消息
const snackbar = reactive({
    show: false,
    message: '',
    color: 'success',
})

// 加载令牌列表
const loadTokens = async () => {
    loading.value = true
    try {
        // 确保用户信息已加载
        await userStore.ensureUserLoaded()
        
        const params = new URLSearchParams({
            p: page.value.toString(),
            size: itemsPerPage.value.toString(),
        })

        const response = await fetch(`/api/token/?${params}`, {
            headers: {
                'New-API-User': userStore.userId.toString(),
            },
        })
        const data = await response.json()

        if (data.success) {
            tokens.value = data.data.items || []
            totalItems.value = data.data.total || 0
        } else {
            showSnackbar(data.message || '获取令牌列表失败', 'error')
        }
    } catch (error) {
        console.error('Failed to load tokens:', error)
        showSnackbar('网络错误，请稍后重试', 'error')
    } finally {
        loading.value = false
    }
}

// 遮盖令牌 Key
const maskKey = (key: string) => {
    if (key.length <= 8) return 'sk-********'
    return 'sk-' + key.substring(0, 4) + '...' + key.substring(key.length - 4)
}

// 切换 Key 可见性
const toggleKeyVisibility = (id: number) => {
    showKey.value[id] = !showKey.value[id]
}

// 复制 Key
const copyKey = async (key: string) => {
    try {
        await navigator.clipboard.writeText('sk-' + key)
        showSnackbar('令牌已复制到剪贴板', 'success')
    } catch {
        showSnackbar('复制失败', 'error')
    }
}

// 获取状态颜色
const getStatusColor = (status: number) => {
    switch (status) {
        case 1: return 'success'
        case 2: return 'warning'
        case 3: return 'error'
        default: return 'grey'
    }
}

// 获取状态文本
const getStatusText = (status: number) => {
    switch (status) {
        case 1: return '已启用'
        case 2: return '已禁用'
        case 3: return '已过期'
        default: return '未知'
    }
}

// 格式化额度
const formatQuota = (quota: number) => {
    if (quota >= 1000000) {
        return (quota / 1000000).toFixed(2) + 'M'
    }
    if (quota >= 1000) {
        return (quota / 1000).toFixed(2) + 'K'
    }
    return quota.toString()
}

// 格式化时间
const formatTime = (timestamp: number) => {
    if (timestamp <= 0) return '-'
    const date = new Date(timestamp * 1000)
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    })
}

// 检查是否过期
const isExpired = (expiredTime: number) => {
    if (expiredTime === -1) return false
    return expiredTime * 1000 < Date.now()
}

// 编辑令牌
const editToken = (token: Token) => {
    editingToken.value = token
    tokenForm.name = token.name
    tokenForm.unlimited_quota = token.unlimited_quota
    tokenForm.remain_quota = token.remain_quota
    tokenForm.expired_time = -1 // 编辑时默认不修改过期时间
    showCreateDialog.value = true
}

// 确认删除
const confirmDelete = (token: Token) => {
    deletingToken.value = token
    showDeleteDialog.value = true
}

// 保存令牌
const saveToken = async () => {
    const { valid } = await formRef.value.validate()
    if (!valid) return

    saving.value = true
    try {
        const url = editingToken.value ? '/api/token/' : '/api/token/'
        const method = editingToken.value ? 'PUT' : 'POST'

        const body: Record<string, unknown> = {
            name: tokenForm.name,
            unlimited_quota: tokenForm.unlimited_quota,
            remain_quota: tokenForm.unlimited_quota ? 0 : tokenForm.remain_quota,
        }

        if (editingToken.value) {
            body.id = editingToken.value.id
        }

        // 处理过期时间
        if (tokenForm.expired_time !== -1) {
            body.expired_time = Math.floor(Date.now() / 1000) + tokenForm.expired_time * 24 * 60 * 60
        } else {
            body.expired_time = -1
        }

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'New-API-User': userStore.userId.toString(),
            },
            body: JSON.stringify(body),
        })

        const data = await response.json()

        if (data.success) {
            showSnackbar(editingToken.value ? '令牌更新成功' : '令牌创建成功', 'success')
            closeDialog()
            loadTokens()
        } else {
            showSnackbar(data.message || '操作失败', 'error')
        }
    } catch (error) {
        console.error('Failed to save token:', error)
        showSnackbar('网络错误，请稍后重试', 'error')
    } finally {
        saving.value = false
    }
}

// 删除令牌
const deleteToken = async () => {
    if (!deletingToken.value) return

    deleting.value = true
    try {
        const response = await fetch(`/api/token/${deletingToken.value.id}`, {
            method: 'DELETE',
            headers: {
                'New-API-User': userStore.userId.toString(),
            },
        })

        const data = await response.json()

        if (data.success) {
            showSnackbar('令牌删除成功', 'success')
            showDeleteDialog.value = false
            deletingToken.value = null
            loadTokens()
        } else {
            showSnackbar(data.message || '删除失败', 'error')
        }
    } catch (error) {
        console.error('Failed to delete token:', error)
        showSnackbar('网络错误，请稍后重试', 'error')
    } finally {
        deleting.value = false
    }
}

// 关闭对话框
const closeDialog = () => {
    showCreateDialog.value = false
    editingToken.value = null
    tokenForm.name = ''
    tokenForm.unlimited_quota = true
    tokenForm.remain_quota = 0
    tokenForm.expired_time = -1
}

// 显示提示消息
const showSnackbar = (message: string, color: string = 'success') => {
    snackbar.message = message
    snackbar.color = color
    snackbar.show = true
}

// 初始化加载
onMounted(() => {
    loadTokens()
})
</script>

<style scoped>
code {
    font-size: 12px;
    font-family: 'Consolas', 'Monaco', monospace;
}

.token-key-bg {
    background: rgba(128, 128, 128, 0.15);
}

.token-key-text {
    word-break: break-all;
    max-width: 200px;
    display: inline-block;
}
</style>
