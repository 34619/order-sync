<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const email = ref('')
const password = ref('')

async function handleLogin() {
  await auth.login(email.value, password.value)
  if (!auth.error) {
    const role = auth.profile?.role
    if (role === 'cnc_program' || role === 'cnc_machine' || role === 'print_3d' || role === 'workshop') {
      router.push('/tasks')
    } else {
      router.push('/dashboard')
    }
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <h1>跟单系统</h1>
      <p class="subtitle">工厂订单管理系统</p>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label class="form-label">邮箱</label>
          <input v-model="email" type="email" class="form-input" placeholder="请输入邮箱" required />
        </div>
        <div class="form-group">
          <label class="form-label">密码</label>
          <input v-model="password" type="password" class="form-input" placeholder="请输入密码" required />
        </div>
        <p v-if="auth.error" class="login-error">{{ auth.error }}</p>
        <button type="submit" class="btn btn-primary login-btn" :disabled="auth.loading">
          {{ auth.loading ? '登录中...' : '登录' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
}

.login-card {
  background: var(--bg-secondary);
  padding: 40px;
  border-radius: 12px;
  width: 380px;
  border: 1px solid var(--border);
}

.login-card h1 {
  text-align: center;
  color: var(--accent);
  margin-bottom: 4px;
  font-size: 1.8rem;
}

.subtitle {
  text-align: center;
  color: var(--text-muted);
  margin-bottom: 30px;
  font-size: 0.9rem;
}

.login-error {
  color: var(--danger);
  font-size: 0.85rem;
  margin-bottom: 12px;
}

.login-btn {
  width: 100%;
  margin-top: 8px;
  padding: 12px;
  font-size: 15px;
}

.login-btn[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
