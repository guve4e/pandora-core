<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Lead Detail</h1>
        <p>View lead data and captured conversation.</p>
      </div>

      <router-link class="back-link" to="/tenant-leads">← Back to leads</router-link>
    </div>

    <div v-if="loading" class="card">Loading lead...</div>

    <div v-else-if="error" class="card error">{{ error }}</div>

    <div v-else class="layout">
      <div class="card">
        <h2>Lead Info</h2>

        <div class="field"><strong>Phone:</strong> {{ lead?.phone || '—' }}</div>
        <div class="field"><strong>Name:</strong> {{ lead?.name || '—' }}</div>
        <div class="field"><strong>City:</strong> {{ lead?.city || '—' }}</div>
        <div class="field"><strong>Service:</strong> {{ lead?.service_type || '—' }}</div>
        <div class="field"><strong>Source:</strong> {{ lead?.source || '—' }}</div>
        <div class="field"><strong>Created:</strong> {{ formatDate(lead?.created_at || '') }}</div>

        <div class="field">
          <strong>Status:</strong>
          <div class="status-row">
            <select v-model="statusDraft">
              <option value="new">new</option>
              <option value="contacted">contacted</option>
              <option value="scheduled">scheduled</option>
              <option value="won">won</option>
              <option value="lost">lost</option>
            </select>

            <button class="save-btn" :disabled="savingStatus" @click="saveStatus">
              {{ savingStatus ? 'Saving...' : 'Save status' }}
            </button>
          </div>
        </div>

        <div class="field summary">
          <strong>Summary:</strong>
          <div>{{ lead?.summary || '—' }}</div>
        </div>

        <div v-if="statusMessage" class="status-message">
          {{ statusMessage }}
        </div>
      </div>

      <div class="card">
        <h2>Conversation</h2>

        <div class="messages">
          <div
            v-for="msg in messages"
            :key="msg.id"
            :class="['msg', msg.role]"
          >
            <div class="msg-role">{{ msg.role }}</div>
            <div class="msg-text">{{ msg.text }}</div>
            <div class="msg-time">{{ formatDate(msg.created_at) }}</div>
          </div>

          <div v-if="messages.length === 0" class="empty">No messages.</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import {
  getTenantLead,
  getTenantLeadMessages,
  updateTenantLeadStatus,
  type LeadMessageRow,
  type LeadRow,
} from '../api/leads';

const route = useRoute();
const id = route.params.id as string;

const loading = ref(true);
const error = ref('');
const lead = ref<LeadRow | null>(null);
const messages = ref<LeadMessageRow[]>([]);
const statusDraft = ref<'new' | 'contacted' | 'scheduled' | 'won' | 'lost'>('new');
const savingStatus = ref(false);
const statusMessage = ref('');

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

async function load() {
  loading.value = true;
  error.value = '';

  try {
    const [leadData, messageData] = await Promise.all([
      getTenantLead(id),
      getTenantLeadMessages(id),
    ]);

    lead.value = leadData;
    statusDraft.value = (leadData.status as any) || 'new';
    messages.value = messageData;
  } catch (e: any) {
    error.value = e?.message || 'Failed to load lead';
  } finally {
    loading.value = false;
  }
}

async function saveStatus() {
  if (!lead.value) return;

  savingStatus.value = true;
  statusMessage.value = '';

  try {
    const updated = await updateTenantLeadStatus(lead.value.id, statusDraft.value);
    lead.value = updated;
    statusDraft.value = (updated.status as any) || 'new';
    statusMessage.value = 'Lead status updated.';
  } catch (e: any) {
    statusMessage.value = e?.message || 'Failed to update status';
  } finally {
    savingStatus.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.page {
  padding: 24px;
  color: #e5e7eb;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0 0 6px 0;
  font-size: 28px;
  font-weight: 700;
}

.page-header p {
  margin: 0;
  color: #94a3b8;
}

.back-link {
  color: #93c5fd;
  text-decoration: none;
}

.layout {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 16px;
}

.card {
  background: rgba(15, 23, 42, 0.75);
  border: 1px solid rgba(51, 65, 85, 0.9);
  border-radius: 16px;
  padding: 20px;
}

.error {
  color: #f87171;
}

h2 {
  margin: 0 0 16px 0;
  font-size: 18px;
}

.field {
  margin-bottom: 12px;
  color: #cbd5e1;
}

.summary {
  margin-top: 20px;
}

.status-row {
  margin-top: 8px;
  display: flex;
  gap: 10px;
  align-items: center;
}

select {
  border: 1px solid #334155;
  border-radius: 10px;
  background: #020617;
  color: #e2e8f0;
  padding: 10px 12px;
  font: inherit;
}

.save-btn {
  border: 1px solid #334155;
  border-radius: 10px;
  background: #0f172a;
  color: #e2e8f0;
  padding: 10px 14px;
  font: inherit;
  cursor: pointer;
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

.status-message {
  margin-top: 16px;
  color: #cbd5e1;
}

.messages {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.msg {
  border-radius: 12px;
  padding: 12px;
  border: 1px solid #334155;
}

.msg.user {
  background: #0f172a;
}

.msg.assistant {
  background: #111827;
}

.msg-role {
  font-size: 12px;
  text-transform: uppercase;
  color: #94a3b8;
  margin-bottom: 6px;
}

.msg-text {
  color: #e2e8f0;
  white-space: pre-wrap;
}

.msg-time {
  margin-top: 8px;
  font-size: 12px;
  color: #64748b;
}

.empty {
  color: #94a3b8;
}

@media (max-width: 900px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
</style>
