<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Layout from '../components/Layout.vue'
import { useOrdersStore } from '../stores/orders'

const store = useOrdersStore()
const showForm = ref(false)

const form = ref({
  symbol: '',
  side: 'buy' as 'buy' | 'sell',
  quantity: 0,
  price: 0,
  status: 'pending' as const
})

onMounted(() => {
  store.fetchOrders()
})

async function handleSubmit() {
  const { error } = await store.addOrder(form.value)
  if (!error) {
    showForm.value = false
    form.value = { symbol: '', side: 'buy', quantity: 0, price: 0, status: 'pending' }
  }
}

function statusText(status: string) {
  return status === 'pending' ? '待处理' : status === 'filled' ? '已完成' : '已取消'
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-CN')
}
</script>

<template>
  <Layout>
    <div class="page-header">
      <h1>订单管理</h1>
      <button class="btn-primary" @click="showForm = !showForm">
        {{ showForm ? '取消' : '+ 新建订单' }}
      </button>
    </div>

    <div v-if="showForm" class="form-card">
      <h3>新建订单</h3>
      <form @submit.prevent="handleSubmit">
        <div class="form-row">
          <div class="form-group">
            <label>交易对</label>
            <input v-model="form.symbol" placeholder="如 BTC/USDT" required />
          </div>
          <div class="form-group">
            <label>方向</label>
            <select v-model="form.side">
              <option value="buy">买入</option>
              <option value="sell">卖出</option>
            </select>
          </div>
          <div class="form-group">
            <label>数量</label>
            <input v-model.number="form.quantity" type="number" step="0.001" min="0" required />
          </div>
          <div class="form-group">
            <label>价格</label>
            <input v-model.number="form.price" type="number" step="0.01" min="0" required />
          </div>
        </div>
        <button type="submit" class="btn-primary">提交订单</button>
      </form>
    </div>

    <div class="table-card">
      <table>
        <thead>
          <tr>
            <th>交易对</th>
            <th>方向</th>
            <th>数量</th>
            <th>价格</th>
            <th>状态</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in store.orders" :key="order.id">
            <td>{{ order.symbol }}</td>
            <td :class="order.side">{{ order.side === 'buy' ? '买入' : '卖出' }}</td>
            <td>{{ order.quantity }}</td>
            <td>{{ order.price }}</td>
            <td>
              <span :class="'status-' + order.status">{{ statusText(order.status) }}</span>
            </td>
            <td>{{ formatDate(order.created_at) }}</td>
            <td>
              <button
                v-if="order.status === 'pending'"
                class="btn-sm btn-success"
                @click="store.updateOrderStatus(order.id, 'filled')"
              >完成</button>
              <button
                v-if="order.status === 'pending'"
                class="btn-sm btn-warning"
                @click="store.updateOrderStatus(order.id, 'cancelled')"
              >取消</button>
              <button class="btn-sm btn-danger" @click="store.deleteOrder(order.id)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="!store.orders.length && !store.loading" class="empty">暂无订单</p>
      <p v-if="store.loading" class="empty">加载中...</p>
    </div>
  </Layout>
</template>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0;
  color: #333;
}

.btn-primary {
  background: #4fc3f7;
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;
}

.btn-primary:hover {
  background: #29b6f6;
}

.form-card {
  background: #fff;
  padding: 24px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 20px;
}

.form-card h3 {
  margin: 0 0 16px;
  color: #333;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  color: #555;
  font-size: 0.85rem;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #4fc3f7;
}

.table-card {
  background: #fff;
  padding: 24px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
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

.buy { color: #27ae60; font-weight: 600; }
.sell { color: #e74c3c; font-weight: 600; }

.status-pending { color: #f39c12; }
.status-filled { color: #27ae60; }
.status-cancelled { color: #95a5a6; }

.btn-sm {
  padding: 4px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  margin-right: 4px;
}

.btn-success { background: #27ae60; color: #fff; }
.btn-warning { background: #f39c12; color: #fff; }
.btn-danger { background: #e74c3c; color: #fff; }

.empty {
  text-align: center;
  color: #aaa;
  padding: 30px;
}
</style>
