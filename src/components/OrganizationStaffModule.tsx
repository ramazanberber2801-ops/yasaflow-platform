import { useEffect, useId, useState, type ChangeEvent, type FormEvent } from 'react';
import { ArrowDown, ArrowUp, Edit3, ImagePlus, Loader2, Plus, Trash2, Users, X } from 'lucide-react';
import { useAppI18n } from '../lib/appI18n';
import { getStaffTranslation } from '../lib/staffTranslations';
import { supabase } from '../lib/supabase';

type Staff = {
  id:string; name:string; position:string; phone:string; email:string; active:boolean; public_visible:boolean; sort_order:number;
  allow_call:boolean; allow_sms:boolean; allow_whatsapp:boolean; allow_email:boolean;
  whatsapp_number:string; bio:string; image_url:string;
};

type StaffForm = {
  name:string; position:string; phone:string; email:string; active:boolean; public_visible:boolean;
  allow_call:boolean; allow_sms:boolean; allow_whatsapp:boolean; allow_email:boolean;
  whatsapp_number:string; bio:string; image_url:string;
};

const empty: StaffForm = {
  name:'', position:'', phone:'', email:'', active:true, public_visible:true,
  allow_call:true, allow_sms:false, allow_whatsapp:false, allow_email:false,
  whatsapp_number:'', bio:'', image_url:'',
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function OrganizationStaffModule({ organizationId }:{ organizationId:string }) {
  const { language } = useAppI18n();
  const t = (key:string) => getStaffTranslation(language,key);
  const titleId = useId();
  const [items,setItems]=useState<Staff[]>([]);
  const [editing,setEditing]=useState<Staff|null>(null);
  const [form,setForm]=useState<StaffForm>(empty);
  const [open,setOpen]=useState(false);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [uploading,setUploading]=useState(false);
  const [deletingId,setDeletingId]=useState<string|null>(null);
  const [movingId,setMovingId]=useState<string|null>(null);
  const [error,setError]=useState('');
  const [status,setStatus]=useState('');

  const load=async()=>{
    if(!supabase){setLoading(false);setError(t('staff.loadFailed'));return;}
    setLoading(true);setError('');
    const {data,error:loadError}=await supabase.from('organization_staff').select('id,name,position,phone,email,active,public_visible,sort_order,allow_call,allow_sms,allow_whatsapp,allow_email,whatsapp_number,bio,image_url').eq('organization_id',organizationId).order('sort_order').order('created_at');
    if(loadError)setError(`${t('staff.loadFailed')} ${loadError.message}`); else setItems((data||[]) as Staff[]);
    setLoading(false);
  };

  useEffect(()=>{void load();},[organizationId,language]);

  const close=()=>{
    if(busy||uploading)return;
    setOpen(false);setEditing(null);setForm(empty);setError('');
  };

  const start=(item?:Staff)=>{
    setEditing(item||null);
    setForm(item?{
      name:item.name||'',position:item.position||'',phone:item.phone||'',email:item.email||'',active:item.active,public_visible:item.public_visible!==false,
      allow_call:item.allow_call!==false,allow_sms:Boolean(item.allow_sms),allow_whatsapp:Boolean(item.allow_whatsapp),allow_email:Boolean(item.allow_email),
      whatsapp_number:item.whatsapp_number||'',bio:item.bio||'',image_url:item.image_url||'',
    }:empty);
    setError('');setStatus('');setOpen(true);
  };

  const uploadImage=async(event:ChangeEvent<HTMLInputElement>)=>{
    const client=supabase;const file=event.target.files?.[0];event.target.value='';
    if(!client||!file)return;
    if(!file.type.startsWith('image/')){setError(t('staff.chooseImageFile'));return;}
    if(file.size>5*1024*1024){setError(t('staff.imageTooLarge'));return;}
    setUploading(true);setError('');
    try{
      const extension=file.name.split('.').pop()?.toLowerCase()||'jpg';
      const path=`${organizationId}/${crypto.randomUUID()}.${extension}`;
      const {error:uploadError}=await client.storage.from('organization-contact-images').upload(path,file,{upsert:false,contentType:file.type});
      if(uploadError){setError(uploadError.message);return;}
      const {data}=client.storage.from('organization-contact-images').getPublicUrl(path);
      setForm(current=>({...current,image_url:data.publicUrl}));
    } finally { setUploading(false); }
  };

  const save=async(e:FormEvent)=>{
    e.preventDefault();
    if(!supabase||busy)return;
    const name=form.name.trim();
    const email=form.email.trim();
    if(!name){setError(t('staff.requiredName'));return;}
    if(email&&!emailPattern.test(email)){setError(t('staff.invalidEmail'));return;}
    setBusy(true);setError('');setStatus('');
    const payload={
      organization_id:organizationId,name,position:form.position.trim()||null,
      phone:form.phone.trim()||null,email:email||null,active:form.active,public_visible:form.public_visible,
      allow_call:Boolean(form.phone.trim())&&form.allow_call,
      allow_sms:Boolean(form.phone.trim())&&form.allow_sms,
      allow_whatsapp:Boolean((form.whatsapp_number||form.phone).trim())&&form.allow_whatsapp,
      allow_email:Boolean(email)&&form.allow_email,
      whatsapp_number:form.whatsapp_number.trim()||null,bio:form.bio.trim()||null,image_url:form.image_url.trim()||null,
      sort_order:editing?.sort_order??items.length,
      updated_at:new Date().toISOString(),
    };
    try{
      const result=editing
        ?await supabase.from('organization_staff').update(payload).eq('id',editing.id).eq('organization_id',organizationId)
        :await supabase.from('organization_staff').insert(payload);
      if(result.error){setError(`${t('staff.saveFailed')} ${result.error.message}`);return;}
      setOpen(false);setEditing(null);setForm(empty);setStatus(t('staff.saved'));await load();
    } finally { setBusy(false); }
  };

  const remove=async(item:Staff)=>{
    if(!supabase||deletingId||!window.confirm(`${t('staff.deletePrefix')}${item.name}${t('staff.deleteSuffix')}`))return;
    setDeletingId(item.id);setError('');setStatus('');
    const {error:deleteError}=await supabase.from('organization_staff').delete().eq('id',item.id).eq('organization_id',organizationId);
    if(deleteError)setError(`${t('staff.deleteFailed')} ${deleteError.message}`);else{setStatus(t('staff.deleted'));await load();}
    setDeletingId(null);
  };

  const move=async(index:number,direction:-1|1)=>{
    const client=supabase;if(!client||movingId)return;
    const target=index+direction;if(target<0||target>=items.length)return;
    const current=items[index];const other=items[target];
    const currentOrder=current.sort_order??index;const otherOrder=other.sort_order??target;
    setMovingId(current.id);setError('');setStatus('');
    setItems(list=>{const next=[...list];[next[index],next[target]]=[next[target],next[index]];return next;});
    const [first,second]=await Promise.all([
      client.from('organization_staff').update({sort_order:otherOrder,updated_at:new Date().toISOString()}).eq('id',current.id).eq('organization_id',organizationId),
      client.from('organization_staff').update({sort_order:currentOrder,updated_at:new Date().toISOString()}).eq('id',other.id).eq('organization_id',organizationId),
    ]);
    if(first.error||second.error){setError((first.error||second.error)?.message||t('staff.orderSaveFailed'));await load();}
    setMovingId(null);
  };

  return <div className="space-y-4">
    <div aria-live="polite" className="sr-only">{status||error}</div>
    <section className="rounded-3xl border bg-white p-5 shadow-sm"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs uppercase opacity-45">{t('staff.organization')}</p><h3 className="font-serif text-2xl">{t('staff.title')}</h3><p className="mt-1 text-sm opacity-55">{items.length} {t('staff.countSuffix')}</p></div><button type="button" onClick={()=>start()} disabled={loading} className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50" style={{background:'var(--brand-primary)',color:'var(--brand-primary-text)'}}><Plus size={16}/>{t('staff.add')}</button></div></section>
    {error&&!open&&<p role="alert" className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p>}
    {status&&!open&&<p role="status" className="rounded-xl bg-green-50 p-3 text-xs text-green-700">{status}</p>}
    {loading?<div className="flex items-center justify-center gap-2 rounded-2xl border bg-white p-8 text-sm opacity-60"><Loader2 className="animate-spin" size={17}/>{t('staff.loading')}</div>:items.length===0?<div className="rounded-2xl border bg-white p-8 text-center text-sm opacity-60">{t('staff.empty')}</div>:<div className="space-y-2">{items.map((item,index)=><div key={item.id} className="flex items-center gap-3 rounded-2xl border bg-white p-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full" style={{background:'var(--brand-subtle)',color:'var(--brand-primary)'}}>{item.image_url?<img src={item.image_url} alt="" className="h-full w-full object-cover"/>:<Users size={17}/>}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-semibold">{item.name}</p>{!item.public_visible&&<span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">{t('staff.hidden')}</span>}{!item.active&&<span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] text-amber-700">{t('staff.inactive')}</span>}</div><p className="truncate text-xs opacity-50">{item.position||t('staff.noRole')}{item.phone?` · ${item.phone}`:''}</p></div><div className="flex flex-col gap-1"><button type="button" aria-label={t('staff.moveUp')} disabled={index===0||Boolean(movingId)} onClick={()=>void move(index,-1)} className="rounded-md bg-black/5 p-1 disabled:opacity-20"><ArrowUp size={13}/></button><button type="button" aria-label={t('staff.moveDown')} disabled={index===items.length-1||Boolean(movingId)} onClick={()=>void move(index,1)} className="rounded-md bg-black/5 p-1 disabled:opacity-20"><ArrowDown size={13}/></button></div><button type="button" aria-label={`${t('staff.editAction')} ${item.name}`} disabled={Boolean(deletingId)||Boolean(movingId)} onClick={()=>start(item)} className="rounded-lg bg-black/5 p-2 disabled:opacity-40"><Edit3 size={15}/></button><button type="button" aria-label={`${t('staff.deleteAction')} ${item.name}`} disabled={Boolean(deletingId)||Boolean(movingId)} onClick={()=>void remove(item)} className="rounded-lg bg-red-50 p-2 text-red-700 disabled:opacity-40">{deletingId===item.id?<Loader2 className="animate-spin" size={15}/>:<Trash2 size={15}/>}</button></div>)}</div>}

    {open&&<div className="fixed inset-0 z-[130] flex items-end bg-black/45 sm:items-center sm:justify-center sm:p-4" onMouseDown={event=>{if(event.target===event.currentTarget)close();}}><form role="dialog" aria-modal="true" aria-labelledby={titleId} onSubmit={save} className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 sm:rounded-3xl"><div className="flex justify-between gap-3"><h3 id={titleId} className="font-serif text-xl">{editing?t('staff.edit'):t('staff.new')}</h3><button type="button" aria-label={t('staff.close')} disabled={busy||uploading} onClick={close} className="rounded-lg p-1 disabled:opacity-40"><X/></button></div><div className="mt-4 space-y-3">
      <label className="block text-xs font-medium">{t('staff.name')} *<input autoFocus required disabled={busy} className="mt-1 w-full rounded-xl border p-3 text-sm disabled:opacity-60" value={form.name} maxLength={120} onChange={e=>setForm({...form,name:e.target.value})}/></label>
      <label className="block text-xs font-medium">{t('staff.position')}<input disabled={busy} className="mt-1 w-full rounded-xl border p-3 text-sm disabled:opacity-60" value={form.position} maxLength={120} onChange={e=>setForm({...form,position:e.target.value})}/></label>
      <label className="block text-xs font-medium">{t('staff.bio')}<textarea disabled={busy} className="mt-1 min-h-24 w-full rounded-xl border p-3 text-sm disabled:opacity-60" value={form.bio} maxLength={1000} onChange={e=>setForm({...form,bio:e.target.value})}/></label>
      <div className="rounded-2xl border p-4"><p className="text-sm font-semibold">{t('staff.image')}</p><div className="mt-3 flex flex-wrap items-center gap-3">{form.image_url?<img src={form.image_url} alt="" className="h-16 w-16 rounded-full object-cover"/>:<div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/5"><Users size={22}/></div>}<label className="flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm"><ImagePlus size={16}/>{uploading?t('staff.uploading'):t('staff.chooseImage')}<input type="file" accept="image/*" className="hidden" disabled={uploading||busy} onChange={event=>void uploadImage(event)}/></label>{form.image_url&&<button type="button" disabled={busy||uploading} onClick={()=>setForm({...form,image_url:''})} className="text-xs text-red-700 disabled:opacity-40">{t('staff.removeImage')}</button>}</div></div>
      <label className="block text-xs font-medium">{t('staff.phone')}<input inputMode="tel" disabled={busy} className="mt-1 w-full rounded-xl border p-3 text-sm disabled:opacity-60" value={form.phone} maxLength={40} onChange={e=>setForm({...form,phone:e.target.value})}/></label>
      <label className="block text-xs font-medium">{t('staff.email')}<input type="email" inputMode="email" disabled={busy} className="mt-1 w-full rounded-xl border p-3 text-sm disabled:opacity-60" value={form.email} maxLength={160} onChange={e=>setForm({...form,email:e.target.value})}/></label>
      <label className="block text-xs font-medium">{t('staff.whatsapp')}<input inputMode="tel" disabled={busy} className="mt-1 w-full rounded-xl border p-3 text-sm disabled:opacity-60" value={form.whatsapp_number} maxLength={40} onChange={e=>setForm({...form,whatsapp_number:e.target.value})}/></label>
      <div className="rounded-2xl border p-4"><p className="text-sm font-semibold">{t('staff.contactOptions')}</p><p className="mt-1 text-xs opacity-55">{t('staff.contactHelp')}</p><div className="mt-3 grid grid-cols-2 gap-3 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={form.allow_call} onChange={e=>setForm({...form,allow_call:e.target.checked})} disabled={busy||!form.phone.trim()}/>{t('staff.call')}</label><label className="flex items-center gap-2"><input type="checkbox" checked={form.allow_sms} onChange={e=>setForm({...form,allow_sms:e.target.checked})} disabled={busy||!form.phone.trim()}/>{t('staff.sms')}</label><label className="flex items-center gap-2"><input type="checkbox" checked={form.allow_whatsapp} onChange={e=>setForm({...form,allow_whatsapp:e.target.checked})} disabled={busy||!(form.whatsapp_number||form.phone).trim()}/>WhatsApp</label><label className="flex items-center gap-2"><input type="checkbox" checked={form.allow_email} onChange={e=>setForm({...form,allow_email:e.target.checked})} disabled={busy||!form.email.trim()}/>{t('staff.email')}</label></div></div>
      <div className="grid gap-3 rounded-2xl border p-4 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={form.public_visible} onChange={e=>setForm({...form,public_visible:e.target.checked})} disabled={busy}/>{t('staff.showPublic')}</label><label className="flex items-center gap-2"><input type="checkbox" checked={form.active} onChange={e=>setForm({...form,active:e.target.checked})} disabled={busy}/>{t('staff.active')}</label></div>
      {error&&<p role="alert" className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p>}
      <button type="submit" disabled={busy||uploading} className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50" style={{background:'var(--brand-primary)',color:'var(--brand-primary-text)'}}>{busy?<><Loader2 className="animate-spin" size={16}/>{t('staff.saving')}</>:editing?t('staff.saveChanges'):t('staff.create')}</button>
    </div></form></div>}
  </div>;
}
