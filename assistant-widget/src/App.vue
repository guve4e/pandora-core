<template>
  <div class="widget-shell">
    <button v-if="!isOpen" class="launcher" @click="isOpen = true">
      <span class="launcher-dot"></span>
      <span>{{ config.launcherLabel }}</span>
    </button>

    <div v-else class="panel">
      <div class="header">
        <div class="header-text">
          <div class="title-row">
            <strong>{{ config.title }}</strong>
            <span class="ai-badge">AI</span>
          </div>
          <div class="subtitle">{{ config.subtitle }}</div>
        </div>

        <button class="close-btn" @click="isOpen = false" aria-label="Close">
          ×
        </button>
      </div>

      <div class="messages" ref="messagesEl">
        <div
          class="intro-card"
          v-if="
            messages.length === 1 &&
            messages[0]?.role === 'assistant' &&
            config.introItems?.length
          "
        >
          <div class="intro-title">
            {{ config.introTitle || 'Как можем да помогнем' }}
          </div>

          <ul>
            <li v-for="item in config.introItems" :key="item">
              {{ item }}
            </li>
          </ul>

          <div v-if="config.introNote" class="intro-note">
            {{ config.introNote }}
          </div>
        </div>

        <div
          v-for="(item, index) in messages"
          :key="index"
          :class="['message-row', item.role]"
        >
          <div v-if="item.role === 'assistant'" class="avatar">AI</div>

          <div :class="['message', item.role]">
            <div class="message-label">
              {{ item.role === 'assistant' ? config.title : 'Вие' }}
            </div>
            <div class="message-text">{{ item.text }}</div>
          </div>
        </div>

        <div v-if="loading" class="message-row assistant">
          <div class="avatar">AI</div>
          <div class="message assistant typing">
            <div class="message-label">{{ config.title }}</div>
            <div class="typing-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>

      <form class="input-row" @submit.prevent="sendMessage">
        <input
          v-model="draft"
          type="text"
          placeholder="Напишете запитване..."
          :disabled="loading"
        />
        <button type="submit" :disabled="loading || !draft.trim()">
          Изпрати
        </button>
      </form>

      <div class="footer-note">
        AI асистент за първоначални запитвания. При нужда екипът ще се свърже с
        вас.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch, onMounted } from 'vue';
import { getWidgetConfig } from './widget.config';

type ChatMessage = {
  role: 'user' | 'assistant';
  text: string;
};

const config = getWidgetConfig();

const isOpen = ref(false);
const loading = ref(false);
const draft = ref('');
const conversationId = ref<string | null>(null);
const messagesEl = ref<HTMLElement | null>(null);

const messages = ref<ChatMessage[]>([
  {
    role: 'assistant',
    text: config.welcomeMessage,
  },
]);

onMounted(() => {
  isOpen.value = window.innerWidth >= 768;
});

function scrollToBottom() {
  nextTick(() => {
    if (messagesEl.value) {
      messagesEl.value.scrollTop = messagesEl.value.scrollHeight;
    }
  });
}

watch(messages, scrollToBottom, { deep: true });
watch(loading, scrollToBottom);

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
    const text = await res.text();
    throw new Error(`Create conversation failed: ${res.status} ${text}`);
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

    const res = await fetch(
      `${config.apiBaseUrl}/conversations/${id}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: text }),
      },
    );

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Send message failed: ${res.status} ${body}`);
    }

    const data = await res.json();

    messages.value.push({
      role: 'assistant',
      text:
        data.reply ??
        'В момента не успяхме да получим отговор. Моля, опитайте отново.',
    });
  } catch (error: any) {
    messages.value.push({
      role: 'assistant',
      text: 'Възникна проблем при връзката с асистента. Моля, опитайте отново след малко.',
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
  right: 18px;
  bottom: 18px;
  z-index: 9999;
  font-family: Inter, Arial, sans-serif;
}

.launcher {
  border: 0;
  border-radius: 999px;
  padding: 14px 18px;
  cursor: pointer;
  background: linear-gradient(135deg, #1d4ed8, #2563eb);
  color: white;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.28);
}

.launcher-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #86efac;
  box-shadow: 0 0 0 4px rgba(134, 239, 172, 0.18);
}

.panel {
  width: min(370px, calc(100vw - 24px));
  height: min(620px, calc(100vh - 32px));
  border: 1px solid #d4d4d8;
  border-radius: 18px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 18px 50px rgba(15, 23, 42, 0.18);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px 16px 14px;
  border-bottom: 1px solid #e5e7eb;
  background: #ffffff;
}

.header-text {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.title-row strong {
  font-size: 15px;
  color: #111827;
}

.ai-badge {
  font-size: 11px;
  font-weight: 700;
  color: #1d4ed8;
  background: #dbeafe;
  padding: 2px 7px;
  border-radius: 999px;
  flex-shrink: 0;
}

.subtitle {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.35;
}

.close-btn {
  border: 0;
  background: transparent;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  color: #374151;
  padding: 0;
  flex-shrink: 0;
}

.messages {
  flex: 1;
  overflow: auto;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #f8fafc;
}

.intro-card {
  border: 1px solid #dbeafe;
  background: #eff6ff;
  border-radius: 14px;
  padding: 14px;
  color: #1f2937;
}

.intro-title {
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 8px;
}

.intro-card ul {
  margin: 0;
  padding-left: 18px;
  font-size: 13px;
  line-height: 1.45;
}

.intro-note {
  margin-top: 10px;
  font-size: 12px;
  color: #4b5563;
}

.message-row {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.message-row.user {
  justify-content: flex-end;
}

.avatar {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.message {
  max-width: 82%;
  padding: 10px 12px;
  border-radius: 14px;
  white-space: pre-wrap;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.message.user {
  align-self: flex-end;
  background: #dbeafe;
  color: #111827;
  border-bottom-right-radius: 6px;
}

.message.assistant {
  align-self: flex-start;
  background: #ffffff;
  color: #111827;
  border: 1px solid #e5e7eb;
  border-bottom-left-radius: 6px;
}

.message-label {
  font-size: 11px;
  font-weight: 700;
  color: #6b7280;
  margin-bottom: 6px;
}

.message-text {
  font-size: 15px;
  line-height: 1.45;
}

.typing-dots {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 18px;
}

.typing-dots span {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: #94a3b8;
  animation: pulse 1.2s infinite ease-in-out;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.15s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.3s;
}

.input-row {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid #e5e7eb;
  background: #ffffff;
}

.input-row input {
  flex: 1;
  min-width: 0;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #d1d5db;
  font-size: 14px;
  outline: none;
}

.input-row input:focus {
  border-color: #60a5fa;
}

.input-row button {
  padding: 12px 16px;
  border-radius: 12px;
  border: 0;
  background: #111827;
  color: white;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
}

.input-row button:disabled {
  opacity: 0.55;
  cursor: default;
}

.footer-note {
  padding: 0 12px 12px;
  font-size: 11px;
  color: #6b7280;
  background: #ffffff;
}

@keyframes pulse {
  0%,
  80%,
  100% {
    opacity: 0.3;
    transform: scale(0.9);
  }
  40% {
    opacity: 1;
    transform: scale(1);
  }
}

@media (max-width: 767px) {
  .widget-shell {
    right: 12px;
    bottom: 12px;
    left: 12px;
  }

  .launcher {
    width: 100%;
    justify-content: center;
    padding: 14px 16px;
  }

  .panel {
    width: 100%;
    height: min(72vh, 620px);
    border-radius: 16px;
  }

  .messages {
    padding: 12px;
  }

  .message {
    max-width: 88%;
  }

  .message-text {
    font-size: 14px;
  }

  .input-row {
    padding: 10px;
  }

  .input-row button {
    padding: 12px 14px;
  }
}
</style>
