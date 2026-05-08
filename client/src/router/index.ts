import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import type { Role } from '../types'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/Login.vue')
    },
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('../views/Dashboard.vue'),
      meta: { requiresAuth: true, roles: ['admin', 'office'] as Role[] }
    },
    {
      path: '/orders',
      name: 'OrderList',
      component: () => import('../views/OrderList.vue'),
      meta: { requiresAuth: true, roles: ['admin', 'office'] as Role[] }
    },
    {
      path: '/orders/create',
      name: 'OrderCreate',
      component: () => import('../views/OrderCreate.vue'),
      meta: { requiresAuth: true, roles: ['admin', 'office'] as Role[] }
    },
    {
      path: '/orders/:id',
      name: 'OrderDetail',
      component: () => import('../views/OrderDetail.vue'),
      meta: { requiresAuth: true, roles: ['admin', 'office', 'cnc_program', 'cnc_machine', 'print_3d', 'workshop'] as Role[] }
    },
    {
      path: '/customers',
      name: 'CustomerList',
      component: () => import('../views/CustomerList.vue'),
      meta: { requiresAuth: true, roles: ['admin', 'office'] as Role[] }
    },
    {
      path: '/tasks',
      name: 'TaskList',
      component: () => import('../views/TaskList.vue'),
      meta: { requiresAuth: true, roles: ['cnc_program', 'cnc_machine', 'print_3d', 'workshop'] as Role[] }
    },
    {
      path: '/users',
      name: 'UserList',
      component: () => import('../views/UserList.vue'),
      meta: { requiresAuth: true, roles: ['admin'] as Role[] }
    },
    {
      path: '/logs',
      name: 'LogList',
      component: () => import('../views/LogList.vue'),
      meta: { requiresAuth: true, roles: ['admin', 'office'] as Role[] }
    }
  ]
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.user) {
    return '/login'
  }

  if (to.path === '/login' && auth.user) {
    const role = auth.profile?.role
    if (role === 'cnc_program' || role === 'cnc_machine' || role === 'print_3d' || role === 'workshop') {
      return '/tasks'
    }
    return '/dashboard'
  }

  if (to.meta.roles && auth.profile) {
    const allowedRoles = to.meta.roles as Role[]
    if (!allowedRoles.includes(auth.profile.role)) {
      const role = auth.profile.role
      if (role === 'cnc_program' || role === 'cnc_machine' || role === 'print_3d' || role === 'workshop') {
        return '/tasks'
      }
      return '/dashboard'
    }
  }
})

export default router
