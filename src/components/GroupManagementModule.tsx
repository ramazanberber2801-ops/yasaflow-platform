import { useEffect, useState, type FormEvent } from 'react';
import { Edit3, Loader2, Plus, Trash2, Users, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Group={id:string;name:string;description:string};

export function GroupManagementModule({organizationId,onChanged}:{organizationId:string;onChanged?:()=>void}){
  const [groups,setGroups]=useState<Group[]>([]);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');
  const [open,setOpen]=useState(false);
  const [editing,setEditing]=useState<Group|null>(null);
  const [name,setName]=useState('');
  const [description,setDescription]=useState('');

  const load=async()=>{
    const client=supabase;if(!client)return;
    setLoading(true);setError('');
    const {data,error}=await client.from('organization_groups').select('id,name,description').eq('organization_id',organizationId).order('name');
    if(error)setError(error.message);else setGroups((data||[]).map(row=>({id:row.id,name:row.name||'',description:row.description||''})));
    setLoading(false);
  };
  useEffect(()=>{void load();},[organizationId]);

  const start=(group?:Group)=>{setEditing(group||null);setName(group?.name||'');setDescription(group?.description||'');setError('');setOpen(true);};
  const save=async(e:FormEvent)=>{
    e.preventDefault();const client=supabase;if(!client||!name.trim())return;
    setSaving(true);setError('');
    const payload={organization_id:organizationId,name:name.trim(),description:description.trim()||null,updated_at:new Date().toISOString()};
    const result=editing?await client.from('organization_groups').update(payload).eq('id',editing.id).eq('organization_id',organizationId):await client.from('organization_groups').insert(payload);
    setSaving(false);
    if(result.error){setError(result.error.message);return;}
    setOpen(false);await load();onChanged?.();
  };
  const remove=async(group:Group)=>{
    const client=supabase;if(!client||!confirm(`Slette gruppen «${group.name}»?`))return;
    const {error}=await client.from('organization_groups').delete().eq('id',group.id).eq('organization_id',organizationId);
    if(error)setError(error.message);else{await load();onChanged?.();}
  };

  return <section className="rounded-3xl border bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between gap-3"><div className="flex items-start gap-3"><Users size={20} style={{color:'var(--brand-primary)'}}/><div><h4 className="font-semibold">Brukergrupper</h4><p className="mt-1 text-xs leading-5 opacity-55">Opprett grupper som Styret, Frivillige, Beboere eller Ungdom.</p></div></div><button onClick={()=>start()} className="flex shrink-0 items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold" style={{background:'var(--brand-primary)',color:'var(--brand-primary-text)'}}><Plus size={14}/>Ny gruppe</button></div>
    {error&&!open&&<p className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p>}
    {loading?<div className="flex justify-center p-7"><Loader2 className="animate-spin"/></div>:groups.length===0?<p className="mt-4 rounded-xl border p-5 text-center text-sm opacity-50">Ingen grupper er opprettet ennå.</p>:<div className="mt-4 space-y-2">{groups.map(group=><div key={group.id} className="flex items-center gap-3 rounded-2xl border p-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{background:'var(--brand-subtle)',color:'var(--brand-primary)'}}><Users size={16}/></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{group.name}</p>{group.description&&<p className="truncate text-xs opacity-45">{group.description}</p>}</div><button onClick={()=>start(group)} className="rounded-lg bg-black/5 p-2"><Edit3 size={14}/></button><button onClick={()=>void remove(group)} className="rounded-lg bg-red-50 p-2 text-red-700"><Trash2 size={14}/></button></div>)}</div>}

    {open&&<div className="fixed inset-0 z-[160] flex items-end justify-center bg-black/45 sm:items-center sm:p-4"><form onSubmit={save} className="w-full max-w-md rounded-t-3xl bg-white p-5 sm:rounded-3xl"><div className="flex items-center justify-between"><h3 className="font-serif text-xl">{editing?'Rediger gruppe':'Ny gruppe'}</h3><button type="button" onClick={()=>setOpen(false)} className="rounded-full bg-black/5 p-2"><X size={17}/></button></div><div className="mt-4 space-y-3"><input required className="w-full rounded-xl border p-3 text-sm" placeholder="Gruppenavn" value={name} onChange={e=>setName(e.target.value)}/><textarea className="min-h-24 w-full rounded-xl border p-3 text-sm" placeholder="Beskrivelse (valgfritt)" value={description} onChange={e=>setDescription(e.target.value)}/>{error&&<p className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p>}<button disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold disabled:opacity-50" style={{background:'var(--brand-primary)',color:'var(--brand-primary-text)'}}>{saving?<Loader2 size={16} className="animate-spin"/>:'Lagre gruppe'}</button></div></form></div>}
  </section>;
}
