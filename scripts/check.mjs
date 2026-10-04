// Checks the plugin's files and the promises between them. Fails with a list of every problem.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { BRIEF_FIELDS, REPORT_FIELDS } from "../plugins/sage/hooks/sage-hook.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const PLUGIN = join(ROOT, "plugins/sage");
const problems = [];
const frontmatter = (file) => /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(readFileSync(file, "utf8"));
const key = (fm, k) => new RegExp(`^${k}:\\s*(.+)$`, "m").exec(fm)?.[1]?.trim();

// Skills use the shared format: name equals the folder, a description, and only the shared keys.
for (const d of readdirSync(join(PLUGIN, "skills"))) {
  const m = frontmatter(join(PLUGIN, "skills", d, "SKILL.md"));
  if (!m) { problems.push(`skills/${d}: no SKILL.md frontmatter`); continue; }
  if (key(m[1], "name") !== d) problems.push(`skills/${d}: name must equal the folder name`);
  if (!key(m[1], "description")) problems.push(`skills/${d}: missing description`);
  for (const k of m[1].split("\n").filter((l) => /^[A-Za-z-]+:/.test(l)).map((l) => l.split(":")[0])) {
    if (!["name", "description", "license", "allowed-tools", "metadata"].includes(k)) problems.push(`skills/${d}: key "${k}" is not in the shared skill format`);
  }
}

// Agents: name equals the file, a description, and each preloaded skill is a sage skill that exists or an agent-kit one.
const agents = readdirSync(join(PLUGIN, "agents")).filter((f) => f.endsWith(".md"));
for (const f of agents) {
  const m = frontmatter(join(PLUGIN, "agents", f));
  if (!m) { problems.push(`agents/${f}: no frontmatter`); continue; }
  if (key(m[1], "name") !== f.slice(0, -3)) problems.push(`agents/${f}: name must equal the file name`);
  if (!key(m[1], "description")) problems.push(`agents/${f}: missing description`);
  for (const [, skill] of m[1].matchAll(/^\s+-\s+(\S+)\s*$/gm)) {
    const [ns, name] = skill.split(":");
    if (ns === "sage" && !existsSync(join(PLUGIN, "skills", name ?? "", "SKILL.md"))) problems.push(`agents/${f}: preloads ${skill}, which does not exist`);
    if (!["sage", "agent-kit"].includes(ns) || !name) problems.push(`agents/${f}: preloads ${skill}; use sage:<skill> or agent-kit:<skill>`);
  }
  for (const [, name] of m[2].matchAll(/`sage:([a-z-]+)`/g)) {
    if (!agents.includes(`${name}.md`) && !existsSync(join(PLUGIN, "skills", name, "SKILL.md"))) problems.push(`agents/${f}: names sage:${name}, which is neither an agent nor a skill`);
  }
}

// The chief's brief template and the hook's brief gate list the same fields, in the same order.
const chief = frontmatter(join(PLUGIN, "agents/chief-of-staff.md"));
const template = /## The brief[\s\S]*?```\n([\s\S]*?)```/.exec(chief?.[2] ?? "")?.[1] ?? "";
const fields = template.split("\n").map((l) => l.split(/\s+/)[0]).filter(Boolean);
if (fields.join(" ") !== BRIEF_FIELDS.join(" ")) problems.push(`agents/chief-of-staff.md: the brief template has ${fields.join(" ")}, the hook checks ${BRIEF_FIELDS.join(" ")}`);

// The report skill's template and the hook's report gate list the same fields, in the same order.
const report = /```\n([\s\S]*?)```/.exec(readFileSync(join(PLUGIN, "skills/report/SKILL.md"), "utf8"))?.[1] ?? "";
const reportFields = report.split("\n").map((l) => l.split(/\s{2,}/)[0].trim()).filter(Boolean);
if (reportFields.join("|") !== REPORT_FIELDS.join("|")) problems.push(`skills/report: the template has ${reportFields.join(", ")}, the hook checks ${REPORT_FIELDS.join(", ")}`);
for (const f of agents.filter((a) => a !== "chief-of-staff.md")) if (!readFileSync(join(PLUGIN, "agents", f), "utf8").includes("  - sage:report")) problems.push(`agents/${f}: must preload sage:report`);

// Every hook command runs a script that exists.
const hooks = JSON.parse(readFileSync(join(PLUGIN, "hooks/hooks.json"), "utf8")).hooks;
for (const [event, groups] of Object.entries(hooks)) for (const g of groups) for (const h of g.hooks) {
  const script = /\$\{CLAUDE_PLUGIN_ROOT\}\/([^"]+)"/.exec(h.command)?.[1];
  if (!script || !existsSync(join(PLUGIN, script))) problems.push(`hooks.json ${event}: runs ${script ?? h.command}, which does not exist`);
}

// The plugin depends on agent-kit, and the marketplace allows that cross-marketplace dependency.
const plugin = JSON.parse(readFileSync(join(PLUGIN, ".claude-plugin/plugin.json"), "utf8"));
const market = JSON.parse(readFileSync(join(ROOT, ".claude-plugin/marketplace.json"), "utf8"));
if (!/^\d+\.\d+\.\d+$/.test(plugin.version ?? "")) problems.push("plugin.json: version must be x.y.z");
if (!(plugin.dependencies ?? []).includes("agent-kit@agent-kit")) problems.push("plugin.json: must depend on agent-kit@agent-kit");
if (!(market.allowCrossMarketplaceDependenciesOn ?? []).includes("agent-kit")) problems.push("marketplace.json: must allow the agent-kit dependency");

if (problems.length) { console.error(problems.map((p) => `✗ ${p}`).join("\n")); process.exit(1); }
console.log("✓ all checks pass");
