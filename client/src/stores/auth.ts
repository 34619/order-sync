import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref('')

  async function init() {
    const { data } = await supabase.auth.getUser()
    user.value = data.user

    supabase.auth.onAuthStateChange((_event, session) => {
      user.value = session?.user ?? null
    })
  }

  async function login(email: string, password: string) {
    loading.value = true
    error.value = ''
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) {
      error.value = err.message
    } else {
      user.value = data.user
    }
    loading.value = false
  }

  async function register(email: string, password: string) {
    loading.value = true
    error.value = ''
    const { data, error: err } = await supabase.auth.signUp({ email, password })
    if (err) {
      error.value = err.message
    } else {
      user.value = data.user
    }
    loading.value = false
  }

  async function logout() {
    await supabase.auth.signOut()
    user.value = null
  }

  return { user, loading, error, init, login, register, logout }
})
