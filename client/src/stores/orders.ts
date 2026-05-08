import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'

export interface Order {
  id: string
  user_id: string
  symbol: string
  side: 'buy' | 'sell'
  quantity: number
  price: number
  status: 'pending' | 'filled' | 'cancelled'
  created_at: string
}

export const useOrdersStore = defineStore('orders', () => {
  const orders = ref<Order[]>([])
  const loading = ref(false)

  async function fetchOrders() {
    loading.value = true
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    orders.value = (data as Order[]) || []
    loading.value = false
  }

  async function addOrder(order: Omit<Order, 'id' | 'user_id' | 'created_at'>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: { message: '未登录' } as any }

    const { data, error } = await supabase
      .from('orders')
      .insert({ ...order, user_id: user.id })
      .select()
      .single()

    if (!error && data) {
      orders.value.unshift(data as Order)
    }
    return { error }
  }

  async function updateOrderStatus(id: string, status: Order['status']) {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)

    if (!error) {
      const order = orders.value.find(o => o.id === id)
      if (order) order.status = status
    }
    return { error }
  }

  async function deleteOrder(id: string) {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id)

    if (!error) {
      orders.value = orders.value.filter(o => o.id !== id)
    }
    return { error }
  }

  return { orders, loading, fetchOrders, addOrder, updateOrderStatus, deleteOrder }
})
