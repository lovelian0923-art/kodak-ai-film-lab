# KODAK AI FILM LAB — Codex Handoff

This folder is a recovered standalone frontend prototype based on the deployed Genspark kiosk.

## Run locally

For reliable browser behavior, serve the folder with a local web server instead of opening `index.html` directly.

### Python
```bash
cd kodak-ai-film-lab
python3 -m http.server 8000
```

Open:
`http://localhost:8000`

## Current state

- HTML/CSS/JS kiosk flow restored
- Sample images bundled locally
- User image upload works locally in the browser
- `/api/ai-develop` remains an optional backend hook
- If the AI endpoint is unavailable, the existing Kodak template fallback is used

## Recommended first Codex task

Analyze this entire project before changing it.

Goals:
1. Preserve the current KODAK AI FILM LAB visual identity and 6-step kiosk flow.
2. Make the frontend robust and presentation-ready.
3. Refactor repeated inline styles into maintainable CSS where useful, without changing the visual result.
4. Replace the generic product preview container with distinct T-shirt, hoodie, tumbler, poster, and combo mockups.
5. Keep the current fallback mode working even when no AI backend is connected.
6. Propose a clean architecture for reconnecting a real image-generation API later.
7. Do not redesign the project from scratch. Improve the existing prototype incrementally.
