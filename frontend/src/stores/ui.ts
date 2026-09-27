import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { LinkItem, Tag } from '../api/client';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export const useUiStore = defineStore('ui', () => {
  // Toast notifications
  const toasts = ref<ToastMessage[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info', duration = 3500) => {
    const id = Math.random().toString(36).substring(2, 9);
    toasts.value.push({ id, type, message });

    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id: string) => {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  };

  // Modals state
  const isLinkModalOpen = ref(false);
  const editingLink = ref<LinkItem | null>(null);

  const isTagModalOpen = ref(false);
  const editingTag = ref<Tag | null>(null);

  const openAddLinkModal = () => {
    editingLink.value = null;
    isLinkModalOpen.value = true;
  };

  const openEditLinkModal = (link: LinkItem) => {
    editingLink.value = link;
    isLinkModalOpen.value = true;
  };

  const closeLinkModal = () => {
    isLinkModalOpen.value = false;
    editingLink.value = null;
  };

  const openAddTagModal = () => {
    editingTag.value = null;
    isTagModalOpen.value = true;
  };

  const openEditTagModal = (tag: Tag) => {
    editingTag.value = tag;
    isTagModalOpen.value = true;
  };

  const closeTagModal = () => {
    isTagModalOpen.value = false;
    editingTag.value = null;
  };

  return {
    toasts,
    addToast,
    removeToast,
    isLinkModalOpen,
    editingLink,
    openAddLinkModal,
    openEditLinkModal,
    closeLinkModal,
    isTagModalOpen,
    editingTag,
    openAddTagModal,
    openEditTagModal,
    closeTagModal,
  };
});
