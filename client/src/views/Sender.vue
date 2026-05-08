<script setup lang="ts">
import { ref } from 'vue'
import Layout from '../components/Layout.vue'

interface Account {
  id: string
  name: string
  balance: number
  isCopying: boolean
}

const accounts = ref<Account[]>([
  { id: '1', name: 'v4live_232', balance: 10057.25, isCopying: true },
  { id: '2', name: 'v4live_5053', balance: 0, isCopying: false },
  { id: '3', name: 'v4live_5082', balance: 0, isCopying: false },
  { id: '4', name: 'v4live_68363', balance: 54936.71, isCopying: true },
  { id: '5', name: 'v4live_6550', balance: 8463.10, isCopying: true },
  { id: '6', name: 'v4live_2064', balance: 52487.57, isCopying: true },
])

const showAddForm = ref(false)
const newAccountName = ref('')

function formatBalance(n: number): string {
  if (n === 0) return '0'
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function deleteAccount(id: string) {
  accounts.value = accounts.value.filter(a => a.id !== id)
}

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
</script>

<template>
  <Layout>
    <div class="page">
      <!-- 账号列表 -->
      <div class="account-list">
        <div v-for="acc in accounts" :key="acc.id" class="account-card">
          <div class="account-row">
            <div class="account-left">
              <span class="balance-label">余额：</span>
              <span class="balance-value" :class="{ 'has-money': acc.balance > 0 }">
                {{ formatBalance(acc.balance) }}
              </span>
            </div>
            <span class="account-name">({{ acc.name }})</span>
          </div>
          <div class="account-status">
            <span :class="['dot', acc.isCopying ? 'dot-on' : '']"></span>
            <span class="status-text" :class="acc.isCopying ? 'text-on' : ''">
              {{ acc.isCopying ? '正在跟单' : '未跟单' }}
            </span>
          </div>
          <div class="account-action">
            <button class="btn-delete" @click="deleteAccount(acc.id)">删除</button>
          </div>
        </div>
      </div>

      <!-- 添加账号表单 -->
      <div v-if="showAddForm" class="add-form">
        <input
          v-model="newAccountName"
          placeholder="输入账号名称，如 v4live_xxx"
          @keyup.enter="addAccount"
        />
        <div class="form-actions">
          <button class="btn-add-confirm" @click="addAccount">添加</button>
          <button class="btn-add-cancel" @click="showAddForm = false">取消</button>
        </div>
      </div>

      <!-- 红色圆形添加按钮 -->
      <button v-if="!showAddForm" class="fab" @click="showAddForm = true">+</button>
    </div>
  </Layout>
</template>

<style scoped>
.page {
  max-width: 480px;
  margin: 0 auto;
}

.account-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.account-card {
  background: #16213e;
  border-radius: 8px;
  padding: 14px 16px;
  border: 1px solid #2a3f5f;
}

.account-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
}

.account-left {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.balance-label {
  color: #8899aa;
  font-size: 0.85rem;
}

.balance-value {
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
}

.balance-value.has-money {
  color: #f39c12;
}

.account-name {
  color: #556677;
  font-size: 0.8rem;
}

.account-status {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #444;
}

.dot-on {
  background: #4caf50;
  box-shadow: 0 0 6px rgba(76, 175, 80, 0.6);
}

.status-text {
  font-size: 0.8rem;
  color: #667788;
}

.text-on {
  color: #4caf50;
}

.account-action {
  display: flex;
  justify-content: flex-end;
}

.btn-delete {
  padding: 4px 16px;
  background: transparent;
  border: 1px solid #556677;
  color: #aaa;
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
  border-radius: 8px;
  padding: 16px;
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
  box-sizing: border-box;
  margin-bottom: 10px;
}

.add-form input::placeholder {
  color: #556677;
}

.add-form input:focus {
  outline: none;
  border-color: #4caf50;
}

.form-actions {
  display: flex;
  gap: 8px;
}

.btn-add-confirm {
  flex: 1;
  padding: 8px;
  background: #55b895;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn-add-cancel {
  flex: 1;
  padding: 8px;
  background: transparent;
  color: #8899aa;
  border: 1px solid #2a3f5f;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
}

.fab {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  margin: 24px auto 0;
  background: #e74c3c;
  color: #fff;
  border: none;
  border-radius: 50%;
  font-size: 1.6rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.4);
}

.fab:hover {
  background: #c0392b;
}
</style>
