<template>
  <div class="tags-page container">
    <div class="page-header">
      <div>
        <h1>Tag Management</h1>
        <p class="subtitle">Organize and categorize your bookmark collections.</p>
      </div>
      <button class="btn btn-primary" @click="ui.openAddTagModal">
        <Plus :size="16" />
        <span>Create Tag</span>
      </button>
    </div>

    <div v-if="tagsStore.isLoading" class="loading-state">
      <div class="loading-skeleton" v-for="n in 4" :key="n"></div>
    </div>

    <div v-else-if="tagsStore.tags.length === 0" class="empty-state carbon-card">
      <TagIcon :size="40" class="empty-icon" />
      <h3>No tags created yet</h3>
      <p>Tags help you categorize your links into logical groups for instant retrieval.</p>
      <button class="btn btn-primary" @click="ui.openAddTagModal">
        <Plus :size="16" />
        <span>Create First Tag</span>
      </button>
    </div>

    <div v-else class="tags-grid">
      <div
        v-for="tag in tagsStore.tags"
        :key="tag.id"
        class="carbon-card tag-card"
        :style="{ borderLeftColor: tag.color || '#0f62fe' }"
      >
        <div class="tag-card-header">
          <div class="tag-title-area">
            <span class="tag-color-dot" :style="{ backgroundColor: tag.color || '#0f62fe' }"></span>
            <h3 class="tag-title">{{ tag.name }}</h3>
          </div>
          <div class="tag-actions">
            <button class="icon-btn" title="Edit Tag" @click="ui.openEditTagModal(tag)">
              <Edit2 :size="14" />
            </button>
            <button class="icon-btn icon-btn-danger" title="Delete Tag" @click="confirmDelete(tag)">
              <Trash2 :size="14" />
            </button>
          </div>
        </div>

        <p v-if="tag.description" class="tag-desc">
          {{ tag.description }}
        </p>
        <p v-else class="tag-desc no-desc">No description provided</p>

        <div class="tag-card-footer">
          <span class="count-badge">
            <strong>{{ tag.linkCount ?? 0 }}</strong> bookmarks
          </span>
          <button class="btn btn-ghost btn-sm" @click="filterByThisTag(tag.id)">
            <span>View Links</span>
            <ArrowRight :size="14" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Plus, Tag as TagIcon, Edit2, Trash2, ArrowRight } from 'lucide-vue-next';
import { useTagsStore } from '../stores/tags';
import { useLinksStore } from '../stores/links';
import { useUiStore } from '../stores/ui';
import type { Tag } from '../api/client';

const router = useRouter();
const tagsStore = useTagsStore();
const linksStore = useLinksStore();
const ui = useUiStore();

const filterByThisTag = (tagId: number) => {
  linksStore.setTagFilter(tagId);
  router.push('/links');
};

const confirmDelete = async (tag: Tag) => {
  if (window.confirm(`Delete tag "${tag.name}"? Existing bookmarks will retain their URLs.`)) {
    await tagsStore.deleteTag(tag.id);
  }
};

onMounted(() => {
  tagsStore.fetchTags();
});
</script>

<style scoped>
.tags-page {
  padding-top: 32px;
  padding-bottom: 64px;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.subtitle {
  color: #525252;
  margin-top: 4px;
}

.tags-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.tag-card {
  padding: 18px 20px;
  background-color: #ffffff;
  border-left: 4px solid #0f62fe;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.tag-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.tag-title-area {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tag-color-dot {
  width: 10px;
  height: 10px;
  border-radius: 0;
}

.tag-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #161616;
}

.tag-actions {
  display: flex;
  gap: 4px;
}

.icon-btn {
  background: transparent;
  border: 1px solid transparent;
  padding: 4px;
  cursor: pointer;
  color: #525252;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0;
  transition: all 0.15s ease;
}

.icon-btn:hover {
  background-color: #f4f4f4;
  color: #161616;
  border-color: #e0e0e0;
}

.icon-btn-danger:hover {
  background-color: #da1e28;
  color: #ffffff;
  border-color: #da1e28;
}

.tag-desc {
  font-size: 0.8125rem;
  color: #525252;
  line-height: 1.4;
  margin-bottom: 16px;
  flex-grow: 1;
}

.no-desc {
  color: #8d8d8d;
  font-style: italic;
}

.tag-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid #f4f4f4;
}

.count-badge {
  font-size: 0.75rem;
  color: #525252;
  font-family: var(--cds-font-mono);
}

.empty-state {
  text-align: center;
  padding: 48px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-icon {
  color: #8d8d8d;
}

.loading-skeleton {
  height: 120px;
  background: linear-gradient(90deg, #e5e5e5 25%, #f4f4f4 50%, #e5e5e5 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  margin-bottom: 12px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
