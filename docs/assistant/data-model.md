# Assistant Data Model

## assistant.conversations

Fields:

- id
- tenant_slug
- visitor_id
- channel
- status
- lead_id
- started_at
- last_message_at
- completed_at
- meta

Also implied:

- summary
- intent
- city
- service_type
- lead_score

Note: analysis fields are not actively used yet.

---

## assistant.messages

Fields:

- id
- conversation_id
- role
- message_text
- created_at
- tokens_input
- tokens_output
- model
- meta

Note: token/model fields are not populated in current flow.

---

## assistant.assistant_configs

Fields:

- tenant_slug
- business_name
- business_description
- services_json
- facts_json
- contact_prompt
- tone
- language

Note: acts as assistant config, not knowledge base.
