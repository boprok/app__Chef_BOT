# MVP scope

Goal: Given a fridge photo, identify ingredients and return 3-5 simple recipe ideas using mostly those ingredients.

## User stories
- As a user, I can upload a photo from my phone/PC.
- As a user, I can optionally add a short text prompt ("vegetarian", "15 minutes", "no dairy").
- As a user, I get a short list of recipes with steps and estimated time.

## Constraints
- Lightweight: no heavy servers or databases for MVP.
- Fast: one round-trip to a vision LLM + small prompt.
- Private: no data stored by default; process in-memory.

## Data flow
browser -> upload image -> server -> vision LLM -> ingredients -> recipe LLM (same call or chained) -> server -> browser

## API
POST /api/analyze
- body: multipart/form-data (file: image), text: prompt (optional)
- response: { ingredients: string[], recipes: { title, ingredients[], steps[], timeMins }[] }

## Prompt sketch
System: You are a helpful chef. Given an image of a fridge and optional user preferences, list ingredients you see and propose 3 concise recipes using mostly those ingredients. Prefer short prep times and minimal extra pantry items.
User: [image]
User: Preferences: <prompt>

Return JSON with fields ingredients and recipes.
