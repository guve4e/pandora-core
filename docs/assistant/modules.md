# Assistant Service Modules

## AppModule

Composes the service.

### Imports

- ConfigModule
- LoggingModule
- PgModule
- ChatModule
- ConversationsModule

---

## Conversations Module

Main orchestration module.

### Responsibilities

- create conversations
- send messages
- read conversations
- coordinate AI + persistence + lead capture

---

## Chat Module

Thin façade.

### Responsibilities

- load tenant assistant profile
- call AI service

### Note

Currently very thin. May be merged or expanded later.

---

## AI Module

Handles OpenAI interaction and prompt building.

### Responsibilities

- build prompts
- generate replies
- analyze conversations

---

## Assistant Config Module

Loads tenant assistant configuration.

### Responsibilities

- load assistant config from DB
- provide fallback profile

### Note

This is not a retrieval or RAG module. It provides tenant-specific assistant configuration used to shape responses.

---

## Lead Capture Module

Extracts lead data and sends to core API.

### Responsibilities

- extract structured lead data via LLM
- create lead in core API if phone exists

---

## Tenant Validation Module

Validates tenant via core API.

### Responsibilities

- ensure tenant exists before creating conversation
