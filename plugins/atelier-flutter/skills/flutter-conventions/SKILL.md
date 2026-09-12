---
name: flutter-conventions
description: House conventions for Flutter and Dart — project structure, layering, state management boundaries, widget composition, and testing. Use this skill whenever writing, refactoring, or reviewing Flutter or Dart code, when deciding where a new file belongs in a Flutter project, when scaffolding a Flutter app, and whenever `/build` or `/bootstrap` works in a Flutter repo. Also use when the user asks where a repository, ViewModel, model, or widget belongs, or where to put a repository, model, or widget.
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

## Project structure

**Use the structure from the official `flutter-apply-architecture-best-practices` skill.** It is maintained by the Flutter team, and a second competing layout in this file would be the worse of the two the moment they diverge. Read it before scaffolding; what follows is the shape it defines and the reasoning worth keeping in mind while working in it.

It is a **hybrid**: UI grouped by feature, data and domain grouped by type.

```
lib/
├── data/
│   ├── models/         # API models
│   ├── repositories/   # repository implementations — the single source of truth
│   └── services/       # API clients, local storage wrappers
├── domain/
│   ├── models/         # clean domain models
│   └── use_cases/      # optional; only for logic that clutters a ViewModel or spans repositories
└── ui/
    ├── core/           # shared widgets, themes, typography
    └── features/
        └── [feature_name]/
            ├── view_models/
            └── views/
```

Why the split rather than pure feature-first: repositories and services are genuinely shared infrastructure — several features read the same user, the same auth token, the same cache. Filing them under one feature makes every other feature import across a boundary that says it owns them. The UI has the opposite property: a screen belongs to exactly one feature and nothing else should touch it, so grouping views by feature is what keeps them deletable.

**`domain/use_cases/` stays empty until it earns its keep.** A use case that forwards one call to one repository is a file that adds a hop. Create one when logic clutters a ViewModel, or when two ViewModels need the same rule.

**`ui/core/` earns its contents by actual reuse.** Two features using a widget moves it there; one feature plus an expectation does not. Themes and typography live there from the start, being shared by definition.

**Dependencies run one way: `ui` → `domain` → `data`.** A repository that imports a widget, or a domain model that knows about a screen, has broken the direction — and that is precisely what makes a feature impossible to test without pumping a widget tree.

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

`test/` mirrors `lib/` so a file's test is always findable at the same path.

- **Unit tests** for `domain`, repositories, and ViewModels — no widget pumping needed, and these should be the majority. `dart-add-unit-test` covers the mechanics, `dart-generate-test-mocks` the dependencies.
- **Widget tests** for anything with conditional rendering, and use `flutter-add-widget-test` from the official collection for the mechanics.
- **Integration tests** for the flows that would embarrass you if broken — login, checkout, the one thing the app exists to do. See `flutter-add-integration-test`.

Test behavior through the public surface. A test asserting a private controller field breaks on refactor and catches nothing.

## Anti-patterns

- **Flat `lib/` with everything at the top level** — `lib/models/`, `lib/widgets/`, `lib/screens/`. This is what `flutter create` leaves you with, and what the structure above replaces.
- **`setState` in a large widget** as the app's state management. It works until two widgets need the same value, and the fix at that point is a rewrite.
- **`BuildContext` stored in a field or passed into a service.** Context is valid for one build of one widget; keeping it outlives its validity.
- **A god `providers.dart` listing every dependency in the app.** Register alongside the thing being registered.
- **Business logic in a `StatefulWidget`'s `initState`.** It cannot be tested, reused, or called again.
- **Ignoring analyzer warnings.** Dart's analyzer is unusually good; a warning it raises is nearly always a real defect. `dart-run-static-analysis` runs it and applies the mechanical fixes.
