const bcrypt=require('bcryptjs');
const {getDb,run,get,save}=require('./database');

async function seed(){
 await getDb();
 const senha=bcrypt.hashSync('123456',10);
 let aluno=get("SELECT id FROM usuarios WHERE lower(email)=?",['aluno@escola.com']);
 if(!aluno){
  const id=run(`INSERT INTO usuarios(nome,matricula,email,senha,tipo,telefone,curso,turma)
   VALUES(?,?,?,?,?,?,?,?)`,['Aluno Demonstração','2026001','aluno@escola.com',senha,'aluno','(85) 99999-0001','Ensino Médio','2°C']);
  aluno={id};
 }
 let prof=get("SELECT id FROM usuarios WHERE lower(email)=?",['professor@escola.com']);
 if(!prof){
  const id=run(`INSERT INTO usuarios(nome,matricula,email,senha,tipo,telefone,curso,turma,disciplina)
   VALUES(?,?,?,?,?,?,?,?,?)`,['Professora Maria Silva','PROF001','professor@escola.com',senha,'professor','(85) 98888-0002','','','Programação']);
  prof={id};
 } else {
  run("UPDATE usuarios SET disciplina='Programação' WHERE id=? AND (disciplina IS NULL OR disciplina='')",[prof.id]);
 }
 let prof2=get("SELECT id FROM usuarios WHERE lower(email)=?",['prof2@escola.com']);
 if(!prof2){
  const id=run(`INSERT INTO usuarios(nome,matricula,email,senha,tipo,telefone,curso,turma,disciplina)
   VALUES(?,?,?,?,?,?,?,?,?)`,['Professor João Oliveira','PROF002','prof2@escola.com',senha,'professor','(85) 97777-0003','','','Matemática']);
  prof2={id};
 } else {
  run("UPDATE usuarios SET disciplina='Matemática' WHERE id=? AND (disciplina IS NULL OR disciplina='')",[prof2.id]);
 }
 const alunosDemo=[
  ['Ana Souza','2026002','ana.souza@escola.com','Aluno2026@02','2°C'],['Bruno Lima','2026003','bruno.lima@escola.com','Aluno2026@03','2°C'],
  ['Carlos Santos','2026004','carlos.santos@escola.com','Aluno2026@04','2°C'],['Daniela Alves','2026005','daniela.alves@escola.com','Aluno2026@05','2°C'],
  ['Eduardo Costa','2026006','eduardo.costa@escola.com','Aluno2026@06','2°C'],['Fernanda Silva','2026007','fernanda.silva@escola.com','Aluno2026@07','2°C'],
  ['Gabriel Oliveira','2026008','gabriel.oliveira@escola.com','Aluno2026@08','2°C'],['Helena Martins','2026009','helena.martins@escola.com','Aluno2026@09','2°C'],
  ['Igor Rodrigues','2026010','igor.rodrigues@escola.com','Aluno2026@10','2°C'],['Juliana Pereira','2026011','juliana.pereira@escola.com','Aluno2026@11','2°C']
 ];
 for(const a of alunosDemo){
   let existing=get('SELECT id FROM usuarios WHERE lower(email)=?', [a[2]]);
   if(!existing) { const id=run(`INSERT INTO usuarios(nome,matricula,email,senha,tipo,curso,turma) VALUES(?,?,?,?,?,?,?)`,[a[0],a[1],a[2],bcrypt.hashSync(a[3],10),'aluno','Ensino Médio',a[4]]); existing={id}; }
   const sampleNotes=[['Matemática','1º Bimestre',Number((5.5+(existing.id%4)*0.7).toFixed(1))],['Português','1º Bimestre',Number((6+(existing.id%3)*0.8).toFixed(1))]];
   for(const n of sampleNotes) if(!get('SELECT id FROM notas WHERE aluno_id=? AND disciplina=? AND etapa=?',[existing.id,n[0],n[1]])) run('INSERT INTO notas(aluno_id,disciplina,etapa,nota) VALUES(?,?,?,?)',[existing.id,...n]);
   const sampleFreq=[['Matemática',40,existing.id%5],['Português',40,(existing.id+1)%4]];
   for(const f of sampleFreq) if(!get('SELECT id FROM faltas WHERE aluno_id=? AND disciplina=?',[existing.id,f[0]])) run('INSERT INTO faltas(aluno_id,disciplina,total_aulas,faltas) VALUES(?,?,?,?)',[existing.id,...f]);
 }

 const notas=[['Matemática','1º Bimestre',8.5],['Português','1º Bimestre',9.0],['História','1º Bimestre',7.5],['Biologia','1º Bimestre',8.0]];
 for(const n of notas) if(!get('SELECT id FROM notas WHERE aluno_id=? AND disciplina=? AND etapa=?',[aluno.id,n[0],n[1]]))
   run('INSERT INTO notas(aluno_id,disciplina,etapa,nota) VALUES(?,?,?,?)',[aluno.id,...n]);
 const faltas=[['Matemática',40,3],['Português',40,2],['História',36,4],['Biologia',40,1]];
 for(const f of faltas) if(!get('SELECT id FROM faltas WHERE aluno_id=? AND disciplina=?',[aluno.id,f[0]]))
   run('INSERT INTO faltas(aluno_id,disciplina,total_aulas,faltas) VALUES(?,?,?,?)',[aluno.id,...f]);

 function futureDate(days){
   const d=new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate()+days);
   return d.toISOString().slice(0,10);
 }
 const slots=[
  [prof.id,futureDate(2),'14:00','15:00','Sala 03'],
  [prof.id,futureDate(4),'15:30','16:30','Sala 03'],
  [prof2.id,futureDate(3),'10:00','11:00','Sala 05'],
  [prof2.id,futureDate(5),'13:30','14:30','Sala 05']
 ];
 for(const s of slots){
   if(!get('SELECT id FROM disponibilidades WHERE professor_id=? AND data=? AND hora_inicio=?',[s[0],s[1],s[2]]))
     run('INSERT INTO disponibilidades(professor_id,data,hora_inicio,hora_fim,local) VALUES(?,?,?,?,?)',s);
 }
 save();
}
if(require.main===module) seed().then(()=>console.log('Dados de demonstração conferidos.'));
module.exports=seed;
