<template>
  <header class="carbon-header">
    <div class="header-inner container">
      <div class="brand">
        <router-link to="/" class="brand-link">
          <Bookmark class="brand-icon" :size="20" />
          <span class="brand-title">Mind<strong>Garten</strong></span>
        </router-link>
        <span class="brand-badge">Enterprise Vault</span>
      </div>

      <nav class="nav-links">
        <router-link to="/" class="nav-item" exact-active-class="active">
          Dashboard
        </router-link>
        <router-link to="/links" class="nav-item" active-class="active">
          Links
        </router-link>
        <router-link to="/tags" class="nav-item" active-class="active">
          Tags
        </router-link>
        <router-link to="/settings" class="nav-item" active-class="active">
          Settings
        </router-link>
      </nav>

      <div class="header-actions">
        <button class="btn btn-primary" @click="ui.openAddLinkModal">
          <Plus :size="16" />
          <span>Save Link</span>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { Bookmark, Plus } from 'lucide-vue-next';
import { useUiStore } from '../stores/ui';

const ui = useUiStore();
</script>

<style scoped>
.carbon-header {
  background-color: #161616;
  color: #ffffff;
  border-bottom: 1px solid #393939;
  position: sticky;
  top: 0;
  z-index: 100;
  height: 56px;
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #ffffff;
  text-decoration: none;
  font-size: 1.125rem;
  font-weight: 300;
  letter-spacing: -0.02em;
}

.brand-link strong {
  font-weight: 700;
  color: #0f62fe;
}

.brand-icon {
  color: #0f62fe;
}

.brand-badge {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  background-color: #262626;
  color: #c6c6c6;
  padding: 2px 6px;
  border: 1px solid #393939;
}

.nav-links {
  display: flex;
  height: 100%;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 16px;
  color: #c6c6c6;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  border-bottom: 3px solid transparent;
  transition: all 0.15s ease;
}

.nav-item:hover {
  color: #ffffff;
  background-color: #262626;
  text-decoration: none;
}

.nav-item.active {
  color: #ffffff;
  background-color: #262626;
  border-bottom-color: #0f62fe;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
