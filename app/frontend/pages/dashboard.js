import {useEffect,useState} from 'react';
const API = process.env.NEXT_PUBLIC_API_BASE;

export default function Dashboard(){
  const [token,setToken]=useState('');
  const [sum,setSum]=useState({total:0, byCategory:[], byDay:[]});
  const [q,setQ]=useState({from:'',to:''});

  useEffect(()=>{const t=localStorage.getItem('token'); if(t) setToken(t);},[]);
  const load=()=> fetch(`${API}/reports/summary?from=${q.from||''}&to=${q.to||''}`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(setSum);
  useEffect(()=>{ if(token) load(); },[token,q.from,q.to]);

  return (<main style={{padding:20}}>
    <h1>Dashboard</h1>
    From: <input type="date" value={q.from} onChange={e=>setQ({...q,from:e.target.value})}/>
    To: <input type="date" value={q.to} onChange={e=>setQ({...q,to:e.target.value})}/>
    <button onClick={load}>Apply</button>
    <h3>Total</h3>
    <p>{sum.total?.toFixed ? sum.total.toFixed(2) : sum.total}</p>
    <h3>By Category</h3>
    <ul>{(sum.byCategory||[]).map(x=>(<li key={x.category}>{x.category}: {x.total.toFixed(2)}</li>))}</ul>
    <h3>By Day</h3>
    <ul>{(sum.byDay||[]).map(x=>(<li key={x.day}>{x.day}: {x.total.toFixed(2)}</li>))}</ul>
    <p><a href="/">Expenses</a></p>
  </main>);
}
