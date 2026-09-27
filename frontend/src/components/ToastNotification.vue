<template>
  <div class="toast-container">
    <div
      v-for="toast in ui.toasts"
      :key="toast.id"
      class="toast-item"
      :class="`toast-${toast.type}`"
    >
      <div class="toast-content">
        <CheckCircle2 v-if="toast.type === 'success'" :size="16" class="toast-icon text-success" />
        <AlertCircle v-else-if="toast.type === 'error'" :size="16" class="toast-icon text-danger" />
        <Info v-else :size="16" class="toast-icon text-info" />
        <span class="toast-message">{{ toast.message }}</span>
      </div>
      <button class="toast-close" @click="ui.removeToast(toast.id)">
        <X :size="14" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-vue-next';
import { useUiStore } from '../stores/ui';

const ui = useUiStore();
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 500;
  max-width: 400px;
}

.toast-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: #161616;
  color: #ffffff;
  border-left: 4px solid #0f62fe;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  border-radius: 0;
  animation: slideIn 0.2s ease-out;
}

.toast-success {
  border-left-color: #198038;
}

.toast-error {
  border-left-color: #da1e28;
}

.toast-info {
  border-left-color: #0f62fe;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.875rem;
}

.toast-icon {
  flex-shrink: 0;
}

.text-success {
  color: #42be65;
}

.text-danger {
  color: #fa4d56;
}

.text-info {
  color: #4589ff;
}

.toast-message {
  line-height: 1.4;
}

.toast-close {
  background: transparent;
  border: none;
  color: #c6c6c6;
  cursor: pointer;
  padding: 2px;
  margin-left: 12px;
  display: flex;
  align-items: center;
}

.toast-close:hover {
  color: #ffffff;
}

@keyframes slideIn {
  from {
    transform: translateX(30px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>
