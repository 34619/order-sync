import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './auth'
import { DEPARTMENT_LABELS } from '../types'
import type { Order, Department } from '../types'

export const useOrdersStore = defineStore('orders', () => {
  const orders = ref<Order[]>([])
  const currentOrder = ref<Order | null>(null)
  const loading = ref(false)

  async function fetchOrders(filters?: { status?: string; keyword?: string }) {
    loading.value = true
    let query = supabase
      .from('orders')
      .select('*, customer:customers(*), items:order_items(*), tasks:order_tasks(*)')
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.keyword) {
      // Search by order_number only since product is now in order_items
      query = query.ilike('order_number', `%${filters.keyword}%`)
    }

    const { data } = await query
    orders.value = (data as Order[]) || []
    loading.value = false
  }

  async function fetchOrder(id: string) {
    loading.value = true
    const { data } = await supabase
      .from('orders')
      .select('*, customer:customers(*), items:order_items(*), tasks:order_tasks(*)')
      .eq('id', id)
      .single()
    currentOrder.value = data as Order | null
    loading.value = false
  }

  async function createOrder(data: {
    order_number: string
    customer_id: string
    deadline?: string
    priority?: 'normal' | 'urgent'
    notes?: string
    items: { product_name: string; product_spec?: string; quantity: number; material?: string; drawing_name?: string; surface_req?: string; dimensions?: string; image_url?: string }[]
  }) {
    const auth = useAuthStore()
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        order_number: data.order_number,
        customer_id: data.customer_id,
        deadline: data.deadline,
        priority: data.priority,
        notes: data.notes,
        created_by: auth.user!.id
      })
      .select()
      .single()

    if (error) throw new Error('创建订单失败: ' + error.message)

    // Insert order items
    const items = data.items.map(item => ({
      order_id: order.id,
      product_name: item.product_name,
      product_spec: item.product_spec || null,
      quantity: item.quantity,
      material: item.material || null,
      drawing_name: item.drawing_name || null,
      surface_req: item.surface_req || null,
      dimensions: item.dimensions || null,
      image_url: item.image_url || null
    }))
    const { error: itemsError } = await supabase.from('order_items').insert(items)
    if (itemsError) throw new Error('添加产品失败: ' + itemsError.message)

    try {
      await supabase.from('operation_logs').insert({
        order_id: order.id,
        user_id: auth.user!.id,
        action: `创建订单 ${order.order_number}`
      })
    } catch { /* 日志记录失败不影响主流程 */ }

    return order
  }

  async function dispatchOrder(orderId: string, departments: Department[]) {
    const auth = useAuthStore()

    const taskDepartments: Department[] = []
    if (departments.includes('cnc_program')) {
      taskDepartments.push('cnc_program', 'cnc_machine')
    }
    if (departments.includes('print_3d')) {
      taskDepartments.push('print_3d')
    }
    if (departments.includes('workshop')) {
      taskDepartments.push('workshop')
    }

    const tasks = taskDepartments.map(dept => ({
      order_id: orderId,
      department: dept
    }))

    const { error: taskError } = await supabase.from('order_tasks').insert(tasks)
    if (taskError) throw new Error('派单失败: ' + taskError.message)

    const deptNames = taskDepartments.map(d => DEPARTMENT_LABELS[d] || d).join('、')
    try {
      await supabase.from('operation_logs').insert({
        order_id: orderId,
        user_id: auth.user!.id,
        action: `派单给: ${deptNames}`
      })
    } catch { /* 日志记录失败不影响主流程 */ }
  }

  async function confirmDelivery(orderId: string) {
    const auth = useAuthStore()
    await supabase
      .from('orders')
      .update({ status: 'delivered' })
      .eq('id', orderId)

    const order = orders.value.find(o => o.id === orderId)
    try {
      await supabase.from('operation_logs').insert({
        order_id: orderId,
        user_id: auth.user!.id,
        action: `确认交付 ${order?.order_number || ''}`
      })
    } catch { /* 日志记录失败不影响主流程 */ }
  }

  async function deleteOrder(id: string) {
    await supabase.from('orders').delete().eq('id', id)
    orders.value = orders.value.filter(o => o.id !== id)
  }

  return { orders, currentOrder, loading, fetchOrders, fetchOrder, createOrder, dispatchOrder, confirmDelivery, deleteOrder }
})
