const express = require('express');
const crypto = require('crypto');
const { get, query, run } = require('../db/database');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

const router = express.Router();
const sessions = new Map();

function normalizeEmail(email) { return String(email || '').trim().toLowerCase(); }
function makeToken() { return crypto.randomBytes(32).toString('hex'); }
function publicUser(user) {
  if (!user) return null;
  const { senha, ...safe } = user;
  return safe;
}

router.post('/login', (req, res) => {
  const email = normalizeEmail(req.body.email);
  const senha = String(req.body.senha || '');
  const tipo = String(req.body.tipo || '').toLowerCase();

  if (!email || !senha || !['aluno', 'professor'].includes(tipo)) {
    return res.status(400).json({ erro: 'Informe o e-mail e o tipo de acesso.' });
  }

  const user = get('SELECT * FROM usuarios WHERE lower(email) = ? AND tipo = ?', [email, tipo]);
  if (!user || !bcrypt.compareSync(senha, user.senha)) {
    return res.status(401).json({
      erro: tipo === 'aluno'
        ? 'E-mail discente não encontrado.'
        : 'E-mail docente não encontrado.'
    });
  }

  const token = makeToken();
  sessions.set(token, user.id);
  res.json({ token, usuario: publicUser(user) });
});



router.post('/cadastro-aluno', (req, res) => {
  const nome = String(req.body.nome || '').trim();
  const email = normalizeEmail(req.body.email);
  const senha = String(req.body.senha || '');
  const confirmar = String(req.body.confirmarSenha || '');
  const matricula = String(req.body.matricula || '').trim();
  const curso = String(req.body.curso || 'Ensino Médio').trim();
  const turma = String(req.body.turma || '').trim();
  if (!nome || !email || !senha || !matricula) return res.status(400).json({ erro: 'Preencha nome, matrícula, e-mail e senha.' });
  if (senha.length < 6) return res.status(400).json({ erro: 'A senha deve ter pelo menos 6 caracteres.' });
  if (senha !== confirmar) return res.status(400).json({ erro: 'As senhas não conferem.' });
  if (get('SELECT id FROM usuarios WHERE lower(email)=?', [email])) return res.status(409).json({ erro: 'Este e-mail já está cadastrado.' });
  if (get('SELECT id FROM usuarios WHERE matricula=?', [matricula])) return res.status(409).json({ erro: 'Esta matrícula já está cadastrada.' });
  const id = run(`INSERT INTO usuarios(nome,matricula,email,senha,tipo,curso,turma) VALUES(?,?,?,?,?,?,?)`, [nome, matricula, email, bcrypt.hashSync(senha, 10), 'aluno', curso, turma]);
  res.status(201).json({ usuario: publicUser(get('SELECT * FROM usuarios WHERE id=?', [id])), mensagem: 'Aluno cadastrado com sucesso.' });
});

router.post('/cadastro-professor', (req, res) => {
  const nome = String(req.body.nome || '').trim();
  const email = normalizeEmail(req.body.email);
  const senha = String(req.body.senha || '');
  const confirmar = String(req.body.confirmarSenha || '');
  const matricula = String(req.body.matricula || '').trim();
  const telefone = String(req.body.telefone || '').trim();
  const disciplina = String(req.body.disciplina || '').trim();

  if (!nome || !email || !senha || !matricula || !disciplina) {
    return res.status(400).json({ erro: 'Preencha nome, matrícula, e-mail, disciplina e senha.' });
  }
  if (!email.includes('@')) {
    return res.status(400).json({ erro: 'Informe um e-mail válido.' });
  }
  if (senha.length < 6) {
    return res.status(400).json({ erro: 'A senha deve ter pelo menos 6 caracteres.' });
  }
  if (senha !== confirmar) {
    return res.status(400).json({ erro: 'As senhas não conferem.' });
  }
  if (get('SELECT id FROM usuarios WHERE lower(email)=?', [email])) {
    return res.status(409).json({ erro: 'Este e-mail já está cadastrado.' });
  }
  if (get('SELECT id FROM usuarios WHERE matricula=?', [matricula])) {
    return res.status(409).json({ erro: 'Esta matrícula já está cadastrada.' });
  }

  const id = run(
    `INSERT INTO usuarios(nome,matricula,email,senha,tipo,telefone,curso,turma,disciplina)
     VALUES(?,?,?,?,?,?,?,?,?)`,
    [nome, matricula, email, bcrypt.hashSync(senha, 10), 'professor', telefone, '', '', disciplina]
  );

  res.status(201).json({
    usuario: publicUser(get('SELECT * FROM usuarios WHERE id=?', [id])),
    mensagem: 'Professor cadastrado com sucesso. Agora entre com seu e-mail e senha.'
  });
});

router.post('/esqueci-senha', async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const user = get("SELECT * FROM usuarios WHERE lower(email)=? AND tipo='professor'", [email]);
  if (!user) return res.json({ mensagem: 'Se o e-mail docente estiver cadastrado, as instruções de recuperação serão enviadas.' });
  const raw = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  run('DELETE FROM recuperacao_senha WHERE usuario_id=?', [user.id]);
  run('INSERT INTO recuperacao_senha(usuario_id,token_hash,expira_em) VALUES(?,?,?)', [user.id, hash, Date.now() + 30*60*1000]);
  const base = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;
  const link = `${base}/?reset=${raw}`;
  const smtpConfigured = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
  if (smtpConfigured) {
    const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: String(process.env.SMTP_SECURE || 'false') === 'true', auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
    try { await transporter.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to: user.email, subject: 'Recuperação de senha — Portal Escolar', text: `Olá, ${user.nome}. Acesse este link para criar uma nova senha: ${link}. O link expira em 30 minutos.` }); } catch (e) { console.error('Falha ao enviar recuperação:', e); return res.status(500).json({ erro: 'Não foi possível enviar o e-mail de recuperação.' }); }
  } else {
    console.log(`\n[RECUPERAÇÃO - SMTP não configurado] ${user.email}: ${link}\n`);
  }
  res.json({ mensagem: 'Se o e-mail docente estiver cadastrado, as instruções de recuperação serão enviadas.', ...(smtpConfigured ? {} : { modoDemo: true, link }) });
});

router.post('/redefinir-senha', (req, res) => {
  const raw = String(req.body.token || '');
  const senha = String(req.body.senha || '');
  if (!raw || senha.length < 6) return res.status(400).json({ erro: 'Informe um token válido e uma senha com pelo menos 6 caracteres.' });
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  const rec = get('SELECT * FROM recuperacao_senha WHERE token_hash=? AND expira_em>?', [hash, Date.now()]);
  if (!rec) return res.status(400).json({ erro: 'Link de recuperação inválido ou expirado.' });
  run('UPDATE usuarios SET senha=?, atualizado_em=CURRENT_TIMESTAMP WHERE id=?', [bcrypt.hashSync(senha, 10), rec.usuario_id]);
  run('DELETE FROM recuperacao_senha WHERE id=?', [rec.id]);
  res.json({ mensagem: 'Senha redefinida com sucesso.' });
});

router.get('/me', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const id = token && sessions.get(token);
  if (!id) return res.status(401).json({ erro: 'Não autenticado.' });
  res.json({ usuario: publicUser(get('SELECT * FROM usuarios WHERE id = ?', [id])) });
});

router.post('/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) sessions.delete(token);
  res.json({ ok: true });
});

router.sessions = sessions;
module.exports = router;
