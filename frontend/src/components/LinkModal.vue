<template>
  <div v-if="ui.isLinkModalOpen" class="modal-overlay" @click.self="ui.closeLinkModal">
    <div class="modal-dialog">
      <div class="modal-header">
        <h3>{{ isEditing ? 'Edit Bookmark' : 'Save New Bookmark' }}</h3>
        <button class="close-btn" @click="ui.closeLinkModal">
          <X :size="18" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label" for="url">URL *</label>
            <input
              id="url"
              v-model="url"
              type="url"
              required
              class="form-input"
              placeholder="https://example.com/article"
              @blur="autoFillTitle"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="title">Title</label>
            <input
              id="title"
              v-model="title"
              type="text"
              class="form-input"
              placeholder="Descriptive title"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="description">Description</label>
            <textarea
              id="description"
              v-model="description"
              class="form-textarea"
              rows="3"
              placeholder="Summary or notes about this link..."
            ></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Tags</label>
            <div class="tags-selector">
              <span
                v-for="tag in tagsStore.tags"
                :key="tag.id"
                class="tag-toggle-item"
                :class="{ selected: selectedTagIds.includes(tag.id) }"
                :style="{ borderLeftColor: tag.color || '#0f62fe' }"
                @click="toggleTag(tag.id)"
              >
                {{ tag.name }}
              </span>
            </div>

            <!-- Inline new tag input -->
            <div class="new-tag-input-row">
              <input
                v-model="newTagName"
                type="text"
                class="form-input form-input-sm"
                placeholder="New tag name (press Add)"
                @keydown.enter.prevent="addNewTag"
              />
              <button
                type="button"
                class="btn btn-secondary btn-sm"
                :disabled="!newTagName.trim()"
                @click="addNewTag"
              >
                <Plus :size="14" />
                Add Tag
              </button>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" @click="ui.closeLinkModal">
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" :disabled="isSubmitting || !url.trim()">
            <Save :size="16" />
            <span>{{ isSubmitting ? 'Saving...' : isEditing ? 'Update Bookmark' : 'Save Bookmark' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { X, Save, Plus } from 'lucide-vue-next';
import { useUiStore } from '../stores/ui';
import { useLinksStore } from '../stores/links';
import { useTagsStore } from '../stores/tags';

const ui = useUiStore();
const linksStore = useLinksStore();
const tagsStore = useTagsStore();

const url = ref('');
const title = ref('');
const description = ref('');
const selectedTagIds = ref<number[]>([]);
const newTagName = ref('');
const isSubmitting = ref(false);

const isEditing = computed(() => !!ui.editingLink);

watch(
  () => ui.isLinkModalOpen,
  (open) => {
    if (open) {
      if (ui.editingLink) {
        url.value = ui.editingLink.url;
        title.value = ui.editingLink.title;
        description.value = ui.editingLink.description || '';
        selectedTagIds.value = ui.editingLink.tags.map((t) => t.id);
      } else {
        url.value = '';
        title.value = '';
        description.value = '';
        selectedTagIds.value = [];
      }
      newTagName.value = '';
    }
  }
);

const autoFillTitle = () => {
  if (!title.value && url.value) {
    try {
      const parsed = new URL(url.value);
      title.value = parsed.hostname.replace(/^www\./, '');
    } catch {
      // ignore
    }
  }
};

const toggleTag = (tagId: number) => {
  const index = selectedTagIds.value.indexOf(tagId);
  if (index === -1) {
    selectedTagIds.value.push(tagId);
  } else {
    selectedTagIds.value.splice(index, 1);
  }
};

const addNewTag = async () => {
  const trimmed = newTagName.value.trim();
  if (!trimmed) return;

  try {
    const created = await tagsStore.createTag({ name: trimmed });
    selectedTagIds.value.push(created.id);
    newTagName.value = '';
  } catch {
    // Handled by store toast
  }
};

const handleSubmit = async () => {
  if (!url.value.trim()) return;

  isSubmitting.value = true;
  try {
    if (isEditing.value && ui.editingLink) {
      await linksStore.updateLink(ui.editingLink.id, {
        url: url.value.trim(),
        title: title.value.trim() || undefined,
        description: description.value.trim() || undefined,
        tags: selectedTagIds.value,
      });
    } else {
      await linksStore.createLink({
        url: url.value.trim(),
        title: title.value.trim() || undefined,
        description: description.value.trim() || undefined,
        tags: selectedTagIds.value,
        createdBy: 'user',
      });
    }
    ui.closeLinkModal();
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

.tags-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
  max-height: 120px;
  overflow-y: auto;
  padding: 4px 0;
}

.tag-toggle-item {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid #e0e0e0;
  border-left: 3px solid #0f62fe;
  background-color: #f4f4f4;
  color: #525252;
  cursor: pointer;
  user-select: none;
  transition: all 0.15s ease;
}

.tag-toggle-item:hover {
  background-color: #e5e5e5;
  color: #161616;
}

.tag-toggle-item.selected {
  background-color: #161616;
  color: #ffffff;
  border-color: #161616;
}

.new-tag-input-row {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.form-input-sm {
  padding: 6px 10px;
  font-size: 0.8125rem;
}
</style>
