# Assistant Message Flow

## Create Conversation

POST /assistant/conversations

Flow:

1. validate tenant via core API
2. create conversation in DB

---

## Send Message

POST /assistant/conversations/:id/messages

Flow:

1. store user message
2. load full history
3. load tenant config
4. generate reply via OpenAI
5. store assistant message
6. run lead extraction
7. send lead to core API (if phone exists)

---

## Get Conversation

GET /assistant/conversations/:id

Returns:

- conversation
- messages

---

## Observations

- full history is loaded multiple times
- lead capture runs synchronously
- token/model tracking exists but is unused
- analysis is not wired into flow
