import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './auth'
import type { Customer } from '../types'

export const useCustomersStore = defineStore('customers', () => {
  const customers = ref<Customer[]>([])
  const loading = ref(false)

  async function fetchCustomers() {
    loading.value = true
    const { data } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })
    customers.value = (data as Customer[]) || []
    loading.value = false
  }

  async function createCustomer(data: { name: string; contact?: string; phone?: string; address?: string; notes?: string }) {
    const auth = useAuthStore()
    const { data: customer, error } = await supabase
      .from('customers')
      .insert({ ...data, created_by: auth.user!.id })
      .select()
      .single()
    if (error) throw error
    customers.value.unshift(customer as Customer)
    return customer
  }

  async function updateCustomer(id: string, data: Partial<Customer>) {
    const { error } = await supabase
      .from('customers')
      .update(data)
      .eq('id', id)
    if (error) throw error
    await fetchCustomers()
  }

  async function deleteCustomer(id: string) {
    await supabase.from('customers').delete().eq('id', id)
    customers.value = customers.value.filter(c => c.id !== id)
  }

  return { customers, loading, fetchCustomers, createCustomer, updateCustomer, deleteCustomer }
})
