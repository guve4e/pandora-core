<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Leads</h1>
        <p>Captured leads for this tenant.</p>
      </div>
    </div>

    <div v-if="loading" class="card">Loading leads...</div>

    <div v-else-if="error" class="card error">{{ error }}</div>

    <div v-else class="card">
      <table class="table">
        <thead>
          <tr>
            <th>Created</th>
            <th>Phone</th>
            <th>City</th>
            <th>Service</th>
            <th>Source</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="lead in leads" :key="lead.id">
            <td>{{ formatDate(lead.created_at) }}</td>
            <td>{{ lead.phone || '—' }}</td>
            <td>{{ lead.city || '—' }}</td>
            <td>{{ lead.service_type || '—' }}</td>
            <td>{{ lead.source || '—' }}</td>
            <td>{{ lead.status || '—' }}</td>
            <td>
              <router-link class="link" :to="`/tenant-leads/${lead.id}`">
                Open
              </router-link>
            </td>
          </tr>

          <tr v-if="leads.length === 0">
            <td colspan="7" class="empty">No leads yet.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { getTenantLeads, type LeadRow } from '../api/leads';

const loading = ref(true);
const error = ref('');
const leads = ref<LeadRow[]>([]);

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
    leads.value = await getTenantLeads();
  } catch (e: any) {
    error.value = e?.message || 'Failed to load leads';
  } finally {
    loading.value = false;
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

.card {
  background: rgba(15, 23, 42, 0.75);
  border: 1px solid rgba(51, 65, 85, 0.9);
  border-radius: 16px;
  padding: 20px;
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
}

th {
  color: #94a3b8;
  font-size: 13px;
}

td {
  color: #e2e8f0;
  font-size: 14px;
}

.link {
  color: #93c5fd;
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}

.empty {
  color: #94a3b8;
  text-align: center;
}
</style>
