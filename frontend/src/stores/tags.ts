import { defineStore } from 'pinia';
import { ref } from 'vue';
import api, { type Tag, type CreateTagInput, type UpdateTagInput } from '../api/client';
import { useUiStore } from './ui';

export const useTagsStore = defineStore('tags', () => {
  const tags = ref<Tag[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const fetchTags = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await api.getTags();
      tags.value = response.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to load tags';
    } finally {
      isLoading.value = false;
    }
  };

  const createTag = async (input: CreateTagInput): Promise<Tag> => {
    const ui = useUiStore();
    try {
      const response = await api.createTag(input);
      tags.value.push(response.data);
      ui.addToast(`Tag "${response.data.name}" created`, 'success');
      return response.data;
    } catch (err: any) {
      ui.addToast(err.message || 'Failed to create tag', 'error');
      throw err;
    }
  };

  const updateTag = async (id: number, input: UpdateTagInput): Promise<Tag> => {
    const ui = useUiStore();
    try {
      const response = await api.updateTag(id, input);
      const index = tags.value.findIndex((t) => t.id === id);
      if (index !== -1) {
        tags.value[index] = { ...tags.value[index], ...response.data };
      }
      ui.addToast('Tag updated', 'success');
      return response.data;
    } catch (err: any) {
      ui.addToast(err.message || 'Failed to update tag', 'error');
      throw err;
    }
  };

  const deleteTag = async (id: number): Promise<void> => {
    const ui = useUiStore();
    try {
      await api.deleteTag(id);
      tags.value = tags.value.filter((t) => t.id !== id);
      ui.addToast('Tag removed', 'success');
    } catch (err: any) {
      ui.addToast(err.message || 'Failed to delete tag', 'error');
      throw err;
    }
  };

  return {
    tags,
    isLoading,
    error,
    fetchTags,
    createTag,
    updateTag,
    deleteTag,
  };
});
