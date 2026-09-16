# Help Center maintenance

Read this when implementing a feature, changing user-visible behavior, or removing functionality. `src/features/help/content.ts` is the authoritative user-guide catalog; Agent Help tools read this same catalog.

## Required steps

1. **Map behavior.** List every changed user task, permission, limit, entry point, state, and recovery path. Find the existing articles by their task and `sources` references. Complete when each functional change maps to an article to update or add.
2. **Update guides in the same change.** Extend existing articles before adding another. Describe the shipped controls, prerequisites, steps, result, limitations, and recovery in user language. Maintain related links, source references, and review date. Remove instructions for removed behavior. Complete when a user can perform every changed task from the guide without knowledge of the implementation conversation.
3. **Keep availability accurate.** Describe gated features conditionally and explain where available users find them. Keep proposed capabilities in engineering roadmaps until implemented. Agent discovery, runtime instructions, admin controls, and Help Center must describe the same capability boundary. Complete when every advertised action has a working authorized path and unavailable actions have accurate copy.
4. **Verify and report.** Maintain relevant content/link tests and product journey coverage. Execute checks according to the Development loop in AGENTS.md. In the PR or handoff, name the updated articles and any unverified behavior. Complete when every mapped change is covered and validation status is explicit.

Pure refactors, formatting, or infrastructure changes with no user-facing behavior impact need a short not-applicable explanation in the PR instead of a cosmetic article edit. A change in product behavior, including a fix that makes existing guidance inaccurate, always updates the guide.
