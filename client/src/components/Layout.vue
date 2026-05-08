<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="layout">
    <nav class="sidebar">
      <div class="logo">
        <h2>OrderSync</h2>
      </div>
      <ul class="nav-links">
        <li><RouterLink to="/">仪表盘</RouterLink></li>
        <li><RouterLink to="/orders">订单管理</RouterLink></li>
        <li><RouterLink to="/strategies">跟单策略</RouterLink></li>
      </ul>
      <div class="user-info">
        <span>{{ auth.user?.email }}</span>
        <button @click="handleLogout">退出登录</button>
      </div>
    </nav>
    <main class="main-content">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 220px;
  background: #1a1a2e;
  color: #fff;
  display: flex;
  flex-direction: column;
  padding: 20px 0;
}

.logo {
  padding: 0 20px 20px;
  border-bottom: 1px solid #333;
}

.logo h2 {
  margin: 0;
  color: #4fc3f7;
  font-size: 1.4rem;
}

.nav-links {
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
}

.nav-links li a {
  display: block;
  padding: 12px 20px;
  color: #aaa;
  text-decoration: none;
  transition: all 0.2s;
}

.nav-links li a:hover,
.nav-links li a.router-link-active {
  background: #16213e;
  color: #4fc3f7;
  border-left: 3px solid #4fc3f7;
}

.user-info {
  padding: 15px 20px;
  border-top: 1px solid #333;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.user-info span {
  font-size: 0.8rem;
  color: #888;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-info button {
  background: none;
  border: 1px solid #555;
  color: #ccc;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
}

.user-info button:hover {
  background: #e74c3c;
  border-color: #e74c3c;
  color: #fff;
}

.main-content {
  flex: 1;
  padding: 30px;
  background: #f5f6fa;
}
</style>
