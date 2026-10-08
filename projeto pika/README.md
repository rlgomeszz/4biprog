# Portal Escolar Acadêmico

Versão de apresentação baseada no Portal Escolar original.

## Perfis de acesso

### Aluno — Área Discente
- Login somente com e-mail discente.
- Consulta de notas.
- Consulta de frequência.
- Plano de estudos organizado pelas menores médias.
- Lista de professores cadastrados com horários disponíveis.
- Agendamento de aula extra.
- O aluno **não consegue lançar ou alterar** notas e frequência.

### Professor — Área Docente
- Login somente com e-mail docente.
- Painel com quantidade de alunos, horários e aulas extras.
- Consulta dos alunos.
- Lançamento e atualização de notas.
- Lançamento e atualização de frequência.
- Cadastro de horários disponíveis para aula extra.
- Consulta das aulas extras agendadas pelos alunos.

## Dados de demonstração

Aluno:
`aluno@escola.com`

Professor:
`professor@escola.com`

Professor adicional:
`prof2@escola.com`

Não há senha no fluxo de demonstração: o tipo de acesso selecionado determina se o e-mail deve ser discente ou docente.

## Como iniciar

```bash
npm install
npm start
```

Depois abra:

`http://localhost:3000`

O banco SQLite fica em `data/escola.sqlite`.


## Contas de demonstração

Aluno principal: aluno@escola.com / 123456
Professor: professor@escola.com / 123456
Professor 2: prof2@escola.com / 123456

Alunos adicionais: cada conta usa a senha indicada abaixo.
- ana.souza@escola.com / Aluno2026@02
- bruno.lima@escola.com / Aluno2026@03
- carlos.santos@escola.com / Aluno2026@04
- daniela.alves@escola.com / Aluno2026@05
- eduardo.costa@escola.com / Aluno2026@06
- fernanda.silva@escola.com / Aluno2026@07
- gabriel.oliveira@escola.com / Aluno2026@08
- helena.martins@escola.com / Aluno2026@09
- igor.rodrigues@escola.com / Aluno2026@10
- juliana.pereira@escola.com / Aluno2026@11
