import { useEffect, useState } from 'react';
import { Activity, Loader2, Newspaper, Shield, Users } from 'lucide-react';
import { useAppI18n } from '../lib/appI18n';
import { getAccessGroupTranslation } from '../lib/accessGroupTranslations';
import { supabase } from '../lib/supabase';

type Visibility='public'|'authenticated'|'members'|'staff'|'admins'|'groups';
type Item={id:string;title:string;visibility:Visibility;allowedGroupIds:string[];type:'news'|'activity'};
type Group={id:string;name:string};

export function ContentVisibilityManager({organizationId}:{organizationId:string}){
  const { language }=useAppI18n();
  const t=(key:string)=>getAccessGroupTranslation(language,key);
  const [items,setItems]=useState<Item[]>([]);
  const [groups,setGroups]=useState<Group[]>([]);
  const [loading,setLoading]=useState(true);
  const [savingId,setSavingId]=useState('');
  const [error,setError]=useState('');

  const options:Array<{value:Visibility;label:string}>=[
    {value:'public',label:t('visibility.public')},
    {value:'authenticated',label:t('visibility.authenticated')},
    {value:'members',label:t('visibility.members')},
    {value:'staff',label:t('visibility.staff')},
    {value:'admins',label:t('visibility.admins')},
    {value:'groups',label:t('visibility.groups')},
  ];

  const load=async()=>{
    const client=supabase;if(!client)return;
    setLoading(true);setError('');
    const [newsResult,activityResult,groupResult]=await Promise.all([
      client.from('organization_news').select('id,title,visibility,allowed_group_ids').eq('organization_id',organizationId).order('updated_at',{ascending:false}),
      client.from('organization_activities').select('id,title,visibility,allowed_group_ids').eq('organization_id',organizationId).order('activity_date',{ascending:false}),
      client.from('organization_groups').select('id,name').eq('organization_id',organizationId).order('name'),
    ]);
    const firstError=newsResult.error||activityResult.error||groupResult.error;
    if(firstError)setError(firstError.message);
    setGroups((groupResult.data||[]) as Group[]);
    setItems([
      ...(newsResult.data||[]).map(row=>({id:row.id,title:row.title||t('visibility.untitled'),visibility:(row.visibility||'public') as Visibility,allowedGroupIds:row.allowed_group_ids||[],type:'news' as const})),
      ...(activityResult.data||[]).map(row=>({id:row.id,title:row.title||t('visibility.untitled'),visibility:(row.visibility||'public') as Visibility,allowedGroupIds:row.allowed_group_ids||[],type:'activity' as const})),
    ]);
    setLoading(false);
  };
  useEffect(()=>{void load();},[organizationId,language]);

  const save=async(item:Item,visibility:Visibility,allowedGroupIds:string[])=>{
    const client=supabase;if(!client)return;
    setSavingId(`${item.type}-${item.id}`);setError('');
    const table=item.type==='news'?'organization_news':'organization_activities';
    const {error}=await client.from(table).update({visibility,allowed_group_ids:visibility==='groups'?allowedGroupIds:[],updated_at:new Date().toISOString()}).eq('id',item.id).eq('organization_id',organizationId);
    setSavingId('');
    if(error){setError(error.message);return;}
    setItems(current=>current.map(entry=>entry.id===item.id&&entry.type===item.type?{...entry,visibility,allowedGroupIds:visibility==='groups'?allowedGroupIds:[]}:entry));
  };

  const toggleGroup=(item:Item,groupId:string)=>{
    const next=item.allowedGroupIds.includes(groupId)?item.allowedGroupIds.filter(id=>id!==groupId):[...item.allowedGroupIds,groupId];
    void save(item,'groups',next);
  };

  return <section className="rounded-3xl border bg-white p-5 shadow-sm">
    <div className="flex items-start gap-3"><Shield size={20} style={{color:'var(--brand-primary)'}}/><div><h4 className="font-semibold">{t('visibility.title')}</h4><p className="mt-1 text-xs leading-5 opacity-55">{t('visibility.subtitle')}</p></div></div>
    {error&&<p className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p>}
    {loading?<div className="flex items-center justify-center gap-2 p-8 text-sm opacity-60"><Loader2 className="animate-spin" size={18}/>{t('visibility.loading')}</div>:items.length===0?<p className="mt-4 rounded-xl border p-5 text-center text-sm opacity-50">{t('visibility.empty')}</p>:<div className="mt-4 space-y-3">{items.map(item=>{const savingKey=`${item.type}-${item.id}`;return <div key={savingKey} className="rounded-2xl border p-3">
      <div className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{background:'var(--brand-subtle)',color:'var(--brand-primary)'}}>{item.type==='news'?<Newspaper size={16}/>:<Activity size={16}/>}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.title}</p><p className="text-[11px] opacity-45">{item.type==='news'?t('visibility.news'):t('visibility.activity')}</p></div><div className="relative"><select aria-label={t('visibility.selectLabel')} disabled={savingId===savingKey} value={item.visibility} onChange={event=>void save(item,event.target.value as Visibility,[])} className="max-w-[145px] rounded-xl border px-2 py-2 text-xs disabled:opacity-50">{options.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select>{savingId===savingKey&&<Loader2 size={13} className="absolute right-2 top-1/2 -translate-y-1/2 animate-spin"/>}</div></div>
      {item.visibility==='groups'&&<div className="mt-3 rounded-xl bg-black/5 p-3"><div className="mb-2 flex items-center gap-2 text-xs font-semibold"><Users size={14}/>{t('visibility.chooseGroups')}</div>{groups.length===0?<p className="text-xs opacity-50">{t('visibility.createGroupFirst')}</p>:<div className="flex flex-wrap gap-2">{groups.map(group=><label key={group.id} className="flex cursor-pointer items-center gap-2 rounded-full border bg-white px-3 py-2 text-xs"><input type="checkbox" checked={item.allowedGroupIds.includes(group.id)} onChange={()=>toggleGroup(item,group.id)}/>{group.name}</label>)}</div>}</div>}
    </div>;})}</div>}
  </section>;
}
