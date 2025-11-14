# Sevenfold Tab Complete — Implementation Plan

## Backend (FastAPI + Streaming)

1. **SSE Endpoint**
   - Introduce a `/complete` router that streams Anthropic completions over SSE with proper framing (`event:` / `data:` / blank line) and headers `Content-Type: text/event-stream`, `Cache-Control: no-store`, `X-Accel-Buffering: no`.
   - Clamp completions to ~80 tokens, temperature ≈0.25, and extend the system prompt with “no meta commentary, don’t repeat recent context, don’t start with citations.” Convert model deltas into word- or whitespace-flushed chunks (flush on whitespace or every ~30 tokens) before emitting SSE events.
   - Normalize events:
     - `event: chunk` → `{request_id, delta, finish:false}`
     - `event: done`  → `{request_id, finish:true, usage:{input_tokens, output_tokens}}`
     - `event: error` → `{request_id, error, detail}`

2. **Request Management & Rate Limiting**
   - Maintain an asyncio-safe map keyed by `(user_id, request_id)` with references to the Anthropic stream, first-token timestamp, and abort flags.
   - When a new request arrives for a user, cancel any prior unfinished stream (close the Anthropic stream, mark aborted) instead of rejecting it.
   - Support aborts via both FastAPI’s `request.is_disconnected()` check and an explicit `POST /complete/abort` endpoint that looks up the `(user_id, request_id)` entry and stops the stream.
   - Enforce a per-user token bucket limiter (2 req/sec, burst 3). If exceeded, emit `event: error` with `{request_id, error:"rate_limited"}` and close the connection.
   - Log `(user_id, doc_id, request_id, ctx_len, cursor_offset, paragraph_count, math_blocks_preserved, t_first_token, tokens_out, aborted)` for observability.

3. **LaTeX Context Cleaner**
   - Build a helper that trims to the last 80–4000 chars and:
     - Strips/condenses `\cite{}`, `\parencite{}`, `\footnote{}`, `\url{}`, `\href{}`, `\label{}`, `\bibliography{}`.
     - Respects environments like `equation`, `align`, `gather`, `multline`, `theorem`, `lemma`, `figure`, `table`.
     - Preserves inline/display math (`$…$`, `\[ … \]`) and never slices inside math blocks.
   - Return both the cleaned excerpt and metadata (cursor offset, paragraph count, math-block count) to feed the prompt and logs.
   - Construct the Anthropic prompt as XML, e.g.:
     ```xml
     <context>
       <![CDATA[{cleaned_excerpt}]]>
     </context>
     <goal>Continue the academic paragraph seamlessly.</goal>
     <instructions>
       <item>Match tone and register.</item>
       <item>No meta commentary; avoid repeating the last ~10 tokens; do not start with citations.</item>
     </instructions>
     <examples>
       <positive>“Therefore, the empirical signal …”</positive>
       <negative>“In this section, I will …”</negative>
     </examples>
     ```
     Include the system guidance inside the same XML envelope so the model clearly sees `context`, `goal`, `instructions`, and `examples` sections.

4. **Ops Notes**
   - Ensure the SSE route bypasses proxy/CDN buffering (nginx `proxy_buffering off` or trust `X-Accel-Buffering: no`).
   - Optionally warm the SSE connection when the compose tab mounts but auto-close after a few idle minutes to conserve resources.

## Frontend (Monaco)

1. **Streaming & State Machine**
   - Use `EventSource` (or a lightweight polyfill) to consume `/complete` SSE events instead of manual fetch parsing.
   - Manage suggestion state via `idle → requesting → streaming → shown → accepted/dismissed`, clearing Monaco decorations whenever the state leaves `shown`.

2. **Trigger Heuristics**
   - Fire after 250 ms idle debounce.
   - Fire when the user types a space following `. ? ! ; : ) ] } $`.
   - Suppress triggers while the cursor is inside braces of `\cite{}`, `\ref{}`, `\footnote{}` until the closing brace plus space.
   - Always send ≥80 chars of context if available, capped at 4 k chars.

3. **Abort & Retry Behavior**
   - Maintain a single `AbortController` for the active request; abort immediately on any non-Tab keystroke or Esc, and call `/complete/abort` with the same `request_id`.
   - If no first chunk arrives within 800 ms, abort once and retry a single time; if the retry also stalls, bail silently.
   - Track lightweight client metrics (TTFT, aborted/completed counts, average suggestion length) for future tuning.

4. **Ghost Text Rendering & Keyboard Handling**
   - Render ghost text using Monaco `deltaDecorations` (or the InlineCompletionsController) anchored at the caret so layout never shifts.
   - Intercept Tab only when a suggestion is visible; on Tab, insert the ghost text via `editor.executeEdits`, update local content state, and transition to `accepted`.
   - Esc always dismisses (state → dismissed) and aborts the stream; any other edit clears decorations and returns to `idle`.

5. **Prompt Payload**
   - System prompt: XML-formatted block with tags `<context>`, `<goal>`, `<instructions>`, `<examples>`; embed the cleaned 3–4 k char excerpt inside `context`, reiterate the academic continuation goal, list rule bullets within `instructions`, and show positive/negative starts within `examples`.
   - User payload: can simply be the same XML (or an empty message if the system prompt already contains it) so both Anthropic roles see the structured data; always ensure the excerpt lives inside `<context>` and the instructions include “Continue seamlessly:” semantics.
