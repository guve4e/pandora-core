# Assistant Service Overview

## Purpose

The assistant service provides tenant-aware business chat for embedded website assistants.

It is responsible for:

- creating and storing assistant conversations
- storing user and assistant messages
- generating assistant replies using tenant-specific business configuration
- attempting to extract leads from conversations
- forwarding captured leads to the core API

It is **not** the system of record for tenants or leads.

## System Boundaries

### Owned by assistant-service

- conversation lifecycle
- message persistence
- tenant-configured prompt construction
- reply generation
- lead extraction attempt
- conversation-level orchestration

### Owned by core API

- tenant validation
- tenant master data
- lead creation and lead ownership

## High-Level Flow

1. A client creates a conversation with a `tenantSlug`
2. The assistant service validates the tenant through the core API
3. The assistant service stores the conversation locally
4. A client sends a message to the conversation
5. The assistant service stores the user message
6. The assistant service loads conversation history
7. The assistant service loads the tenant assistant configuration
8. The assistant service generates a reply using OpenAI
9. The assistant service stores the assistant reply
10. The assistant service attempts to extract lead data from the conversation
11. If a phone number is found, the assistant service sends the lead to the core API

## Current Shape

The current service is best described as:

> a conversation orchestration service with tenant-configured LLM replies and lead handoff

It is not yet a full retrieval-based knowledge assistant.

## Current Limitations

- tenant business context is loaded from assistant config, not from a retrieval system
- lead capture runs synchronously after each message
- request validation is minimal
- conversation analysis fields exist in the repository layer but are not currently updated in the active flow
- environment configuration is read directly from `process.env` in several services
