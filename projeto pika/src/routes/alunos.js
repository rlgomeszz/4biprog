const express = require('express');
const { get, run } = require('../db/database');
const router = express.Router();
const auth = require('./auth');
function userId(req) { const t = req.headers.authorization?.replace('Bearer ', ''); return t && auth.sessions.get(t); }

router.put('/perfil', (req, res) => {
  const id = userId(req); if (!id) return res.status(401).json({ erro: 'Não autenticado.' });
  const atual = get('SELECT * FROM usuarios WHERE id = ?', [id]);
  if (!atual) return res.status(404).json({ erro: 'Usuário não encontrado.' });
  const { nome = atual.nome, telefone = atual.telefone, curso = atual.curso, turma = atual.turma } = req.body;
  run('UPDATE usuarios SET nome = ?, telefone = ?, curso = ?, turma = ?, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?', [nome, telefone, curso, turma, id]);
  const user = get('SELECT id,nome,matricula,email,tipo,telefone,curso,turma,criado_em,atualizado_em FROM usuarios WHERE id = ?', [id]);
  res.json({ usuario: user, mensagem: 'Dados pessoais atualizados.' });
});

module.exports = router;
