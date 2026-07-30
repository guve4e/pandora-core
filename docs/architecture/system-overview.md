# Pandora / Energrid System Overview

## Mental Model

- `landing-backbone` is the public storefront.

- `pandora-core` is the SaaS platform and admin/control plane.

- `energrid-be` is the Energrid-specific brain, if/when separated.

Right now, some Energrid-specific logic may still live inside `pandora-core`, especially assistant, estimator, voice, or lead flows. That is acceptable during MVP, but it must stay clearly marked.

## Current Systems

### landing-backbone

Public Nuxt SSR frontend for Energrid-style landing pages.

Owns:

- public website UI

- SEO pages

- contact/lead forms

- assistant widget embedding

- analytics SDK loading

- static brand/content presentation

Must not own:

- pricing logic

- tenant logic

- user/auth logic

- estimator business rules

- IoT/voice logic

### pandora-core

Main platform backend and admin frontend.

Owns:

- tenants

- users/auth

- admin dashboard

- analytics collection

- leads

- assistant configuration

- public tracking API

- internal tenant validation

- platform-level orchestration

Also currently may contain MVP business logic for Energrid until extracted.

### energrid-be

Future or separate Energrid domain backend.

Owns:

- deterministic estimator engine

- voice assistant sessions

- electrical workflow logic

- IoT/MQTT integrations

- Home Assistant/device integrations

- Energrid-specific automation logic

## Strategic Rule

Frontend displays and collects.

Pandora Core manages platform state.

Energrid BE owns domain intelligence.

Do not let the landing page become the brain.