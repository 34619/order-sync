<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const localError = ref('')

async function handleRegister() {
  if (password.value !== confirmPassword.value) {
    localError.value = '两次密码不一致'
    return
  }
  localError.value = ''
  await auth.register(email.value, password.value)
  if (!auth.error) {
    router.push('/')
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1>OrderSync</h1>
      <p class="subtitle">注册新账号</p>
      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label>邮箱</label>
          <input v-model="email" type="email" placeholder="请输入邮箱" required />
        </div>
        <div class="form-group">
          <label>密码</label>
          <input v-model="password" type="password" placeholder="请输入密码（至少6位）" required minlength="6" />
        </div>
        <div class="form-group">
          <label>确认密码</label>
          <input v-model="confirmPassword" type="password" placeholder="请再次输入密码" required />
        </div>
        <p v-if="localError || auth.error" class="error">{{ localError || auth.error }}</p>
        <button type="submit" :disabled="auth.loading">
          {{ auth.loading ? '注册中...' : '注册' }}
        </button>
      </form>
      <p class="link">已有账号？<RouterLink to="/login">去登录</RouterLink></p>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1a1a2e;
}

.auth-card {
  background: #16213e;
  padding: 40px;
  border-radius: 12px;
  width: 380px;
  border: 1px solid #2a3f5f;
}

.auth-card h1 {
  text-align: center;
  color: #4caf50;
  margin-bottom: 4px;
  font-size: 1.8rem;
}

.subtitle {
  text-align: center;
  color: #667788;
  margin-bottom: 30px;
  font-size: 0.9rem;
}

.form-group {
  margin-bottom: 18px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  color: #8899aa;
  font-size: 0.9rem;
}

.form-group input {
  width: 100%;
  padding: 10px 12px;
  background: #0f1729;
  border: 1px solid #2a3f5f;
  border-radius: 6px;
  font-size: 1rem;
  color: #fff;
  box-sizing: border-box;
}

.form-group input::placeholder {
  color: #556677;
}

.form-group input:focus {
  outline: none;
  border-color: #4caf50;
}

button[type="submit"] {
  width: 100%;
  padding: 12px;
  background: #4caf50;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 8px;
}

button[type="submit"]:hover {
  background: #45a049;
}

button[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}

.error {
  color: #e74c3c;
  font-size: 0.85rem;
  margin-bottom: 12px;
}

.link {
  text-align: center;
  margin-top: 20px;
  color: #667788;
  font-size: 0.9rem;
}

.link a {
  color: #4caf50;
}
</style>
