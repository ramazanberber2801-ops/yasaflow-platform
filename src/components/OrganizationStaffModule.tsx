import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { ArrowDown, ArrowUp, Edit3, ImagePlus, Loader2, Plus, Trash2, Users, X } from 'lucide-react';
import { useAppI18n } from '../lib/appI18n';
import { getStaffTranslation } from '../lib/staffTranslations';
import { supabase } from '../lib/supabase';

type Staff = {
  id:string; name:string; position:string; phone:string; email:string; active:boolean; public_visible:boolean; sort_order:number;
  allow_call:boolean; allow_sms:boolean; allow_whatsapp:boolean; allow_email:boolean;
  whatsapp_number:string; bio:string; image_url:string;
};

const empty = {
  name:'', position:'', phone:'', email:'', active:true, public_visible:true,
  allow_call:true, allow_sms:false, allow_whatsapp:false, allow_email:false,
  whatsapp_number:'', bio:'', image_url:'',
};

export function OrganizationStaffModule({ organizationId }:{ organizationId:string }) {
  const { language } = useAppI18n();
  const t = (key:string) => getStaffTranslation(language,key);
  const [items,setItems]=useState<Staff[]>([]); const [editing,setEditing]=useState<Staff|null>(null);
  const [form,setForm]=useState(empty); const [open,setOpen]=useState(false); const [busy,setBusy]=useState(false); const [uploading,setUploading]=useState(false); const [error,setError]=useState('');

  const load=async()=>{
    if(!supabase)return;
    const {data,error}=await supabase.from('organization_staff').select('id,name,position,phone,email,active,public_visible,sort_order,allow_call,allow_sms,allow_whatsapp,allow_email,whatsapp_number,bio,image_url').eq('organization_id',organizationId).order('sort_order').order('created_at');
    if(error)setError(error.message); else setItems((data||[]) as Staff[]);
  };

  useEffect(()=>{void load();},[organizationId,language]);

  const start=(item?:Staff)=>{
    setEditing(item||null);
    setForm(item?{
      name:item.name||'',position:item.position||'',phone:item.phone||'',email:item.email||'',active:item.active,public_visible:item.public_visible!==false,
      allow_call:item.allow_call!==false,allow_sms:Boolean(item.allow_sms),allow_whatsapp:Boolean(item.allow_whatsapp),allow_email:Boolean(item.allow_email),
      whatsapp_number:item.whatsapp_number||'',bio:item.bio||'',image_url:item.image_url||'',
    }:empty);
    setError('');setOpen(true);
  };

  const uploadImage=async(event:ChangeEvent<HTMLInputElement>)=>{
    const client=supabase;const file=event.target.files?.[0];if(!client||!file)return;
    if(!file.type.startsWith('image/'))return setError(t('staff.chooseImageFile'));
    if(file.size>5*1024*1024)return setError(t('staff.imageTooLarge'));
    setUploading(true);setError('');
    const extension=file.name.split('.').pop()?.toLowerCase()||'jpg';
    const path=`${organizationId}/${crypto.randomUUID()}.${extension}`;
    const {error}=await client.storage.from('organization-contact-images').upload(path,file,{upsert:false,contentType:file.type});
    if(error){setUploading(false);setError(error.message);return;}
    const {data}=client.storage.from('organization-contact-images').getPublicUrl(path);
    setForm(current=>({...current,image_url:data.publicUrl}));
    setUploading(false);
  };

  const save=async(e:FormEvent)=>{
    e.preventDefault();if(!supabase||!form.name.trim())return;
    setBusy(true);
    const payload={
      organization_id:organizationId,name:form.name.trim(),position:form.position.trim()||null,
      phone:form.phone.trim()||null,email:form.email.trim()||null,active:form.active,public_visible:form.public_visible,
      allow_call:Boolean(form.phone.trim())&&form.allow_call,
      allow_sms:Boolean(form.phone.trim())&&form.allow_sms,
      allow_whatsapp:Boolean((form.whatsapp_number||form.phone).trim())&&form.allow_whatsapp,
      allow_email:Boolean(form.email.trim())&&form.allow_email,
      whatsapp_number:form.whatsapp_number.trim()||null,bio:form.bio.trim()||null,image_url:form.image_url.trim()||null,
      sort_order:editing?.sort_order??items.length,
      updated_at:new Date().toISOString(),
    };
    const result=editing?await supabase.from('organization_staff').update(payload).eq('id',editing.id).eq('organization_id',organizationId):await supabase.from('organization_staff').insert(payload);
    setBusy(false);if(result.error)return setError(result.error.message);setOpen(false);await load();
  };

  const remove=async(item:Staff)=>{if(!supabase||!confirm(`${t('staff.deletePrefix')}${item.name}${t('staff.deleteSuffix')}`))return;const {error}=await supabase.from('organization_staff').delete().eq('id',item.id).eq('organization_id',organizationId);if(error)alert(error.message);else await load();};

  const move=async(index:number,direction:-1|1)=>{
    const client=supabase;if(!client)return;
    const target=index+direction;if(target<0||target>=items.length)return;
    const current=items[index];const other=items[target];
    const currentOrder=current.sort_order??index;const otherOrder=other.sort_order??target;
    setItems(list=>{const next=[...list];[next[index],next[target]]=[next[target],next[index]];return next;});
    const [first,second]=await Promise.all([
      client.from('organization_staff').update({sort_order:otherOrder,updated_at:new Date().toISOString()}).eq('id',current.id).eq('organization_id',organizationId),
      client.from('organization_staff').update({sort_order:currentOrder,updated_at:new Date().toISOString()}).eq('id',other.id).eq('organization_id',organizationId),
    ]);
    if(first.error||second.error){setError((first.error||second.error)?.message||t('staff.orderSaveFailed'));await load();}
  };

  return <div className="space-y-4">
    <section className="rounded-3xl border bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-xs uppercase opacity-45">{t('staff.organization')}</p><h3 className="font-serif text-2xl">{t('staff.title')}</h3><p className="mt-1 text-sm opacity-55">{items.length} {t('staff.countSuffix')}</p></div><button onClick={()=>start()} className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium" style={{background:'var(--brand-primary)',color:'var(--brand-primary-text)'}}><Plus size={16}/>{t('staff.add')}</button></div></section>
    {error&&!open&&<p className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p>}
    <div className="space-y-2">{items.map((item,index)=><div key={item.id} className="flex items-center gap-3 rounded-2xl border bg-white p-4"><div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full" style={{background:'var(--brand-subtle)',color:'var(--brand-primary)'}}>{item.image_url?<img src={item.image_url} alt="" className="h-full w-full object-cover"/>:<Users size={17}/>}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate text-sm font-semibold">{item.name}</p>{!item.public_visible&&<span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">{t('staff.hidden')}</span>}</div><p className="truncate text-xs opacity-50">{item.position||t('staff.noRole')}{item.phone?` · ${item.phone}`:''}</p></div><div className="flex flex-col gap-1"><button disabled={index===0} onClick={()=>void move(index,-1)} className="rounded-md bg-black/5 p-1 disabled:opacity-20"><ArrowUp size={13}/></button><button disabled={index===items.length-1} onClick={()=>void move(index,1)} className="rounded-md bg-black/5 p-1 disabled:opacity-20"><ArrowDown size={13}/></button></div><button onClick={()=>start(item)} className="rounded-lg bg-black/5 p-2"><Edit3 size={15}/></button><button onClick={()=>void remove(item)} className="rounded-lg bg-red-50 p-2 text-red-700"><Trash2 size={15}/></button></div>)}</div>

    {open&&<div className="fixed inset-0 z-[130] flex items-end bg-black/45 sm:items-center sm:justify-center sm:p-4"><form onSubmit={save} className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 sm:rounded-3xl"><div className="flex justify-between"><h3 className="font-serif text-xl">{editing?t('staff.edit'):t('staff.new')}</h3><button type="button" aria-label={t('staff.close')} onClick={()=>setOpen(false)}><X/></button></div><div className="mt-4 space-y-3">
      <input required className="w-full rounded-xl border p-3 text-sm" placeholder={t('staff.name')} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
      <input className="w-full rounded-xl border p-3 text-sm" placeholder={t('staff.position')} value={form.position} onChange={e=>setForm({...form,position:e.target.value})}/>
      <textarea className="min-h-24 w-full rounded-xl border p-3 text-sm" placeholder={t('staff.bio')} value={form.bio} onChange={e=>setForm({...form,bio:e.target.value})}/>
      <div className="rounded-2xl border p-4"><p className="text-sm font-semibold">{t('staff.image')}</p><div className="mt-3 flex items-center gap-3">{form.image_url?<img src={form.image_url} alt="" className="h-16 w-16 rounded-full object-cover"/>:<div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/5"><Users size={22}/></div>}<label className="flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm"><ImagePlus size={16}/>{uploading?t('staff.uploading'):t('staff.chooseImage')}<input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={event=>void uploadImage(event)}/></label>{form.image_url&&<button type="button" onClick={()=>setForm({...form,image_url:''})} className="text-xs text-red-700">{t('staff.removeImage')}</button>}</div></div>
      <input className="w-full rounded-xl border p-3 text-sm" placeholder={t('staff.phone')} value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/>
      <input type="email" className="w-full rounded-xl border p-3 text-sm" placeholder={t('staff.email')} value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>
      <input className="w-full rounded-xl border p-3 text-sm" placeholder={t('staff.whatsapp')} value={form.whatsapp_number} onChange={e=>setForm({...form,whatsapp_number:e.target.value})}/>
      <div className="rounded-2xl border p-4"><p className="text-sm font-semibold">{t('staff.contactOptions')}</p><p className="mt-1 text-xs opacity-55">{t('staff.contactHelp')}</p><div className="mt-3 grid grid-cols-2 gap-3 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={form.allow_call} onChange={e=>setForm({...form,allow_call:e.target.checked})} disabled={!form.phone.trim()}/>{t('staff.call')}</label><label className="flex items-center gap-2"><input type="checkbox" checked={form.allow_sms} onChange={e=>setForm({...form,allow_sms:e.target.checked})} disabled={!form.phone.trim()}/>{t('staff.sms')}</label><label className="flex items-center gap-2"><input type="checkbox" checked={form.allow_whatsapp} onChange={e=>setForm({...form,allow_whatsapp:e.target.checked})} disabled={!(form.whatsapp_number||form.phone).trim()}/>WhatsApp</label><label className="flex items-center gap-2"><input type="checkbox" checked={form.allow_email} onChange={e=>setForm({...form,allow_email:e.target.checked})} disabled={!form.email.trim()}/>{t('staff.email')}</label></div></div>
      <div className="grid gap-3 rounded-2xl border p-4 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={form.public_visible} onChange={e=>setForm({...form,public_visible:e.target.checked})}/>{t('staff.showPublic')}</label><label className="flex items-center gap-2"><input type="checkbox" checked={form.active} onChange={e=>setForm({...form,active:e.target.checked})}/>{t('staff.active')}</label></div>
      {error&&<p className="text-xs text-red-700">{error}</p>}
      <button disabled={busy||uploading} className="flex w-full justify-center rounded-xl py-3 text-sm font-medium disabled:opacity-50" style={{background:'var(--brand-primary)',color:'var(--brand-primary-text)'}}>{busy?<Loader2 className="animate-spin" size={16}/>:editing?t('staff.saveChanges'):t('staff.create')}</button>
    </div></form></div>}
  </div>;
}
