import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
    // T027: 员工管理路由
    {
      path: '/employees',
      name: 'employees',
      component: () => import('../views/EmployeeManagement.vue'),
    },
    // T035: 员工详情路由
    {
      path: '/employees/:id',
      name: 'employee-detail',
      component: () => import('../views/EmployeeDetail.vue'),
    },
    // T049: 日历视图路由
    {
      path: '/calendar',
      name: 'calendar',
      component: () => import('../views/LeaveCalendar.vue'),
    },
    // T068: 设置页面路由
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/Settings.vue'),
    },
  ],
})

export default router
