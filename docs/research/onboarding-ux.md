# Onboarding UX research

## Question

How should Relay welcome first-time players, collect a small amount of useful profile and attribution data, and teach the core product on mobile and desktop without creating a long tutorial?

## Findings

1. **Front-loaded tutorials are commonly skipped and poorly retained.** Nielsen Norman Group describes launch-time walkthroughs as disruptive “push revelations”: they interrupt a task, present help out of context, are frequently skipped, and generally do not improve later task performance. It recommends contextual, dismissible help that can be recalled later. [NN/g: Onboarding Tutorials vs. Contextual Help](https://www.nngroup.com/articles/onboarding-tutorials/)
2. **Teach only what matters first.** Progressive disclosure initially exposes a few important options and defers specialized features. NN/g reports benefits to learnability, efficiency, and error reduction, especially for novice users. [NN/g: Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/)
3. **A short wizard is appropriate when the questions form a necessary sequence.** NN/g distinguishes staged disclosure (a linear wizard with one coherent subset per step) from broad feature education. Each step should have one clear purpose. [NN/g: Progressive Disclosure — Staged Disclosure](https://www.nngroup.com/articles/progressive-disclosure/#toc-staged-disclosure-one-step-at-a-time-4)
4. **Onboarding must not block an urgent destination.** Apple’s onboarding guidance emphasizes helping people begin using an app quickly and avoiding unnecessary setup before they can experience value. [Apple Human Interface Guidelines: Onboarding](https://developer.apple.com/design/human-interface-guidelines/onboarding)
5. **Help must be dismissible and replayable.** NN/g specifically recommends easy dismissal and a durable way to recall guidance later. Relay already exposes “Replay tour” in Help Center, which should remain. [NN/g: Onboarding Tutorials vs. Contextual Help](https://www.nngroup.com/articles/onboarding-tutorials/)

## Relay decisions

- Keep setup to **three short steps**: welcome and identity, play and app preferences, discovery source and confirmation.
- Keep optional recreational questions optional; require only recognizable name and username.
- Store appearance choices locally because they are device preferences, not account identity.
- Keep discovery source optional and use a bounded vocabulary suitable for aggregate reporting.
- Reduce the product tour to **five steps**: welcome, Create, Home, Court, and Profile. Groups, search, notifications, payments, and advanced Play behavior are contextual features and should not be taught up front.
- Resolve each tour target from the visible responsive navigation so the same tour works in the desktop sidebar and mobile header/bottom bar.
- Keep Skip and Replay tour.
- Report discovery source only as aggregate counts in Admin Insights; show the individual response on the user detail page. Do not infer attribution or expose unrelated private activity.
