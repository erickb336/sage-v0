# Working on sage

- **What is where:** the agents in `plugins/sage/agents/`, the state tool in `plugins/sage/skills/sage/`, the hook in `plugins/sage/hooks/`, the design in `docs/design/sage-mode.html`.
- **Run `npm run check` and `npm test` after every change.** CI runs both. The tests run the state tool and the hook as Claude Code does.
- **One source for each rule:**
  - The brief fields live in the hook (`BRIEF_FIELDS`). The chief's brief template must list the same fields; `npm run check` checks this.
  - The routes, states and verdict kinds live in the state tool. The design page and the chief's instructions describe them; change all three together.
- **A rule that matters goes into code** (the hook or the state tool), with a test. An instruction in a prompt alone is not enough.
- **Agents** preload principles from agent-kit (`agent-kit:principle-…`) and sage's own skills (`sage:…`). Do not copy principle text into sage.
- **Write** at 80% of Simplified Technical English, as agent-kit's writing standard says.
