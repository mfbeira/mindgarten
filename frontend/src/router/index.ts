import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import DashboardView from '../pages/DashboardView.vue';
import LinkBrowserView from '../pages/LinkBrowserView.vue';
import TagManagerView from '../pages/TagManagerView.vue';
import SettingsView from '../pages/SettingsView.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'dashboard',
    component: DashboardView,
  },
  {
    path: '/links',
    name: 'links',
    component: LinkBrowserView,
  },
  {
    path: '/tags',
    name: 'tags',
    component: TagManagerView,
  },
  {
    path: '/settings',
    name: 'settings',
    component: SettingsView,
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

export default router;
