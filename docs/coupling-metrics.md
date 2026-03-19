# Coupling Metrics Report

**Generated:** 2026-03-19
**Threshold:** Ca+Ce > 1 flagged as high coupling

## Module Coupling

| Module       | Files | Ca (incoming) | Ce (outgoing) | Total | Instability | Flag    |
| ------------ | ----- | ------------- | ------------- | ----- | ----------- | ------- |
| composables  | 268   | 3             | 3             | 6     | 0.50        | ⚠️ HIGH |
| components   | 536   | 2             | 2             | 4     | 0.50        | ⚠️ HIGH |
| pages        | 134   | 0             | 4             | 4     | 1.00        | ⚠️ HIGH |
| app-utils    | 36    | 3             | 1             | 4     | 0.25        | ⚠️ HIGH |
| server-utils | 63    | 4             | 0             | 4     | 0.00        | ⚠️ HIGH |
| api          | 137   | 0             | 2             | 2     | 1.00        | ⚠️ HIGH |
| services     | 12    | 1             | 1             | 2     | 0.50        | ⚠️ HIGH |

## Interpretation

- **Ca (Afferent):** How many modules depend on this one. High Ca = stable, hard to change.
- **Ce (Efferent):** How many modules this depends on. High Ce = fragile, many reasons to change.
- **Instability:** Ce/(Ca+Ce). 0=maximally stable, 1=maximally unstable.
- **Flag:** Modules with Ca+Ce > threshold are hub modules that may need refactoring.

## Dependency Details

### composables

- **Depended on by:** components, pages, app-utils
- **Depends on:** app-utils, components, server-utils

### components

- **Depended on by:** composables, pages
- **Depends on:** composables, app-utils

### pages

- **Depends on:** composables, components, app-utils, server-utils

### app-utils

- **Depended on by:** composables, components, pages
- **Depends on:** composables

### server-utils

- **Depended on by:** composables, pages, api, services

### api

- **Depends on:** server-utils, services

### services

- **Depended on by:** api
- **Depends on:** server-utils
