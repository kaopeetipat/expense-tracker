import {useEffect,useState} from 'react';
const API = process.env.NEXT_PUBLIC_API_BASE;

export default function Categories(){
  const [token,setToken]=useState('');
  const [cats,setCats]=useState([]);
  const [name,setName]=useState('');

  useEffect(()=>{const t=localStorage.getItem('token'); if(t) setToken(t);},[]);
  const load=()=> fetch(`${API}/categories`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(setCats);
  useEffect(()=>{ if(token) load(); },[token]);

  const add=async(e)=>{
    e.preventDefault();
    await fetch(`${API}/categories`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body: JSON.stringify({name})});
    setName(''); load();
  };
  const del=async(id)=>{ await fetch(`${API}/categories/${id}`,{method:'DELETE',headers:{Authorization:`Bearer ${token}`}}); load(); };

  return (<main style={{padding:20}}>
    <h1>Categories</h1>
    <form onSubmit={add}>
      <input value={name} onChange={e=>setName(e.target.value)} placeholder="name"/><button>Add</button>
    </form>
    <ul>{cats.map(c=>(<li key={c.id}>{c.name} <button onClick={()=>del(c.id)}>Delete</button></li>))}</ul>
    <p><a href="/">Back</a></p>
  </main>);
}
