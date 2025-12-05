<template>
    <v-dialog v-model="dialogVisible" max-width="720" :fullscreen="smAndDown" scrollable
        transition="dialog-bottom-transition">
        <v-card rounded="xl" class="notice-dialog">
            <!-- Header -->
            <v-card-title class="d-flex align-center justify-space-between pa-4 pb-0">
                <div class="d-flex align-center ga-3">
                    <span class="text-h5 font-weight-bold">通知</span>
                </div>
            </v-card-title>

            <!-- Tabs -->
            <div class="px-4 pt-4">
                <v-tabs v-model="activeTab" color="primary" density="comfortable" class="notice-tabs">
                    <v-tab value="notice" class="text-none" rounded="lg">
                        <v-icon start size="18">mdi-bell-outline</v-icon>
                        通知
                    </v-tab>
                    <v-tab value="system" class="text-none" rounded="lg">
                        <v-icon start size="18">mdi-newspaper-variant-outline</v-icon>
                        系统动态
                    </v-tab>
                </v-tabs>
            </div>

            <!-- Content -->
            <v-card-text class="pa-0" style="min-height: 400px; max-height: 60vh;">
                <v-tabs-window v-model="activeTab">
                    <!-- 通知公告 Tab -->
                    <v-tabs-window-item value="notice">
                        <div class="pa-6">
                            <!-- Loading State -->
                            <div v-if="loading" class="d-flex flex-column align-center justify-center py-12">
                                <v-progress-circular indeterminate color="primary" size="48" />
                                <p class="text-medium-emphasis mt-4">加载中...</p>
                            </div>

                            <!-- Empty State -->
                            <div v-else-if="!noticeContent"
                                class="d-flex flex-column align-center justify-center py-12">
                                <div class="empty-icon-wrapper mb-4">
                                    <v-icon size="64" color="grey-lighten-1">mdi-bell-off-outline</v-icon>
                                </div>
                                <p class="text-h6 text-medium-emphasis">暂无公告</p>
                                <p class="text-body-2 text-disabled">管理员还没有发布任何公告</p>
                            </div>

                            <!-- Notice Content -->
                            <div v-else class="notice-content markdown-body" v-html="noticeContent" />
                        </div>
                    </v-tabs-window-item>

                    <!-- 系统动态 Tab -->
                    <v-tabs-window-item value="system">
                        <div class="pa-6">
                            <!-- Empty State -->
                            <div v-if="announcements.length === 0"
                                class="d-flex flex-column align-center justify-center py-12">
                                <div class="empty-icon-wrapper mb-4">
                                    <v-icon size="64" color="grey-lighten-1">mdi-newspaper-variant-outline</v-icon>
                                </div>
                                <p class="text-h6 text-medium-emphasis">暂无系统动态</p>
                                <p class="text-body-2 text-disabled">系统运行一切正常</p>
                            </div>

                            <!-- Timeline -->
                            <v-timeline v-else align="start" density="compact" side="end" class="announcement-timeline">
                                <v-timeline-item v-for="(item, index) in announcements" :key="index"
                                    :dot-color="getTypeColor(item.type)" size="small">

                                    <v-card :class="['announcement-card', { 'unread-card': item.isUnread }]"
                                        variant="tonal" :color="item.isUnread ? 'primary' : undefined" rounded="lg">
                                        <v-card-text class="pa-4">
                                            <div class="d-flex align-center justify-space-between mb-2">
                                                <span class="text-caption text-medium-emphasis">
                                                    <v-icon size="12" class="mr-1">mdi-clock-outline</v-icon>
                                                    {{ item.relative || item.time }}
                                                </span>
                                            </div>
                                            <div class="announcement-content markdown-body" v-html="item.htmlContent" />
                                            <div v-if="item.htmlExtra"
                                                class="text-caption text-medium-emphasis mt-2 pt-2 border-t"
                                                v-html="item.htmlExtra" />
                                        </v-card-text>
                                    </v-card>
                                </v-timeline-item>
                            </v-timeline>
                        </div>
                    </v-tabs-window-item>
                </v-tabs-window>
            </v-card-text>

            <!-- Footer -->
            <v-card-actions class="pa-4">
                <v-btn variant="text" color="medium-emphasis" @click="closeTodayNotice">
                    <v-icon start size="18">mdi-calendar-remove</v-icon>
                    今日不再显示
                </v-btn>
                <v-btn variant="tonal" color="primary" @click="close">
                    我知道了
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useDisplay } from 'vuetify'
import { API } from '@/utils/api'
import { marked } from 'marked'

interface Announcement {
    publishDate?: string
    content?: string
    type?: string
    extra?: string
}

interface ProcessedAnnouncement {
    key: string
    type: string
    time: string
    relative: string
    content: string
    htmlContent: string
    extra?: string
    htmlExtra?: string
    isUnread: boolean
}

const props = withDefaults(defineProps<{
    modelValue?: boolean
    showFloatingButton?: boolean
    announcements?: Announcement[]
}>(), {
    modelValue: false,
    showFloatingButton: true,
    announcements: () => []
})

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
}>()

const { smAndDown } = useDisplay()

const dialogVisible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
})

const activeTab = ref('notice')
const loading = ref(false)
const noticeContent = ref('')
const readKeys = ref<Set<string>>(new Set())

// 从 localStorage 读取已读状态
onMounted(() => {
    const stored = localStorage.getItem('announcement_read_keys')
    if (stored) {
        try {
            readKeys.value = new Set(JSON.parse(stored))
        } catch {
            readKeys.value = new Set()
        }
    }
})

// 生成公告的唯一 key
const getKeyForItem = (item: Announcement): string => {
    return `${item?.publishDate || ''}-${(item?.content || '').slice(0, 30)}`
}

// 获取相对时间
const getRelativeTime = (dateString?: string): string => {
    if (!dateString) return ''
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''

    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 7) return ''
    if (days > 0) return `${days}天前`
    if (hours > 0) return `${hours}小时前`
    if (minutes > 0) return `${minutes}分钟前`
    return '刚刚'
}

// 处理公告数据
const announcements = computed<ProcessedAnnouncement[]>(() => {
    return (props.announcements || []).slice(0, 20).map((item) => {
        const pubDate = item?.publishDate ? new Date(item.publishDate) : null
        const absoluteTime = pubDate && !isNaN(pubDate.getTime())
            ? `${pubDate.getFullYear()}-${String(pubDate.getMonth() + 1).padStart(2, '0')}-${String(pubDate.getDate()).padStart(2, '0')} ${String(pubDate.getHours()).padStart(2, '0')}:${String(pubDate.getMinutes()).padStart(2, '0')}`
            : item?.publishDate || ''

        const key = getKeyForItem(item)
        return {
            key,
            type: item.type || 'default',
            time: absoluteTime,
            relative: getRelativeTime(item.publishDate),
            content: item.content || '',
            htmlContent: marked.parse(item.content || '') as string,
            extra: item.extra,
            htmlExtra: item.extra ? marked.parse(item.extra) as string : undefined,
            isUnread: !readKeys.value.has(key)
        }
    })
})

const unreadCount = computed(() => announcements.value.filter(a => a.isUnread).length)
const hasUnread = computed(() => unreadCount.value > 0 || (!loading.value && noticeContent.value))

// 获取类型配置
const getTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
        success: 'success',
        warning: 'warning',
        error: 'error',
        info: 'info',
        default: 'primary'
    }
    return colors[type] || 'primary'
}

// 获取公告内容
const fetchNotice = async () => {
    loading.value = true
    try {
        const res = await API.get('/api/notice')
        const { success, data } = res.data
        if (success && data) {
            noticeContent.value = marked.parse(data) as string
        } else {
            noticeContent.value = ''
        }
    } catch {
        noticeContent.value = ''
    } finally {
        loading.value = false
    }
}

// 标记所有公告为已读
const markAllAsRead = () => {
    announcements.value.forEach(item => {
        readKeys.value.add(item.key)
    })
    localStorage.setItem('announcement_read_keys', JSON.stringify([...readKeys.value]))
}

// 打开弹窗
const open = () => {
    dialogVisible.value = true
}

// 关闭弹窗
const close = () => {
    markAllAsRead()
    dialogVisible.value = false
}

// 今日关闭
const closeTodayNotice = () => {
    const today = new Date().toDateString()
    localStorage.setItem('notice_close_date', today)
    close()
}

// 监听弹窗打开
watch(dialogVisible, (val) => {
    if (val) {
        fetchNotice()
    }
})

// 暴露方法
defineExpose({ open, close })
</script>

<style scoped>
.notice-dialog {
    overflow: hidden;
    padding: 16px;
}

.notice-icon-wrapper {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.notice-tabs :deep(.v-tab) {
    min-width: auto;
    padding: 0 16px;
}

.empty-icon-wrapper {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: rgba(var(--v-theme-on-surface), 0.05);
    display: flex;
    align-items: center;
    justify-content: center;
}

.notice-content {
    line-height: 1.8;
}

.notice-content :deep(h1),
.notice-content :deep(h2),
.notice-content :deep(h3) {
    margin-top: 1em;
    margin-bottom: 0.5em;
    font-weight: 600;
}

.notice-content :deep(p) {
    margin-bottom: 1em;
}

.notice-content :deep(ul),
.notice-content :deep(ol) {
    padding-left: 1.5em;
    margin-bottom: 1em;
}

.notice-content :deep(a) {
    color: rgb(var(--v-theme-primary));
    text-decoration: none;
}

.notice-content :deep(a:hover) {
    text-decoration: underline;
}

.notice-content :deep(code) {
    background: rgba(var(--v-theme-on-surface), 0.08);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Fira Code', monospace;
    font-size: 0.9em;
}

.notice-content :deep(pre) {
    background: rgba(var(--v-theme-on-surface), 0.05);
    padding: 16px;
    border-radius: 8px;
    overflow-x: auto;
    margin-bottom: 1em;
}

.notice-content :deep(blockquote) {
    padding-left: 16px;
    margin: 1em 0;
    color: rgba(var(--v-theme-on-surface), 0.7);
}

.announcement-timeline {
    padding-left: 0;
}

.announcement-card {
    transition: all 0.3s ease;
}

.announcement-content {
    font-size: 0.95rem;
    line-height: 1.6;
}

.announcement-content :deep(p) {
    margin: 0;
}

.announcement-content :deep(p + p) {
    margin-top: 0.5em;
}

.notice-fab {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 1000;
}

@media (max-width: 600px) {
    .notice-fab {
        bottom: 80px;
        right: 16px;
    }
}

/* Animation */
@keyframes pulse {

    0%,
    100% {
        transform: scale(1);
    }

    50% {
        transform: scale(1.05);
    }
}

.notice-fab:hover {
    animation: pulse 1s ease-in-out infinite;
}
</style>
