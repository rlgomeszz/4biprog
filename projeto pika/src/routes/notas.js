const express=require('express');
const {query}=require('../db/database');
const auth=require('./auth');
const router=express.Router();
function user(req,res){
 const t=req.headers.authorization?.replace('Bearer ',''); const id=t&&auth.sessions.get(t);
 if(!id){res.status(401).json({erro:'Não autenticado.'});return null;}
 return id;
}
router.get('/',(req,res)=>{
 const id=user(req,res); if(!id)return;
 res.json(query('SELECT id,disciplina,etapa,nota FROM notas WHERE aluno_id=? ORDER BY disciplina,etapa',[id]));
});
router.post('/',(req,res)=>res.status(403).json({erro:'Apenas professores podem lançar notas.'}));
module.exports=router;