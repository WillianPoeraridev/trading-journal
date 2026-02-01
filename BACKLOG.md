# BACKLOG

## Futuro — Aba Setups (Padrões)

### Visão geral
- Criar uma nova aba/tela **Setups** para cadastrar e organizar padrões de operação.
- Objetivo: manter uma biblioteca pessoal de setups com critérios claros e reutilizáveis.

### CRUD de padrões
Estrutura sugerida do setup:
```
{
  id: string,
  name: string,
  description: string,
  tags: string[],
  markets: string[],
  timeframe?: string,
  checklist: string[]
}
```

Funcionalidades previstas:
- **Criar** novo setup
- **Editar** setup existente
- **Excluir** setup
- **Listar** com paginação simples (se necessário)

### Busca e filtros
- Busca por texto (nome/descrição)
- Filtros por **tags**, **mercados** e **timeframe**
- Ordenação por nome ou data de atualização

### Persistência
- Salvar no `localStorage`
- Chave: `tradingJournal:setups`
- Estrutura inicial: array de setups

### Integração futura (opcional)
- Adicionar `patternId` ao trade **sem alterar cálculos**
- Usar para estatísticas por setup (ex.: winrate por padrão)

### Estrutura de pastas/arquivos sugerida
```
src/
  core/
    setups.ts        # tipos e helpers (CRUD, filtros, persistência)
  components/
    setups/
      SetupForm.tsx
      SetupList.tsx
      SetupFilters.tsx
  pages/
    SetupsPage.tsx
```
