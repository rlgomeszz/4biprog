const express = require('express');
const { get, query, run } = require('../db/database');
const router = express.Router();
const auth = require('./auth');
function userId(req) { const t = req.headers.authorization?.replace('Bearer ', ''); return t && auth.sessions.get(t); }


router.get('/professores', (req,res) => {
  const id=userId(req); if(!id) return res.status(401).json({erro:'Não autenticado.'});
  res.json(query(`SELECT DISTINCT u.id,u.nome,u.email,u.curso,u.disciplina
    FROM usuarios u
    WHERE u.tipo='professor' ORDER BY u.nome`));
});

router.get('/disponibilidades', (req, res) => {
  const id = userId(req); if (!id) return res.status(401).json({ erro: 'Não autenticado.' });
  const rows = query(`SELECT d.id,d.data,d.hora_inicio,d.hora_fim,d.local,u.nome AS professor,u.disciplina
    FROM disponibilidades d JOIN usuarios u ON u.id=d.professor_id
    WHERE d.status='disponivel' AND d.data >= date('now','localtime') AND NOT EXISTS (
      SELECT 1 FROM agendamentos a WHERE a.disponibilidade_id=d.id AND a.status='agendado'
    ) ORDER BY d.data,d.hora_inicio`);
  res.json(rows);
});

router.get('/meus', (req, res) => {
  const id = userId(req); if (!id) return res.status(401).json({ erro: 'Não autenticado.' });
  res.json(query(`SELECT a.id,a.assunto,a.observacao,a.status,d.data,d.hora_inicio,d.hora_fim,d.local,u.nome AS professor
    FROM agendamentos a JOIN disponibilidades d ON d.id=a.disponibilidade_id JOIN usuarios u ON u.id=d.professor_id
    WHERE a.aluno_id=? ORDER BY d.data DESC,d.hora_inicio DESC`, [id]));
});

router.post('/', (req, res) => {
  const id = userId(req); if (!id) return res.status(401).json({ erro: 'Não autenticado.' });
  const { disponibilidade_id, assunto, observacao = '' } = req.body;
  if (!disponibilidade_id || !assunto) return res.status(400).json({ erro: 'Informe horário e assunto.' });
  const disp = get(`SELECT d.*,u.nome AS professor FROM disponibilidades d JOIN usuarios u ON u.id=d.professor_id WHERE d.id=?`, [disponibilidade_id]);
  if (!disp) return res.status(404).json({ erro: 'Horário não encontrado.' });
  if (disp.status !== 'disponivel') return res.status(409).json({ erro: 'Horário indisponível.' });
  if (get(`SELECT id FROM agendamentos WHERE disponibilidade_id=? AND status='agendado'`, [disponibilidade_id])) return res.status(409).json({ erro: 'Esse horário acabou de ser reservado.' });
  if (get(`SELECT a.id FROM agendamentos a JOIN disponibilidades d ON d.id=a.disponibilidade_id WHERE a.aluno_id=? AND a.status='agendado' AND d.data=? AND d.hora_inicio=?`, [id, disp.data, disp.hora_inicio])) return res.status(409).json({ erro: 'Você já possui agendamento neste horário.' });
  const novo = run('INSERT INTO agendamentos (aluno_id,disponibilidade_id,assunto,observacao) VALUES (?,?,?,?)', [id, disponibilidade_id, assunto, observacao]);
  res.status(201).json(get(`SELECT a.id,a.assunto,a.observacao,a.status,d.data,d.hora_inicio,d.hora_fim,d.local,u.nome AS professor FROM agendamentos a JOIN disponibilidades d ON d.id=a.disponibilidade_id JOIN usuarios u ON u.id=d.professor_id WHERE a.id=?`, [novo]));
});

router.delete('/:id', (req, res) => {
  const id = userId(req); if (!id) return res.status(401).json({ erro: 'Não autenticado.' });
  const ag = get('SELECT * FROM agendamentos WHERE id=? AND aluno_id=?', [req.params.id, id]);
  if (!ag) return res.status(404).json({ erro: 'Agendamento não encontrado.' });
  run(`UPDATE agendamentos SET status='cancelado' WHERE id=?`, [ag.id]);
  res.json({ mensagem: 'Agendamento cancelado.' });
});
module.exports = router;
