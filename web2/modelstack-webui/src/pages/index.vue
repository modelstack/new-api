<template>
  <v-container fluid class="pa-6">
    <div class="text-center py-16">
      <h1 class="text-h2 font-weight-bold mb-4">
        欢迎来到 <span class="text-primary">Model</span>Stack
      </h1>
      <p class="text-h6 text-medium-emphasis mb-8">
        一站式 AI 模型服务平台，为您提供多种优质模型选择
      </p>
      <v-btn color="primary" size="large" to="/models" rounded="lg">
        <v-icon start>mdi-cube-outline</v-icon>
        探索模型广场
      </v-btn>
    </div>

    <v-row class="mt-8">
      <v-col cols="12" md="4">
        <v-card variant="tonal" class="pa-6 text-center h-100">
          <v-icon size="48" color="primary" class="mb-4">mdi-lightning-bolt</v-icon>
          <h3 class="text-h6 font-weight-bold mb-2">高性能</h3>
          <p class="text-body-2 text-medium-emphasis">
            优化的基础设施，确保低延迟和高吞吐量
          </p>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card variant="tonal" class="pa-6 text-center h-100">
          <v-icon size="48" color="primary" class="mb-4">mdi-shield-check</v-icon>
          <h3 class="text-h6 font-weight-bold mb-2">安全可靠</h3>
          <p class="text-body-2 text-medium-emphasis">
            企业级安全保障，数据隐私有保证
          </p>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card variant="tonal" class="pa-6 text-center h-100">
          <v-icon size="48" color="primary" class="mb-4">mdi-currency-usd</v-icon>
          <h3 class="text-h6 font-weight-bold mb-2">灵活计费</h3>
          <p class="text-body-2 text-medium-emphasis">
            按需付费，透明定价，无隐藏费用
          </p>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
  //
</script>
