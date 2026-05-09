<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Layout from '../components/Layout.vue'
import StatusBadge from '../components/StatusBadge.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import { useOrdersStore } from '../stores/orders'
import { STATUS_LABELS } from '../types'

const router = useRouter()
const ordersStore = useOrdersStore()

const statusFilter = ref('')
const keyword = ref('')
const showDelete = ref(false)
const deleteId = ref('')

onMounted(() => {
  ordersStore.fetchOrders()
})

async function handleSearch() {
  await ordersStore.fetchOrders({
    status: statusFilter.value || undefined,
    keyword: keyword.value || undefined
  })
}

function goDetail(id: string) {
  router.push(`/orders/${id}`)
}

function confirmDelete(id: string) {
  deleteId.value = id
  showDelete.value = true
}

async function handleDelete() {
  await ordersStore.deleteOrder(deleteId.value)
  showDelete.value = false
}
</script>

<template>
  <Layout>
    <div class="page-header">
      <h1 class="page-title">订单管理</h1>
      <button class="btn btn-primary" @click="router.push('/orders/create')">创建订单</button>
    </div>

    <div class="card mb-16">
      <div class="filter-bar">
        <input
          v-model="keyword"
          class="form-input"
          style="width: 240px"
          placeholder="搜索订单号"
          @keyup.enter="handleSearch"
        />
        <select v-model="statusFilter" class="form-select" style="width: 160px" @change="handleSearch">
          <option value="">全部状态</option>
          <option v-for="(label, key) in STATUS_LABELS" :key="key" :value="key">{{ label }}</option>
        </select>
        <button class="btn" @click="handleSearch">查询</button>
      </div>
    </div>

    <div class="card">
      <table class="data-table" v-if="ordersStore.orders.length">
        <thead>
          <tr>
            <th>订单号</th>
            <th>产品</th>
            <th>交期</th>
            <th>优先级</th>
            <th>状态</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in ordersStore.orders" :key="order.id" @click="goDetail(order.id)">
            <td>{{ order.order_number }}</td>
            <td>{{ order.items?.map(i => i.product_name).join('、') || '-' }}</td>
            <td>{{ order.deadline || '-' }}</td>
            <td>
              <span class="badge" :class="order.priority === 'urgent' ? 'badge-danger' : 'badge-default'">
                {{ order.priority === 'urgent' ? '加急' : '普通' }}
              </span>
            </td>
            <td><StatusBadge :status="order.status" type="order" /></td>
            <td class="text-secondary text-sm">{{ order.created_at.slice(0, 10) }}</td>
            <td @click.stop>
              <button class="btn btn-sm btn-danger" @click="confirmDelete(order.id)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else class="text-center text-secondary" style="padding: 40px">暂无订单</p>
    </div>

    <ConfirmDialog
      v-if="showDelete"
      title="删除订单"
      message="确定要删除此订单吗？相关的任务和日志也会被删除。"
      danger
      @confirm="handleDelete"
      @cancel="showDelete = false"
    />
  </Layout>
</template>

<style scoped>
.filter-bar {
  display: flex;
  gap: 12px;
  align-items: center;
}
</style>
