# sage

Sage mode for Claude Code. Say **"sage mode"** in any session, and the session becomes your chief of staff. The chief of staff runs a team of specialist agents: a PE, a designer, implementers, code, security and UX reviewers, and QA. It asks you only the product questions, and it shows you results, not code.

There is no app and no dashboard. Sage mode works in any Claude Code session: on your desktop, in a terminal, or from your phone through Remote Control. The chat is the interface. The state is plain files that any session can pick up.

> **Status: early (v0.1).** The kitchen is built and tested: the state tool, the gates and the agent cap. The agents are drafts that have not run a real task yet. Next comes a dry run, then a pilot on a real project. See [the plan](docs/design/sage-mode.html#plan).

## How it works

```
You ──request──▶ Chief of staff ──brief──▶ Design ─▶ Build ─▶ Review ─▶ QA ─▶ Pull request
     ◀─questions, results──┘    ◀──report + evidence───────────────────────┘      │
                     │                                            autopilot: merge after 2 clean cycles
                     └── a lesson comes back twice ──▶ improve the kitchen (test, lint, check, skill)
```

- **A chief of staff that never writes code.** It frames each task, picks its route, writes the briefs, records every result, and asks you only what it can't decide.
- **Routes sized to the task.** A tiny fix gets a build and its checks. A large feature gets a design, a PE check, your approval, the build, three reviews and QA. The chief can add steps, never remove the least route.
- **Rules in code, not only in prompts.** The sage hook and the state tool enforce them:
  - The chief never edits files.
  - Every brief has all its fields.
  - At most 3 sage agents run at once.
  - Nobody force-pushes or pushes to main.
  - Every finding is triaged before QA.
  - Repair rounds are bounded.
  - A merge needs the checked head SHA with its clean cycles in the ledger.
- **Arena.** For a design with no clear answer, N agents make a candidate each. The PE takes the best of each.
- **Autopilot.** Off by default. With "autopilot on", a pull request merges by itself after 2 clean cycles of fresh reviews and QA on its head SHA.

The full design, with diagrams, the data model, every rule and edge case, and the options I rejected, is in [docs/design/sage-mode.html](docs/design/sage-mode.html).

## Install

Sage builds on [agent-kit](https://github.com/erickb336/agent-kit). Its agents preload agent-kit's principles. Install agent-kit first:

```
/plugin marketplace add erickb336/agent-kit
/plugin install agent-kit@agent-kit
/plugin marketplace add erickb336/sage
/plugin install sage@sage
```

## Use

| Say | What happens |
| --- | --- |
| `sage mode` | The session becomes your chief of staff. |
| `sage mode off` | It's a normal session again. |
| `autopilot on` / `autopilot off` | Verified pull requests merge by themselves, or wait for you. |
| `arena` or `arena 4` | The next design goes to N agents, and the PE takes the best of each. |

To make every session in a folder start as the chief of staff, put this in the folder's `.claude/settings.json`:

```json
{ "agent": "sage:chief-of-staff" }
```

The state lives in `~/.claude/sage/<project>-<hash>/`: tasks, runs, findings, the verdict ledger, your gates, the decision trail, and `status.md`.

## Change it

- The agents are in `plugins/sage/agents/`, the state tool in `plugins/sage/skills/sage/`, and the hook in `plugins/sage/hooks/`.
- Run `npm run check` and `npm test` after a change. CI runs both.

## Thanks

Sage takes its ideas from [pstack](https://github.com/cursor/plugins/tree/main/pstack) and poteto mode by [Lauren Tan (poteto)](https://github.com/poteto), from my own [Orchestrator](https://github.com/erickb336/orchestrator) experiments, and from Anthropic's and Cognition's writing on multi-agent systems.

## Licence

MIT.
