<template>
  <div class="settings-page container">
    <div class="page-header">
      <div>
        <h1>Settings & Agent Integration</h1>
        <p class="subtitle">Configure API tokens, server connectivity, and agent endpoints.</p>
      </div>
    </div>

    <div class="settings-grid">
      <!-- API Configuration Card -->
      <div class="carbon-card">
        <h2>API & Server Configuration</h2>
        <p class="section-desc">Manage authentication tokens and backend endpoint addresses.</p>

        <form @submit.prevent="saveSettings">
          <div class="form-group">
            <label class="form-label" for="api-token">API Token (Bearer)</label>
            <div class="token-input-row">
              <input
                id="api-token"
                v-model="token"
                :type="showToken ? 'text' : 'password'"
                class="form-input"
                placeholder="mindgarten-secret-token"
              />
              <button
                type="button"
                class="btn btn-secondary btn-sm"
                @click="showToken = !showToken"
              >
                <Eye v-if="!showToken" :size="14" />
                <EyeOff v-else :size="14" />
                <span>{{ showToken ? 'Hide' : 'Show' }}</span>
              </button>
            </div>
            <span class="help-text">Used to authenticate requests from Hermes, Pi Agent, and this UI.</span>
          </div>

          <div class="form-group">
            <label class="form-label" for="base-url">API Base URL</label>
            <input
              id="base-url"
              v-model="baseUrl"
              type="text"
              class="form-input"
              placeholder="Leave empty for default (relative / proxy)"
            />
            <span class="help-text">e.g. http://localhost:3000 or http://192.168.0.X:3000</span>
          </div>

          <div class="actions-row">
            <button type="submit" class="btn btn-primary">
              <Save :size="16" />
              <span>Save Configuration</span>
            </button>
            <button
              type="button"
              class="btn btn-secondary"
              :disabled="isChecking"
              @click="testConnection"
            >
              <Activity :size="16" />
              <span>{{ isChecking ? 'Testing...' : 'Test Connection' }}</span>
            </button>
          </div>
        </form>

        <!-- Connectivity Status Banner -->
        <div v-if="connectionStatus" class="status-banner" :class="`status-${connectionStatus.type}`">
          <CheckCircle2 v-if="connectionStatus.type === 'success'" :size="18" />
          <AlertCircle v-else :size="18" />
          <div>
            <strong>{{ connectionStatus.title }}</strong>
            <p>{{ connectionStatus.detail }}</p>
          </div>
        </div>
      </div>

      <!-- Hermes & Pi Agent Integration Guide -->
      <div class="carbon-card">
        <h2>Agent Integration (Hermes & Pi Agent)</h2>
        <p class="section-desc">Connect your AI assistants to automatically capture links.</p>

        <div class="integration-step">
          <h3>Hermes Agent (Docker / Telegram)</h3>
          <p>Configure the following environment variables in your Hermes container:</p>
          <div class="code-block">
            <pre><code>MINDGARTEN_URL=http://localhost:3000
MINDGARTEN_TOKEN={{ token || 'your-token' }}</code></pre>
          </div>
          <p class="step-notes">
            Telegram Command format: <code>/save_link &lt;url&gt; [optional title]</code>
          </p>
        </div>

        <div class="integration-step">
          <h3>REST API Quick Test (cURL)</h3>
          <p>Test adding a bookmark directly via terminal:</p>
          <div class="code-block">
            <pre><code>curl -X POST http://localhost:3000/api/v1/links \
  -H "Authorization: Bearer {{ token || 'your-token' }}" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://news.ycombinator.com",
    "title": "Hacker News",
    "tags": ["tech", "news"]
  }'</code></pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Save, Activity, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-vue-next';
import api from '../api/client';
import { useUiStore } from '../stores/ui';

const ui = useUiStore();

const token = ref(api.getToken());
const baseUrl = ref(api.getBaseUrl());
const showToken = ref(false);
const isChecking = ref(false);
const connectionStatus = ref<{ type: 'success' | 'error'; title: string; detail: string } | null>(null);

const saveSettings = () => {
  api.setToken(token.value);
  api.setBaseUrl(baseUrl.value);
  ui.addToast('Settings saved successfully', 'success');
};

const testConnection = async () => {
  isChecking.value = true;
  connectionStatus.value = null;
  try {
    const health = await api.checkHealth();
    let dbStatus = 'Not checked';
    try {
      const ready = await api.checkReady();
      dbStatus = ready.database || 'connected';
    } catch {
      dbStatus = 'unreachable';
    }

    connectionStatus.value = {
      type: 'success',
      title: 'Connection Successful',
      detail: `API Status: ${health.status} (v${health.version}) | PostgreSQL: ${dbStatus}`,
    };
  } catch (err: any) {
    connectionStatus.value = {
      type: 'error',
      title: 'Connection Failed',
      detail: err.message || 'Could not connect to MindGarten backend server',
    };
  } finally {
    isChecking.value = false;
  }
};
</script>

<style scoped>
.settings-page {
  padding-top: 32px;
  padding-bottom: 64px;
}

.page-header {
  margin-bottom: 24px;
}

.subtitle {
  color: #525252;
  margin-top: 4px;
}

.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

@media (max-width: 900px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}

.section-desc {
  font-size: 0.875rem;
  color: #525252;
  margin-bottom: 20px;
}

.token-input-row {
  display: flex;
  gap: 8px;
}

.help-text {
  font-size: 0.75rem;
  color: #8d8d8d;
  margin-top: 4px;
}

.actions-row {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.status-banner {
  margin-top: 20px;
  padding: 12px 16px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  border-left: 4px solid;
  border-radius: 0;
  font-size: 0.875rem;
}

.status-banner strong {
  display: block;
  margin-bottom: 2px;
}

.status-success {
  background-color: #defbe6;
  color: #0e6027;
  border-left-color: #198038;
}

.status-error {
  background-color: #fff1f1;
  color: #a2191f;
  border-left-color: #da1e28;
}

.integration-step {
  margin-bottom: 24px;
}

.integration-step h3 {
  font-size: 1rem;
  margin-bottom: 6px;
}

.integration-step p {
  font-size: 0.875rem;
  color: #525252;
  margin-bottom: 8px;
}

.step-notes {
  margin-top: 8px;
  font-size: 0.8125rem;
}

.code-block {
  background-color: #161616;
  color: #f4f4f4;
  padding: 12px 16px;
  border-left: 3px solid #0f62fe;
  overflow-x: auto;
}

.code-block pre {
  margin: 0;
  font-family: var(--cds-font-mono);
  font-size: 0.8125rem;
  line-height: 1.5;
}
</style>
