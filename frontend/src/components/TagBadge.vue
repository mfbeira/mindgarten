<template>
  <span
    class="tag-badge-item"
    :style="{ borderLeftColor: tag.color || '#0f62fe' }"
    :class="{ clickable: isClickable }"
    @click="handleClick"
  >
    <span class="tag-name">{{ tag.name }}</span>
    <span v-if="tag.linkCount !== undefined" class="tag-count">{{ tag.linkCount }}</span>
  </span>
</template>

<script setup lang="ts">
import type { Tag } from '../api/client';

const props = defineProps<{
  tag: Tag;
  isClickable?: boolean;
}>();

const emit = defineEmits<{
  (e: 'click', tag: Tag): void;
}>();

const handleClick = () => {
  if (props.isClickable) {
    emit('click', props.tag);
  }
};
</script>

<style scoped>
.tag-badge-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 0px;
  border-left: 3px solid #0f62fe;
  background-color: #f4f4f4;
  color: #161616;
  border-top: 1px solid #e0e0e0;
  border-right: 1px solid #e0e0e0;
  border-bottom: 1px solid #e0e0e0;
  transition: all 0.15s ease;
  user-select: none;
}

.clickable {
  cursor: pointer;
}

.clickable:hover {
  background-color: #e5e5e5;
  border-color: #c6c6c6;
}

.tag-name {
  line-height: 1.2;
}

.tag-count {
  font-family: var(--cds-font-mono);
  font-size: 0.6875rem;
  color: #525252;
  background-color: #e0e0e0;
  padding: 0 4px;
}
</style>
