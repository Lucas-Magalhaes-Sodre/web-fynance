# Financial Control Module

## Portugues

Este modulo concentra a UI e os helpers especificos da feature de controle financeiro.

- `components`: componentes da feature e estilos locais.
- `hooks`: hooks da feature quando alguma orquestracao se tornar reutilizavel.
- `services`: adaptadores especificos da feature quando os servicos globais nao forem suficientes.
- `utils`: utilitarios usados apenas por esta feature.
- `validations`: schemas Yup e regras de validacao de formularios.

A pagina `src/pages/FinancialControlPage.tsx` deve permanecer como orquestradora:

- carregar dados
- manter estado de tela
- conectar callbacks
- renderizar os componentes do modulo

UI especifica da feature deve ficar neste modulo. Componentes so devem ir para `src/components` quando forem compartilhados por mais de uma feature.

## English

This module contains the financial control feature-specific UI and helpers.

- `components`: feature components and local styles.
- `hooks`: feature hooks when page orchestration becomes reusable.
- `services`: feature-specific adapters when global services are not enough.
- `utils`: utilities used only by this feature.
- `validations`: Yup schemas and form validation rules.

The `src/pages/FinancialControlPage.tsx` page should remain an orchestrator:

- load data
- hold screen state
- wire callbacks
- render module components

Feature-specific UI belongs in this module. Components should move to `src/components` only when they are shared by more than one feature.
