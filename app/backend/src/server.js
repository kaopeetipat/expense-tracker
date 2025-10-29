import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const app = express();
app.use(cors());
app.use(express.json());
const prisma = new PrismaClient();

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

function auth(req,res,next){
  const auth = req.headers.authorization||'';
  const token = auth.startsWith('Bearer ')? auth.slice(7):'';
  if(!token) return res.status(401).json({message:'No token'});
  try{ req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch(e){ return res.status(401).json({message:'Invalid token'}); }
}

app.get('/health', (_req,res)=> res.json({ok:true}));

// Auth
app.post('/auth/register', async (req,res)=>{
  const {email,password,full_name,role} = req.body;
  const passwordHash = await bcrypt.hash(password,10);
  try{
    const user = await prisma.user.create({data:{email,passwordHash,full_name,role: role||'user'}});
    res.json({id:user.id});
  }catch(e){ res.status(400).json({message:'Email exists'}); }
});
app.post('/auth/login', async (req,res)=>{
  const {email,password} = req.body;
  const user = await prisma.user.findUnique({where:{email}});
  if(!user) return res.status(401).json({message:'Bad credentials'});
  const ok = await bcrypt.compare(password, user.passwordHash);
  if(!ok) return res.status(401).json({message:'Bad credentials'});
  const token = jwt.sign({id:user.id,email:user.email,role:user.role,full_name:user.full_name}, JWT_SECRET, {expiresIn:'7d'});
  res.json({token});
});
app.get('/me', auth, async (req,res)=>{
  const user = await prisma.user.findUnique({where:{id:req.user.id}});
  res.json({id:user.id,email:user.email,full_name:user.full_name,role:user.role});
});

// Categories
app.get('/categories', auth, async (req,res)=>{
  const rows = await prisma.category.findMany({ orderBy:{ name:'asc' } });
  res.json(rows);
});
app.post('/categories', auth, async (req,res)=>{
  const {name} = req.body;
  const row = await prisma.category.create({data:{name}});
  res.json(row);
});
app.delete('/categories/:id', auth, async (req,res)=>{
  await prisma.category.delete({where:{id:req.params.id}});
  res.json({ok:true});
});

// Expenses
app.get('/expenses', auth, async (req,res)=>{
  const {from, to, sort='-occurred_at'} = req.query;
  const where = { userId: req.user.id };
  if(from||to){ where.occurred_at = {}; }
  if(from) where.occurred_at.gte = new Date(String(from));
  if(to) where.occurred_at.lte = new Date(String(to));
  const orderBy = (()=>{
    const dir = sort.startsWith('-')? 'desc':'asc';
    const field = sort.replace('-','');
    if(!['occurred_at','amount','created_at'].includes(field)) return {occurred_at:'desc'};
    return { [field]: dir };
  })();
  const rows = await prisma.expense.findMany({ where, orderBy, include:{category:true} });
  res.json(rows.map(r=>({id:r.id, amount: Number(r.amount), currency:r.currency, occurred_at:r.occurred_at, note:r.note, category_name:r.category?.name||'-'})));
});
app.post('/expenses', auth, async (req,res)=>{
  const {amount,categoryId,occurred_at,note,currency='THB'} = req.body;
  const row = await prisma.expense.create({data:{ userId:req.user.id, categoryId, amount, currency, occurred_at:new Date(occurred_at), note }});
  res.json({id:row.id});
});
app.delete('/expenses/:id', auth, async (req,res)=>{
  await prisma.expense.delete({where:{id:req.params.id}});
  res.json({ok:true});
});

// Reports
app.get('/reports/summary', auth, async (req,res)=>{
  const {from,to} = req.query;
  const where = { userId: req.user.id };
  if(from||to){ where.occurred_at = {}; }
  if(from) where.occurred_at.gte = new Date(String(from));
  if(to) where.occurred_at.lte = new Date(String(to));

  const rows = await prisma.expense.findMany({ where, include:{category:true} });
  const total = rows.reduce((s,r)=> s + Number(r.amount), 0);
  const byCategoryMap = new Map();
  const byDayMap = new Map();
  for(const r of rows){
    const cat = r.category?.name || '-';
    byCategoryMap.set(cat, (byCategoryMap.get(cat)||0) + Number(r.amount));
    const day = r.occurred_at.toISOString().slice(0,10);
    byDayMap.set(day, (byDayMap.get(day)||0) + Number(r.amount));
  }
  const byCategory = Array.from(byCategoryMap, ([category,total])=>({category,total})).sort((a,b)=>b.total-a.total);
  const byDay = Array.from(byDayMap, ([day,total])=>({day,total})).sort((a,b)=> a.day.localeCompare(b.day));
  res.json({ total, byCategory, byDay });
});

app.listen(PORT, ()=> console.log('API on :'+PORT));
