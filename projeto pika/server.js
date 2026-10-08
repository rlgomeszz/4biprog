require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { getDb, query } = require('./src/db/database');
const seed = require('./src/db/seed');
const auth = require('./src/routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname,'public')));

app.get('/api/health',(req,res)=>res.json({ok:true,projeto:'Portal Escolar Acadêmico'}));
app.use('/api/auth',auth);
app.use('/api/notas',require('./src/routes/notas'));
app.use('/api/faltas',require('./src/routes/faltas'));
app.use('/api/agendamento',require('./src/routes/agendamento'));
app.use('/api/alunos',require('./src/routes/alunos'));
app.use('/api/professor',require('./src/routes/professor'));

app.get('/api/dashboard',(req,res)=>{
  const token=req.headers.authorization?.replace('Bearer ','');
  const id=auth.sessions.get(token);
  if(!id) return res.status(401).json({erro:'Não autenticado.'});
  const u=query('SELECT * FROM usuarios WHERE id=?',[id])[0];
  if(u.tipo==='professor'){
    const alunos=query("SELECT COUNT(*) AS total FROM usuarios WHERE tipo='aluno'")[0].total;
    const atend=query(`SELECT COUNT(*) AS total FROM agendamentos a JOIN disponibilidades d ON d.id=a.disponibilidade_id
      WHERE d.professor_id=? AND a.status='agendado'`,[id])[0].total;
    const horarios=query("SELECT COUNT(*) AS total FROM disponibilidades WHERE professor_id=?",[id])[0].total;
    return res.json({tipo:'professor',alunos,atendimentos:atend,horarios});
  }
  const media=query('SELECT ROUND(AVG(nota),1) AS media FROM notas WHERE aluno_id=?',[id])[0]?.media??0;
  const freq=query('SELECT ROUND(SUM(total_aulas-faltas)*100.0/SUM(total_aulas),1) AS percentual FROM faltas WHERE aluno_id=?',[id])[0]?.percentual??0;
  const faltas=query('SELECT COALESCE(SUM(faltas),0) AS total FROM faltas WHERE aluno_id=?',[id])[0].total;
  const agendamentos=query("SELECT COUNT(*) AS total FROM agendamentos WHERE aluno_id=? AND status='agendado'",[id])[0].total;
  res.json({tipo:'aluno',media,frequencia:freq,faltas,agendamentos});
});

app.use((req,res)=>res.status(404).json({erro:'Rota não encontrada.'}));

getDb().then(seed).then(()=>app.listen(PORT,()=>console.log(`\nPortal Escolar Acadêmico: http://localhost:${PORT}\nAluno: aluno@escola.com\nProfessor: professor@escola.com\n`)))
.catch(err=>{console.error(err);process.exit(1);});
