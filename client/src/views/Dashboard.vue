<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Layout from '../components/Layout.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { useOrdersStore } from '../stores/orders'
import { STATUS_LABELS } from '../types'
import type { OrderStatus } from '../types'

const ordersStore = useOrdersStore()

const loading = ref(true)
const taskCounts = ref<Record<string, Record<string, number>>>({})

onMounted(async () => {
  await ordersStore.fetchOrders()
  loading.value = false
})

const totalOrders = computed(() => ordersStore.orders.length)
const inProgress = computed(() => ordersStore.orders.filter(o =>
  ['programming', 'rough_machining', 'fine_machining'].includes(o.status)
).length)
const delivered = computed(() => ordersStore.orders.filter(o => o.status === 'delivered').length)
const pendingDelivery = computed(() => ordersStore.orders.filter(o => o.status === 'pending_delivery').length)

const todayStr = new Date().toISOString().slice(0, 10)
const todayNew = computed(() => ordersStore.orders.filter(o =>
  o.created_at.slice(0, 10) === todayStr
).length)

const overdue = computed(() => {
  const today = new Date().toISOString().slice(0, 10)
  return ordersStore.orders.filter(o =>
    o.deadline && o.deadline < today && o.status !== 'delivered'
  ).length
})

const recentOrders = computed(() => ordersStore.orders.slice(0, 5))
</script>

<template>
  <Layout>
    <div class="page-header">
      <h1 class="page-title">数据看板</h1>
    </div>

    <div class="grid-4 mb-16">
      <div class="card stat-card">
        <div class="stat-value">{{ totalOrders }}</div>
        <div class="stat-label">总订单数</div>
      </div>
      <div class="card stat-card">
        <div class="stat-value" style="color: var(--info)">{{ inProgress }}</div>
        <div class="stat-label">进行中</div>
      </div>
      <div class="card stat-card">
        <div class="stat-value" style="color: var(--warning)">{{ pendingDelivery }}</div>
        <div class="stat-label">待交付</div>
      </div>
      <div class="card stat-card">
        <div class="stat-value" style="color: var(--accent)">{{ delivered }}</div>
        <div class="stat-label">已交付</div>
      </div>
    </div>

    <div class="grid-4 mb-16">
      <div class="card stat-card">
        <div class="stat-value" style="color: var(--info)">{{ todayNew }}</div>
        <div class="stat-label">今日新增</div>
      </div>
      <div class="card stat-card">
        <div class="stat-value" style="color: var(--danger)">{{ overdue }}</div>
        <div class="stat-label">逾期订单</div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">最近订单</div>
      <div v-if="recentOrders.length">
        <table class="data-table">
          <thead>
            <tr>
              <th>订单号</th>
              <th>产品</th>
              <th>交期</th>
              <th>状态</th>
              <th>创建时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in recentOrders" :key="order.id">
              <td>{{ order.order_number }}</td>
              <td>{{ order.items?.map(i => i.product_name).join('、') || '-' }}</td>
              <td>{{ order.deadline || '-' }}</td>
              <td><StatusBadge :status="order.status" type="order" /></td>
              <td class="text-secondary text-sm">{{ order.created_at.slice(0, 10) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="text-center text-secondary" style="padding: 20px">暂无订单数据</p>
    </div>
  </Layout>
</template>

<style scoped>
.stat-card {
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
}

.stat-label {
  color: var(--text-secondary);
  margin-top: 4px;
  font-size: 13px;
}
</style>
