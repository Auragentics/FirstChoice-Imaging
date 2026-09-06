# Deploy voice-agent prompts to GHL (no more copy-paste)

`src/deploy-prompts.js` pushes the repo prompt `.md` files straight into the
**GHL-native Voice AI** agents (`agentPrompt` field). Edit the files → run one
command → all agents updated. The repo becomes the source of truth; git is the
change log.

## The 4 live agents (NOT 5)

Both Logan clinics share ONE call desk / central schedulers, so **North Logan
runs on the Logan agent.** `NorthLoganVoiceAgentPrompt.md` stays in the repo for
reference but is **never deployed.**

| Prompt file | Agent | Published DID |
|---|---|---|
| `LoganVoiceAgentPrompt.md` | Logan (+ North Logan) / Ethan | 435-258-9598 |
| `TooeleVoiceAgentPrompt.md` | Tooele / Leo | 435-882-1674 |
| `SandyVoiceAgentPrompt.md` | Sandy / Marcus | 801-576-1290 |
| `StGeorgeVoiceAgentPrompt.md` | St. George / Luke | 435-275-6210 |

Mapping is resolved live each run by DID (name as fallback). Anything ambiguous
is reported and **skipped** — a commit never runs on a fuzzy match.

## One-time setup

1. **Create a Private Integration Token** in GHL → Settings → Private
   Integrations. Select the **Voice AI** scopes (read + write). Copy the token
   (starts with `pit-`).
2. **Get the sub-account (location) ID** (Settings → Business Profile, or the URL).
3. **Store the secrets** — never commit them:
   - Local: put `GHL_PIT` and `GHL_LOCATION_ID` in `netsapiens-bridge/.env`
     (see `.env.example`). `.env` is gitignored.
   - Cloud (if the bridge ever runs this): `gcloud secrets create ghl-pit --data-file=-`.

## Usage

```bash
cd netsapiens-bridge
npm run deploy-prompts -- --list      # show every agent GHL returns (confirm the mapping)
npm run deploy-prompts                # dry-run: resolve mapping + diff, writes NOTHING
npm run deploy-prompts -- --only logan --commit   # deploy ONE agent (first live test)
npm run deploy-prompts -- --commit    # deploy all 4
```

- **Dry-run is the default.** `--commit` is required to write.
- `--only <label>` limits to one (`logan`, `tooele`, `sandy`, `stgeorge`).
- The dry-run diff shows the first changed line and the char delta per agent.

## First live run — verify

1. `--list` and confirm all 4 agents appear with the expected DIDs.
2. Dry-run and confirm the diffs look right (e.g. only the agents you changed show `DIFF`).
3. `--only logan --commit`, then open that agent in the GHL UI and confirm the
   prompt updated. **Check whether GHL needs a "publish"/save step** for the change
   to affect live calls — if so, note it here and add it to the flow.
4. Once verified, `--commit` the rest.

## Notes

- We send **only** `agentPrompt` in the PATCH (partial update) — no other agent
  config is touched.
- Tool wiring (`check_repeat_caller`, transfers) is separate — GHL's Voice AI
  **Actions API** can version-control those too if we want (future).
