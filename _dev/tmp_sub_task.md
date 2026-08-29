# Task: Implement ALL tasks T1–T7 from /home/u1/_dev/tiro-notes/_specs/flaky_login_tasks.md

Work in /home/u1/_dev/tiro-notes.

Steps:
1. Read _specs/flaky_login_tasks.md fully.
2. Read every file the tasks touch:
   - server/src/managers/loginToken.manager.ts
   - server/src/managers/password.manager.ts
   - server/src/routes.ts (the sendLoginInfos handler)
   - client/src/hooks/app/loginToken.hook.tsx
   - client/src/components/Input.component.tsx
   - client/src/managers/sockets/socket.manager.ts
   - server/src/managers/__tests__/ (existing test style)
3. Implement all tasks exactly as specified (T1, T2, T3, T4, T5, T6, T7).
   - T2 + T4 + T6 all touch loginToken.hook.tsx — do them in one coherent edit pass.
   - Do NOT upgrade socket.io.
4. Run the repo's existing server test command (check package.json scripts) so the new T7 test runs green. Run it if there's a client typecheck/build script that's quick, and fix any errors your changes introduced.
5. Do NOT git commit or push. Leave changes staged/unstaged for the supervisor.
6. End your message with a "TASK RESULT:" section: per task (T1–T7) one line: done/skipped + one-sentence note, then the test output summary (pass/fail counts).

Constraints:
- Minimal diffs, follow existing code style.
- If a task's described code doesn't match the actual file (names/structure differ), adapt sensibly to the intent and note it in TASK RESULT.
