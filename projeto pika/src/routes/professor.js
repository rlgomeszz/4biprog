const express = require('express');
const { get, query, run } = require('../db/database');
const auth = require('./auth');
const router = express.Router();

function current(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const id = token && auth.sessions.get(token);
  return id ? get('SELECT * FROM usuarios WHERE id=?', [id]) : null;
}
function professor(req, res) {
  const u = current(req);
  if (!u) { res.status(401).json({ erro: 'Não autenticado.' }); return null; }
  if (u.tipo !== 'professor') { res.status(403).json({ erro: 'Acesso exclusivo para professores.' }); return null; }
  return u;
}

router.get('/alunos', (req,res) => {
  if (!professor(req,res)) return;
  const rows = query(`SELECT id,nome,matricula,email,curso,turma
    FROM usuarios WHERE tipo='aluno' ORDER BY nome`);
  res.json(rows);
});

router.get('/alunos/:id/resumo', (req,res) => {
  const p = professor(req,res); if (!p) return;
  const aluno = get(`SELECT id,nome,matricula,email,curso,turma FROM usuarios
    WHERE id=? AND tipo='aluno'`, [req.params.id]);
  if (!aluno) return res.status(404).json({ erro:'Aluno não encontrado.' });
  const notas = query(`SELECT id,disciplina,etapa,nota FROM notas WHERE aluno_id=? AND disciplina=?
    ORDER BY etapa`, [aluno.id, p.disciplina]);
  const faltas = query(`SELECT id,disciplina,total_aulas,faltas,
    (total_aulas-faltas) AS frequentadas,
    ROUND(((total_aulas-faltas)*100.0)/total_aulas,1) AS percentual
    FROM faltas WHERE aluno_id=? AND disciplina=? ORDER BY disciplina`, [aluno.id, p.disciplina]);
  res.json({ aluno, notas, faltas });
});

router.post('/notas', (req,res) => {
  const aluno_id=Number(req.body.aluno_id), disciplina=String(req.body.disciplina||'').trim();
  const etapa=String(req.body.etapa||'').trim(), nota=Number(req.body.nota);
  if (!aluno_id || !disciplina || !etapa || !Number.isFinite(nota) || nota<0 || nota>10)
    return res.status(400).json({erro:'Preencha os dados corretamente. A nota deve estar entre 0 e 10.'});
  const p = professor(req,res); if (!p) return;
  if (disciplina.toLocaleLowerCase('pt-BR') !== String(p.disciplina).trim().toLocaleLowerCase('pt-BR'))
    return res.status(403).json({erro:`Você só pode lançar notas da disciplina ${p.disciplina}.`});
  if (!get(`SELECT id FROM usuarios WHERE id=? AND tipo='aluno'`,[aluno_id]))
    return res.status(404).json({erro:'Aluno não encontrado.'});
  const existente=get('SELECT id FROM notas WHERE aluno_id=? AND disciplina=? AND etapa=?',[aluno_id,disciplina,etapa]);
  if (existente) {
    run('UPDATE notas SET nota=? WHERE id=?',[nota,existente.id]);
    return res.json(get('SELECT id,disciplina,etapa,nota FROM notas WHERE id=?',[existente.id]));
  }
  const id=run('INSERT INTO notas (aluno_id,disciplina,etapa,nota) VALUES (?,?,?,?)',[aluno_id,disciplina,etapa,nota]);
  res.status(201).json(get('SELECT id,disciplina,etapa,nota FROM notas WHERE id=?',[id]));
});

router.post('/frequencia', (req,res) => {
  const aluno_id=Number(req.body.aluno_id), disciplina=String(req.body.disciplina||'').trim();
  const total=Number(req.body.total_aulas), faltas=Number(req.body.faltas);
  if (!aluno_id || !disciplina || !Number.isInteger(total) || total<=0 || !Number.isInteger(faltas) || faltas<0 || faltas>total)
    return res.status(400).json({erro:'Informe aulas e faltas válidas.'});
  const p = professor(req,res); if (!p) return;
  if (disciplina.toLocaleLowerCase('pt-BR') !== String(p.disciplina).trim().toLocaleLowerCase('pt-BR'))
    return res.status(403).json({erro:`Você só pode lançar frequência da disciplina ${p.disciplina}.`});
  if (!get(`SELECT id FROM usuarios WHERE id=? AND tipo='aluno'`,[aluno_id]))
    return res.status(404).json({erro:'Aluno não encontrado.'});
  const existente=get('SELECT id FROM faltas WHERE aluno_id=? AND disciplina=?',[aluno_id,disciplina]);
  if (existente) {
    run('UPDATE faltas SET total_aulas=?, faltas=? WHERE id=?',[total,faltas,existente.id]);
    return res.json({ok:true});
  }
  run('INSERT INTO faltas (aluno_id,disciplina,total_aulas,faltas) VALUES (?,?,?,?)',[aluno_id,disciplina,total,faltas]);
  res.status(201).json({ok:true});
});

router.post('/disponibilidades', (req,res) => {
  const p=professor(req,res); if (!p) return;
  const {data,hora_inicio,hora_fim,local='Sala de Atendimento'}=req.body;
  if (!data || !hora_inicio || !hora_fim) return res.status(400).json({erro:'Informe data e horário.'});
  if (hora_inicio >= hora_fim) return res.status(400).json({erro:'O horário final deve ser maior que o inicial.'});
  const id=run(`INSERT INTO disponibilidades (professor_id,data,hora_inicio,hora_fim,local)
    VALUES (?,?,?,?,?)`,[p.id,data,hora_inicio,hora_fim,local]);
  res.status(201).json(get(`SELECT d.*,u.nome AS professor FROM disponibilidades d
    JOIN usuarios u ON u.id=d.professor_id WHERE d.id=?`,[id]));
});

router.get('/meus-horarios', (req,res) => {
  const p=professor(req,res); if (!p) return;
  res.json(query(`SELECT d.id,d.data,d.hora_inicio,d.hora_fim,d.local,
    CASE WHEN EXISTS(SELECT 1 FROM agendamentos a WHERE a.disponibilidade_id=d.id AND a.status='agendado')
    THEN 'reservado' ELSE 'disponivel' END AS situacao
    FROM disponibilidades d WHERE d.professor_id=? ORDER BY d.data,d.hora_inicio`,[p.id]));
});

router.get('/agendamentos', (req,res) => {
  const p=professor(req,res); if (!p) return;
  res.json(query(`SELECT a.id,a.assunto,a.observacao,a.status,
    d.data,d.hora_inicio,d.hora_fim,d.local,u.nome AS aluno,u.matricula
    FROM agendamentos a
    JOIN disponibilidades d ON d.id=a.disponibilidade_id
    JOIN usuarios u ON u.id=a.aluno_id
    WHERE d.professor_id=? ORDER BY d.data,d.hora_inicio`,[p.id]));
});

module.exports=router;
