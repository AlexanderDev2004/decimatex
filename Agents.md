# Decimatex – AI Agent Guidelines

## Project Overview

**Decimatex** is a Decision Support System (DSS) platform that automates decision analysis using mathematical multi-criteria decision making (MCDM) methods.

The platform allows users to:

* Define decision problems
* Create criteria and alternatives
* Generate decision matrices
* Apply DSS algorithms
* Visualize ranking results

Decimatex acts as a **universal DSS calculation engine with a web interface**.

---

# Core Concept

A DSS problem in Decimatex follows this structure:

Decision Problem
→ Criteria
→ Alternatives
→ Decision Matrix
→ DSS Method
→ Ranking Result

Example flow:

User Input
↓
Decision Matrix
↓
Run DSS Algorithm (TOPSIS / AHP / EDAS / PSI)
↓
Score Calculation
↓
Ranking Result

---

# Supported DSS Methods

The system should support modular DSS algorithms including:

* AHP (Analytic Hierarchy Process)
* TOPSIS (Technique for Order Preference by Similarity)
* EDAS (Evaluation based on Distance from Average Solution)
* PSI (Preference Selection Index)
* VIKOR
* MOORA
* ELECTRE
* PROMETHEE
* COPRAS

Each method must follow the **standard DSS pipeline**.

---

# DSS Engine Pipeline

All DSS algorithms must follow this pipeline:

1. Matrix Validation
2. Normalization
3. Weight Application
4. Method-specific computation
5. Score generation
6. Ranking

Example pipeline:

Input Matrix
↓
Normalize values
↓
Apply criteria weights
↓
Method computation
↓
Generate scores
↓
Sort ranking

All methods must return:

```
{
  alternativeId: string
  score: number
  rank: number
}
```

---

# Domain Model

Core DSS entities:

## DecisionProblem

Represents a decision scenario.

Fields:

```
id
name
description
createdAt
```

---

## Criteria

Represents evaluation criteria.

```
id
decisionId
name
weight
type (benefit | cost)
```

---

## Alternative

Represents a possible option.

```
id
decisionId
name
description
```

---

## DecisionMatrix

Represents matrix values.

```
alternativeId
criteriaId
value
```

---

## Method

Represents DSS method.

```
id
name
description
```

---

## RankingResult

Stores computation results.

```
alternativeId
score
rank
method
```

---

# Technology Stack

Frontend

* TanStack Router
* TanStack Query
* React
* TailwindCSS
* shadcn/ui

Desktop

* Electron

Backend

* Bun runtime
* Effect-TS
* RPC server functions

Database

* PostgreSQL
* Drizzle ORM

Deployment

* Cloudflare

---

# Development Commands

```
# Development
bun run dev
bun run dev:desktop
bun run typecheck
bun run lint
bun run format

# Testing
bun run test
bun run test:ui
bun run test:service
bun run test:watch

# Single test
bun run test:ui -- src/components/Button.test.tsx
bun run test:service -- src/features/topic/lib/topic-service.test.ts

# Production
bun run build
bun run build:desktop
bun run desktop
bun run deploy
```

---

# Code Style

| Category      | Rule                                  |
| ------------- | ------------------------------------- |
| Formatting    | oxfmt, tabs, width 4                  |
| Imports       | automatic sorting                     |
| React imports | `import type * as React from "react"` |
| Type imports  | always use `import type`              |
| Path alias    | `@/*` for src                         |
| Components    | PascalCase                            |
| Hooks         | camelCase                             |
| Errors        | PascalCase ending with Error          |

Example:

```
UserNotFoundError
MatrixValidationError
CriteriaWeightError
```

---

# Effect-TS Service Pattern

All business logic must be implemented using Effect services.

Example service:

```
export class UserNotFoundError extends Data.TaggedError("UserNotFoundError")<{
  readonly userId: string;
}> {}

export const getUser = Effect.fn("getUser")((userId: string) =>
  Effect.gen(function* () {
    const db = yield* Database

    const user = yield* db.getUser(userId)

    if (!user)
      return yield* new UserNotFoundError({ userId })

    return user
  })
)
```

---

# RPC Handler Pattern

Server functions should wrap Effect services.

Example:

```
export const getUserRpc = createServerFn()
  .middleware([authMiddleware])
  .handler(({ data }) =>
    Effect.gen(function* () {

      const result = yield* getUser(data.userId)

      return yield* Rpc.ok(result)

    }).pipe(
      Effect.catchTags({
        UserNotFoundError: () => Rpc.notFound("User"),
      }),
      Effect.catchAll(() => Rpc.err("Internal server error")),
      Effect.provide(AppLayer),
      Effect.runPromise
    )
  )
```

---

# React Query Integration

RPC calls should be wrapped in queryOptions.

Example:

```
export const UserRpc = {

  users: () => ["users"],

  getUser: (userId: string) =>
    queryOptions({
      queryKey: [...UserRpc.users(), userId],
      queryFn: () => getUserRpc({ data: { userId } })
    }),

  updateUser: () =>
    mutationOptions({
      mutationKey: UserRpc.users(),
      mutationFn: (data) => updateUserRpc({ data })
    })
}
```

Usage in component:

```
const { data, isLoading } = useRpcQuery(UserRpc.getUser(id))
```

---

# Testing Strategy

UI Tests

File suffix:

```
.test.tsx
```

Example:

```
render(<Button>Click</Button>)
expect(screen.getByText("Click")).toBeInTheDocument()
```

---

Service Tests

File suffix:

```
.test.ts
```

Effect testing pattern:

```
it.effect("should work", () =>
  Effect.gen(function* () {
    const result = yield* myService()
    expect(result).toEqual(...)
  }).pipe(Effect.provide(AppLayerTest))
)
```

---

# Project Architecture

```
src

features/
  decision/
  criteria/
  alternatives/

server/
  rpc/
  db/
  app-layer.ts

components/
hooks/
lib/
routes/
```

Feature module structure:

```
features/{feature}

components/
hooks/
lib/
```

---

# DSS Method Implementation

Each DSS algorithm must be implemented as:

```
src/features/decision/lib/methods/{method}.ts
```

Example:

```
methods/
  ahp.ts
  topsis.ts
  edas.ts
  psi.ts
```

All methods must implement:

```
run(matrix, weights): RankingResult[]
```

---

# Styling

UI uses:

* TailwindCSS
* shadcn/ui components

Use `cn()` helper for class composition.

---

# Resources

Effect documentation:

```
~/.local/share/effect-solutions/effect
```

List guides:

```
effect-solutions list
```

---

# AI Agent Behavior Guidelines

When implementing features:

1. Follow domain model
2. Implement logic as Effect services
3. Expose functionality via RPC handlers
4. Use React Query for data fetching
5. Follow DSS pipeline for algorithms
6. Write tests for services and UI
7. Avoid duplicating algorithm logic
8. Prefer composable Effect pipelines
