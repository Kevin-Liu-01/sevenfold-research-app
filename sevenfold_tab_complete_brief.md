# Sevenfold Tab Complete — Feature Brief

## Title & Summary
**Feature:** Tab-based autocomplete for research paper composition.  
**Goal:** Provide seamless, context-aware sentence continuation suggestions within the LaTeX editor.  
When the user pauses or finishes a thought, a light gray "ghost text" suggestion appears. Pressing **Tab** accepts it; pressing **Esc** or typing dismisses it.  
This should feel fast, natural, and unobtrusive — similar to Google Docs or Cursor’s inline autocomplete.

---

## MVP Scope (In / Out)

**In Scope**
- Streamed autocomplete suggestions for ongoing compositions.
- Triggering suggestions based on idle debounce (~250 ms) and punctuation (space/enter/period).
- Ghost text rendering overlay inside the editor.
- Keyboard interactions (Tab → accept, Esc → dismiss).
- `/complete` backend endpoint for streaming completions.
- Context extraction and prompt construction (LaTeX-aware cleanup).

**Out of Scope**
- Full speculative pre-emptive requests (continuous async).
- Cross-document retrieval or citation-based RAG.
- Multi-model routing or cost optimization layer.
- Advanced personalization or author-style learning.

---

## Functional Requirements
1. **Trigger Conditions**
   - Fire when:
     - User pauses typing for ~250 ms.
     - User types a space after punctuation (`. ? ! ; : ) ] } $`).
   - Abort existing requests when new input arrives.

2. **Completion Stream**
   - Frontend sends `{context, cursor, doc_id, request_id}` snapshot to backend.
   - Backend streams token deltas as they’re generated.
   - Abort signal stops generation immediately.

3. **Editor Integration**
   - Ghost text overlay appears inline after cursor.
   - Tab inserts suggestion into main text buffer.
   - Esc or typing clears suggestion and cancels stream.

4. **Request Limits**
   - One active request per session.
   - Drop new triggers if a previous stream hasn’t started producing tokens.

---

## UX / Interaction Spec
- **Visual**
  - Ghost text color: light gray (#9AA0A6) or theme-adjusted.
  - Suggestion should not shift layout or cursor.
- **Keyboard**
  - **Tab:** Accept suggestion and insert text.
  - **Esc:** Dismiss suggestion, retain original text.
  - **Typing:** Immediately cancel and hide suggestion.
- **States**
  - _Idle:_ No suggestions visible.
  - _Streaming:_ Ghost text animates in as tokens arrive.
  - _Committed:_ Suggestion merged into document.

---

## Backend API & Streaming
**Endpoint:** `POST /complete` (WebSocket or SSE)

**Request**
```json
{
  "doc_id": "uuid",
  "cursor": 4123,
  "context": "Recent advances in transformer architectures ...",
  "language": "latex",
  "request_id": "uuid"
}
```

**Response (stream)**
```json
{ "request_id": "uuid", "delta": " This approach", "finish": false }
{ "request_id": "uuid", "delta": " significantly improves results.", "finish": false }
{ "request_id": "uuid", "finish": true }
```

**Abort**
```json
{ "type": "abort", "request_id": "uuid" }
```

Server must terminate model stream and release resources immediately.

---

## Prompt & Context Rules (LaTeX-aware)
**System message:**
> You are an academic writing assistant. Continue the paragraph naturally. Match tone and style. Avoid meta commentary.

**User message:**
```
<last 3–4k chars of document, cleaned of LaTeX commands>
Continue seamlessly:
```

**Cleaning Rules**
- Remove or compress `\cite{}`, `\ref{}`, `\label{}`, `\bibliography{}` blocks.
- Preserve inline math (`$...$`) and display math (`\[ ... \]`).
- Limit to most recent 2–3 paragraphs before cursor.

---

## Testing & Demo Plan
- **Unit Tests**
  - Verify trigger logic fires on space/enter/pause.
  - Verify aborts cancel streaming completions.
  - Ensure Tab and Esc behaviors function correctly.
- **Integration Test**
  - Connect editor → backend → LLM → stream → ghost text.
  - Simulate user typing flow and verify latency under 400 ms perceived delay.
- **Demo Script**
  - Type a paragraph in the editor.
  - Pause — ghost text appears.
  - Press Tab — completion merges smoothly.
  - Say aloud: “Google Docs–style autocomplete, but tuned for academic writing.”

---

## Acceptance Criteria
- [ ] Ghost text renders and updates live from streamed completions.
- [ ] Tab accepts suggestion; Esc or typing dismisses it.
- [ ] Trigger logic fires on pause or punctuation.
- [ ] Backend streaming works with `/complete` and `abort`.
- [ ] Prompt correctly cleans LaTeX and continues logically.
- [ ] Demo flow produces a visible, contextually relevant completion within ~250 ms perceived delay.
