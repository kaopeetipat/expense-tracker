import {useEffect,useState} from 'react';
const API = process.env.NEXT_PUBLIC_API_BASE;

export default function Expenses(){
  const [token,setToken]=useState('');
  const [rows,setRows]=useState([]);
  const [cats,setCats]=useState([]);
  const [form,setForm]=useState({amount:0,categoryId:'',occurred_at:'',note:''});
  const [q,setQ]=useState({from:'',to:'',sort:'-occurred_at'});

  useEffect(()=>{ const t=localStorage.getItem('token'); if(t) setToken(t); },[]);

  const load=async()=>{
    const r = await fetch(`${API}/expenses?from=${q.from||''}&to=${q.to||''}&sort=${q.sort||''}`,{headers:{Authorization:`Bearer ${token}`}});
    const d = await r.json(); setRows(d);
    const rc = await fetch(`${API}/categories`,{headers:{Authorization:`Bearer ${token}`}}); setCats(await rc.json());
  };
  useEffect(()=>{ if(token) load(); },[token,q.from,q.to,q.sort]);

  const add=async(e)=>{
    e.preventDefault();
    await fetch(`${API}/expenses`,{
      method:'POST', headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},
      body: JSON.stringify(form)
    });
    setForm({amount:0,categoryId:'',occurred_at:'',note:''});
    load();
  };

  const del=async(id)=>{
    await fetch(`${API}/expenses/${id}`,{method:'DELETE',headers:{Authorization:`Bearer ${token}`}});
    load();
  }

  return (<main style={{padding:20}}>
    <h1>Expenses</h1>
    {!token && <p>Please <a href="/login">login</a></p>}

    <section>
      <h3>Filters</h3>
      From: <input type="date" value={q.from} onChange={e=>setQ({...q,from:e.target.value})}/>
      To: <input type="date" value={q.to} onChange={e=>setQ({...q,to:e.target.value})}/>
      Sort: <select value={q.sort} onChange={e=>setQ({...q,sort:e.target.value})}>
        <option value="-occurred_at">Newest</option>
        <option value="occurred_at">Oldest</option>
        <option value="-amount">Amount desc</option>
        <option value="amount">Amount asc</option>
      </select>
      <button onClick={load}>Apply</button>
    </section>

    <section>
      <h3>Add Expense</h3>
      <form onSubmit={add}>
        <input type="number" step="0.01" placeholder="amount" value={form.amount} onChange={e=>setForm({...form,amount:+e.target.value})}/>
        <select value={form.categoryId} onChange={e=>setForm({...form,categoryId:e.target.value})}>
          <option value="">-- category --</option>
          {cats.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input type="date" value={form.occurred_at} onChange={e=>setForm({...form,occurred_at:e.target.value})}/>
        <input placeholder="note" value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/>
        <button type="submit">Add</button>
      </form>
    </section>

    <table border="1" cellPadding="6">
      <thead><tr><th>Date</th><th>Category</th><th>Amount</th><th>Note</th><th></th></tr></thead>
      <tbody>
        {rows.map(r=>(
          <tr key={r.id}>
            <td>{new Date(r.occurred_at).toLocaleDateString()}</td>
            <td>{r.category_name}</td>
            <td>{r.amount.toFixed(2)}</td>
            <td>{r.note||''}</td>
            <td><button onClick={()=>del(r.id)}>Delete</button></td>
          </tr>
        ))}
      </tbody>
    </table>

    <p><a href="/dashboard">Dashboard</a> | <a href="/categories">Categories</a></p>
  </main>);
}
