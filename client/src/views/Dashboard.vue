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
    <div class="dashboard">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ totalOrders }}</div>
          <div class="stat-label">总订单数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value orange">{{ pendingOrders }}</div>
          <div class="stat-label">待处理</div>
        </div>
        <div class="stat-card">
          <div class="stat-value green">{{ filledOrders }}</div>
          <div class="stat-label">已完成</div>
        </div>
        <div class="stat-card">
          <div class="stat-value green">{{ activeStrategies }}</div>
          <div class="stat-label">启用策略</div>
        </div>
      </div>

      <div class="section">
        <h2>最近订单</h2>
        <div v-if="ordersStore.orders.length" class="order-list">
          <div v-for="order in ordersStore.orders.slice(0, 5)" :key="order.id" class="order-item">
            <div class="order-info">
              <span class="symbol">{{ order.symbol }}</span>
              <span :class="['side', order.side]">{{ order.side === 'buy' ? '买' : '卖' }}</span>
            </div>
            <div class="order-detail">
              <span>{{ order.quantity }} @ {{ order.price }}</span>
              <span :class="'status status-' + order.status">
                {{ order.status === 'pending' ? '待处理' : order.status === 'filled' ? '已完成' : '已取消' }}
              </span>
            </div>
          </div>
        </div>
        <p v-else class="empty">暂无订单数据</p>
      </div>

      <div class="section">
        <h2>跟单策略</h2>
        <div v-if="strategiesStore.strategies.length" class="strategy-list">
          <div v-for="s in strategiesStore.strategies" :key="s.id" class="strategy-item">
            <div class="strategy-name">{{ s.name }}</div>
            <div class="strategy-info">
              <span>{{ s.source_account }}</span>
              <span :class="['badge', s.is_active ? 'active' : 'disabled']">
                {{ s.is_active ? '运行中' : '已暂停' }}
              </span>
            </div>
          </div>
        </div>
        <p v-else class="empty">暂无策略</p>
      </div>
    </div>
  </Layout>
</template>

<style scoped>
.dashboard {
  max-width: 600px;
  margin: 0 auto;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.stat-card {
  background: #16213e;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
  border: 1px solid #2a3f5f;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: #ffffff;
}

.stat-value.green { color: #4caf50; }
.stat-value.orange { color: #f39c12; }

.stat-label {
  color: #667788;
  margin-top: 4px;
  font-size: 0.85rem;
}

.section {
  background: #16213e;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 16px;
  border: 1px solid #2a3f5f;
}

.section h2 {
  font-size: 0.95rem;
  color: #8899aa;
  margin-bottom: 12px;
  font-weight: 500;
}

.order-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #2a3f5f;
}

.order-item:last-child {
  border-bottom: none;
}

.order-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.symbol {
  font-weight: 600;
}

.side {
  font-size: 0.8rem;
  padding: 2px 8px;
  border-radius: 4px;
}

.side.buy {
  background: rgba(76, 175, 80, 0.15);
  color: #4caf50;
}

.side.sell {
  background: rgba(231, 76, 60, 0.15);
  color: #e74c3c;
}

.order-detail {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #8899aa;
  font-size: 0.85rem;
}

.status-pending { color: #f39c12; }
.status-filled { color: #4caf50; }
.status-cancelled { color: #667788; }

.strategy-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #2a3f5f;
}

.strategy-item:last-child {
  border-bottom: none;
}

.strategy-name {
  font-weight: 600;
}

.strategy-info {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #8899aa;
  font-size: 0.85rem;
}

.badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
}

.badge.active {
  background: rgba(76, 175, 80, 0.15);
  color: #4caf50;
}

.badge.disabled {
  background: rgba(102, 119, 136, 0.15);
  color: #667788;
}

.empty {
  text-align: center;
  color: #556677;
  padding: 20px;
}
</style>
