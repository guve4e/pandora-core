<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Conversations</h1>
        <p>All assistant conversations for this tenant.</p>
      </div>
    </div>

    <div v-if="loading" class="card">Loading conversations...</div>

    <div v-else-if="error" class="card error">{{ error }}</div>

    <div v-else class="layout">
      <div class="card">
        <table class="table">
          <thead>
            <tr>
              <th>Last activity</th>
              <th>Visitor</th>
              <th>Last message</th>
              <th>Lead</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="conversation in conversations"
              :key="conversation.id"
              :class="{ selected: selectedConversationId === conversation.id }"
              @click="selectConversation(conversation.id)"
            >
              <td>{{ formatDate(conversation.last_message_at) }}</td>
              <td>{{ conversation.visitor_id || '—' }}</td>
              <td class="last-message-cell">
                {{ truncate(conversation.last_message || '—', 90) }}
              </td>
              <td>{{ conversation.lead_id ? 'Yes' : 'No' }}</td>
            </tr>

            <tr v-if="conversations.length === 0">
              <td colspan="4" class="empty">No conversations yet.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card">
        <template v-if="selectedConversationId">
          <div class="detail-header">
            <h2>Conversation</h2>
            <div class="detail-meta">
              <div><strong>ID:</strong> {{ selectedConversationId }}</div>
            </div>
          </div>

          <div v-if="messagesLoading" class="messages-loading">
            Loading messages...
          </div>

          <div v-else class="messages">
            <div
              v-for="(msg, index) in messages"
              :key="`${msg.created_at}-${index}`"
              :class="['msg', msg.role]"
            >
              <div class="msg-role">{{ msg.role }}</div>
              <div class="msg-text">{{ msg.message_text }}</div>
              <div class="msg-time">{{ formatDate(msg.created_at) }}</div>
            </div>

            <div v-if="messages.length === 0" class="empty">No messages.</div>
          </div>
        </template>

        <template v-else>
          <div class="empty-state">
            Select a conversation to view messages.
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import {
  getTenantConversationMessages,
  getTenantConversations,
  type ConversationMessageRow,
  type ConversationRow,
} from '../api/conversations';

const loading = ref(true);
const error = ref('');
const conversations = ref<ConversationRow[]>([]);
const selectedConversationId = ref<string>('');
const messages = ref<ConversationMessageRow[]>([]);
const messagesLoading = ref(false);

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function truncate(value: string, max = 80) {
  if (!value) return '';
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

async function loadConversations() {
  loading.value = true;
  error.value = '';

  try {
    conversations.value = await getTenantConversations();

    if (conversations.value.length > 0) {
      await selectConversation(conversations.value[0].id);
    }
  } catch (e: any) {
    error.value = e?.message || 'Failed to load conversations';
  } finally {
    loading.value = false;
  }
}

async function selectConversation(id: string) {
  selectedConversationId.value = id;
  messagesLoading.value = true;

  try {
    messages.value = await getTenantConversationMessages(id);
  } catch (e: any) {
    error.value = e?.message || 'Failed to load conversation messages';
    messages.value = [];
  } finally {
    messagesLoading.value = false;
  }
}

onMounted(loadConversations);
</script>

<style scoped>
.page {
  padding: 24px;
  color: #e5e7eb;
}

.page-header {
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

.layout {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 16px;
}

.card {
  background: rgba(15, 23, 42, 0.75);
  border: 1px solid rgba(51, 65, 85, 0.9);
  border-radius: 16px;
  padding: 20px;
  min-height: 420px;
}

.error {
  color: #f87171;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 12px 10px;
  text-align: left;
  border-bottom: 1px solid #1e293b;
  vertical-align: top;
}

th {
  color: #94a3b8;
  font-size: 13px;
}

td {
  color: #e2e8f0;
  font-size: 14px;
}

tbody tr {
  cursor: pointer;
}

tbody tr:hover {
  background: rgba(30, 41, 59, 0.45);
}

tbody tr.selected {
  background: rgba(37, 99, 235, 0.16);
}

.last-message-cell {
  max-width: 360px;
  color: #cbd5e1;
}

.detail-header {
  margin-bottom: 16px;
}

.detail-header h2 {
  margin: 0 0 10px 0;
  font-size: 18px;
}

.detail-meta {
  font-size: 13px;
  color: #94a3b8;
}

.messages-loading,
.empty-state,
.empty {
  color: #94a3b8;
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
  font-weight: 700;
  color: #93c5fd;
  margin-bottom: 6px;
  text-transform: uppercase;
}

.msg-text {
  color: #e2e8f0;
  white-space: pre-wrap;
  line-height: 1.5;
}

.msg-time {
  margin-top: 8px;
  font-size: 12px;
  color: #94a3b8;
}
</style>
