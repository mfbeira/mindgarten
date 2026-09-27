import { defineStore } from 'pinia';
import { ref } from 'vue';
import api, { type LinkItem, type CreateLinkInput, type UpdateLinkInput } from '../api/client';
import { useUiStore } from './ui';
import { useTagsStore } from './tags';

export const useLinksStore = defineStore('links', () => {
  const links = ref<LinkItem[]>([]);
  const total = ref(0);
  const skip = ref(0);
  const take = ref(20);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const searchQuery = ref('');
  const selectedTagId = ref<number | null>(null);
  const sortOrder = ref<'newest' | 'oldest' | 'alphabetical'>('newest');

  const fetchLinks = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await api.getLinks({
        skip: skip.value,
        take: take.value,
        search: searchQuery.value || undefined,
        tag: selectedTagId.value !== null ? selectedTagId.value : undefined,
        sort: sortOrder.value,
      });

      links.value = response.data;
      total.value = response.total ?? response.data.length;
    } catch (err: any) {
      error.value = err.message || 'Failed to load links';
    } finally {
      isLoading.value = false;
    }
  };

  const createLink = async (input: CreateLinkInput): Promise<LinkItem> => {
    const ui = useUiStore();
    const tagsStore = useTagsStore();
    try {
      const response = await api.createLink(input);
      // Prepend to list
      links.value.unshift(response.data);
      total.value += 1;
      ui.addToast('Link saved successfully', 'success');
      // Refresh tags to get updated link counts
      tagsStore.fetchTags();
      return response.data;
    } catch (err: any) {
      ui.addToast(err.message || 'Failed to save link', 'error');
      throw err;
    }
  };

  const updateLink = async (id: number, input: UpdateLinkInput): Promise<LinkItem> => {
    const ui = useUiStore();
    const tagsStore = useTagsStore();
    try {
      const response = await api.updateLink(id, input);
      const index = links.value.findIndex((l) => l.id === id);
      if (index !== -1) {
        links.value[index] = response.data;
      }
      ui.addToast('Link updated successfully', 'success');
      tagsStore.fetchTags();
      return response.data;
    } catch (err: any) {
      ui.addToast(err.message || 'Failed to update link', 'error');
      throw err;
    }
  };

  const deleteLink = async (id: number): Promise<void> => {
    const ui = useUiStore();
    const tagsStore = useTagsStore();
    try {
      await api.deleteLink(id);
      links.value = links.value.filter((l) => l.id !== id);
      total.value = Math.max(0, total.value - 1);
      ui.addToast('Link deleted', 'info');
      tagsStore.fetchTags();
    } catch (err: any) {
      ui.addToast(err.message || 'Failed to delete link', 'error');
      throw err;
    }
  };

  const setSearch = (query: string) => {
    searchQuery.value = query;
    skip.value = 0;
    fetchLinks();
  };

  const setTagFilter = (tagId: number | null) => {
    selectedTagId.value = tagId;
    skip.value = 0;
    fetchLinks();
  };

  const setSort = (order: 'newest' | 'oldest' | 'alphabetical') => {
    sortOrder.value = order;
    fetchLinks();
  };

  return {
    links,
    total,
    skip,
    take,
    isLoading,
    error,
    searchQuery,
    selectedTagId,
    sortOrder,
    fetchLinks,
    createLink,
    updateLink,
    deleteLink,
    setSearch,
    setTagFilter,
    setSort,
  };
});
