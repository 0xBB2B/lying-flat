<!-- 首页 - 简单的欢迎页面和快速导航 -->
<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function navigateToEmployees() {
  router.push('/employees')
}
</script>

<template>
  <div class="home-view container mx-auto px-4 py-12">
    <!-- 欢迎区域 -->
    <div class="text-center mb-12">
      <h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        欢迎使用员工年假统计系统
      </h1>
      <p class="text-xl text-gray-600 dark:text-gray-400 mb-8">
        智能管理员工年假,自动计算额度,轻松跟踪使用情况
      </p>
      <button
        @click="navigateToEmployees"
        class="
          px-8 py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg
          hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          transition-colors shadow-lg
        "
      >
        开始使用 →
      </button>
    </div>

    <!-- 功能介绍 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
      <!-- 功能卡片 1 -->
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div class="text-blue-600 dark:text-blue-400 text-4xl mb-4">📝</div>
        <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          员工管理
        </h3>
        <p class="text-gray-600 dark:text-gray-400">
          添加和管理员工信息,系统根据入职日期自动计算年假额度
        </p>
      </div>

      <!-- 功能卡片 2 -->
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div class="text-green-600 dark:text-green-400 text-4xl mb-4">📊</div>
        <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          余额查看
        </h3>
        <p class="text-gray-600 dark:text-gray-400">
          实时查看每位员工的年假余额,包括总额度、已使用和剩余天数
        </p>
      </div>

      <!-- 功能卡片 3 -->
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div class="text-purple-600 dark:text-purple-400 text-4xl mb-4">📅</div>
        <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          休假记录
        </h3>
        <p class="text-gray-600 dark:text-gray-400">
          记录年假使用情况,支持全天和半天休假,自动扣减余额
        </p>
      </div>
    </div>

    <!-- 系统特性 -->
    <div class="mt-16 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 p-8 rounded-lg">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
        系统特性
      </h2>
      <ul class="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700 dark:text-gray-300">
        <li class="flex items-start gap-2">
          <span class="text-green-600 dark:text-green-400">✓</span>
          <span>根据日本劳动基准法自动计算年假额度</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-green-600 dark:text-green-400">✓</span>
          <span>支持手动调整年假(增加/减少)</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-green-600 dark:text-green-400">✓</span>
          <span>年假有效期管理(2年自动过期)</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-green-600 dark:text-green-400">✓</span>
          <span>即将过期年假提醒</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-green-600 dark:text-green-400">✓</span>
          <span>数据本地存储,支持导入导出</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-green-600 dark:text-green-400">✓</span>
          <span>响应式设计,支持移动端和桌面端</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
/* 可选:添加渐变背景动画 */
.home-view {
  animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
