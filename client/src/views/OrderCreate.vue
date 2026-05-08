<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Layout from '../components/Layout.vue'
import ImageUpload from '../components/ImageUpload.vue'
import { useOrdersStore } from '../stores/orders'
import { useCustomersStore } from '../stores/customers'
import type { Department } from '../types'

const router = useRouter()
const ordersStore = useOrdersStore()
const customersStore = useCustomersStore()

const submitting = ref(false)
const form = ref({
  order_number: '',
  customer_id: '',
  deadline_month: '',
  deadline_day: '',
  priority: 'normal' as 'normal' | 'urgent',
  notes: ''
})

interface ItemForm {
  product_name: string
  product_spec: string
  quantity: number
  material: string
  drawing_name: string
  surface_req: string
  dimensions: string
  image_url: string | null
}

function createItem(): ItemForm {
  return { product_name: '', product_spec: '', quantity: 1, material: '', drawing_name: '', surface_req: '', dimensions: '', image_url: null }
}

const items = ref<ItemForm[]>([createItem()])

const departments = ref<{ key: Department; label: string; checked: boolean }[]>([
  { key: 'cnc_program', label: 'CNC', checked: false },
  { key: 'print_3d', label: '3D打印', checked: false },
  { key: 'workshop', label: '车间加工', checked: false }
])

onMounted(() => {
  customersStore.fetchCustomers()
})

function addItem() {
  items.value.push(createItem())
}

function removeItem(index: number) {
  if (items.value.length > 1) items.value.splice(index, 1)
}

async function handleSubmit() {
  if (!form.value.order_number || !form.value.customer_id) return
  const validItems = items.value.filter(i => i.product_name && i.quantity > 0)
  if (validItems.length === 0) return

  const selectedDepts = departments.value.filter(d => d.checked).map(d => d.key)
  if (selectedDepts.length === 0) return

  submitting.value = true
  try {
    const year = new Date().getFullYear()
    const deadline = form.value.deadline_month && form.value.deadline_day
      ? `${year}-${String(form.value.deadline_month).padStart(2, '0')}-${String(form.value.deadline_day).padStart(2, '0')}`
      : undefined

    const order = await ordersStore.createOrder({
      order_number: form.value.order_number,
      customer_id: form.value.customer_id,
      deadline,
      priority: form.value.priority,
      notes: form.value.notes || undefined,
      items: validItems.map(i => ({
        product_name: i.product_name,
        product_spec: i.product_spec || undefined,
        quantity: i.quantity,
        material: i.material || undefined,
        drawing_name: i.drawing_name || undefined,
        surface_req: i.surface_req || undefined,
        dimensions: i.dimensions || undefined,
        image_url: i.image_url || undefined
      }))
    })

    await ordersStore.dispatchOrder(order.id, selectedDepts)
    router.push(`/orders/${order.id}`)
  } catch (e: any) {
    console.error('创建订单失败:', e)
    alert('创建失败: ' + (e.message || '未知错误'))
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <Layout>
    <div class="page-header">
      <h1 class="page-title">创建订单</h1>
      <button class="btn" @click="router.back()">返回</button>
    </div>

    <div class="card" style="max-width: 800px">
      <form @submit.prevent="handleSubmit">
        <!-- 订单信息 -->
        <div class="form-group">
          <label class="form-label">订单单号 *</label>
          <input v-model="form.order_number" class="form-input" required placeholder="请输入订单单号" />
        </div>

        <div class="form-group">
          <label class="form-label">客户 *</label>
          <select v-model="form.customer_id" class="form-select" required>
            <option value="">请选择客户</option>
            <option v-for="c in customersStore.customers" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">交期</label>
          <div class="flex gap-8">
            <select v-model="form.deadline_month" class="form-select" style="width: 120px">
              <option value="">月份</option>
              <option v-for="m in 12" :key="m" :value="m">{{ m }}月</option>
            </select>
            <select v-model="form.deadline_day" class="form-select" style="width: 120px">
              <option value="">日期</option>
              <option v-for="d in 31" :key="d" :value="d">{{ d }}日</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">优先级</label>
          <div class="flex gap-12">
            <label class="radio-label">
              <input type="radio" v-model="form.priority" value="normal" /> 普通
            </label>
            <label class="radio-label">
              <input type="radio" v-model="form.priority" value="urgent" /> 加急
            </label>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">工艺要求/备注</label>
          <textarea v-model="form.notes" class="form-textarea" placeholder="请输入工艺要求或其他备注"></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">派发部门 *（至少选一个）</label>
          <div class="flex gap-16">
            <label class="checkbox-label" v-for="dept in departments" :key="dept.key">
              <input type="checkbox" v-model="dept.checked" /> {{ dept.label }}
            </label>
          </div>
        </div>

        <!-- 产品列表 -->
        <div class="items-section">
          <div class="items-header">
            <label class="form-label" style="margin: 0">产品列表 *（至少一个）</label>
            <button type="button" class="btn btn-sm" @click="addItem">+ 添加产品</button>
          </div>

          <div v-for="(item, idx) in items" :key="idx" class="item-card">
            <div class="item-header">
              <span class="item-index">产品 {{ idx + 1 }}</span>
              <button v-if="items.length > 1" type="button" class="btn btn-sm btn-danger" @click="removeItem(idx)">删除</button>
            </div>
            <div class="item-grid">
              <div class="form-group">
                <label class="form-label">产品名称 *</label>
                <input v-model="item.product_name" class="form-input" required placeholder="产品名称" />
              </div>
              <div class="form-group">
                <label class="form-label">数量 *</label>
                <input v-model.number="item.quantity" type="number" class="form-input" min="1" required />
              </div>
              <div class="form-group">
                <label class="form-label">规格/型号</label>
                <input v-model="item.product_spec" class="form-input" placeholder="规格或型号" />
              </div>
              <div class="form-group">
                <label class="form-label">材质</label>
                <input v-model="item.material" class="form-input" placeholder="如：ABS、铝合金" />
              </div>
              <div class="form-group">
                <label class="form-label">图纸名</label>
                <input v-model="item.drawing_name" class="form-input" placeholder="图纸文件名" />
              </div>
              <div class="form-group">
                <label class="form-label">尺寸</label>
                <input v-model="item.dimensions" class="form-input" placeholder="如：100x50x30mm" />
              </div>
              <div class="form-group full-width">
                <label class="form-label">表面要求</label>
                <input v-model="item.surface_req" class="form-input" placeholder="如：细磨砂、Pantone 621C" />
              </div>
              <div class="form-group full-width">
                <label class="form-label">产品图片</label>
                <ImageUpload v-model="item.image_url" />
              </div>
            </div>
          </div>
        </div>

        <div class="flex gap-12" style="margin-top: 24px">
          <button type="submit" class="btn btn-primary" :disabled="submitting">
            {{ submitting ? '提交中...' : '创建并派单' }}
          </button>
          <button type="button" class="btn" @click="router.back()">取消</button>
        </div>
      </form>
    </div>
  </Layout>
</template>

<style scoped>
.radio-label, .checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-secondary);
}

.items-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
}

.items-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.item-card {
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.item-index {
  font-weight: 600;
  font-size: 14px;
}

.item-grid {
  display: grid;
  grid-template-columns: 1fr 100px;
  gap: 12px;
}

.item-grid .form-group:nth-child(3),
.item-grid .form-group:nth-child(4),
.item-grid .form-group:nth-child(5),
.item-grid .form-group:nth-child(6) {
  grid-column: span 1;
}

.full-width {
  grid-column: span 2;
}
</style>
