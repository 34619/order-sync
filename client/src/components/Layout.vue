<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

function isActive(path: string) {
  return route.path === path
}

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="app-layout">
    <header class="app-header">
      <span class="header-title">OrderSync</span>
      <button class="logout-btn" @click="handleLogout">退出</button>
    </header>
    <main class="app-main">
      <slot />
    </main>
    <nav class="app-tabs">
      <router-link to="/sender" :class="{ active: isActive('/sender') }">
        发送端配置
      </router-link>
      <router-link to="/receiver" :class="{ active: isActive('/receiver') }">
        接收端配置
      </router-link>
      <router-link to="/" :class="{ active: isActive('/') }">
        接收端 6/6
      </router-link>
    </nav>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #1a1a2e;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: #16213e;
  border-bottom: 1px solid #2a3f5f;
}

.header-title {
  font-size: 0.85rem;
  color: #8899aa;
}

.logout-btn {
  background: none;
  border: 1px solid #556677;
  color: #8899aa;
  padding: 3px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
}

.logout-btn:hover {
  border-color: #e74c3c;
  color: #e74c3c;
}

.app-main {
  flex: 1;
  padding: 20px 16px;
  padding-bottom: 72px;
  overflow-y: auto;
}

.app-tabs {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background: #223355;
  border-top: 1px solid #2a3f5f;
  z-index: 100;
}

.app-tabs a {
  flex: 1;
  text-align: center;
  padding: 14px 0;
  color: #8899aa;
  font-size: 0.85rem;
  text-decoration: none;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
}

.app-tabs a.active {
  color: #fff;
  border-bottom-color: #4caf50;
}

.app-tabs a:hover {
  color: #ccc;
}
</style>
