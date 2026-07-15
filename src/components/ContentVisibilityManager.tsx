import { useEffect, useState } from 'react';
import { Activity, Loader2, Newspaper, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Visibility = 'public' | 'authenticated' | 'members' | 'staff' | 'admins' | 'groups';
type Item = { id:string; title:string; visibility:Visibility; type:'news'|'activity' };

const options: Array<{value:Visibility;label:string}> = [
  {value:'public',label:'Offentlig'},
  {value:'authenticated',label:'Alle innloggede'},
  {value:'members',label:'Kun medlemmer'},
  {value:'staff',label:'Kun ansatte og styret'},
  {value:'admins',label:'Kun administratorer'},
];

export function ContentVisibilityManager({ organizationId }:{organizationId:string}) {
  const [items,setItems]=useState<Item[]>([]);
  const [loading,setLoading]=useState(true);
  const [savingId,setSavingId]=useState('');
  const [error,setError]=useState('');

  const load=async()=>{
    const client=supabase;if(!client)return;
    setLoading(true);setError('');
    const [newsResult,activityResult]=await Promise.all([
      client.from('organization_news').select('id,title,visibility').eq('organization_id',organizationId).order('updated_at',{ascending:false}),
      client.from('organization_activities').select('id,title,visibility').eq('organization_id',organizationId).order('activity_date',{ascending:false}),
    ]);
    const firstError=newsResult.error||activityResult.error;
    if(firstError)setError(firstError.message);
    setItems([
      ...(newsResult.data||[]).map(row=>({id:row.id,title:row.title||'Uten tittel',visibility:(row.visibility||'public') as Visibility,type:'news' as const})),
      ...(activityResult.data||[]).map(row=>({id:row.id,title:row.title||'Uten tittel',visibility:(row.visibility||'public') as Visibility,type:'activity' as const})),
    ]);
    setLoading(false);
  };

  useEffect(()=>{void load();},[organizationId]);

  const change=async(item:Item,visibility:Visibility)=>{
    const client=supabase;if(!client)return;
    setSavingId(item.id);setError('');
    const table=item.type==='news'?'organization_news':'organization_activities';
    const {error}=await client.from(table).update({visibility,allowed_group_ids:[],updated_at:new Date().toISOString()}).eq('id',item.id).eq('organization_id',organizationId);
    setSavingId('');
    if(error){setError(error.message);return;}
    setItems(current=>current.map(entry=>entry.id===item.id?{...entry,visibility}:entry));
  };

  return <section className="rounded-3xl border bg-white p-5 shadow-sm">
    <div className="flex items-start gap-3"><Shield size={20} style={{color:'var(--brand-primary)'}}/><div><h4 className="font-semibold">Tilgang per innhold</h4><p className="mt-1 text-xs leading-5 opacity-55">Bestem hvem som kan se hver nyhet og aktivitet. Valgte grupper legges til i neste trinn.</p></div></div>
    {error&&<p className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p>}
    {loading?<div className="flex justify-center p-8"><Loader2 className="animate-spin"/></div>:items.length===0?<p className="mt-4 rounded-xl border p-5 text-center text-sm opacity-50">Ingen nyheter eller aktiviteter er opprettet.</p>:<div className="mt-4 space-y-2">{items.map(item=><div key={`${item.type}-${item.id}`} className="flex items-center gap-3 rounded-2xl border p-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{background:'var(--brand-subtle)',color:'var(--brand-primary)'}}>{item.type==='news'?<Newspaper size={16}/>:<Activity size={16}/>}</span>
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.title}</p><p className="text-[11px] opacity-45">{item.type==='news'?'Nyhet':'Aktivitet'}</p></div>
      <div className="relative"><select disabled={savingId===item.id} value={item.visibility==='groups'?'members':item.visibility} onChange={event=>void change(item,event.target.value as Visibility)} className="max-w-[145px] rounded-xl border px-2 py-2 text-xs disabled:opacity-50">{options.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select>{savingId===item.id&&<Loader2 size={13} className="absolute right-2 top-1/2 -translate-y-1/2 animate-spin"/>}</div>
    </div>)}</div>}
  </section>;
}
