PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  matricula TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  senha TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'aluno' CHECK (tipo IN ('aluno','professor','admin')),
  telefone TEXT DEFAULT '',
  curso TEXT DEFAULT 'Ensino Médio',
  turma TEXT DEFAULT '',
  disciplina TEXT DEFAULT '',
  criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  aluno_id INTEGER NOT NULL,
  disciplina TEXT NOT NULL,
  etapa TEXT NOT NULL,
  nota REAL NOT NULL CHECK (nota >= 0 AND nota <= 10),
  criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (aluno_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  UNIQUE (aluno_id, disciplina, etapa)
);

CREATE TABLE IF NOT EXISTS faltas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  aluno_id INTEGER NOT NULL,
  disciplina TEXT NOT NULL,
  total_aulas INTEGER NOT NULL CHECK (total_aulas > 0),
  faltas INTEGER NOT NULL DEFAULT 0 CHECK (faltas >= 0 AND faltas <= total_aulas),
  FOREIGN KEY (aluno_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  UNIQUE (aluno_id, disciplina)
);

CREATE TABLE IF NOT EXISTS disponibilidades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  professor_id INTEGER NOT NULL,
  data TEXT NOT NULL,
  hora_inicio TEXT NOT NULL,
  hora_fim TEXT NOT NULL,
  local TEXT NOT NULL DEFAULT 'Sala de Atendimento',
  status TEXT NOT NULL DEFAULT 'disponivel' CHECK (status IN ('disponivel','indisponivel')),
  FOREIGN KEY (professor_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS agendamentos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  aluno_id INTEGER NOT NULL,
  disponibilidade_id INTEGER NOT NULL,
  assunto TEXT NOT NULL,
  observacao TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'agendado' CHECK (status IN ('agendado','cancelado','realizado')),
  criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (aluno_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (disponibilidade_id) REFERENCES disponibilidades(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notas_aluno ON notas(aluno_id);
CREATE INDEX IF NOT EXISTS idx_faltas_aluno ON faltas(aluno_id);
CREATE INDEX IF NOT EXISTS idx_disp_data ON disponibilidades(data);
CREATE INDEX IF NOT EXISTS idx_ag_aluno ON agendamentos(aluno_id);

CREATE TABLE IF NOT EXISTS recuperacao_senha (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expira_em INTEGER NOT NULL,
  criado_em INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
