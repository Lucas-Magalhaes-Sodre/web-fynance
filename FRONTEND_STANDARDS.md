# Frontend Standards

## Base Structure

The frontend source lives in `src/`.

- `src/components`: shared application components, organized with Atomic Design.
  - `atoms`
  - `molecules`
  - `organisms`
  - `templates`
- `src/modules`: business features and modules.
- `src/routes`: route configuration with `react-router-dom`.
- `src/services`: global API integrations and services.
- `src/hooks`: reusable global hooks.
- `src/contexts`: global React contexts.
- `src/interfaces`: shared interfaces and global types.
- `src/styles`: theme, palette, global styles and design tokens.
- `src/utils`: utility functions.
- `src/config`: application configuration.

## Module Structure

Modules should be separated by responsibility as needed:

```text
ModuleName/
├── pages/
├── components/
├── services/
├── hooks/
├── utils/
├── validations/
└── contexts/
```

Use only the folders that the feature actually needs.

## Component Structure

New components should live in their own folder:

```text
ComponentName/
├── index.tsx
└── styles.ts
```

`styles.ts` must use `styled-components`. Import styles as:

```ts
import * as S from "./styles";
```

Avoid inline styles and MUI `sx` in new code whenever possible.

## Services

Services should follow this layout when the feature needs API integration:

```text
services/
├── api.ts
├── dto.ts
├── queries.ts
└── index.ts
```

Global Axios configuration lives in `src/services/api.ts`.

## Main Stack

- TypeScript strict
- Alias imports with `@/`
- styled-components
- React Query
- Recoil
- Axios
- React Hook Form
- Yup
- Jest
- Cypress

## Development Rules

- Use TypeScript everywhere.
- Avoid `any`, `unknown`, `as` and non-null assertions.
- Prefer `interface` over `type`.
- Components use PascalCase.
- Hooks start with `use`.
- Variables and functions use camelCase.
- Exported primitive global constants use UPPERCASE.
- Forms use React Hook Form + Yup.
- Prefer early returns and avoid unnecessary `else`.
- Tests should accompany behavior changes when they add useful confidence.
- Imports are handled by Prettier/formatter configuration.

## Migration Notes

The project is being migrated incrementally to these standards. Existing legacy files may still use older patterns, but new code should follow this document.
