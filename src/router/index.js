import { createRouter, createWebHistory } from 'vue-router'
import LandingPage from '../views/LandingPage.vue'
import Studio from '../views/Studio.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: LandingPage
  },
  {
    path: '/studio',
    name: 'Studio',
    component: Studio
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router 