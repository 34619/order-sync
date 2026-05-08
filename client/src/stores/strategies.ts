import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'

export interface Strategy {
  id: string
  user_id: string
  name: string
  description: string
  source_account: string
  multiplier: number
  max_position: number
  stop_loss: number
  take_profit: number
  is_active: boolean
  created_at: string
}

export const useStrategiesStore = defineStore('strategies', () => {
  const strategies = ref<Strategy[]>([])
  const loading = ref(false)

  async function fetchStrategies() {
    loading.value = true
    const { data } = await supabase
      .from('strategies')
      .select('*')
      .order('created_at', { ascending: false })
    strategies.value = (data as Strategy[]) || []
    loading.value = false
  }

  async function addStrategy(strategy: Omit<Strategy, 'id' | 'user_id' | 'created_at'>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: { message: '未登录' } as any }

    const { data, error } = await supabase
      .from('strategies')
      .insert({ ...strategy, user_id: user.id })
      .select()
      .single()

    if (!error && data) {
      strategies.value.unshift(data as Strategy)
    }
    return { error }
  }

  async function toggleStrategy(id: string) {
    const strategy = strategies.value.find(s => s.id === id)
    if (!strategy) return

    const { error } = await supabase
      .from('strategies')
      .update({ is_active: !strategy.is_active })
      .eq('id', id)

    if (!error) {
      strategy.is_active = !strategy.is_active
    }
    return { error }
  }

  async function deleteStrategy(id: string) {
    const { error } = await supabase
      .from('strategies')
      .delete()
      .eq('id', id)

    if (!error) {
      strategies.value = strategies.value.filter(s => s.id !== id)
    }
    return { error }
  }

  return { strategies, loading, fetchStrategies, addStrategy, toggleStrategy, deleteStrategy }
})
