const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
let token=localStorage.getItem('portal_token'), user=JSON.parse(localStorage.getItem('portal_user')||'null');
let role='aluno';
const titles={
 aluno:{dashboard:'Visão geral',notas:'Minhas notas',frequencia:'Minha frequência',estudos:'Plano de estudos',agendamento:'Aula extra'},
 professor:{dashboard:'Painel docente',alunos:'Alunos',lancamentos:'Lançar notas e frequência',horarios:'Horários de atendimento',agendamentos:'Aulas extras agendadas'}
};
const menus={
 aluno:[['dashboard','▦','Visão geral'],['notas','✓','Notas'],['frequencia','◷','Frequência'],['estudos','📚','Plano de estudos'],['agendamento','◫','Aulas extras']],
 professor:[['dashboard','▦','Visão geral'],['alunos','👥','Alunos'],['lancamentos','✎','Notas e frequência'],['horarios','◷','Disponibilidades'],['agendamentos','◫','Aulas extras']]
};
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2800)}
async function api(url,opts={}){opts.headers={...(opts.headers||{}),'Content-Type':'application/json',Authorization:`Bearer ${token}`};const r=await fetch('/api'+url,opts);const d=await r.json();if(!r.ok)throw Error(d.erro||'Erro');return d}
function setupNav(){role=user.tipo;$('#nav').innerHTML=menus[role].map((m,i)=>`<button class="nav ${i===0?'active':''}" data-page="${m[0]}">${m[1]} <span>${m[2]}</span></button>`).join('');$$('.nav').forEach(b=>b.onclick=()=>load(b.dataset.page))}
function showApp(){if(!token||!user)return showAuth();$('#auth').classList.add('hidden');$('#app').classList.remove('hidden');setupNav();$('#userName').textContent=user.nome;$('#avatar').textContent=user.nome[0].toUpperCase();$('#sideRole').textContent=role==='professor'?'Área docente':'Área discente';load('dashboard')}
function showAuth(){$('#auth').classList.remove('hidden');$('#app').classList.add('hidden')}
$$('.role').forEach(b=>b.onclick=()=>{$$('.role').forEach(x=>x.classList.remove('active'));b.classList.add('active');role=b.dataset.role;$('#tipo').value=role;$('#roleIcon').textContent=role==='aluno'?'🎓':'👨‍🏫';$('#loginTitle').textContent=role==='aluno'?'Acesso do aluno':'Acesso do professor';$('#loginText').textContent=role==='aluno'?'Entre usando exclusivamente seu e-mail discente.':'Entre usando exclusivamente seu e-mail docente.';$('#emailHint').textContent=role==='aluno'?'discente':'docente';$('#loginEmail').placeholder=role==='aluno'?'aluno@escola.com':'professor@escola.com';$('#registerLink').textContent=role==='aluno'?'Cadastrar novo aluno':'Cadastrar novo professor';$('#forgotLink').style.display=role==='professor'?'inline-block':'inline-block'});
$('#loginForm').onsubmit=async e=>{e.preventDefault();try{const d=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:$('#loginEmail').value,senha:$('#loginSenha').value,tipo:$('#tipo').value})}).then(r=>r.json());if(!d.token)throw Error(d.erro);token=d.token;user=d.usuario;localStorage.setItem('portal_token',token);localStorage.setItem('portal_user',JSON.stringify(user));showApp()}catch(e){toast(e.message)}};
$('#logout').onclick=async()=>{try{await api('/auth/logout',{method:'POST'})}catch{}localStorage.clear();token=null;user=null;showAuth()};
async function load(page){$$('.nav').forEach(b=>b.classList.toggle('active',b.dataset.page===page));$('#pageTitle').textContent=titles[role][page];const c=$('#content');c.innerHTML='<div class="empty">Carregando...</div>';try{if(role==='aluno'){if(page==='dashboard')await alunoDashboard(c);if(page==='notas')await notas(c);if(page==='frequencia')await frequencia(c);if(page==='estudos')await estudos(c);if(page==='agendamento')await agendamento(c)}else{if(page==='dashboard')await profDashboard(c);if(page==='alunos')await alunos(c);if(page==='lancamentos')await lancamentos(c);if(page==='horarios')await horarios(c);if(page==='agendamentos')await profAgendamentos(c)}}catch(e){toast(e.message);if(e.message==='Não autenticado.')showAuth()}}

async function alunoDashboard(c){
 const d=await api('/dashboard');
 c.innerHTML=`<div class="hero"><div><small>ACOMPANHAMENTO ACADÊMICO</small><h3>Olá, ${user.nome.split(' ')[0]}!</h3><p>Consulte seus resultados e organize seus estudos.</p></div><div class="hero-number">${d.media}</div></div>
 <div class="grid"><div class="card metric"><small>Média geral</small><strong>${d.media}</strong></div><div class="card metric"><small>Frequência</small><strong>${d.frequencia}%</strong></div><div class="card metric"><small>Faltas</small><strong>${d.faltas}</strong></div><div class="card metric"><small>Aulas extras</small><strong>${d.agendamentos}</strong></div></div>
 <div class="notice"><b>Área discente</b><span>Notas e frequência são somente para consulta. O lançamento e a alteração dos dados ficam restritos aos professores.</span></div>
 <div class="card"><h3>Precisa recuperar pontos?</h3><p>Acesse <b>Plano de estudos</b> para identificar as disciplinas que mais precisam de atenção com base nas suas notas atuais.</p></div>`;
}
async function notas(c){
 const rows=await api('/notas');
 const groups={};rows.forEach(r=>(groups[r.disciplina]??=[]).push(r));
 c.innerHTML=`<div class="card intro"><h3>Boletim acadêmico</h3><p>As notas abaixo são lançadas exclusivamente pelos professores.</p></div>
 <div class="table-wrap"><table class="table"><thead><tr><th>Disciplina</th><th>Etapa</th><th>Nota</th></tr></thead><tbody>${rows.map(r=>`<tr><td><b>${r.disciplina}</b></td><td>${r.etapa}</td><td><span class="grade">${Number(r.nota).toFixed(1)}</span></td></tr>`).join('')||'<tr><td colspan="3" class="empty">Nenhuma nota lançada.</td></tr>'}</tbody></table></div>`;
}
async function frequencia(c){
 const rows=await api('/faltas');
 c.innerHTML=`<div class="card intro"><h3>Frequência escolar</h3><p>Consulte suas faltas e o percentual de presença por disciplina.</p></div>
 <div class="table-wrap"><table class="table"><thead><tr><th>Disciplina</th><th>Aulas</th><th>Faltas</th><th>Presença</th><th>Situação</th></tr></thead><tbody>${rows.map(r=>`<tr><td><b>${r.disciplina}</b></td><td>${r.total_aulas}</td><td>${r.faltas}</td><td>${r.percentual}%</td><td><span class="badge ${Number(r.percentual)<75?'warn':''}">${Number(r.percentual)<75?'Atenção':'Regular'}</span></td></tr>`).join('')||'<tr><td colspan="5" class="empty">Nenhuma frequência lançada.</td></tr>'}</tbody></table></div>`;
}
async function estudos(c){
 const rows=await api('/notas');const by={};
 rows.forEach(r=>{if(!by[r.disciplina])by[r.disciplina]=[];by[r.disciplina].push(Number(r.nota))});
 const data=Object.entries(by).map(([disc,ns])=>({disc,avg:ns.reduce((a,b)=>a+b,0)/ns.length,sum:ns.reduce((a,b)=>a+b,0)})).sort((a,b)=>a.avg-b.avg);
 const items=data.map((x,i)=>{const prioridade=i<3?'Alta':'Acompanhar';const pontos=Math.max(0,24-x.sum);return `<div class="study-item"><div class="rank">${i+1}</div><div class="study-main"><div><b>${x.disc}</b><span class="badge ${x.avg<6?'warn':''}">${prioridade}</span></div><small>Média atual: ${x.avg.toFixed(1)} · Para atingir 24 pontos no ano, faltam aproximadamente <b>${pontos.toFixed(1)} pontos</b> nas etapas restantes.</small><div class="progress"><i style="width:${Math.min(100,x.avg/10*100)}%"></i></div></div><button class="secondary" data-study="${x.disc}">Estudar</button></div>`});
 c.innerHTML=`<div class="hero compact"><h3>Plano de estudos</h3><p>Organizado automaticamente pelas menores médias. A meta usada é 6,0 de média anual (24 pontos em 4 etapas).</p></div><div class="card"><h3>Disciplinas que precisam de mais atenção</h3><div class="study-list">${items.join('')||'<div class="empty">Ainda não há notas suficientes para montar o plano.</div>'}</div></div>`;
 $$('[data-study]').forEach(b=>b.onclick=()=>toast(`Plano de estudo aberto para ${b.dataset.study}. Comece revisando os conteúdos e exercícios dessa disciplina.`));
}
async function agendamento(c){
 try{
  const [prof,slots,meus]=await Promise.all([api('/agendamento/professores'),api('/agendamento/disponibilidades'),api('/agendamento/meus')]);
  c.innerHTML=`<div class="card intro"><h3>Agendar aula extra</h3><p>Escolha um professor cadastrado e um horário disponível para tirar dúvidas ou reforçar uma matéria.</p></div>
  <div class="section-title"><h3>Professores cadastrados</h3></div><div class="prof-grid">${prof.map(p=>`<div class="prof-card"><div class="prof-avatar">${p.nome[0]}</div><div><b>${p.nome}</b><small>${p.email}</small></div></div>`).join('')||'<div class="card empty">Nenhum professor cadastrado.</div>'}</div>
  <div class="section-title"><h3>Horários disponíveis</h3></div><div class="slot-grid">${slots.map(s=>`<div class="slot"><span class="slot-tag">AULA EXTRA</span><strong>${s.professor}</strong><p>${s.data.split('-').reverse().join('/')} · ${s.hora_inicio} às ${s.hora_fim}</p><small>${s.local} · ${s.disciplina||'Disciplina não informada'}</small><button type="button" class="primary" data-slot="${s.id}">Agendar aula</button></div>`).join('')||'<div class="card empty">Nenhum horário disponível no momento.</div>'}</div>
  <div class="section-title"><h3>Meus agendamentos</h3></div><div class="table-wrap"><table class="table"><thead><tr><th>Data</th><th>Professor</th><th>Assunto</th><th>Status</th><th></th></tr></thead><tbody>${meus.map(a=>`<tr><td>${a.data.split('-').reverse().join('/')} ${a.hora_inicio}</td><td>${a.professor}</td><td>${a.assunto}</td><td><span class="badge">${a.status}</span></td><td>${a.status==='agendado'?`<button type="button" class="secondary danger" data-cancel="${a.id}">Cancelar</button>`:''}</td></tr>`).join('')||'<tr><td colspan="5" class="empty">Nenhuma aula extra agendada.</td></tr>'}</tbody></table></div>
  <div id="bookingModal" class="modal hidden"><div class="modal-card"><button type="button" class="modal-close" id="closeBooking">×</button><h2>Agendar aula extra</h2><p id="bookingInfo"></p><form id="bookingForm"><input type="hidden" name="disponibilidade_id" id="bookingSlot"><label>Matéria ou assunto<input name="assunto" required placeholder="Ex.: Dúvidas de Matemática"></label><label>Observação <textarea name="observacao" rows="3" placeholder="Opcional"></textarea></label><button class="primary full">Confirmar agendamento</button></form></div></div>`;
  const modal=$('#bookingModal');
  $$('[data-slot]').forEach(b=>b.onclick=()=>{
    const slot=slots.find(x=>String(x.id)===String(b.dataset.slot));
    if(!slot)return toast('Horário não encontrado. Atualize a página.');
    $('#bookingSlot').value=slot.id;
    $('#bookingInfo').textContent=`${slot.professor} · ${slot.data.split('-').reverse().join('/')} · ${slot.hora_inicio} às ${slot.hora_fim}`;
    $('#bookingForm').reset(); $('#bookingSlot').value=slot.id; modal.classList.remove('hidden');
  });
  $('#closeBooking').onclick=()=>modal.classList.add('hidden');
  $('#bookingForm').onsubmit=async e=>{e.preventDefault();try{const payload=Object.fromEntries(new FormData(e.target));await api('/agendamento',{method:'POST',body:JSON.stringify(payload)});modal.classList.add('hidden');toast('Aula extra agendada com sucesso!');await load('agendamento')}catch(e){toast(e.message)}};
  $$('[data-cancel]').forEach(b=>b.onclick=async()=>{if(!confirm('Cancelar esta aula extra?'))return;try{await api('/agendamento/'+b.dataset.cancel,{method:'DELETE'});toast('Agendamento cancelado.');load('agendamento')}catch(e){toast(e.message)}});
 }catch(e){c.innerHTML=`<div class="card empty"><h3>Não foi possível carregar os agendamentos</h3><p>${e.message}</p><button class="primary" onclick="load('agendamento')">Tentar novamente</button></div>`;throw e}
}
async function profDashboard(c){
 const d=await api('/dashboard');
 c.innerHTML=`<div class="hero teacher"><div><small>ÁREA DOCENTE</small><h3>Olá, Prof. ${user.nome.split(' ').slice(-1)[0]}!</h3><p>Gerencie notas e frequência exclusivamente de <strong>${user.disciplina||'sua disciplina'}</strong>, além dos seus atendimentos.</p></div><div class="hero-number">DOC</div></div>
 <div class="grid"><div class="card metric"><small>Alunos cadastrados</small><strong>${d.alunos}</strong></div><div class="card metric"><small>Aulas extras agendadas</small><strong>${d.atendimentos}</strong></div><div class="card metric"><small>Horários cadastrados</small><strong>${d.horarios}</strong></div></div>
 <div class="notice teacher-note"><b>Disciplina vinculada</b><span>Você está vinculado à disciplina <strong>${user.disciplina||'não definida'}</strong>. Notas e frequência ficam restritas a essa matéria.</span></div>`;
}
async function alunos(c){
 const rows=await api('/professor/alunos');
 c.innerHTML=`<div class="card intro"><h3>Alunos cadastrados</h3><p>Selecione um aluno para consultar o boletim e a frequência.</p></div><div class="student-grid">${rows.map(a=>`<button class="student-card" data-aluno="${a.id}"><div class="prof-avatar">${a.nome[0]}</div><div><b>${a.nome}</b><small>${a.matricula} · ${a.turma||'Sem turma'}</small><small>${a.email}</small></div><span>›</span></button>`).join('')||'<div class="empty">Nenhum aluno cadastrado.</div>'}</div><div id="studentDetail"></div>`;
 $$('[data-aluno]').forEach(b=>b.onclick=()=>studentDetail(b.dataset.aluno));
}
async function studentDetail(id){
 const d=await api('/professor/alunos/'+id+'/resumo');const el=$('#studentDetail');
 el.innerHTML=`<div class="section-title"><h3>${d.aluno.nome}</h3></div><div class="grid two-cols"><div class="card"><h4>Notas</h4>${d.notas.map(n=>`<p class="line"><span>${n.disciplina} · ${n.etapa}</span><b>${Number(n.nota).toFixed(1)}</b></p>`).join('')||'<small>Sem notas.</small>'}</div><div class="card"><h4>Frequência</h4>${d.faltas.map(f=>`<p class="line"><span>${f.disciplina}</span><b>${f.percentual}%</b></p>`).join('')||'<small>Sem frequência.</small>'}</div></div>`;
}
async function lancamentos(c){
 const alunos=await api('/professor/alunos');
 const disciplina=user.disciplina||'';
 c.innerHTML=`<div class="card form-card wide"><div class="section-title"><div><h3>Lançar ou atualizar nota</h3><small>Disciplina: <strong>${disciplina}</strong></small></div></div><form id="notaProf"><label>Aluno<select name="aluno_id" required>${alunos.map(a=>`<option value="${a.id}">${a.nome} — ${a.matricula}</option>`).join('')}</select></label><div class="two"><label>Disciplina<input name="disciplina" value="${disciplina}" readonly required></label><label>Etapa<select name="etapa"><option>1º Bimestre</option><option>2º Bimestre</option><option>3º Bimestre</option><option>4º Bimestre</option></select></label></div><label>Nota<input name="nota" type="number" min="0" max="10" step="0.1" required></label><button class="primary">Salvar nota</button></form></div>
 <div class="card form-card wide"><div class="section-title"><div><h3>Lançar ou atualizar frequência</h3><small>Disciplina: <strong>${disciplina}</strong></small></div></div><form id="freqProf"><label>Aluno<select name="aluno_id">${alunos.map(a=>`<option value="${a.id}">${a.nome} — ${a.matricula}</option>`).join('')}</select></label><div class="two"><label>Disciplina<input name="disciplina" value="${disciplina}" readonly required></label><label>Total de aulas<input name="total_aulas" type="number" min="1" required></label></div><label>Faltas<input name="faltas" type="number" min="0" required></label><button class="primary">Salvar frequência</button></form></div>`;
 $('#notaProf').onsubmit=async e=>{e.preventDefault();try{await api('/professor/notas',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});toast(`Nota de ${disciplina} salva com sucesso.`);e.target.reset();load('lancamentos')}catch(x){toast(x.message)}};
 $('#freqProf').onsubmit=async e=>{e.preventDefault();try{await api('/professor/frequencia',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});toast(`Frequência de ${disciplina} salva com sucesso.`);e.target.reset();load('lancamentos')}catch(x){toast(x.message)}};
}

async function horarios(c){
 const rows=await api('/professor/meus-horarios');
 c.innerHTML=`<div class="card form-card"><h3>Abrir horário para aula extra</h3><p>Os alunos verão esses horários na área de agendamento.</p><form id="slotForm"><label>Data<input name="data" type="date" required></label><div class="two"><label>Início<input name="hora_inicio" type="time" required></label><label>Fim<input name="hora_fim" type="time" required></label></div><label>Local<input name="local" value="Sala de Atendimento"></label><button class="primary">Disponibilizar horário</button></form></div>
 <div class="section-title"><h3>Meus horários</h3></div><div class="table-wrap"><table class="table"><thead><tr><th>Data</th><th>Horário</th><th>Local</th><th>Situação</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r.data.split('-').reverse().join('/')}</td><td>${r.hora_inicio} — ${r.hora_fim}</td><td>${r.local}</td><td><span class="badge ${r.situacao==='reservado'?'warn':''}">${r.situacao}</span></td></tr>`).join('')||'<tr><td colspan="4" class="empty">Nenhum horário cadastrado.</td></tr>'}</tbody></table></div>`;
 $('#slotForm').onsubmit=async e=>{e.preventDefault();try{await api('/professor/disponibilidades',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});toast('Horário disponibilizado!');load('horarios')}catch(x){toast(x.message)}};
}
async function profAgendamentos(c){
 const rows=await api('/professor/agendamentos');
 c.innerHTML=`<div class="card intro"><h3>Aulas extras agendadas</h3><p>Confira quais alunos marcaram atendimento com você.</p></div><div class="table-wrap"><table class="table"><thead><tr><th>Data</th><th>Horário</th><th>Aluno</th><th>Assunto</th><th>Local</th><th>Status</th></tr></thead><tbody>${rows.map(a=>`<tr><td>${a.data.split('-').reverse().join('/')}</td><td>${a.hora_inicio}</td><td><b>${a.aluno}</b><small class="sub">${a.matricula}</small></td><td>${a.assunto}</td><td>${a.local}</td><td><span class="badge">${a.status}</span></td></tr>`).join('')||'<tr><td colspan="6" class="empty">Nenhuma aula extra agendada.</td></tr>'}</tbody></table></div>`;
}


function openModal(id){$('#'+id).classList.remove('hidden')}
function closeModal(id){$('#'+id).classList.add('hidden')}
$('#registerLink').onclick=()=>{if(role==='professor')openModal('registerProfessorModal');else openModal('registerModal')};
$('#registerLink').textContent=role==='professor'?'Cadastrar novo professor':'Cadastrar novo aluno';
$('#forgotLink').onclick=()=>{if(role!=='professor')return toast('A recuperação por e-mail é exclusiva do acesso docente.');openModal('forgotModal')};
$$('[data-close]').forEach(b=>b.onclick=()=>closeModal(b.dataset.close));
$('#registerForm').onsubmit=async e=>{e.preventDefault();try{const d=await fetch('/api/auth/cadastro-aluno',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(new FormData(e.target)))}).then(r=>r.json());if(!d.usuario)throw Error(d.erro);toast('Aluno cadastrado! Agora entre com seu e-mail e senha.');e.target.reset();closeModal('registerModal')}catch(x){toast(x.message)}};
$('#registerProfessorForm').onsubmit=async e=>{e.preventDefault();try{const d=await fetch('/api/auth/cadastro-professor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(new FormData(e.target)))}).then(r=>r.json());if(!d.usuario)throw Error(d.erro);toast('Professor cadastrado! Agora entre com o e-mail e senha cadastrados.');e.target.reset();closeModal('registerProfessorModal')}catch(x){toast(x.message)}};
$('#forgotForm').onsubmit=async e=>{e.preventDefault();try{const d=await fetch('/api/auth/esqueci-senha',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(new FormData(e.target)))}).then(r=>r.json());if(d.erro)throw Error(d.erro);toast(d.mensagem);if(d.link){prompt('Modo de demonstração: link de recuperação gerado. Copie para testar:',d.link)}e.target.reset();closeModal('forgotModal')}catch(x){toast(x.message)}};
$('#resetForm').onsubmit=async e=>{e.preventDefault();try{const d=await fetch('/api/auth/redefinir-senha',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(new FormData(e.target)))}).then(r=>r.json());if(d.erro)throw Error(d.erro);toast(d.mensagem);closeModal('resetModal');history.replaceState({},'',location.pathname)}catch(x){toast(x.message)}};
const resetParam=new URLSearchParams(location.search).get('reset');if(resetParam){$('#resetToken').value=resetParam;openModal('resetModal')}

if(token&&user)showApp();else showAuth();
