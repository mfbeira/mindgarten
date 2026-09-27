<template>
  <div class="dashboard-page container">
    <!-- Hero / Headline -->
    <div class="hero-section">
      <div class="hero-content">
        <h1>Personal Knowledge & Bookmark Vault</h1>
        <p class="hero-subtitle">
          Self-hosted memory repository with native API endpoints for Hermes and Pi Agent.
        </p>
      </div>
      <div class="hero-actions">
        <button class="btn btn-primary" @click="ui.openAddLinkModal">
          <Plus :size="16" />
          <span>Save Link</span>
        </button>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid">
      <div class="carbon-card stat-card">
        <div class="stat-header">
          <span class="stat-label">TOTAL BOOKMARKS</span>
          <Bookmark :size="18" class="stat-icon" />
        </div>
        <div class="stat-value">{{ linksStore.total }}</div>
        <div class="stat-desc">Stored in PostgreSQL</div>
      </div>

      <div class="carbon-card stat-card">
        <div class="stat-header">
          <span class="stat-label">ACTIVE TAGS</span>
          <Tag :size="18" class="stat-icon" />
        </div>
        <div class="stat-value">{{ tagsStore.tags.length }}</div>
        <div class="stat-desc">Flexible taxonomy</div>
      </div>

      <div class="carbon-card stat-card">
        <div class="stat-header">
          <span class="stat-label">API INTEGRATION</span>
          <Cpu :size="18" class="stat-icon" />
        </div>
        <div class="stat-value">Ready</div>
        <div class="stat-desc">Hermes & Pi Agent connected</div>
      </div>
    </div>

    <!-- Quick Search & Tag Filter -->
    <div class="carbon-card search-card">
      <div class="search-input-wrapper">
        <Search :size="18" class="search-icon" />
        <input
          v-model="searchInput"
          type="text"
          class="dashboard-search-input"
          placeholder="Search by title, description or URL..."
          @input="handleSearchInput"
        />
        <button v-if="searchInput" class="clear-btn" @click="clearSearch">
          <X :size="16" />
        </button>
      </div>

      <!-- Quick Tag Filter Chips -->
      <div v-if="tagsStore.tags.length > 0" class="tag-filter-row">
        <span class="tag-filter-label">Filter:</span>
        <button
          class="tag-filter-chip"
          :class="{ active: linksStore.selectedTagId === null }"
          @click="linksStore.setTagFilter(null)"
        >
          All ({{ linksStore.total }})
        </button>
        <button
          v-for="tag in tagsStore.tags"
          :key="tag.id"
          class="tag-filter-chip"
          :class="{ active: linksStore.selectedTagId === tag.id }"
          :style="{ borderLeftColor: tag.color || '#0f62fe' }"
          @click="linksStore.setTagFilter(tag.id)"
        >
          {{ tag.name }}
          <span v-if="tag.linkCount !== undefined" class="chip-count">{{ tag.linkCount }}</span>
        </button>
      </div>
    </div>

    <!-- Recent Bookmarks Section -->
    <div class="recent-section">
      <div class="section-header">
        <h2>{{ linksStore.selectedTagId !== null ? 'Filtered Bookmarks' : 'Recent Bookmarks' }}</h2>
        <router-link to="/links" class="view-all-link">
          <span>View all in Browser</span>
          <ArrowRight :size="16" />
        </router-link>
      </div>

      <div v-if="linksStore.isLoading" class="loading-state">
        <div class="loading-skeleton" v-for="n in 3" :key="n"></div>
      </div>

      <div v-else-if="linksStore.links.length === 0" class="empty-state carbon-card">
        <Inbox :size="40" class="empty-icon" />
        <h3>No bookmarks found</h3>
        <p v-if="searchInput || linksStore.selectedTagId">
          No bookmarks match your search criteria. Try clearing filters.
        </p>
        <p v-else>
          You haven't saved any bookmarks yet. Start collecting articles, documentation and references!
        </p>
        <button class="btn btn-primary" @click="ui.openAddLinkModal">
          <Plus :size="16" />
          <span>Save Your First Link</span>
        </button>
      </div>

      <div v-else class="links-list">
        <LinkCard
          v-for="link in linksStore.links"
          :key="link.id"
          :link="link"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Bookmark, Tag, Cpu, Search, X, Plus, ArrowRight, Inbox } from 'lucide-vue-next';
import LinkCard from '../components/LinkCard.vue';
import { useLinksStore } from '../stores/links';
import { useTagsStore } from '../stores/tags';
import { useUiStore } from '../stores/ui';

const linksStore = useLinksStore();
const tagsStore = useTagsStore();
const ui = useUiStore();

const searchInput = ref('');
let debounceTimer: any = null;

const handleSearchInput = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    linksStore.setSearch(searchInput.value);
  }, 250);
};

const clearSearch = () => {
  searchInput.value = '';
  linksStore.setSearch('');
};

onMounted(() => {
  linksStore.fetchLinks();
  tagsStore.fetchTags();
});
</script>

<style scoped>
.dashboard-page {
  padding-top: 32px;
  padding-bottom: 64px;
}

.hero-section {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}

.hero-content h1 {
  margin-bottom: 8px;
}

.hero-subtitle {
  font-size: 1rem;
  color: #525252;
  max-width: 650px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  padding: 20px;
  background-color: #ffffff;
}

.stat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.stat-label {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.8px;
  color: #525252;
}

.stat-icon {
  color: #0f62fe;
}

.stat-value {
  font-size: 2.25rem;
  font-weight: 300;
  line-height: 1;
  margin-bottom: 6px;
  color: #161616;
}

.stat-desc {
  font-size: 0.75rem;
  color: #8d8d8d;
}

.search-card {
  margin-bottom: 32px;
  padding: 16px 20px;
  background-color: #ffffff;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 2px solid #161616;
  padding-bottom: 8px;
}

.search-icon {
  color: #0f62fe;
  flex-shrink: 0;
}

.dashboard-search-input {
  width: 100%;
  border: none;
  outline: none;
  font-size: 1.0625rem;
  font-family: var(--cds-font-sans);
  color: #161616;
  background: transparent;
}

.clear-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #525252;
  padding: 4px;
}

.tag-filter-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.tag-filter-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #525252;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tag-filter-chip {
  background-color: #f4f4f4;
  border: 1px solid #e0e0e0;
  border-left: 3px solid #8d8d8d;
  color: #161616;
  padding: 3px 10px;
  font-size: 0.75rem;
  font-family: var(--cds-font-sans);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s ease;
}

.tag-filter-chip:hover {
  background-color: #e5e5e5;
}

.tag-filter-chip.active {
  background-color: #161616;
  color: #ffffff;
  border-color: #161616;
}

.chip-count {
  font-family: var(--cds-font-mono);
  font-size: 0.6875rem;
  opacity: 0.8;
}

.recent-section {
  margin-top: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.view-all-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  font-weight: 500;
}

.links-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
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

.empty-state h3 {
  font-size: 1.25rem;
  color: #161616;
}

.empty-state p {
  color: #525252;
  max-width: 480px;
  margin-bottom: 8px;
}

.loading-skeleton {
  height: 90px;
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
