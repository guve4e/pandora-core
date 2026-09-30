<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>Conversations</h1>
        <p>Review customer chats and clean up test conversations.</p>
      </div>
      <button :disabled="loading || deleting" @click="loadConversations">
        Refresh
      </button>
    </header>
    <div class="toolbar">
      <label
        >Search<input
          v-model="search"
          type="search"
          placeholder="Message, visitor or conversation ID"
      /></label>
      <label
        >Channel<select v-model="channel">
          <option value="all">All conversations</option>
          <option value="pilot">Pilot conversations</option>
          <option value="other">Other channels</option>
        </select></label
      >
      <span class="muted" role="status"
        >{{ filtered.length }} of {{ conversations.length }}</span
      >
    </div>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <p v-if="notice" role="status">{{ notice }}</p>
    <div v-if="loading" class="empty">Loading conversations…</div>
    <div v-else class="layout">
      <aside class="card conversation-list" aria-label="Conversations">
        <button
          v-for="conversation in filtered"
          :key="conversation.id"
          class="conversation"
          :class="{ selected: selectedConversationId === conversation.id }"
          :aria-pressed="selectedConversationId === conversation.id"
          :disabled="deleting"
          @click="selectConversation(conversation.id)"
        >
          <span class="row"
            ><strong>{{
              conversation.channel === 'pilot'
                ? 'Pilot conversation'
                : 'Customer conversation'
            }}</strong
            ><time>{{ formatDate(conversation.last_message_at) }}</time></span
          >
          <span class="preview">{{
            conversation.last_message || 'No messages yet'
          }}</span>
          <span class="row muted"
            ><span>{{
              conversation.visitor_id
                ? truncate(conversation.visitor_id, 24)
                : conversation.id.slice(0, 8)
            }}</span
            ><span
              v-if="conversation.has_lead || conversation.lead_id"
              class="badge"
              >Linked lead</span
            ><span v-else>{{ conversation.channel || 'Web' }}</span></span
          >
        </button>
        <div v-if="!filtered.length" class="empty">
          {{
            conversations.length
              ? 'No matching conversations.'
              : 'No conversations yet.'
          }}
        </div>
      </aside>
      <section class="card detail" aria-label="Conversation messages">
        <template v-if="selectedConversation">
          <header class="detail-header">
            <div>
              <h2>
                {{
                  selectedConversation.channel === 'pilot'
                    ? 'Pilot conversation'
                    : 'Conversation'
                }}
              </h2>
              <span class="muted conversation-id">{{
                selectedConversationId
              }}</span>
            </div>
            <button
              class="danger"
              :disabled="
                deleting ||
                !!selectedConversation.has_lead ||
                !!selectedConversation.lead_id
              "
              @click="confirming = true"
            >
              Delete
            </button>
          </header>
          <p
            v-if="selectedConversation.has_lead || selectedConversation.lead_id"
            class="muted"
          >
            This conversation has a linked lead and is protected from deletion.
          </p>
          <div
            v-if="confirming"
            class="confirmation"
            role="alertdialog"
            aria-labelledby="delete-title"
            aria-describedby="delete-description"
          >
            <h3 id="delete-title">Delete this conversation?</h3>
            <p id="delete-description">
              This permanently removes this chat, all its messages and its saved
              estimate state. It cannot be undone.
            </p>
            <div class="actions">
              <button :disabled="deleting" @click="confirming = false">
                Cancel</button
              ><button
                class="danger"
                :disabled="deleting"
                @click="removeSelected"
              >
                {{ deleting ? 'Deleting…' : 'Permanently delete' }}
              </button>
            </div>
          </div>
          <p v-if="messageError" class="error" role="alert">
            {{ messageError }}
          </p>
          <div v-if="messagesLoading" class="empty">Loading messages…</div>
          <div v-else class="messages">
            <article
              v-for="(msg, index) in messages"
              :key="`${msg.created_at}-${index}`"
              :class="['msg', msg.role]"
            >
              <div class="row">
                <strong>{{
                  msg.role === 'user' ? 'Customer' : 'Energrid Assistant'
                }}</strong
                ><time>{{ formatDate(msg.created_at) }}</time>
              </div>
              <div class="msg-text">{{ msg.message_text }}</div>
            </article>
            <div v-if="!messages.length && !messageError" class="empty">
              No messages.
            </div>
          </div>
        </template>
        <div v-else class="empty">
          Select a conversation to read its messages.
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import {
  deleteTenantConversation,
  getTenantConversationMessages,
  getTenantConversations,
  type ConversationMessageRow,
  type ConversationRow,
} from '../api/conversations';
const loading = ref(true);
const error = ref('');
const messageError = ref('');
const notice = ref('');
const search = ref('');
const channel = ref('all');
const conversations = ref<ConversationRow[]>([]);
const selectedConversationId = ref('');
const selectedConversation = computed(() =>
  conversations.value.find((c) => c.id === selectedConversationId.value),
);
const filtered = computed(() =>
  conversations.value.filter((c) => {
    const channelMatches =
      channel.value === 'all' ||
      (channel.value === 'pilot'
        ? c.channel === 'pilot'
        : c.channel !== 'pilot');
    return (
      channelMatches &&
      [c.id, c.visitor_id, c.last_message].some((v) =>
        v?.toLowerCase().includes(search.value.trim().toLowerCase()),
      )
    );
  }),
);
const messages = ref<ConversationMessageRow[]>([]);
const messagesLoading = ref(false);
const confirming = ref(false);
const deleting = ref(false);
let messageRequest = 0;
function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}
function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}
function errorText(e: any, fallback: string) {
  return e?.response?.data?.message || e?.message || fallback;
}
async function loadConversations() {
  loading.value = true;
  error.value = '';
  notice.value = '';
  try {
    conversations.value = await getTenantConversations();
    const id = conversations.value.some(
      (c) => c.id === selectedConversationId.value,
    )
      ? selectedConversationId.value
      : conversations.value[0]?.id;
    await selectConversation(id || '');
  } catch (e) {
    error.value = errorText(e, 'Failed to load conversations');
  } finally {
    loading.value = false;
  }
}
async function selectConversation(id: string) {
  const request = ++messageRequest;
  selectedConversationId.value = id;
  confirming.value = false;
  messages.value = [];
  messageError.value = '';
  messagesLoading.value = !!id;
  if (!id) return;
  try {
    const result = await getTenantConversationMessages(id);
    if (request === messageRequest) messages.value = result;
  } catch (e) {
    if (request === messageRequest)
      messageError.value = errorText(e, 'Failed to load messages');
  } finally {
    if (request === messageRequest) messagesLoading.value = false;
  }
}
async function removeSelected() {
  const id = selectedConversationId.value;
  if (!id || deleting.value) return;
  deleting.value = true;
  messageError.value = '';
  notice.value = '';
  try {
    await deleteTenantConversation(id);
    conversations.value = conversations.value.filter((c) => c.id !== id);
    notice.value = 'Conversation and messages deleted.';
    await selectConversation(filtered.value[0]?.id || '');
  } catch (e) {
    messageError.value = errorText(
      e,
      'Could not delete the conversation. Nothing was removed.',
    );
  } finally {
    deleting.value = false;
  }
}
onMounted(loadConversations);
</script>

<style scoped>
.page {
  padding: 24px;
  color: #e5e7eb;
}
.page-header,
.row,
.detail-header,
.toolbar,
.actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.page-header {
  margin-bottom: 24px;
}
h1 {
  margin: 0 0 6px;
  font-size: 28px;
}
h2 {
  margin: 0 0 6px;
  font-size: 18px;
}
h3 {
  margin: 0;
}
p,
.muted,
time {
  color: #94a3b8;
}
p {
  line-height: 1.5;
}
button,
input,
select {
  font: inherit;
  color: #e2e8f0;
  background: #0f172a;
  border: 1px solid #475569;
  border-radius: 8px;
  padding: 10px 12px;
}
button {
  cursor: pointer;
}
button:hover {
  background: #1e293b;
}
button:disabled {
  opacity: 0.5;
  cursor: default;
}
button:focus-visible,
input:focus-visible,
select:focus-visible {
  outline: 2px solid #60a5fa;
  outline-offset: 2px;
}
.toolbar {
  justify-content: flex-start;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
label {
  display: grid;
  gap: 6px;
  font-size: 13px;
}
label:first-child {
  flex: 1;
  min-width: 220px;
}
.toolbar .muted {
  align-self: flex-end;
  padding-bottom: 12px;
}
.layout {
  display: grid;
  grid-template-columns: minmax(280px, 0.8fr) minmax(0, 1.2fr);
  gap: 16px;
  align-items: start;
}
.card {
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 14px;
  overflow: hidden;
}
.conversation-list {
  max-height: 72vh;
  overflow-y: auto;
}
.conversation {
  display: grid;
  width: 100%;
  gap: 10px;
  border: 0;
  border-bottom: 1px solid #334155;
  border-radius: 0;
  text-align: left;
  padding: 16px;
}
.conversation.selected {
  background: #172b48;
  box-shadow: inset 3px 0 #60a5fa;
}
.row {
  font-size: 12px;
  flex-wrap: wrap;
}
.row strong {
  font-size: 13px;
}
.preview {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
  font-size: 14px;
  overflow-wrap: anywhere;
}
.badge {
  color: #a7f3d0;
}
.detail {
  padding: 20px;
}
.detail-header {
  align-items: start;
  margin-bottom: 20px;
}
.conversation-id {
  font-size: 12px;
  overflow-wrap: anywhere;
}
.messages {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 65vh;
  overflow-y: auto;
  padding-right: 4px;
}
.msg {
  border: 1px solid #334155;
  background: #111827;
  padding: 14px;
  border-radius: 12px;
  margin-right: 24px;
}
.msg.user {
  background: #172b48;
  margin-left: 24px;
  margin-right: 0;
}
.msg-text {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  line-height: 1.6;
  margin-top: 10px;
  font-size: 14px;
}
.empty {
  color: #94a3b8;
  padding: 32px 20px;
}
.error {
  color: #fca5a5;
}
.danger {
  color: #fca5a5;
  border-color: #9f4545;
}
.confirmation {
  padding: 16px;
  border: 1px solid #9f4545;
  border-radius: 10px;
  margin-bottom: 16px;
}
.actions {
  justify-content: flex-end;
}
@media (max-width: 850px) {
  .layout {
    grid-template-columns: 1fr;
  }
  .conversation-list {
    max-height: 35vh;
  }
  .page {
    padding: 16px;
  }
  .page-header {
    align-items: start;
  }
}
</style>
