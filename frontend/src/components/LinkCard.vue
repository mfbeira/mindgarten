<template>
  <div class="carbon-card link-card">
    <div class="card-main">
      <div class="card-header">
        <div class="title-row">
          <img
            :src="link.faviconUrl || defaultFavicon"
            @error="handleFaviconError"
            alt=""
            class="favicon"
          />
          <a :href="link.url" target="_blank" rel="noopener noreferrer" class="link-title">
            {{ link.title }}
            <ExternalLink :size="14" class="external-icon" />
          </a>
        </div>
        <div class="card-actions">
          <button class="icon-btn" :title="copied ? 'Copied!' : 'Copy URL'" @click="copyUrl">
            <Check v-if="copied" :size="15" class="text-success" />
            <Copy v-else :size="15" />
          </button>
          <button class="icon-btn" title="Edit Link" @click="ui.openEditLinkModal(link)">
            <Edit2 :size="15" />
          </button>
          <button class="icon-btn icon-btn-danger" title="Delete Link" @click="confirmDelete">
            <Trash2 :size="15" />
          </button>
        </div>
      </div>

      <div class="url-meta">
        <span class="url-text">{{ link.url }}</span>
      </div>

      <p v-if="link.description" class="link-description">
        {{ link.description }}
      </p>

      <div class="card-footer">
        <div class="tags-group">
          <TagBadge
            v-for="tag in link.tags"
            :key="tag.id"
            :tag="tag"
            :is-clickable="true"
            @click="filterByTag"
          />
          <span v-if="!link.tags || link.tags.length === 0" class="no-tags">No tags</span>
        </div>

        <div class="meta-info">
          <span v-if="link.createdBy && link.createdBy !== 'user'" class="agent-tag">
            {{ link.createdBy }}
          </span>
          <span class="timestamp">{{ formattedDate }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ExternalLink, Copy, Check, Edit2, Trash2 } from 'lucide-vue-next';
import type { LinkItem, Tag } from '../api/client';
import TagBadge from './TagBadge.vue';
import { useUiStore } from '../stores/ui';
import { useLinksStore } from '../stores/links';

const props = defineProps<{
  link: LinkItem;
}>();

const ui = useUiStore();
const linksStore = useLinksStore();

const copied = ref(false);
const defaultFavicon = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%230f62fe" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/></svg>';

const handleFaviconError = (e: Event) => {
  const target = e.target as HTMLImageElement;
  target.src = defaultFavicon;
};

const formattedDate = computed(() => {
  try {
    const d = new Date(props.link.createdAt);
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return props.link.createdAt;
  }
});

const copyUrl = async () => {
  try {
    await navigator.clipboard.writeText(props.link.url);
    copied.value = true;
    ui.addToast('Link URL copied to clipboard', 'info', 2000);
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch {
    ui.addToast('Failed to copy URL', 'error');
  }
};

const filterByTag = (tag: Tag) => {
  linksStore.setTagFilter(tag.id);
};

const isDeleting = ref(false);

const confirmDelete = async () => {
  const confirmed = window.confirm(`Deseja realmente excluir o bookmark "${props.link.title}"?`);
  if (!confirmed) return;

  isDeleting.value = true;
  try {
    await linksStore.deleteLink(props.link.id);
  } finally {
    isDeleting.value = false;
  }
};
</script>

<style scoped>
.link-card {
  padding: 16px 20px;
  background-color: #ffffff;
  border-left: 3px solid transparent;
  transition: all 0.15s ease;
}

.link-card:hover {
  border-left-color: #0f62fe;
  background-color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 6px;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  overflow: hidden;
}

.favicon {
  width: 18px;
  height: 18px;
  object-fit: contain;
  flex-shrink: 0;
}

.link-title {
  font-size: 1.0625rem;
  font-weight: 600;
  color: #161616;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.link-title:hover {
  color: #0f62fe;
  text-decoration: underline;
}

.external-icon {
  opacity: 0.6;
  flex-shrink: 0;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.icon-btn {
  background: transparent;
  border: 1px solid transparent;
  padding: 6px;
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

.text-success {
  color: #198038;
}

.url-meta {
  margin-bottom: 8px;
}

.url-text {
  font-family: var(--cds-font-mono);
  font-size: 0.75rem;
  color: #8d8d8d;
  word-break: break-all;
}

.link-description {
  font-size: 0.875rem;
  color: #525252;
  line-height: 1.5;
  margin-bottom: 14px;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding-top: 10px;
  border-top: 1px solid #f4f4f4;
}

.tags-group {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.no-tags {
  font-size: 0.75rem;
  color: #8d8d8d;
  font-style: italic;
}

.meta-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.75rem;
  color: #8d8d8d;
}

.agent-tag {
  background-color: #161616;
  color: #ffffff;
  padding: 1px 6px;
  font-family: var(--cds-font-mono);
  font-size: 0.6875rem;
}

.timestamp {
  font-family: var(--cds-font-mono);
}
</style>
