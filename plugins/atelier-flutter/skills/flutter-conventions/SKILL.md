---
name: flutter-conventions
description: House conventions for Flutter and Dart — feature-first project structure, layering inside a feature, state management boundaries, widget composition, and testing. Use this skill whenever writing, refactoring, or reviewing Flutter or Dart code, when deciding where a new file belongs in a Flutter project, when scaffolding a Flutter app, and whenever `/build` or `/bootstrap` works in a Flutter repo. Also use when the user asks about feature-first structure, Riverpod/Bloc placement, or where to put a repository, model, or widget.
---

Conventions for Flutter work in this house style. The structural decisions are the ones that matter most here — Flutter projects go wrong at the folder level long before they go wrong at the widget level, and by then moving files means touching every import.

## The first rule: match what is already there

Read before writing. An existing project's structure, state management choice, and routing setup win over anything in this skill. Introducing Riverpod into a Bloc codebase, or a layer-first folder into a feature-first one, costs more than any benefit it brings.

These are the defaults for new projects and the tiebreaker when the codebase is silent.

## Where the deep Flutter knowledge lives

The Flutter team publishes a large official skill collection (`github.com/flutter/skills` — `flutter-apply-architecture-best-practices`, `flutter-build-responsive-layout`, `flutter-add-widget-test`, `flutter-setup-declarative-routing`, `flutter-setup-localization`, and others). Where one of those covers the task, **use it** — they are maintained by the people who maintain the framework, and duplicating them here would mean carrying a stale copy.

This skill owns what those do not: the structure this house uses and the handful of decisions that are ours rather than the framework's. If a Flutter skill and this file disagree on a framework detail, the Flutter skill is right.

**If they are not installed, recommend them once and move on.** Check whether skills like `flutter-apply-architecture-best-practices` or `flutter-add-widget-test` are in the available skills list. If none are:

> This is a Flutter project and the official Flutter skills aren't installed. They cover architecture, responsive layout, routing, testing, localization and more, maintained by the Flutter team:
> ```bash
> npx -y skills add flutter/skills --agent claude-code
> ```
> That installs the whole collection. Worth picking the ones you want instead — every installed skill's description stays in context for every session.

Say it once, then continue with this skill's conventions. Do not stall waiting for an install, do not repeat the suggestion later in the same session, and do not run the command yourself — installing third-party skills is the user's call.

## Project structure: feature-first

Organize by **feature**, not by layer. A layer-first tree (`lib/models/`, `lib/widgets/`, `lib/services/`) looks tidy on day one and then makes every real task a scavenger hunt — adding a field to checkout means opening four folders, and deleting a feature means finding its fragments in each.

Feature-first keeps everything one feature needs in one place, which is the unit people actually work in, hand off, and delete.

```
lib/
├── main.dart                      # entry point, nothing else
└── src/
    ├── features/
    │   ├── auth/
    │   │   ├── data/              # repositories, data sources, DTOs
    │   │   ├── domain/            # models, entities, value objects
    │   │   ├── application/       # services, use cases (only when needed)
    │   │   └── presentation/      # screens, widgets, controllers
    │   └── checkout/
    │       └── ...
    ├── common/                    # widgets and helpers used by 2+ features
    ├── routing/                   # route table, guards
    ├── localization/
    ├── theme/
    └── constants/

test/                              # mirrors lib/src/ exactly
```

**The layers inside a feature depend inward.** `presentation` may use `application` and `domain`; `data` may use `domain`; `domain` depends on nothing. A model that imports a widget is the signal that the direction has broken, and it is what makes a feature impossible to test without a UI.

**`application/` is optional.** When a controller calls one repository and does nothing else, a service layer is a file that forwards a call. Add it when there is real logic that does not belong to a single repository — an operation spanning two of them, a transaction, a policy.

**`common/` earns its contents by actual reuse.** Two features using a widget moves it there; one feature plus an expectation does not. A `common/` folder that accumulates speculative shared code becomes the layer-first tree you were avoiding, wearing a different name.

**A feature that grows too large splits into features**, not into deeper folders. If `auth/` has thirty files, there is probably a `profile/` or `onboarding/` inside it wanting out.

## State management

Use whatever the project already has. For new projects the choice matters less than the boundary, which is the same regardless:

**Controllers hold state; widgets render it.** A widget that performs a network call, holds business logic, or decides a policy cannot be tested without pumping a widget tree, and cannot be reused anywhere else.

**Never put business logic in `build()`.** It runs on every rebuild, which is often and unpredictably. Compute in the controller, pass the result down.

**Dispose everything you create.** Controllers, streams, listeners, animation controllers, focus nodes. A missed `dispose` is a leak that shows up as a slow crawl, not a crash, which makes it expensive to find later.

## Widgets

**Prefer composition over configuration.** A widget with eleven optional constructor parameters and a `type` enum is several widgets that have not been separated yet.

**Extract widgets into classes, not into methods.** A `Widget _buildHeader()` method rebuilds with the whole parent every time; a `const HeaderWidget()` does not. This is the most common avoidable performance problem in a Flutter app, and the fix is mechanical.

**`const` wherever the analyzer allows it.** It is free, and it tells the framework the subtree cannot have changed.

**Keep `build()` shallow.** More than roughly three levels of nesting is a subtree asking to be its own widget — which also makes it independently testable.

## Async and errors

Follow the `errors` skill for typed errors and cause chains, and `logging` for structured logs. The Flutter-specific parts:

- **Check `mounted` before using a `BuildContext` after an await.** The widget may be gone; using its context after disposal throws, and it happens exactly when the network was slow — which is to say, on a real user's connection and never on yours.
- **Every future that can fail has a visible failure state.** A `FutureBuilder` with no error branch renders a spinner forever, which is indistinguishable to the user from a hung app.
- **Errors surface in the UI, not just the console.** A caught exception that only prints is a silent failure in a release build.

## Testing

`test/` mirrors `lib/src/` so a file's test is always findable at the same path.

- **Unit tests** for `domain` and `application` — no widget pumping needed, and these should be the majority. `dart-add-unit-test` covers the mechanics, `dart-generate-test-mocks` the dependencies.
- **Widget tests** for anything with conditional rendering, and use `flutter-add-widget-test` from the official collection for the mechanics.
- **Integration tests** for the flows that would embarrass you if broken — login, checkout, the one thing the app exists to do. See `flutter-add-integration-test`.

Test behavior through the public surface. A test asserting a private controller field breaks on refactor and catches nothing.

## Anti-patterns

- **Layer-first folders** (`lib/models/`, `lib/widgets/`, `lib/services/`) — the structure this skill exists to prevent.
- **`setState` in a large widget** as the app's state management. It works until two widgets need the same value, and the fix at that point is a rewrite.
- **`BuildContext` stored in a field or passed into a service.** Context is valid for one build of one widget; keeping it outlives its validity.
- **A god `providers.dart` or `services.dart`** listing every dependency in the app. Register per feature.
- **Business logic in a `StatefulWidget`'s `initState`.** It cannot be tested, reused, or called again.
- **Ignoring analyzer warnings.** Dart's analyzer is unusually good; a warning it raises is nearly always a real defect. `dart-run-static-analysis` runs it and applies the mechanical fixes.
