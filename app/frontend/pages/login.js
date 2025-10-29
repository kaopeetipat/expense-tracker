import {useState} from 'react';
const API = process.env.NEXT_PUBLIC_API_BASE;
export default function Login(){
  const [email,setEmail]=useState('user@test.com');
  const [password,setPassword]=useState('Passw0rd!');
  const [msg,setMsg]=useState('');
  const submit=async(e)=>{
    e.preventDefault();
    const r = await fetch(`${API}/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body: JSON.stringify({email,password})});
    const d = await r.json();
    if(r.ok){ localStorage.setItem('token', d.token); location.href='/'; } else setMsg(d.message||'Login failed');
  };
  return (<main style={{padding:20}}>
    <h1>Login</h1>
    <form onSubmit={submit}>
      <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="email"/><br/>
      <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="password"/><br/>
      <button type="submit">Login</button>
    </form>
    <p style={{color:'red'}}>{msg}</p>
  </main>);
}
