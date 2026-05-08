<script setup lang="ts">
import { computed, onMounted } from 'vue'
import Layout from '../components/Layout.vue'
import { useOrdersStore } from '../stores/orders'
import { useStrategiesStore } from '../stores/strategies'

const ordersStore = useOrdersStore()
const strategiesStore = useStrategiesStore()

onMounted(() => {
  ordersStore.fetchOrders()
  strategiesStore.fetchStrategies()
})

const totalOrders = computed(() => ordersStore.orders.length)
const pendingOrders = computed(() => ordersStore.orders.filter(o => o.status === 'pending').length)
const filledOrders = computed(() => ordersStore.orders.filter(o => o.status === 'filled').length)
const activeStrategies = computed(() => strategiesStore.strategies.filter(s => s.is_active).length)
</script>

<template>
  <Layout>
    <h1>仪表盘</h1>
    <div class="stats">
      <div class="stat-card">
        <div class="stat-value">{{ totalOrders }}</div>
        <div class="stat-label">总订单数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ pendingOrders }}</div>
        <div class="stat-label">待处理订单</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ filledOrders }}</div>
        <div class="stat-label">已完成订单</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ activeStrategies }}</div>
        <div class="stat-label">启用策略</div>
      </div>
    </div>

    <div class="recent">
      <h2>最近订单</h2>
      <table v-if="ordersStore.orders.length">
        <thead>
          <tr>
            <th>交易对</th>
            <th>方向</th>
            <th>数量</th>
            <th>价格</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in ordersStore.orders.slice(0, 5)" :key="order.id">
            <td>{{ order.symbol }}</td>
            <td :class="order.side">{{ order.side === 'buy' ? '买入' : '卖出' }}</td>
            <td>{{ order.quantity }}</td>
            <td>{{ order.price }}</td>
            <td>
              <span :class="'status-' + order.status">
                {{ order.status === 'pending' ? '待处理' : order.status === 'filled' ? '已完成' : '已取消' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else class="empty">暂无订单数据</p>
    </div>
  </Layout>
</template>

<style scoped>
h1 {
  margin: 0 0 24px;
  color: #333;
}

.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: #fff;
  padding: 24px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #4fc3f7;
}

.stat-label {
  color: #888;
  margin-top: 6px;
  font-size: 0.9rem;
}

.recent {
  background: #fff;
  padding: 24px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.recent h2 {
  margin: 0 0 16px;
  font-size: 1.1rem;
  color: #333;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

th {
  color: #888;
  font-weight: 500;
  font-size: 0.85rem;
}

.buy { color: #27ae60; }
.sell { color: #e74c3c; }

.status-pending { color: #f39c12; }
.status-filled { color: #27ae60; }
.status-cancelled { color: #95a5a6; }

.empty {
  text-align: center;
  color: #aaa;
  padding: 30px;
}
</style>
