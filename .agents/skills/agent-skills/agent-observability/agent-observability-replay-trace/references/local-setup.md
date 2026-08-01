# Setting up a local testing flow (step 3.5)

Read this only when the app **can't be invoked locally with a JSON input** — a deployed-only service, an
HTTP/gRPC handler entrypoint, no local `__main__`/CLI, deps not installed, or logic coupled to live infra.
Replay re-runs the entrypoint locally, so without a local run path there's nothing to replay. This procedure
makes the app locally runnable, then hands back to the normal instrument + runner steps.

**Shape:** detect → **propose (one approval)** → build automatically. You do as much as possible on your own,
but two things are **mandatory handbacks** to the user; see below.

## 1. Detect the gap

The real question isn't the binary "is the app runnable?" — it's **what is the innermost callable seam
corresponding to the trace's root span, and can it be called directly with a JSON input?** A deployed-only
HTTP/gRPC service frequently still exposes a plain callable underneath its handler (the ports-and-adapters /
hexagonal case); when it does, extract/call that seam — full local-setup would be overkill. Only run this
procedure when **no seam is directly callable**.

Signals the seam isn't directly callable as-is:

- The entrypoint is a request handler (FastAPI/Flask/gRPC/Lambda) with no plain callable beneath it.
- No `if __name__ == "__main__"` / CLI, or no way to import + call the core logic directly.
- Config/secrets read from a deployed environment (env injected by the platform, a secrets manager).
- Imports of cloud/service clients constructed at service startup (DB, queues, downstream services).
- No local virtualenv / dependencies not installed.

If the seam is already an importable function you can call with JSON, **skip this whole procedure** and
return to step 4. If the logic is a plain callable buried inside a handler, extracting that seam is a small
edit (see §2) — still lighter than treating the whole app as non-runnable.

## 2. Analyze + propose (get ONE approval before touching anything)

**First, look for an existing dry-run affordance before proposing any stubs.** Many apps already ship a
dry-run / no-op / sandbox mode or a nil-adapter branch built for exactly this situation. Using the app's own
affordance is **safer and higher fidelity** than a mock — it exercises the real code path right up to the
side effect, and it's code the owners already trust. Check for it (flags, env vars, a `--dry-run`, a
nil/fake adapter) and prefer it. Only fall back to a **stub** — a fake/no-op stand-in for a dependency
that either isn't reachable locally or whose real call would re-trigger a side-effecting write — where no
such affordance exists; the per-dependency **stub-vs-real** decision is §4's second handback.

Read the code around the entrypoint and produce a concrete, reviewable plan covering:

- **The local entry point** you'll scaffold — a thin module that invokes the core agent logic with a JSON
  input (extracting a callable seam if the logic is buried inside a handler).
- **Any existing dry-run / no-op / sandbox mode** you found, and where you'll use it instead of a stub.
- **Deps + venv** to create/install, and the **run command**.
- **Env/config** to load locally (e.g. a `.env`), and **tracing** enabled under **`<ml_app>-local`**
  (`LLMObs.enable(ml_app="<ml_app>-local")`) — local test traces must **not** pollute the production ml_app.
- **Per external dependency**, your proposed handling: **stub / no-op**, **point at a local or test
  instance**, or **use real read-only creds** — one line each.
- **Any structural edits** to the app (e.g. extracting the core function out of a handler), called out
  explicitly.

Present this as a single plan and get the user's approval (accept / adjust / "just scaffold, I'll do X").
This is their one control point — don't build before it.

## 3. Build (automatic after approval)

Do everything you can without further prompting:

- Scaffold the local entry point that calls the core logic with the JSON input.
- Extract the callable seam if needed (apply the structural edits you flagged).
- Create the venv, install deps, write the local `.env` skeleton, enable `LLMObs` under `<ml_app>-local`.
- Wire external deps per the approved plan (stubs / local instances).

Then hand off to **step 4** (instrument + runner) as normal — the runner's entrypoint becomes this local
entry point.

## 4. Two mandatory handbacks

These you cannot (and must not silently) do for the user:

- **Secrets.** You can't fabricate API keys, DB credentials, or service tokens. Scaffold the `.env` with the
  required keys **empty** and ask the user to fill them; never invent or guess values.
- **Stub-vs-real per external dependency.** Never silently auto-mock — a wrong mock makes the replay's output
  diverge for reasons unrelated to the code change, so the **diff becomes misleading**. Surface each external
  dependency and let the user choose stub / local / real (**prefer the app's own dry-run / no-op affordance
  from §2 over a hand-written stub** — it's higher fidelity). Only then implement it.

Everything outside these two is automatic.

## 5. Safety

- **Default external writes to stubbed / no-op** unless the user explicitly opts into real dependencies —
  replaying against real infra re-triggers real writes (DB/email/billing/queues) on **every** iteration of
  the loop.
- **Warn before structural refactors.** Extracting a seam edits the app's real code; show the change and keep
  it minimal and non-destructive.
- Don't make it run "at any cost" — hardcoding config, disabling auth, or skipping validation just to get a
  trace out produces a local flow that runs but doesn't represent production. Flag such shortcuts instead of
  taking them silently.
