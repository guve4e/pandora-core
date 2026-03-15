<template>
  <div class="widget-shell">
    <button v-if="!isOpen" class="launcher" @click="isOpen = true">
      Chat
    </button>

    <div v-else class="panel">
      <div class="header">
        <strong>{{ config.title }}</strong>
        <button class="close-btn" @click="isOpen = false">×</button>
      </div>

      <div class="messages">
        <div
          v-for="(item, index) in messages"
          :key="index"
          :class="['message', item.role]"
        >
          {{ item.text }}
        </div>
      </div>

      <form class="input-row" @submit.prevent="sendMessage">
        <input
          v-model="draft"
          type="text"
          placeholder="Type a message..."
          :disabled="loading"
        />
        <button type="submit" :disabled="loading || !draft.trim()">
          {{ loading ? '...' : 'Send' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { getWidgetConfig } from './widget.config';

type ChatMessage = {
  role: 'user' | 'assistant';
  text: string;
};

const config = getWidgetConfig();

const isOpen = ref(true);
const loading = ref(false);
const draft = ref('');
const conversationId = ref<string | null>(null);
const messages = ref<ChatMessage[]>([
  {
    role: 'assistant',
    text: config.welcomeMessage,
  },
]);

async function ensureConversation(): Promise<string> {
  if (conversationId.value) return conversationId.value;

  const res = await fetch(`${config.apiBaseUrl}/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tenantSlug: config.tenantSlug,
      visitorId: `visitor-${Date.now()}`,
      channel: 'web',
    }),
  });

  if (!res.ok) {
    throw new Error(`Create conversation failed: ${res.status}`);
  }

  const data = await res.json();
  conversationId.value = data.id;
  return data.id;
}

async function sendMessage() {
  const text = draft.value.trim();
  if (!text || loading.value) return;

  messages.value.push({
    role: 'user',
    text,
  });

  draft.value = '';
  loading.value = true;

  try {
    const id = await ensureConversation();

    const res = await fetch(`${config.apiBaseUrl}/conversations/${id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: text }),
    });

    if (!res.ok) {
      throw new Error(`Send message failed: ${res.status}`);
    }

    const data = await res.json();

    messages.value.push({
      role: 'assistant',
      text: data.reply ?? 'No reply received.',
    });
  } catch (error: any) {
    messages.value.push({
      role: 'assistant',
      text: `Error: ${error?.message ?? 'Unknown error'}`,
    });
    console.error(error);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.widget-shell {
  position: fixed;
  right: 16px;
  bottom: 16px;
  font-family: Arial, sans-serif;
}

.launcher {
  border: 0;
  border-radius: 999px;
  padding: 12px 18px;
  cursor: pointer;
}

.panel {
  width: 340px;
  height: 500px;
  border: 1px solid #ccc;
  border-radius: 12px;
  background: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #ddd;
}

.close-btn {
  border: 0;
  background: transparent;
  font-size: 18px;
  cursor: pointer;
}

.messages {
  flex: 1;
  overflow: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.message {
  max-width: 80%;
  padding: 10px 12px;
  border-radius: 10px;
  white-space: pre-wrap;
}

.message.user {
  align-self: flex-end;
  background: #dbeafe;
}

.message.assistant {
  align-self: flex-start;
  background: #f3f4f6;
}

.input-row {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid #ddd;
}

.input-row input {
  flex: 1;
  padding: 10px;
}

.input-row button {
  padding: 10px 14px;
}
</style>
