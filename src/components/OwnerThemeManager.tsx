import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Loader2, Palette, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { applyThemeToDocument, themes } from '../lib/themeEngine';

 type OrganizationOption = { id:string; name:string; themeId:string };
const mix=(color:string,amount:number,fallback='transparent')=>`color-mix(in srgb, ${color} ${amount}%, ${fallback})`;

export function OwnerThemeManager(){
  const [organizations,setOrganizations]=useState<OrganizationOption[]>([]);
  const [organizationId,setOrganizationId]=useState('');
  const [themeId,setThemeId]=useState('yasaflow-standard');
  const [open,setOpen]=useState(false);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');

  useEffect(()=>{
    if(!supabase){setError('Supabase er ikke konfigurert.');setLoading(false);return;}
    supabase.from('organizations').select('id,name,theme_id,organization_type').neq('id','dtim').neq('organization_type','system').order('name').then(({data,error:loadError})=>{
      if(loadError){setError(loadError.message);setLoading(false);return;}
      const rows=(data||[]).map((row)=>({id:row.id,name:row.name||row.id,themeId:row.theme_id||'yasaflow-standard'}));
      setOrganizations(rows);
      const saved=localStorage.getItem('yasaflow_owner_selected_organization');
      const selected=rows.find((row)=>row.id===saved)||rows[0];
      if(selected){setOrganizationId(selected.id);setThemeId(selected.themeId);}
      setLoading(false);
    });
  },[]);

  useEffect(()=>{
    const handleSelected=(event:Event)=>{
      const id=(event as CustomEvent<{organizationId:string}>).detail?.organizationId;
      if(!id)return;
      const selected=organizations.find((item)=>item.id===id);
      if(selected){setOrganizationId(id);setThemeId(selected.themeId||'yasaflow-standard');setMessage('');setError('');}
    };
    window.addEventListener('yasaflow-owner-organization-selected',handleSelected);
    return()=>window.removeEventListener('yasaflow-owner-organization-selected',handleSelected);
  },[organizations]);

  const selectedOrganization=useMemo(()=>organizations.find((item)=>item.id===organizationId)||null,[organizations,organizationId]);
  const selectedTheme=useMemo(()=>themes.find((theme)=>theme.id===themeId)||themes[0],[themeId]);

  const chooseTheme=(id:string)=>{setThemeId(id);setMessage('');setError('');const theme=themes.find((item)=>item.id===id);if(theme)applyThemeToDocument(theme);};

  const saveTheme=async()=>{
    if(!supabase||!organizationId)return;
    setSaving(true);setMessage('');setError('');
    const {data,error:saveError}=await supabase
      .from('organizations')
      .update({theme_id:themeId,updated_at:new Date().toISOString()})
      .eq('id',organizationId)
      .select('id,theme_id')
      .single();
    if(saveError){setError(saveError.message);setSaving(false);return;}
    if(!data||data.theme_id!==themeId){setError('Temaet ble ikke bekreftet lagret. Prøv igjen.');setSaving(false);return;}
    setOrganizations((current)=>current.map((item)=>item.id===organizationId?{...item,themeId}:item));
    localStorage.setItem(`yasaflow_theme_${organizationId}`,themeId);
    window.dispatchEvent(new CustomEvent('yasaflow-owner-theme-changed',{detail:{organizationId,themeId}}));
    applyThemeToDocument(selectedTheme);
    setMessage(`Temaet er lagret for ${selectedOrganization?.name||'organisasjonen'}.`);
    setSaving(false);

    // Appens rotkomponent holder temafargene i React-state. En kontrollert reload
    // gjør at det nylig lagrede temaet hentes og brukes i hele appen med én gang.
    window.setTimeout(()=>window.location.reload(),350);
  };

  return <section className="mx-4 mt-4 overflow-hidden rounded-2xl border-2 bg-white shadow-sm" style={{borderColor:mix('var(--brand-primary)',22),color:'var(--brand-text)'}}>
    <button type="button" onClick={()=>setOpen((current)=>!current)} className="flex w-full items-center justify-between gap-3 p-4 text-left"><div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{backgroundColor:mix('var(--brand-primary)',12),color:'var(--brand-primary)'}}><Palette size={18}/></div><div className="min-w-0"><p className="text-sm font-medium">Tema og design</p><p className="truncate text-[11px] opacity-50">{selectedOrganization?.name||'Valgt organisasjon'} · {selectedTheme.name}</p></div></div><ChevronDown size={18} className={`shrink-0 transition-transform ${open?'rotate-180':''}`}/></button>
    {open&&<div className="border-t p-4" style={{borderColor:mix('var(--brand-primary)',16)}}>{loading?<div className="flex items-center justify-center gap-2 py-8 text-sm opacity-60"><Loader2 size={17} className="animate-spin"/> Henter temaer...</div>:<div className="space-y-4"><div className="rounded-xl border px-3 py-2" style={{borderColor:mix('var(--brand-primary)',16),backgroundColor:mix('var(--brand-primary)',5,'#FFFFFF')}}><p className="text-[10px] uppercase tracking-wide opacity-45">Tema endres for</p><p className="text-sm font-semibold">{selectedOrganization?.name||'Ingen organisasjon valgt'}</p><p className="mt-0.5 text-[11px] opacity-50">Følger organisasjonen som er valgt øverst i Owner Panel.</p></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{themes.map((theme)=>{const active=themeId===theme.id;return <button key={theme.id} type="button" onClick={()=>chooseTheme(theme.id)} className="rounded-2xl border-2 p-3 text-left transition" style={{borderColor:active?theme.tokens.primary:mix('var(--brand-primary)',16),backgroundColor:active?mix(theme.tokens.primary,7,'#FFFFFF'):'#FFFFFF'}}><div className="flex items-center justify-between gap-2"><div className="flex gap-1.5">{[theme.tokens.primary,theme.tokens.secondary,theme.tokens.background,theme.tokens.card].map((color)=><span key={color} className="h-6 w-6 rounded-full border" style={{backgroundColor:color}}/>)}</div>{active&&<span className="flex h-7 w-7 items-center justify-center rounded-full" style={{backgroundColor:theme.tokens.primary,color:'#FFFFFF'}}><Check size={15}/></span>}</div><p className="mt-3 text-sm font-semibold">{theme.name}</p><p className="mt-1 text-[11px] leading-4 opacity-55">{theme.description}</p></button>;})}</div>{error&&<p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}{message&&<p className="rounded-xl bg-green-50 px-3 py-2 text-xs text-green-700">{message}</p>}<button type="button" disabled={saving||!selectedOrganization} onClick={()=>void saveTheme()} className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium disabled:opacity-50" style={{backgroundColor:'var(--brand-primary)',color:'var(--brand-primary-text)'}}>{saving?<Loader2 size={16} className="animate-spin"/>:<Save size={16}/>} {saving?'Lagrer tema...':`Lagre tema for ${selectedOrganization?.name||'organisasjonen'}`}</button></div>}</div>}
  </section>;
}
