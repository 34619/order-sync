<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Layout from '../components/Layout.vue'
import { useStrategiesStore } from '../stores/strategies'

const store = useStrategiesStore()
const showForm = ref(false)

const form = ref({
  name: '',
  description: '',
  source_account: '',
  multiplier: 1,
  max_position: 1000,
  stop_loss: 5,
  take_profit: 10,
  is_active: true
})

onMounted(() => {
  store.fetchStrategies()
})

async function handleSubmit() {
  const { error } = await store.addStrategy(form.value)
  if (!error) {
    showForm.value = false
    form.value = {
      name: '', description: '', source_account: '',
      multiplier: 1, max_position: 1000, stop_loss: 5, take_profit: 10, is_active: true
    }
  }
}
</script>

<template>
  <Layout>
    <div class="page-header">
      <h1>跟单策略</h1>
      <button class="btn-primary" @click="showForm = !showForm">
        {{ showForm ? '取消' : '+ 新建策略' }}
      </button>
    </div>

    <div v-if="showForm" class="form-card">
      <h3>新建策略</h3>
      <form @submit.prevent="handleSubmit">
        <div class="form-row">
          <div class="form-group">
            <label>策略名称</label>
            <input v-model="form.name" placeholder="如：稳健跟单" required />
          </div>
          <div class="form-group">
            <label>源账号</label>
            <input v-model="form.source_account" placeholder="被跟单的账号ID" required />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>跟单倍数</label>
            <input v-model.number="form.multiplier" type="number" step="0.1" min="0.1" required />
          </div>
          <div class="form-group">
            <label>最大持仓</label>
            <input v-model.number="form.max_position" type="number" min="0" required />
          </div>
          <div class="form-group">
            <label>止损 (%)</label>
            <input v-model.number="form.stop_loss" type="number" step="0.1" min="0" required />
          </div>
          <div class="form-group">
            <label>止盈 (%)</label>
            <input v-model.number="form.take_profit" type="number" step="0.1" min="0" required />
          </div>
        </div>
        <div class="form-group full">
          <label>策略描述</label>
          <textarea v-model="form.description" placeholder="可选，描述策略逻辑" rows="2"></textarea>
        </div>
        <button type="submit" class="btn-primary">创建策略</button>
      </form>
    </div>

    <div class="strategies-grid">
      <div v-for="s in store.strategies" :key="s.id" class="strategy-card" :class="{ inactive: !s.is_active }">
        <div class="card-header">
          <h3>{{ s.name }}</h3>
          <span class="badge" :class="s.is_active ? 'active' : 'disabled'">
            {{ s.is_active ? '运行中' : '已暂停' }}
          </span>
        </div>
        <p class="desc">{{ s.description || '暂无描述' }}</p>
        <div class="card-stats">
          <div><span class="label">源账号</span><span class="value">{{ s.source_account }}</span></div>
          <div><span class="label">跟单倍数</span><span class="value">{{ s.multiplier }}x</span></div>
          <div><span class="label">最大持仓</span><span class="value">{{ s.max_position }}</span></div>
          <div><span class="label">止损</span><span class="value">{{ s.stop_loss }}%</span></div>
          <div><span class="label">止盈</span><span class="value">{{ s.take_profit }}%</span></div>
        </div>
        <div class="card-actions">
          <button class="btn-sm" :class="s.is_active ? 'btn-warning' : 'btn-success'" @click="store.toggleStrategy(s.id)">
            {{ s.is_active ? '暂停' : '启用' }}
          </button>
          <button class="btn-sm btn-danger" @click="store.deleteStrategy(s.id)">删除</button>
        </div>
      </div>
    </div>

    <p v-if="!store.strategies.length && !store.loading" class="empty">暂无策略，点击上方按钮创建</p>
    <p v-if="store.loading" class="empty">加载中...</p>
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
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.form-row:last-of-type {
  grid-template-columns: repeat(4, 1fr);
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  color: #555;
  font-size: 0.85rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
  box-sizing: border-box;
  font-family: inherit;
}

.form-group.full {
  margin-bottom: 16px;
}

.form-group textarea {
  resize: vertical;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #4fc3f7;
}

.strategies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.strategy-card {
  background: #fff;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s;
}

.strategy-card:hover {
  transform: translateY(-2px);
}

.strategy-card.inactive {
  opacity: 0.7;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.card-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.1rem;
}

.badge {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge.active {
  background: #e8f5e9;
  color: #27ae60;
}

.badge.disabled {
  background: #f5f5f5;
  color: #999;
}

.desc {
  color: #888;
  font-size: 0.85rem;
  margin-bottom: 16px;
}

.card-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.card-stats div {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
}

.card-stats .label {
  color: #888;
}

.card-stats .value {
  color: #333;
  font-weight: 500;
}

.card-actions {
  display: flex;
  gap: 8px;
  border-top: 1px solid #f0f0f0;
  padding-top: 14px;
}

.btn-sm {
  padding: 6px 14px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
}

.btn-success { background: #27ae60; color: #fff; }
.btn-warning { background: #f39c12; color: #fff; }
.btn-danger { background: #e74c3c; color: #fff; }

.empty {
  text-align: center;
  color: #aaa;
  padding: 40px;
}
</style>
