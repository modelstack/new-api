<template>
  <v-container fluid class="pa-0">
    <!-- Notice Modal -->
    <NoticeModal v-model="showNoticeModal" :announcements="systemAnnouncements" />

    <!-- Hero Section -->
    <v-sheet class="hero-section d-flex align-center position-relative overflow-hidden" min-height="85vh">
       <!-- Background effect -->
       <div class="hero-bg-glow"></div>

       <v-container>
         <v-row align="center" justify="space-between">
           <v-col cols="12" md="6" class="text-left pt-6 animate-fade-up">
             <h1 class="text-h3 text-md-h2 font-weight-black mb-6 leading-tight">
               构建您的 <br/>
               <span class="text-primary gradient-text d-block mt-2">AI 智能应用</span>
             </h1>
             <p class="text-h6 text-medium-emphasis mb-8" style="max-width: 540px; line-height: 1.6;">
               ModelStack 提供一站式 AI 模型接入服务。
               <br class="d-none d-md-block" />
               稳定、高速、安全，让您专注于创造价值。
             </p>
             <div class="d-flex gap-4 flex-wrap">
               <v-btn color="primary" size="x-large" to="/models" rounded="lg" variant="tonal" class="px-8">
                 <v-icon start>mdi-rocket-launch</v-icon>
                 立即开始
               </v-btn>
               <v-btn variant="outlined" size="x-large" href="https://docs.modelstack.app" target="_blank" rounded="lg" class="px-8 ml-sm-4 mt-4 mt-sm-0">
                 <v-icon start>mdi-book-open-page-variant</v-icon>
                 查看文档
               </v-btn>
             </div>
           </v-col>

           <v-col cols="12" md="6" class="d-none d-md-block animate-fade-in-delay pl-md-12">
             <v-card class="code-window" elevation="12" rounded="lg" theme="dark" border>
               <div class="window-header d-flex align-center px-4 py-3 bg-grey-darken-4 border-b">
                 <div class="d-flex ga-2">
                   <div class="window-dot bg-red-lighten-1"></div>
                   <div class="window-dot bg-amber-lighten-1"></div>
                   <div class="window-dot bg-green-lighten-1"></div>
                 </div>
                 <div class="text-caption text-grey ml-4 font-mono">modelstack.py</div>
               </div>
               <div class="code-content pa-6 bg-grey-darken-4 font-mono text-body-2">
                 <pre><code class="language-python"><span class="keyword">from</span> openai <span class="keyword">import</span> OpenAI
 
client = OpenAI(
    api_key = <span class="string">"your-api-key"</span>,
    base_url = <span class="string">"https://modelstack.app/v1"</span>,
)

completion = client.chat.completions.create(
    model = <span class="string">"gemini-2.5-pro"</span>,
    messages = [
        {<span class="string">"role"</span>: <span class="string">"system"</span>, <span class="string">"content"</span>: <span class="string">"你是一个智能助手..."</span>},
        {<span class="string">"role"</span>: <span class="string">"user"</span>, <span class="string">"content"</span>: <span class="string">"你好，Flash Attention 是什么？"</span>}
    ],
    temperature = <span class="number">0.6</span>,
)

<span class="function">print</span>(completion.choices[<span class="number">0</span>].message.content)</code></pre>
               </div>
             </v-card>
           </v-col>
         </v-row>
       </v-container>
    </v-sheet>

    <!-- Features Section -->
    <v-container class="py-16">
      <v-row class="mb-12">
        <v-col cols="12" md="8" class="text-left pt-6">
          <h2 class="text-h3 font-weight-bold mb-4">为什么选择 ModelStack?</h2>
          <p class="text-h6 text-medium-emphasis">
            为开发者打造的企业级基础设施，助力您的业务快速成长
          </p>
        </v-col>
      </v-row>

      <v-row>
        <v-col
          v-for="(feature, i) in features"
          :key="i"
          cols="12"
          :md="(i % 4 === 0 || i % 4 === 3) ? 8 : 4"
        >
          <v-hover v-slot="{ isHovering, props }">
            <v-card
              v-bind="props"
              elevation="0"
              :class="feature.bgClass"
              :theme="feature.dark ? 'dark' : undefined"
              class="feature-card h-100 pa-8 transition-swing d-flex flex-column"
              rounded="xl"
            >
              <div class="d-flex align-start mb-16">
                 <v-icon size="40" :color="feature.dark ? 'white' : 'on-surface'">{{ feature.icon }}</v-icon>
              </div>
              
              <div class="mt-auto">
                <h3 class="text-h5 font-weight-bold mb-3">{{ feature.title }}</h3>
                <p :class="feature.dark ? 'text-white' : 'text-medium-emphasis'" class="text-body-1" style="line-height: 1.6;">
                  {{ feature.description }}
                </p>
              </div>
            </v-card>
          </v-hover>
        </v-col>
      </v-row>
    </v-container>

    <!-- CTA Section -->
    <v-container class="pb-16">
      <v-sheet
        class="cta-section pt-12 pb-12 position-relative overflow-hidden d-flex align-center justify-center text-center"
        rounded="xl"
        min-height="400"
      >
        <div style="z-index: 1" class="mx-auto pl-8 pr-8">
          <h2 class="text-h3 font-weight-bold text-white mb-6">
            随时随地构建 AI 应用
          </h2>
          <p class="text-h6 text-white mb-8 opacity-90">
            无论是在服务器、桌面还是移动设备，ModelStack 都能为您提供一致、高性能的模型服务体验。
          </p>
          <v-btn
            color="white"
            size="x-large"
            rounded="pill"
            elevation="0"
            class="font-weight-bold px-8 cta-button"
            to="/register"
          >
            <v-icon start>mdi-rocket-launch</v-icon>
            立即注册
          </v-btn>
        </div>
      </v-sheet>
    </v-container>

    <!-- Footer -->
    <v-footer class="site-footer py-6 text-center">
      <v-container>
        <p class="text-body-2 text-medium-emphasis mb-0">
          本站基于
          <a 
            href="https://github.com/QuantumNous/new-api" 
            target="_blank" 
            rel="noopener noreferrer"
            class="footer-link"
          >
            NewAPI
          </a>
          开发
        </p>
      </v-container>
    </v-footer>
  </v-container>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useTheme } from 'vuetify'
import NoticeModal from '@/components/NoticeModal.vue'
import { API } from '@/utils/api'

const theme = useTheme()

// Notice Modal
const showNoticeModal = ref(false)
const systemAnnouncements = ref<any[]>([])

// 检查今日是否已关闭公告
const checkTodayNotice = () => {
  const closedDate = localStorage.getItem('notice_close_date')
  const today = new Date().toDateString()
  return closedDate !== today
}

// 获取系统状态和公告
const fetchSystemStatus = async () => {
  try {
    const res = await API.get('/api/status')
    if (res.data?.data?.announcements) {
      systemAnnouncements.value = res.data.data.announcements
    }
  } catch {
    // ignore
  }
}

// 自动显示公告
onMounted(async () => {
  await fetchSystemStatus()
  // 如果今日未关闭且有公告，自动显示
  if (checkTodayNotice()) {
    // 延迟一下显示，让页面先渲染
    setTimeout(() => {
      showNoticeModal.value = true
    }, 800)
  }
})

const features = ref([
  {
    icon: 'mdi-lightning-bolt',
    title: '极致性能',
    description: '全球边缘节点加速，智能路由调度，确保最低延迟和最高吞吐量，让您的应用快人一步。',
    bgClass: 'feature-bg-blue'
  },
  {
    icon: 'mdi-shield-check',
    title: '安全可靠',
    description: '企业级安全保障，数据传输全链路加密，严格的隐私保护机制，让您无后顾之忧。',
    bgClass: 'feature-bg-green'
  },
  {
    icon: 'mdi-currency-usd',
    title: '灵活计费',
    description: '按 Token 计费，透明定价，无隐藏费用。支持多种模型混合调用，成本可控。',
    bgClass: 'feature-bg-yellow'
  },
  {
    icon: 'mdi-api',
    title: '统一接口',
    description: '完全兼容 OpenAI 接口格式，一行代码即可无缝切换多种模型，降低开发迁移成本。',
    bgClass: 'feature-bg-red'
  },
  {
    icon: 'mdi-chart-line',
    title: '实时监控',
    description: '提供详细的调用日志和用量分析报表，帮助您实时掌握业务状况，优化应用性能。',
    bgClass: 'feature-bg-amber'
  },
  {
    icon: 'mdi-headset',
    title: '专业支持',
    description: '7x24小时技术支持团队，完善的文档和社区，助您快速解决问题，落地业务。',
    bgClass: 'feature-bg-primary',
    dark: true
  }
])
</script>

<style scoped>
.hero-section {
  background: linear-gradient(135deg, rgb(var(--v-theme-surface)) 0%, rgb(var(--v-theme-surface-variant)) 100%);
}

.hero-bg-glow {
  position: absolute;
  top: -20%;
  right: -10%;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(var(--v-theme-primary), 0.15) 0%, rgba(0,0,0,0) 70%);
  border-radius: 50%;
  filter: blur(80px);
  z-index: 0;
  pointer-events: none;
}

.gradient-text {
  color: #EA73E8;
}

.window-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.code-content {
  overflow-x: auto;
  line-height: 1.5;
}

.font-mono {
  font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
}

/* Simple Syntax Highlighting Simulation */
.keyword { color: #c678dd; }
.string { color: #98c379; }
.number { color: #d19a66; }
.function { color: #61afef; }

/* Animations */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-up {
  animation: fadeUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

.animate-fade-in-delay {
  opacity: 0;
  animation: fadeUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) 0.2s forwards;
}

.feature-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Feature card backgrounds - Light mode */
.feature-bg-blue {
  background-color: #e8f0fe;
}
.feature-bg-green {
  background-color: #ceead6;
}
.feature-bg-yellow {
  background-color: #fef7e0;
}
.feature-bg-red {
  background-color: #fce8e6;
}
.feature-bg-amber {
  background-color: #fde293;
}
.feature-bg-primary {
  background-color: #1a73e8;
}

/* Feature card backgrounds - Dark mode */
.v-theme--dark .feature-bg-blue {
  background-color: #1e3a5f;
}
.v-theme--dark .feature-bg-green {
  background-color: #1e4d2b;
}
.v-theme--dark .feature-bg-yellow {
  background-color: #4d4020;
}
.v-theme--dark .feature-bg-red {
  background-color: #4d2c2a;
}
.v-theme--dark .feature-bg-amber {
  background-color: #4d3d1a;
}
.v-theme--dark .feature-bg-primary {
  background-color: #1e3a5f;
}

/* CTA Section */
.cta-section {
  background: linear-gradient(135deg, #3872e0 0%, #7c4dff 100%);
}

.v-theme--dark .cta-section {
  background: #1e3a5f;
}

.cta-button {
  color: #7c4dff !important;
}

/* Footer */
.site-footer {
  background: transparent;
}

.footer-link {
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.2s ease;
}

.footer-link:hover {
  opacity: 0.8;
  text-decoration: underline;
}
</style>
