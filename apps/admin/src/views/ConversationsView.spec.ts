import { beforeEach, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import ConversationsView from './ConversationsView.vue';
import { deleteTenantConversation, getTenantConversations, getTenantConversationMessages } from '../api/conversations';
vi.mock('../api/conversations', () => ({ deleteTenantConversation: vi.fn(), getTenantConversations: vi.fn(), getTenantConversationMessages: vi.fn() }));
const row = { id: 'test-chat', visitor_id: null, status: 'open', lead_id: null, has_lead: false, channel: 'pilot', started_at: '2026-09-30T10:00:00Z', last_message_at: '2026-09-30T10:00:00Z', last_message: 'Test message' };
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getTenantConversations).mockResolvedValue([{ ...row }]);
  vi.mocked(getTenantConversationMessages).mockResolvedValue([{ role: 'user', message_text: 'Test message', created_at: row.started_at }]);
  vi.mocked(deleteTenantConversation).mockResolvedValue();
});
it('requires confirmation and removes the deleted conversation from view', async () => {
  const wrapper = mount(ConversationsView); await flushPromises();
  await wrapper.get('button.danger').trigger('click');
  expect(deleteTenantConversation).not.toHaveBeenCalled();
  await wrapper.get('.confirmation .danger').trigger('click'); await flushPromises();
  expect(deleteTenantConversation).toHaveBeenCalledWith('test-chat');
  expect(wrapper.findAll('.conversation')).toHaveLength(0);
  expect(wrapper.text()).toContain('Conversation and messages deleted.');
  wrapper.unmount();
});
it('keeps a conversation visible when deletion fails', async () => {
  vi.mocked(deleteTenantConversation).mockRejectedValue(new Error('Connection failed'));
  const wrapper = mount(ConversationsView); await flushPromises();
  await wrapper.get('button.danger').trigger('click');
  await wrapper.get('.confirmation .danger').trigger('click'); await flushPromises();
  expect(wrapper.findAll('.conversation')).toHaveLength(1);
  expect(wrapper.text()).toContain('Connection failed');
  wrapper.unmount();
});
it('disables deletion for a linked lead', async () => {
  vi.mocked(getTenantConversations).mockResolvedValue([{ ...row, has_lead: true }]);
  const wrapper = mount(ConversationsView); await flushPromises();
  expect(wrapper.get('button.danger').attributes('disabled')).toBeDefined();
  expect(deleteTenantConversation).not.toHaveBeenCalled();
  wrapper.unmount();
});
