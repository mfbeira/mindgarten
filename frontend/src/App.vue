<template>
  <div id="mindgarten-app">
    <Navbar />
    <main class="main-content">
      <router-view />
    </main>

    <!-- Global Modals & Toasts -->
    <LinkModal />
    <TagModal />
    <ToastNotification />
  </div>
</template>

<script setup lang="ts">
import Navbar from './components/Navbar.vue';
import LinkModal from './components/LinkModal.vue';
import TagModal from './components/TagModal.vue';
import ToastNotification from './components/ToastNotification.vue';
</script>

<style>
@import './styles/carbon.css';

#mindgarten-app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
}
</style>
