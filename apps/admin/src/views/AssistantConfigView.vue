<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Assistant Config</h1>
        <p>Manage the business profile used by the assistant.</p>
      </div>

      <button class="save-btn" :disabled="loading || saving" @click="save">
        {{ saving ? 'Saving...' : 'Save' }}
      </button>
    </div>

    <div v-if="loading" class="card">
      Loading assistant config...
    </div>

    <div v-else class="grid">
      <div class="card">
        <div class="field">
          <label>Business name</label>
          <input v-model="form.businessName" type="text" />
        </div>

        <div class="field">
          <label>Business description</label>
          <textarea v-model="form.businessDescription" rows="5"></textarea>
        </div>

        <div class="field">
          <label>Contact prompt</label>
          <textarea v-model="form.contactPrompt" rows="4"></textarea>
        </div>

        <div class="field">
          <label>Tone</label>
          <input v-model="form.tone" type="text" placeholder="helpful and practical" />
        </div>

        <div class="field">
          <label>Language</label>
          <input v-model="form.language" type="text" placeholder="bg" />
        </div>

        <label class="checkbox-row">
          <input v-model="form.isActive" type="checkbox" />
          Assistant active
        </label>
      </div>

      <div class="card">
        <div class="field">
          <label>Services (one per line)</label>
          <textarea v-model="servicesText" rows="10"></textarea>
        </div>

        <div class="field">
          <label>Facts / rules (one per line)</label>
          <textarea v-model="factsText" rows="10"></textarea>
        </div>
      </div>
    </div>

    <div class="card json-card" v-if="!loading">
      <div class="json-header">
        <div>
          <h2>Raw JSON</h2>
          <p>Use this to paste/import config quickly. Tenant slug is not included here.</p>
        </div>

        <div class="json-actions">
          <button class="secondary-btn" @click="loadJsonFromForm">
            Load from form
          </button>
          <button class="secondary-btn" @click="applyJsonToForm">
            Apply JSON to form
          </button>
        </div>
      </div>

      <textarea
        v-model="jsonText"
        class="json-textarea"
        rows="16"
        spellcheck="false"
      ></textarea>

      <div v-if="jsonError" class="json-error">
        {{ jsonError }}
      </div>
    </div>

    <div v-if="message" class="status">
      {{ message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import {
  getAssistantConfig,
  updateAssistantConfig,
  type AssistantConfigDto,
} from '../api/assistant-config';

type AssistantConfigJson = {
  businessName: string;
  businessDescription: string;
  services: string[];
  facts: string[];
  contactPrompt: string | null;
  tone: string | null;
  language: string;
  isActive: boolean;
};

const loading = ref(true);
const saving = ref(false);
const message = ref('');
const jsonText = ref('');
const jsonError = ref('');

const form = reactive({
  businessName: '',
  businessDescription: '',
  contactPrompt: '',
  tone: '',
  language: 'bg',
  isActive: true,
});

const services = ref<string[]>([]);
const facts = ref<string[]>([]);

const servicesText = computed({
  get: () => services.value.join('\n'),
  set: (value: string) => {
    services.value = value
      .split('\n')
      .map((x) => x.trim())
      .filter(Boolean);
  },
});

const factsText = computed({
  get: () => facts.value.join('\n'),
  set: (value: string) => {
    facts.value = value
      .split('\n')
      .map((x) => x.trim())
      .filter(Boolean);
  },
});

function getFormPayload(): AssistantConfigJson {
  return {
    businessName: form.businessName,
    businessDescription: form.businessDescription,
    services: services.value,
    facts: facts.value,
    contactPrompt: form.contactPrompt || null,
    tone: form.tone || null,
    language: form.language || 'bg',
    isActive: form.isActive,
  };
}

function applyPayloadToForm(data: Partial<AssistantConfigJson>) {
  form.businessName = data.businessName ?? '';
  form.businessDescription = data.businessDescription ?? '';
  form.contactPrompt = data.contactPrompt ?? '';
  form.tone = data.tone ?? '';
  form.language = data.language ?? 'bg';
  form.isActive = data.isActive ?? true;
  services.value = Array.isArray(data.services) ? data.services : [];
  facts.value = Array.isArray(data.facts) ? data.facts : [];
}

function loadJsonFromForm() {
  jsonError.value = '';
  jsonText.value = JSON.stringify(getFormPayload(), null, 2);
}

function applyJsonToForm() {
  jsonError.value = '';
  message.value = '';

  try {
    const parsed = JSON.parse(jsonText.value);

    if (!parsed || typeof parsed !== 'object') {
      throw new Error('JSON must be an object.');
    }

    if (parsed.services && !Array.isArray(parsed.services)) {
      throw new Error('"services" must be an array.');
    }

    if (parsed.facts && !Array.isArray(parsed.facts)) {
      throw new Error('"facts" must be an array.');
    }

    applyPayloadToForm({
      businessName:
        typeof parsed.businessName === 'string' ? parsed.businessName : '',
      businessDescription:
        typeof parsed.businessDescription === 'string'
          ? parsed.businessDescription
          : '',
      services: Array.isArray(parsed.services)
        ? parsed.services.map((x: unknown) => String(x).trim()).filter(Boolean)
        : [],
      facts: Array.isArray(parsed.facts)
        ? parsed.facts.map((x: unknown) => String(x).trim()).filter(Boolean)
        : [],
      contactPrompt:
        parsed.contactPrompt == null ? '' : String(parsed.contactPrompt),
      tone: parsed.tone == null ? '' : String(parsed.tone),
      language:
        parsed.language == null ? 'bg' : String(parsed.language),
      isActive:
        typeof parsed.isActive === 'boolean' ? parsed.isActive : true,
    });

    message.value = 'JSON applied to form.';
  } catch (error: any) {
    jsonError.value = `Invalid JSON: ${error?.message ?? 'Unknown error'}`;
  }
}

function applyConfig(data: AssistantConfigDto) {
  applyPayloadToForm({
    businessName: data.businessName,
    businessDescription: data.businessDescription,
    services: data.services,
    facts: data.facts,
    contactPrompt: data.contactPrompt,
    tone: data.tone,
    language: data.language,
    isActive: data.isActive,
  });

  loadJsonFromForm();
}

async function load() {
  loading.value = true;
  message.value = '';
  jsonError.value = '';

  try {
    const data = await getAssistantConfig();
    applyConfig(data);
  } catch (error: any) {
    message.value = `Load failed: ${error?.message ?? 'Unknown error'}`;
  } finally {
    loading.value = false;
  }
}

async function save() {
  saving.value = true;
  message.value = '';
  jsonError.value = '';

  try {
    const data = await updateAssistantConfig(getFormPayload());
    applyConfig(data);
    message.value = 'Assistant config saved.';
  } catch (error: any) {
    message.value = `Save failed: ${error?.message ?? 'Unknown error'}`;
  } finally {
    saving.value = false;
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

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.card {
  background: rgba(15, 23, 42, 0.75);
  border: 1px solid rgba(51, 65, 85, 0.9);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

label {
  font-size: 14px;
  font-weight: 600;
  color: #cbd5e1;
}

input,
textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #334155;
  border-radius: 10px;
  background: #020617;
  color: #e2e8f0;
  padding: 12px 14px;
  font: inherit;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: #22c55e;
}

textarea {
  resize: vertical;
  min-height: 100px;
}

.save-btn,
.secondary-btn {
  border: 1px solid #334155;
  border-radius: 10px;
  background: #0f172a;
  color: #e2e8f0;
  padding: 10px 14px;
  font: inherit;
  cursor: pointer;
}

.save-btn:hover,
.secondary-btn:hover {
  border-color: #22c55e;
}

.save-btn:disabled,
.secondary-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}

.checkbox-row input {
  width: auto;
}

.json-card {
  margin-top: 8px;
}

.json-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.json-header h2 {
  margin: 0 0 6px 0;
  font-size: 20px;
}

.json-header p {
  margin: 0;
  color: #94a3b8;
}

.json-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.json-textarea {
  min-height: 280px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  font-size: 13px;
}

.json-error {
  margin-top: 12px;
  color: #f87171;
}

.status {
  margin-top: 16px;
  color: #cbd5e1;
}

@media (max-width: 900px) {
  .grid {
    grid-template-columns: 1fr;
  }

  .json-header {
    flex-direction: column;
  }
}
</style>
