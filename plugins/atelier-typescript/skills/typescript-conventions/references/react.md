# React conventions

Assumes the shared rules in `../SKILL.md`. Match the existing codebase over anything here.

## Contents

- [Server and client boundaries](#server-and-client-boundaries)
- [State](#state)
- [Effects](#effects)
- [Data fetching](#data-fetching)
- [Rendering and performance](#rendering-and-performance)
- [Forms](#forms)
- [Component shape](#component-shape)
- [Accessibility](#accessibility)
- [Anti-patterns](#anti-patterns)

## Folder structure

Follow the [bulletproof-react](https://github.com/alan2207/bulletproof-react) layout. Organize by **feature**, not by file type: a type-first tree (`components/`, `hooks/`, `types/`, `utils/` holding everything) looks tidy empty and turns every real task into a scavenger hunt — touching checkout means opening four folders, and deleting a feature means hunting its fragments in each.

```
src/
├── app/              # application layer — routes/pages, providers, router config
├── assets/           # static files
├── components/       # shared components used across the whole app
├── config/           # global config, exported env vars
├── features/         # feature modules (see below)
├── hooks/            # shared hooks
├── lib/              # reusable libraries preconfigured for this app
├── stores/           # global state stores
├── testing/          # test utilities and mocks
├── types/            # shared types
└── utils/            # shared utility functions
```

Each feature mirrors that shape at its own scope:

```
src/features/checkout/
├── api/              # request declarations and hooks for this feature
├── assets/
├── components/       # components scoped to this feature
├── hooks/
├── stores/
├── types/
└── utils/
```

**Dependencies flow one way: shared → features → app.** Shared code can be used anywhere; a feature may depend on shared code but **not on another feature**; the app layer may import from both. A feature importing from a sibling feature is the single rule worth enforcing with a lint boundary, because it is invisible in review and it is what turns two features into one that cannot be deleted separately.

**Route files stay thin.** A `page.tsx` composes and fetches; the logic lives in the feature. That keeps the routing tree readable as a map of the app rather than a pile of implementations.

**Create only the folders a feature actually needs.** A `checkout/` with `components/` and `api/` is finished; adding empty `stores/` and `utils/` to match the diagram is the type-first habit creeping back in one level down.

**Promote to shared only on the second real consumer.** One feature plus an expectation is not reuse, and a `lib/` that fills with speculative helpers becomes the type-first tree you were avoiding under a different name.

## Server and client boundaries

In an App Router project, **server components are the default** and `'use client'` is an opt-out you push as far down the tree as possible. A `'use client'` at the top of a page drags the entire subtree into the bundle, including components that had no interactivity and no reason to ship.

The practical shape: a server component fetches and composes, and hands data to small client leaves that need state, effects, or event handlers. When a client component needs a server-rendered child, pass it as `children` rather than importing it — composition crosses the boundary, imports do not.

Serialization is the constraint people hit: props crossing from server to client must be serializable. No functions, no class instances, no `Date` in some setups. If you are reaching for a workaround, the boundary is probably drawn in the wrong place.

## State

**Colocate state as low as it can live.** Lift it only when two siblings genuinely need it. State lifted "just in case" re-renders a whole subtree for a value one leaf uses.

**Derive, don't duplicate.** If a value can be computed from existing state or props, compute it during render. A second piece of state holding a derived value is a bug waiting for the two to disagree:

```tsx
// Two sources of truth that will drift
const [items, setItems] = useState<Item[]>([])
const [count, setCount] = useState(0)

// One source of truth
const [items, setItems] = useState<Item[]>([])
const count = items.length
```

**URL state belongs in the URL.** Filters, tabs, pagination, the open detail panel — anything a user might share, bookmark, or reload into. `useState` for these silently breaks the back button and makes bug reports unreproducible.

**Server data is not client state.** It belongs in whatever cache the project uses (React Query, SWR, the framework's own), not copied into `useState`. See [Data fetching](#data-fetching).

## Effects

`useEffect` synchronizes with something **outside React** — a subscription, an event listener, a media element, a third-party widget, the document title. That is its job description, and most `useEffect` calls in a typical codebase are not doing it.

You do not need an effect to:

- **Transform data for rendering** — compute during render.
- **Respond to a user event** — do it in the handler, where you have the event and the intent. An effect that watches state to decide what the click meant has thrown the intent away and is guessing.
- **Reset state when a prop changes** — give the component a `key` instead and let React remount it.
- **Fetch data** — see below.

When you do write one, the cleanup function is not optional: every subscription, listener, timer, and in-flight request gets torn down. Missing cleanup is the standard source of "setState on unmounted component" and of listeners that stack up on every navigation.

## Data fetching

**Never `useEffect` + `fetch` + `setState`.** That pattern has no caching, no deduplication, no retry, races on fast navigation (an older response can land after a newer one and win), and double-fires in StrictMode. Every one of those is a real bug your users will hit.

Fetch in a server component, or use the project's data library. If neither exists and the project is client-only, add one — this is worth a dependency.

Mutations invalidate the cache rather than hand-patching it, unless you are deliberately doing an optimistic update, in which case the rollback path is written at the same time as the optimistic one, not later.

## Rendering and performance

**Do not reach for `memo`, `useMemo`, or `useCallback` by default.** They are not free: each adds a dependency array to keep correct, and a wrong array is a stale-value bug that is much harder to find than the render it saved. React Compiler, where the project has it, makes most manual memoization redundant.

Memoize when you have a measured problem — a genuinely expensive computation, a large list, or a referentially-unstable prop that is provably causing a costly subtree to re-render. Profile first; "this felt slow" is not a measurement.

**Keys are identity, not position.** `key={index}` tells React that the item at slot 3 is the same item it was before, so on insert or reorder it reuses the wrong DOM node and the wrong state — a checkbox stays ticked next to a different row. Use a stable id from the data.

## Forms

For anything past a couple of fields, prefer **uncontrolled inputs with `FormData`**, or the project's form library. Hand-rolling controlled state for twelve fields means twelve pieces of state, twelve handlers, and a re-render of the whole form on every keystroke, in exchange for nothing the platform wasn't already doing.

Controlled inputs earn their cost when you need to react to a value as it changes — live validation, a dependent field, a character counter.

Validate with the same schema on the client and the server. The client copy is UX; the server copy is the actual boundary, and it is never optional, because a client check is advice the user can decline.

## Component shape

- **Props are an interface, not a config bag.** More than about five props, or a `variant` matrix crossed with booleans, usually means two components wearing a trench coat. Split them.
- **Boolean props over enums of two**: `disabled` reads better than `state="disabled"`. Beyond two, a union of literals beats stacked booleans — `isLoading && isError` has states you never meant to allow.
- **`children` over a `content` prop.** It composes, it accepts anything renderable, and it keeps the parent out of the child's layout business.
- **One component per file**, named the same as the file. Small private subcomponents used only by that component can share the file.
- **No business logic in JSX.** Compute above the return; the markup should read as structure.

## Accessibility

This is correctness, not polish — the same category as error handling, and it is much cheaper now than retrofitted.

- **Real elements.** A `<div onClick>` is invisible to keyboards and screen readers. `<button>` for actions, `<a href>` for navigation. Free focus handling, free Enter/Space, free semantics.
- **Every input has a label** — `<label htmlFor>` or an `aria-label`. Placeholder text is not a label; it disappears exactly when the user needs it.
- **Focus is managed on navigation and in dialogs.** A modal traps focus, returns it to the trigger on close, and closes on Escape.
- **Never remove a focus outline without replacing it.** `outline: none` with nothing in its place makes the app unusable by keyboard.
- **Color is never the only signal.** Pair it with text, an icon, or a shape.

## Anti-patterns

- **`useEffect` that calls `setState` from a prop.** Derive it during render, or `key` the component to remount it.
- **Array index as key** on a list that can reorder, filter, or insert.
- **Spreading unknown props onto a DOM node** (`<div {...props}>`) — it leaks React-only props into the DOM and hides what the component actually accepts.
- **A context holding frequently-changing state.** Every consumer re-renders on every change. Split contexts by update frequency, or use a store with selectors.
- **Conditionally calling a hook.** Hooks run in the same order every render, without exception.
- **`dangerouslySetInnerHTML` with anything a user can influence**, unless it has been through a sanitizer. The prop is named as a warning.
