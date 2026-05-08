<script setup lang="ts">
import { onMounted } from 'vue'
import Layout from '../components/Layout.vue'
import { useLogsStore } from '../stores/logs'

const logsStore = useLogsStore()

onMounted(() => {
  logsStore.fetchLogs()
})
</script>

<template>
  <Layout>
    <div class="page-header">
      <h1 class="page-title">跟单日志</h1>
    </div>

    <div class="card">
      <div v-if="logsStore.logs.length" class="log-list">
        <div v-for="log in logsStore.logs" :key="log.id" class="log-item">
          <span class="log-time">{{ log.created_at.slice(0, 16).replace('T', ' ') }}</span>
          <span class="log-order">{{ log.order?.order_number || '-' }}</span>
          <span class="log-action">{{ log.action }}</span>
        </div>
      </div>
      <p v-else class="text-center text-secondary" style="padding: 40px">暂无日志</p>
    </div>
  </Layout>
</template>

<style scoped>
.log-list {
  display: flex;
  flex-direction: column;
}

.log-item {
  display: flex;
  gap: 16px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
  font-size: 14px;
  align-items: center;
}

.log-item:last-child {
  border-bottom: none;
}

.log-time {
  color: var(--text-muted);
  white-space: nowrap;
  min-width: 140px;
  font-size: 13px;
}

.log-order {
  color: var(--accent);
  font-weight: 600;
  min-width: 80px;
}

.log-action {
  color: var(--text-secondary);
}
</style>
