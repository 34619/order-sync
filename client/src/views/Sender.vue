<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Layout from '../components/Layout.vue'
import { useOrdersStore } from '../stores/orders'

const store = useOrdersStore()

// 发送端账号列表（用本地状态模拟，后续接入数据库）
interface SenderAccount {
  id: string
  name: string
  balance: number
  isCopying: boolean
}

const accounts = ref<SenderAccount[]>([
  { id: '1', name: 'v4live_232', balance: 10057.25, isCopying: true },
  { id: '2', name: 'v4live_5053', balance: 0, isCopying: false },
  { id: '3', name: 'v4live_5082', balance: 0, isCopying: false },
  { id: '4', name: 'v4live_68363', balance: 54936.71, isCopying: true },
  { id: '5', name: 'v4live_6550', balance: 8463.10, isCopying: true },
  { id: '6', name: 'v4live_2064', balance: 52487.57, isCopying: true },
])

const showAddForm = ref(false)
const newAccountName = ref('')

onMounted(() => {
  store.fetchOrders()
})

function addAccount() {
  if (!newAccountName.value.trim()) return
  accounts.value.push({
    id: Date.now().toString(),
    name: newAccountName.value.trim(),
    balance: 0,
    isCopying: false
  })
  newAccountName.value = ''
  showAddForm.value = false
}

function toggleCopy(id: string) {
  const acc = accounts.value.find(a => a.id === id)
  if (acc) acc.isCopying = !acc.isCopying
}

function deleteAccount(id: string) {
  accounts.value = accounts.value.filter(a => a.id !== id)
}
</script>

<template>
  <Layout>
    <div class="sender">
      <h2>发送端配置</h2>

      <div class="account-list">
        <div v-for="acc in accounts" :key="acc.id" class="account-card">
          <div class="account-info">
            <div class="account-name">
              余额：
              <span class="balance" :class="{ 'has-balance': acc.balance > 0 }">
                {{ acc.balance > 0 ? acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0' }}
              </span>
              <span class="account-id">({{ acc.name }})</span>
            </div>
          </div>
          <div class="account-status">
            <span :class="['status-dot', acc.isCopying ? 'copying' : '']"></span>
            <span class="status-text">{{ acc.isCopying ? '正在跟单' : '未跟单' }}</span>
          </div>
          <div class="account-actions">
            <button
              class="btn-toggle"
              :class="acc.isCopying ? 'btn-on' : 'btn-off'"
              @click="toggleCopy(acc.id)"
            >
              {{ acc.isCopying ? '停止' : '跟单' }}
            </button>
            <button class="btn-delete" @click="deleteAccount(acc.id)">删除</button>
          </div>
        </div>
      </div>

      <!-- 添加账号表单 -->
      <div v-if="showAddForm" class="add-form">
        <input
          v-model="newAccountName"
          placeholder="输入账号名称"
          @keyup.enter="addAccount"
        />
        <div class="add-form-actions">
          <button class="btn-confirm" @click="addAccount">确认</button>
          <button class="btn-cancel" @click="showAddForm = false">取消</button>
        </div>
      </div>

      <!-- 添加按钮 -->
      <button v-if="!showAddForm" class="add-btn" @click="showAddForm = true">+</button>
    </div>
  </Layout>
</template>

<style scoped>
.sender {
  max-width: 500px;
  margin: 0 auto;
}

.sender h2 {
  font-size: 1.1rem;
  color: #fff;
  margin-bottom: 16px;
  text-align: center;
  padding-bottom: 12px;
  border-bottom: 1px solid #2a3f5f;
}

.account-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.account-card {
  background: #16213e;
  padding: 14px 16px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 1px solid #2a3f5f;
}

.account-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.account-name {
  color: #ccc;
  font-size: 0.9rem;
}

.balance {
  font-weight: 600;
  color: #fff;
}

.balance.has-balance {
  color: #f39c12;
}

.account-id {
  color: #556677;
  font-size: 0.8rem;
  margin-left: 6px;
}

.account-status {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #556677;
}

.status-dot.copying {
  background: #4caf50;
  box-shadow: 0 0 6px rgba(76, 175, 80, 0.5);
}

.status-text {
  font-size: 0.8rem;
  color: #8899aa;
}

.account-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.btn-toggle {
  padding: 4px 14px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.btn-on {
  background: #e74c3c;
  color: #fff;
}

.btn-off {
  background: #4caf50;
  color: #fff;
}

.btn-delete {
  padding: 4px 14px;
  border: 1px solid #556677;
  background: transparent;
  color: #8899aa;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.btn-delete:hover {
  border-color: #e74c3c;
  color: #e74c3c;
}

.add-form {
  background: #16213e;
  padding: 16px;
  border-radius: 8px;
  margin-top: 12px;
  border: 1px solid #2a3f5f;
}

.add-form input {
  width: 100%;
  padding: 10px 12px;
  background: #0f1729;
  border: 1px solid #2a3f5f;
  border-radius: 6px;
  color: #fff;
  font-size: 0.95rem;
  margin-bottom: 10px;
  box-sizing: border-box;
}

.add-form input::placeholder {
  color: #556677;
}

.add-form input:focus {
  outline: none;
  border-color: #4caf50;
}

.add-form-actions {
  display: flex;
  gap: 8px;
}

.btn-confirm {
  flex: 1;
  padding: 8px;
  background: #4caf50;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.btn-cancel {
  flex: 1;
  padding: 8px;
  background: transparent;
  color: #8899aa;
  border: 1px solid #2a3f5f;
  border-radius: 6px;
  cursor: pointer;
}

.add-btn {
  display: block;
  width: 50px;
  height: 50px;
  margin: 20px auto 0;
  background: #e74c3c;
  color: #fff;
  border: none;
  border-radius: 50%;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-btn:hover {
  background: #c0392b;
}
</style>
