<template>
  <div class="browser-page container">
    <div class="page-header">
      <div>
        <h1>Bookmark Browser</h1>
        <p class="subtitle">Search, filter and organize your collected resources.</p>
      </div>
      <button class="btn btn-primary" @click="ui.openAddLinkModal">
        <Plus :size="16" />
        <span>Save Link</span>
      </button>
    </div>

    <!-- Controls Bar -->
    <div class="carbon-card controls-card">
      <div class="controls-grid">
        <!-- Search Input -->
        <div class="search-box">
          <label class="control-label">Search Query</label>
          <div class="search-input-wrap">
            <Search :size="16" class="control-icon" />
            <input
              v-model="searchInput"
              type="text"
              class="form-input"
              placeholder="Search title, description or url..."
              @input="handleSearch"
            />
            <button v-if="searchInput" class="clear-btn" @click="clearSearch">
              <X :size="14" />
            </button>
          </div>
        </div>

        <!-- Tag Filter Dropdown -->
        <div class="filter-box">
          <label class="control-label">Filter by Tag</label>
          <select
            :value="linksStore.selectedTagId ?? ''"
            class="form-select"
            @change="handleTagSelect"
          >
            <option value="">All Tags</option>
            <option v-for="tag in tagsStore.tags" :key="tag.id" :value="tag.id">
              {{ tag.name }} ({{ tag.linkCount ?? 0 }})
            </option>
          </select>
        </div>

        <!-- Sort Order -->
        <div class="sort-box">
          <label class="control-label">Sort By</label>
          <select
            :value="linksStore.sortOrder"
            class="form-select"
            @change="handleSortSelect"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="alphabetical">Alphabetical (A-Z)</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Active Filters Feedback & Count -->
    <div class="results-meta">
      <div class="results-count">
        Found <strong>{{ linksStore.total }}</strong> bookmarks
        <span v-if="linksStore.searchQuery"> matching "<em>{{ linksStore.searchQuery }}</em>"</span>
        <span v-if="selectedTagName"> in tag <strong>{{ selectedTagName }}</strong></span>
      </div>

      <button
        v-if="hasActiveFilters"
        class="btn btn-ghost btn-sm reset-btn"
        @click="resetFilters"
      >
        <RotateCcw :size="14" />
        <span>Reset Filters</span>
      </button>
    </div>

    <!-- Links List -->
    <div v-if="linksStore.isLoading" class="loading-state">
      <div class="loading-skeleton" v-for="n in 5" :key="n"></div>
    </div>

    <div v-else-if="linksStore.links.length === 0" class="empty-state carbon-card">
      <SearchX :size="40" class="empty-icon" />
      <h3>No matching bookmarks</h3>
      <p>Try modifying your search criteria or clearing filters.</p>
      <button class="btn btn-secondary btn-sm" @click="resetFilters">
        Clear All Filters
      </button>
    </div>

    <div v-else class="links-list">
      <LinkCard
        v-for="link in linksStore.links"
        :key="link.id"
        :link="link"
      />
    </div>

    <!-- Pagination Controls -->
    <div v-if="linksStore.total > linksStore.take" class="pagination-bar">
      <div class="pagination-info">
        Showing {{ paginationStart }} - {{ paginationEnd }} of {{ linksStore.total }}
      </div>
      <div class="pagination-buttons">
        <button
          class="btn btn-secondary btn-sm"
          :disabled="linksStore.skip === 0"
          @click="prevPage"
        >
          <ChevronLeft :size="16" />
          <span>Previous</span>
        </button>
        <button
          class="btn btn-secondary btn-sm"
          :disabled="linksStore.skip + linksStore.take >= linksStore.total"
          @click="nextPage"
        >
          <span>Next</span>
          <ChevronRight :size="16" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Search, X, Plus, RotateCcw, SearchX, ChevronLeft, ChevronRight } from 'lucide-vue-next';
import LinkCard from '../components/LinkCard.vue';
import { useLinksStore } from '../stores/links';
import { useTagsStore } from '../stores/tags';
import { useUiStore } from '../stores/ui';

const linksStore = useLinksStore();
const tagsStore = useTagsStore();
const ui = useUiStore();

const searchInput = ref(linksStore.searchQuery);
let debounceTimer: any = null;

const selectedTagName = computed(() => {
  if (linksStore.selectedTagId === null) return null;
  const tag = tagsStore.tags.find((t) => t.id === linksStore.selectedTagId);
  return tag ? tag.name : null;
});

const hasActiveFilters = computed(() => {
  return !!linksStore.searchQuery || linksStore.selectedTagId !== null || linksStore.sortOrder !== 'newest';
});

const paginationStart = computed(() => {
  if (linksStore.total === 0) return 0;
  return linksStore.skip + 1;
});

const paginationEnd = computed(() => {
  return Math.min(linksStore.skip + linksStore.take, linksStore.total);
});

const handleSearch = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    linksStore.setSearch(searchInput.value);
  }, 250);
};

const clearSearch = () => {
  searchInput.value = '';
  linksStore.setSearch('');
};

const handleTagSelect = (e: Event) => {
  const value = (e.target as HTMLSelectElement).value;
  linksStore.setTagFilter(value ? parseInt(value, 10) : null);
};

const handleSortSelect = (e: Event) => {
  const value = (e.target as HTMLSelectElement).value as 'newest' | 'oldest' | 'alphabetical';
  linksStore.setSort(value);
};

const resetFilters = () => {
  searchInput.value = '';
  linksStore.searchQuery = '';
  linksStore.selectedTagId = null;
  linksStore.sortOrder = 'newest';
  linksStore.skip = 0;
  linksStore.fetchLinks();
};

const prevPage = () => {
  if (linksStore.skip >= linksStore.take) {
    linksStore.skip -= linksStore.take;
    linksStore.fetchLinks();
  }
};

const nextPage = () => {
  if (linksStore.skip + linksStore.take < linksStore.total) {
    linksStore.skip += linksStore.take;
    linksStore.fetchLinks();
  }
};

onMounted(() => {
  linksStore.fetchLinks();
  tagsStore.fetchTags();
});
</script>

<style scoped>
.browser-page {
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

.controls-card {
  padding: 16px 20px;
  background-color: #ffffff;
  margin-bottom: 20px;
}

.controls-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 16px;
}

@media (max-width: 768px) {
  .controls-grid {
    grid-template-columns: 1fr;
  }
}

.control-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 500;
  color: #525252;
  margin-bottom: 4px;
  letter-spacing: 0.32px;
}

.search-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.control-icon {
  position: absolute;
  left: 10px;
  color: #8d8d8d;
}

.search-input-wrap .form-input {
  padding-left: 32px;
  padding-right: 28px;
}

.clear-btn {
  position: absolute;
  right: 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #8d8d8d;
  display: flex;
  align-items: center;
}

.results-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  font-size: 0.875rem;
  color: #525252;
}

.results-count strong {
  color: #161616;
}

.reset-btn {
  padding: 4px 8px;
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

.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 24px;
  padding: 16px 20px;
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
}

.pagination-info {
  font-size: 0.8125rem;
  color: #525252;
  font-family: var(--cds-font-mono);
}

.pagination-buttons {
  display: flex;
  gap: 8px;
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
