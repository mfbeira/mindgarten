<template>
  <div v-if="ui.isTagModalOpen" class="modal-overlay" @click.self="ui.closeTagModal">
    <div class="modal-dialog">
      <div class="modal-header">
        <h3>{{ isEditing ? 'Edit Tag' : 'Create New Tag' }}</h3>
        <button class="close-btn" @click="ui.closeTagModal">
          <X :size="18" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label" for="tag-name">Name *</label>
            <input
              id="tag-name"
              v-model="name"
              type="text"
              required
              class="form-input"
              placeholder="e.g. devops, ai, research"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Color Accent</label>
            <div class="color-palette">
              <button
                v-for="c in carbonColors"
                :key="c"
                type="button"
                class="color-swatch"
                :style="{ backgroundColor: c }"
                :class="{ active: color === c }"
                @click="color = c"
              ></button>
            </div>
            <div class="color-custom-row">
              <span class="color-preview" :style="{ backgroundColor: color }"></span>
              <input
                v-model="color"
                type="text"
                class="form-input form-input-sm"
                placeholder="#0f62fe"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="tag-description">Description</label>
            <textarea
              id="tag-description"
              v-model="description"
              class="form-textarea"
              rows="2"
              placeholder="What kind of bookmarks belong here?"
            ></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" @click="ui.closeTagModal">
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" :disabled="isSubmitting || !name.trim()">
            <Save :size="16" />
            <span>{{ isSubmitting ? 'Saving...' : isEditing ? 'Update Tag' : 'Create Tag' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { X, Save } from 'lucide-vue-next';
import { useUiStore } from '../stores/ui';
import { useTagsStore } from '../stores/tags';

const ui = useUiStore();
const tagsStore = useTagsStore();

const carbonColors = [
  '#0f62fe', // IBM Blue 60
  '#0043ce', // IBM Blue 70
  '#8a3ffc', // Purple
  '#007d79', // Teal
  '#ee538b', // Magenta
  '#1192e8', // Cyan
  '#ff832b', // Orange
  '#198038', // Green
  '#525252', // Gray 70
  '#161616', // Gray 100
];

const name = ref('');
const color = ref('#0f62fe');
const description = ref('');
const isSubmitting = ref(false);

const isEditing = computed(() => !!ui.editingTag);

watch(
  () => ui.isTagModalOpen,
  (open) => {
    if (open) {
      if (ui.editingTag) {
        name.value = ui.editingTag.name;
        color.value = ui.editingTag.color || '#0f62fe';
        description.value = ui.editingTag.description || '';
      } else {
        name.value = '';
        color.value = '#0f62fe';
        description.value = '';
      }
    }
  }
);

const handleSubmit = async () => {
  if (!name.value.trim()) return;

  isSubmitting.value = true;
  try {
    if (isEditing.value && ui.editingTag) {
      await tagsStore.updateTag(ui.editingTag.id, {
        name: name.value.trim(),
        color: color.value.trim() || undefined,
        description: description.value.trim() || undefined,
      });
    } else {
      await tagsStore.createTag({
        name: name.value.trim(),
        color: color.value.trim() || undefined,
        description: description.value.trim() || undefined,
      });
    }
    ui.closeTagModal();
  } catch {
    // Handled by store toast
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.close-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #525252;
  padding: 4px;
  display: flex;
  align-items: center;
}

.close-btn:hover {
  color: #161616;
}

.color-palette {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.color-swatch {
  width: 28px;
  height: 28px;
  border-radius: 0;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.1s ease;
}

.color-swatch:hover {
  transform: scale(1.1);
}

.color-swatch.active {
  border-color: #161616;
  outline: 2px solid #0f62fe;
}

.color-custom-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-preview {
  width: 32px;
  height: 32px;
  border: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.form-input-sm {
  padding: 6px 10px;
  font-size: 0.8125rem;
}
</style>
