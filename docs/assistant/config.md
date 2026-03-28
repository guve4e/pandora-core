# Assistant Configuration

## Environment Variables

### OpenAI

- OPENAI_API_KEY
- OPENAI_MODEL (default: gpt-4.1-mini)
- OPENAI_TIMEOUT_MS (default: 20000)

### Core API

- CORE_API_BASE_URL (default: http://localhost:3001/api)
- INTERNAL_API_TOKEN

### Server

- PORT (default: 3010)
- CORS_ORIGINS (comma-separated)

---

## Notes

- env is read directly via process.env
- no central validation
- defaults are duplicated

---

## Future Improvement

Introduce typed config layer instead of scattered process.env usage.
