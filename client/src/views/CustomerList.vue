<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Layout from '../components/Layout.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import { useCustomersStore } from '../stores/customers'
import type { Customer } from '../types'

const customersStore = useCustomersStore()

const showForm = ref(false)
const editing = ref<Customer | null>(null)
const showDelete = ref(false)
const deleteId = ref('')

const form = ref({
  name: '',
  contact: '',
  phone: '',
  address: '',
  notes: ''
})

onMounted(() => {
  customersStore.fetchCustomers()
})

function openCreate() {
  editing.value = null
  form.value = { name: '', contact: '', phone: '', address: '', notes: '' }
  showForm.value = true
}

function openEdit(c: Customer) {
  editing.value = c
  form.value = {
    name: c.name,
    contact: c.contact || '',
    phone: c.phone || '',
    address: c.address || '',
    notes: c.notes || ''
  }
  showForm.value = true
}

async function handleSave() {
  if (!form.value.name) return
  if (editing.value) {
    await customersStore.updateCustomer(editing.value.id, form.value)
  } else {
    await customersStore.createCustomer(form.value)
  }
  showForm.value = false
}

function confirmDelete(id: string) {
  deleteId.value = id
  showDelete.value = true
}

async function handleDelete() {
  await customersStore.deleteCustomer(deleteId.value)
  showDelete.value = false
}
</script>

<template>
  <Layout>
    <div class="page-header">
      <h1 class="page-title">客户管理</h1>
      <button class="btn btn-primary" @click="openCreate">新增客户</button>
    </div>

    <div class="card">
      <table class="data-table" v-if="customersStore.customers.length">
        <thead>
          <tr>
            <th>客户名称</th>
            <th>联系人</th>
            <th>电话</th>
            <th>地址</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in customersStore.customers" :key="c.id">
            <td>{{ c.name }}</td>
            <td>{{ c.contact || '-' }}</td>
            <td>{{ c.phone || '-' }}</td>
            <td>{{ c.address || '-' }}</td>
            <td class="text-secondary text-sm">{{ c.created_at.slice(0, 10) }}</td>
            <td class="flex gap-8">
              <button class="btn btn-sm" @click.stop="openEdit(c)">编辑</button>
              <button class="btn btn-sm btn-danger" @click.stop="confirmDelete(c.id)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else class="text-center text-secondary" style="padding: 40px">暂无客户</p>
    </div>

    <!-- 表单弹窗 -->
    <div v-if="showForm" class="dialog-overlay" @click.self="showForm = false">
      <div class="dialog-box">
        <h3 class="dialog-title">{{ editing ? '编辑客户' : '新增客户' }}</h3>
        <form @submit.prevent="handleSave">
          <div class="form-group">
            <label class="form-label">客户名称 *</label>
            <input v-model="form.name" class="form-input" required />
          </div>
          <div class="form-group">
            <label class="form-label">联系人</label>
            <input v-model="form.contact" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">电话</label>
            <input v-model="form.phone" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">地址</label>
            <input v-model="form.address" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">备注</label>
            <textarea v-model="form.notes" class="form-textarea"></textarea>
          </div>
          <div class="flex gap-12" style="justify-content: flex-end; margin-top: 16px">
            <button type="button" class="btn" @click="showForm = false">取消</button>
            <button type="submit" class="btn btn-primary">保存</button>
          </div>
        </form>
      </div>
    </div>

    <ConfirmDialog
      v-if="showDelete"
      title="删除客户"
      message="确定要删除此客户吗？"
      danger
      @confirm="handleDelete"
      @cancel="showDelete = false"
    />
  </Layout>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-box {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 24px;
  width: 440px;
}

.dialog-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
}
</style>
