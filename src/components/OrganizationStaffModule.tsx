import { useEffect, useState, type FormEvent } from 'react';
import { Edit3, Loader2, Plus, Trash2, Users, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Staff = {
  id:string; name:string; position:string; phone:string; email:string; active:boolean;
  allow_call:boolean; allow_sms:boolean; allow_whatsapp:boolean; allow_email:boolean;
  whatsapp_number:string; bio:string; image_url:string;
};

const empty = {
  name:'', position:'', phone:'', email:'', active:true,
  allow_call:true, allow_sms:false, allow_whatsapp:false, allow_email:false,
  whatsapp_number:'', bio:'', image_url:'',
};

export function OrganizationStaffModule({ organizationId }:{ organizationId:string }) {
  const [items,setItems]=useState<Staff[]>([]); const [editing,setEditing]=useState<Staff|null>(null);
  const [form,setForm]=useState(empty); const [open,setOpen]=useState(false); const [busy,setBusy]=useState(false); const [error,setError]=useState('');

  const load=async()=>{
    if(!supabase)return;
    const {data,error}=await supabase.from('organization_staff').select('id,name,position,phone,email,active,allow_call,allow_sms,allow_whatsapp,allow_email,whatsapp_number,bio,image_url').eq('organization_id',organizationId).order('sort_order');
    if(error)setError(error.message); else setItems((data||[]) as Staff[]);
  };

  useEffect(()=>{void load();},[organizationId]);

  const start=(item?:Staff)=>{
    setEditing(item||null);
    setForm(item?{
      name:item.name||'',position:item.position||'',phone:item.phone||'',email:item.email||'',active:item.active,
      allow_call:item.allow_call!==false,allow_sms:Boolean(item.allow_sms),allow_whatsapp:Boolean(item.allow_whatsapp),allow_email:Boolean(item.allow_email),
      whatsapp_number:item.whatsapp_number||'',bio:item.bio||'',image_url:item.image_url||'',
    }:empty);
    setError('');setOpen(true);
  };

  const save=async(e:FormEvent)=>{
    e.preventDefault();if(!supabase||!form.name.trim())return;
    setBusy(true);
    const payload={
      organization_id:organizationId,name:form.name.trim(),position:form.position.trim()||null,
      phone:form.phone.trim()||null,email:form.email.trim()||null,active:form.active,
      allow_call:Boolean(form.phone.trim())&&form.allow_call,
      allow_sms:Boolean(form.phone.trim())&&form.allow_sms,
      allow_whatsapp:Boolean((form.whatsapp_number||form.phone).trim())&&form.allow_whatsapp,
      allow_email:Boolean(form.email.trim())&&form.allow_email,
      whatsapp_number:form.whatsapp_number.trim()||null,bio:form.bio.trim()||null,image_url:form.image_url.trim()||null,
      updated_at:new Date().toISOString(),
    };
    const result=editing?await supabase.from('organization_staff').update(payload).eq('id',editing.id).eq('organization_id',organizationId):await supabase.from('organization_staff').insert(payload);
    setBusy(false);if(result.error)return setError(result.error.message);setOpen(false);await load();
  };

  const remove=async(item:Staff)=>{if(!supabase||!confirm(`Slette ${item.name}?`))return;const {error}=await supabase.from('organization_staff').delete().eq('id',item.id).eq('organization_id',organizationId);if(error)alert(error.message);else await load();};

  return <div className="space-y-4">
    <section className="rounded-3xl border bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-xs uppercase opacity-45">Organisasjon</p><h3 className="font-serif text-2xl">Styret og ledelsen</h3><p className="mt-1 text-sm opacity-55">{items.length} registrerte personer</p></div><button onClick={()=>start()} className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium" style={{background:'var(--brand-primary)',color:'var(--brand-primary-text)'}}><Plus size={16}/>Legg til</button></div></section>
    {error&&!open&&<p className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p>}
    <div className="space-y-2">{items.map(item=><div key={item.id} className="flex items-center gap-3 rounded-2xl border bg-white p-4"><div className="flex h-10 w-10 items-center justify-center rounded-full" style={{background:'var(--brand-subtle)',color:'var(--brand-primary)'}}><Users size={17}/></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.name}</p><p className="truncate text-xs opacity-50">{item.position||'Ingen rolle'}{item.phone?` · ${item.phone}`:''}</p></div><button onClick={()=>start(item)} className="rounded-lg bg-black/5 p-2"><Edit3 size={15}/></button><button onClick={()=>void remove(item)} className="rounded-lg bg-red-50 p-2 text-red-700"><Trash2 size={15}/></button></div>)}</div>

    {open&&<div className="fixed inset-0 z-[130] flex items-end bg-black/45 sm:items-center sm:justify-center sm:p-4"><form onSubmit={save} className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 sm:rounded-3xl"><div className="flex justify-between"><h3 className="font-serif text-xl">{editing?'Rediger person':'Ny person'}</h3><button type="button" onClick={()=>setOpen(false)}><X/></button></div><div className="mt-4 space-y-3">
      <input required className="w-full rounded-xl border p-3 text-sm" placeholder="Navn" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
      <input className="w-full rounded-xl border p-3 text-sm" placeholder="Rolle/stilling" value={form.position} onChange={e=>setForm({...form,position:e.target.value})}/>
      <textarea className="min-h-24 w-full rounded-xl border p-3 text-sm" placeholder="Kort beskrivelse (valgfritt)" value={form.bio} onChange={e=>setForm({...form,bio:e.target.value})}/>
      <input className="w-full rounded-xl border p-3 text-sm" placeholder="Bilde-URL (valgfritt)" value={form.image_url} onChange={e=>setForm({...form,image_url:e.target.value})}/>
      <input className="w-full rounded-xl border p-3 text-sm" placeholder="Telefon" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/>
      <input type="email" className="w-full rounded-xl border p-3 text-sm" placeholder="E-post" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>
      <input className="w-full rounded-xl border p-3 text-sm" placeholder="Eget WhatsApp-nummer (valgfritt)" value={form.whatsapp_number} onChange={e=>setForm({...form,whatsapp_number:e.target.value})}/>

      <div className="rounded-2xl border p-4"><p className="text-sm font-semibold">Kontaktmuligheter</p><p className="mt-1 text-xs opacity-55">Bare valgte kontaktmetoder vises på personens side.</p><div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.allow_call} onChange={e=>setForm({...form,allow_call:e.target.checked})} disabled={!form.phone.trim()}/>Ring</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.allow_sms} onChange={e=>setForm({...form,allow_sms:e.target.checked})} disabled={!form.phone.trim()}/>SMS</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.allow_whatsapp} onChange={e=>setForm({...form,allow_whatsapp:e.target.checked})} disabled={!(form.whatsapp_number||form.phone).trim()}/>WhatsApp</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.allow_email} onChange={e=>setForm({...form,allow_email:e.target.checked})} disabled={!form.email.trim()}/>E-post</label>
      </div></div>

      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={e=>setForm({...form,active:e.target.checked})}/>Aktiv</label>
      {error&&<p className="text-xs text-red-700">{error}</p>}
      <button disabled={busy} className="flex w-full justify-center rounded-xl py-3 text-sm font-medium" style={{background:'var(--brand-primary)',color:'var(--brand-primary-text)'}}>{busy?<Loader2 className="animate-spin" size={16}/>:editing?'Lagre endringer':'Opprett'}</button>
    </div></form></div>}
  </div>;
}
