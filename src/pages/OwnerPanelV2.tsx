import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Building2, Boxes, ExternalLink, Plus, Rocket, Save, Search, Send, Server, ShieldCheck, X } from 'lucide-react';
import { OwnerPanelFormField, OwnerPanelTextInput } from '../components/owner/OwnerPanelFormField';
import {
  getOwnerPanelErrorSummary,
  hasOwnerPanelValidationErrors,
  normalizeOwnerOrganization,
  validateOwnerOrganization,
  type OwnerOrganizationDraft,
  type OwnerPanelValidationErrors,
} from '../lib/ownerPanelValidation';
import { supabase } from '../lib/supabase';

const brand = {
  primary: 'var(--brand-primary)',
  secondary: 'var(--brand-secondary)',
  text: 'var(--brand-text)',
  primaryText: 'var(--brand-primary-text)',
  secondaryText: 'var(--brand-secondary-text)',
};

const mix = (color: string, amount: number, fallback = 'transparent') =>
  `color-mix(in srgb, ${color} ${amount}%, ${fallback})`;

type Organization = OwnerOrganizationDraft & {
  type: string; country: string; language: string; status: string; hosting: string;
  adminName: string; memberCount: number; themeId: string; onboardingStep: string;
};
type ModuleItem = { id:string; name:string; category:string; status:string; enabled:boolean; locked:boolean; core?:boolean; later?:boolean };
type ModuleCategory = { id:string; name:string; icon:string };
type ProvisioningStep = { stepKey:string; label:string; status:string };

const defaultProvisioningSteps: ProvisioningStep[] = [
  { stepKey:'order_received',label:'Bestilling mottatt',status:'pending' },
  { stepKey:'organization_created',label:'Organisasjon opprettet',status:'pending' },
  { stepKey:'admin_ready',label:'Administrator',status:'pending' },
  { stepKey:'domain_configured',label:'Domene konfigurert',status:'pending' },
  { stepKey:'modules_configured',label:'Moduler konfigurert',status:'pending' },
  { stepKey:'testing',label:'Testing',status:'pending' },
  { stepKey:'ready_to_publish',label:'Klar for publisering',status:'pending' },
  { stepKey:'published',label:'Publisert',status:'pending' },
];

const moduleCategories:ModuleCategory[]=[
  {id:'communication',name:'Kommunikasjon',icon:'📢'},{id:'activities',name:'Aktiviteter',icon:'📅'},{id:'members',name:'Medlemmer',icon:'👥'},
  {id:'finance',name:'Økonomi',icon:'💰'},{id:'organization',name:'Organisasjon',icon:'🏢'},{id:'education',name:'Undervisning',icon:'📚'},
  {id:'rooms',name:'Lokaler',icon:'📍'},{id:'information',name:'Informasjon',icon:'🌍'},{id:'faith',name:'Trossamfunn',icon:'🤲'},
  {id:'administration',name:'Administrasjon',icon:'📊'},{id:'integrations',name:'Integrasjoner',icon:'🌐'},{id:'premium',name:'Premium',icon:'⭐'},{id:'ai',name:'AI',icon:'🤖'},
];

const coreModules:ModuleItem[]=[
  {id:'news',name:'Nyheter',category:'core',status:'Inkludert',enabled:true,locked:true,core:true},
  {id:'activities',name:'Aktiviteter',category:'core',status:'Inkludert',enabled:true,locked:true,core:true},
  {id:'members',name:'Medlemmer',category:'core',status:'Inkludert',enabled:true,locked:true,core:true},
  {id:'administration',name:'Administrasjon',category:'core',status:'Inkludert',enabled:true,locked:true,core:true},
  {id:'settings',name:'Innstillinger',category:'core',status:'Inkludert',enabled:true,locked:true,core:true},
];

const optionalModules:ModuleItem[]=[
  {id:'push',name:'Push-varsler',category:'communication',status:'Aktiv',enabled:true,locked:false},
  {id:'announcements',name:'Kunngjøringer',category:'communication',status:'Av',enabled:false,locked:false},
  {id:'notification-center',name:'Varslingssenter',category:'communication',status:'Av',enabled:false,locked:false},
  {id:'chat',name:'Chat',category:'communication',status:'Av',enabled:false,locked:false},
  {id:'direct-messages',name:'Direktemeldinger',category:'communication',status:'Av',enabled:false,locked:false},
  {id:'email-campaigns',name:'E-postutsendelser',category:'communication',status:'Senere',enabled:false,locked:true,later:true},
  {id:'sms',name:'SMS',category:'communication',status:'Senere',enabled:false,locked:true,later:true},
  {id:'events',name:'Arrangementer',category:'activities',status:'Av',enabled:false,locked:false},
  {id:'calendar',name:'Kalender',category:'activities',status:'Av',enabled:false,locked:false},
  {id:'registration',name:'Påmelding',category:'activities',status:'Av',enabled:false,locked:false},
  {id:'waitlist',name:'Venteliste',category:'activities',status:'Av',enabled:false,locked:false},
  {id:'event-volunteers',name:'Frivillige til arrangement',category:'activities',status:'Av',enabled:false,locked:false},
  {id:'qr-checkin',name:'QR-innsjekk',category:'activities',status:'Senere',enabled:false,locked:true,later:true},
  {id:'member-groups',name:'Grupper',category:'members',status:'Av',enabled:false,locked:false},
  {id:'member-roles',name:'Interne roller',category:'members',status:'Av',enabled:false,locked:false},
  {id:'families',name:'Familier',category:'members',status:'Senere',enabled:false,locked:true,later:true},
  {id:'member-card',name:'Medlemskort',category:'members',status:'Av',enabled:false,locked:false},
  {id:'qr-member-card',name:'QR-medlemskort',category:'members',status:'Senere',enabled:false,locked:true,later:true},
  {id:'donation',name:'Donasjoner',category:'finance',status:'Aktiv',enabled:true,locked:false},
  {id:'fundraising',name:'Innsamlinger',category:'finance',status:'Av',enabled:false,locked:false},
  {id:'membership-fees',name:'Kontingent',category:'finance',status:'Av',enabled:false,locked:false},
  {id:'payments',name:'Betalinger',category:'finance',status:'Av',enabled:false,locked:false},
  {id:'receipts',name:'Kvitteringer',category:'finance',status:'Av',enabled:false,locked:false},
  {id:'vipps',name:'Vipps',category:'finance',status:'Senere',enabled:false,locked:true,later:true},
  {id:'stripe',name:'Stripe',category:'finance',status:'Senere',enabled:false,locked:true,later:true},
  {id:'board',name:'Styret',category:'organization',status:'Av',enabled:false,locked:false},
  {id:'employees',name:'Ansatte',category:'organization',status:'Av',enabled:false,locked:false},
  {id:'volunteers',name:'Frivillige',category:'organization',status:'Av',enabled:false,locked:false},
  {id:'document-archive',name:'Dokumentarkiv',category:'organization',status:'Av',enabled:false,locked:false},
  {id:'file-library',name:'Filbibliotek',category:'organization',status:'Av',enabled:false,locked:false},
  {id:'links',name:'Lenker',category:'organization',status:'Av',enabled:false,locked:false},
  {id:'courses',name:'Kurs',category:'education',status:'Av',enabled:false,locked:false},
  {id:'teaching',name:'Undervisning',category:'education',status:'Av',enabled:false,locked:false},
  {id:'videos',name:'Videoer',category:'education',status:'Av',enabled:false,locked:false},
  {id:'podcast',name:'Podkast',category:'education',status:'Av',enabled:false,locked:false},
  {id:'documents',name:'Dokumenter',category:'education',status:'Av',enabled:false,locked:false},
  {id:'resource-library',name:'Ressursbibliotek',category:'education',status:'Av',enabled:false,locked:false},
  {id:'room-booking',name:'Rombooking',category:'rooms',status:'Av',enabled:false,locked:false},
  {id:'room-calendar',name:'Kalender for lokaler',category:'rooms',status:'Av',enabled:false,locked:false},
  {id:'rentals',name:'Utleie',category:'rooms',status:'Av',enabled:false,locked:false},
  {id:'resources',name:'Ressurser',category:'rooms',status:'Av',enabled:false,locked:false},
  {id:'about',name:'Om oss',category:'information',status:'Av',enabled:false,locked:false},
  {id:'contact',name:'Kontakt',category:'information',status:'Av',enabled:false,locked:false},
  {id:'opening-hours',name:'Åpningstider',category:'information',status:'Av',enabled:false,locked:false},
  {id:'map',name:'Kart',category:'information',status:'Av',enabled:false,locked:false},
  {id:'social-media',name:'Sosiale medier',category:'information',status:'Av',enabled:false,locked:false},
  {id:'prayer',name:'Bønnetider',category:'faith',status:'Av',enabled:false,locked:false},
  {id:'friday-prayer',name:'Fredagsbønn',category:'faith',status:'Av',enabled:false,locked:false},
  {id:'ramadan',name:'Ramadan',category:'faith',status:'Av',enabled:false,locked:false},
  {id:'eid',name:'Eid',category:'faith',status:'Av',enabled:false,locked:false},
  {id:'bible-study',name:'Bibelstudier',category:'faith',status:'Av',enabled:false,locked:false},
  {id:'services',name:'Gudstjenester',category:'faith',status:'Av',enabled:false,locked:false},
  {id:'ceremonies',name:'Seremonier',category:'faith',status:'Av',enabled:false,locked:false},
  {id:'daily_inspiration',name:'Dagens vers / hadith',category:'faith',status:'Av',enabled:false,locked:false},
  {id:'analytics',name:'Analyse',category:'administration',status:'Av',enabled:false,locked:false},
  {id:'statistics',name:'Statistikk',category:'administration',status:'Av',enabled:false,locked:false},
  {id:'admin-dashboard',name:'Dashboard',category:'administration',status:'Av',enabled:false,locked:false},
  {id:'logs',name:'Logger',category:'administration',status:'Av',enabled:false,locked:false},
  {id:'export',name:'Eksport',category:'administration',status:'Senere',enabled:false,locked:true,later:true},
  {id:'import',name:'Import',category:'administration',status:'Senere',enabled:false,locked:true,later:true},
  {id:'google-calendar',name:'Google Calendar',category:'integrations',status:'Av',enabled:false,locked:false},
  {id:'outlook',name:'Outlook',category:'integrations',status:'Av',enabled:false,locked:false},
  {id:'youtube',name:'YouTube',category:'integrations',status:'Av',enabled:false,locked:false},
  {id:'facebook',name:'Facebook',category:'integrations',status:'Av',enabled:false,locked:false},
  {id:'instagram',name:'Instagram',category:'integrations',status:'Av',enabled:false,locked:false},
  {id:'whatsapp',name:'WhatsApp',category:'integrations',status:'Av',enabled:false,locked:false},
  {id:'zapier',name:'Zapier',category:'integrations',status:'Senere',enabled:false,locked:true,later:true},
  {id:'api',name:'API',category:'integrations',status:'Senere',enabled:false,locked:true,later:true},
  {id:'white-label',name:'White-label',category:'premium',status:'Av',enabled:false,locked:false},
  {id:'custom-domain',name:'Eget domene',category:'premium',status:'Av',enabled:false,locked:false},
  {id:'own-app',name:'Egen app',category:'premium',status:'Av',enabled:false,locked:false},
  {id:'custom-branding',name:'Egen profil',category:'premium',status:'Av',enabled:false,locked:false},
  {id:'advanced-roles',name:'Avanserte roller',category:'premium',status:'Av',enabled:false,locked:false},
  {id:'backup',name:'Backup',category:'premium',status:'Av',enabled:false,locked:false},
  {id:'audit-log',name:'Revisjonslogg',category:'premium',status:'Av',enabled:false,locked:false},
  {id:'ai-assistant',name:'AI-assistent',category:'ai',status:'Senere',enabled:false,locked:true,later:true},
  {id:'ai-translation',name:'AI-oversettelse',category:'ai',status:'Senere',enabled:false,locked:true,later:true},
  {id:'ai-summaries',name:'AI-oppsummeringer',category:'ai',status:'Senere',enabled:false,locked:true,later:true},
  {id:'ai-writing',name:'AI-skrivehjelp',category:'ai',status:'Senere',enabled:false,locked:true,later:true},
];

const defaultModules=[...coreModules,...optionalModules];
const defaultOrganization:Organization={id:'',name:'',type:'Forening',country:'Norge',language:'Norsk',status:'Prøve',hosting:'Managed',domain:'',liveUrl:'/',vercelUrl:'',supabaseUrl:'',adminName:'',adminEmail:'',memberCount:0,themeId:'yasaflow-standard',onboardingStep:'Bestilling'};
function normalizeOrganization(row:any):Organization{return {...defaultOrganization,id:row.id||'',name:row.name||'Uten navn',type:row.organization_type||row.type||'Forening',country:row.country||'Norge',language:row.language||'Norsk',status:row.status||'Prøve',hosting:row.hosting_mode||row.hosting||'Managed',domain:row.domain||'',liveUrl:row.live_url||row.liveUrl||'/',vercelUrl:row.vercel_url||row.vercelUrl||'',supabaseUrl:row.supabase_url||row.supabaseUrl||'',adminName:row.admin_name||row.adminName||'',adminEmail:row.admin_email||row.adminEmail||'',memberCount:Number(row.member_count||row.memberCount||0),themeId:row.theme_id||row.themeId||'yasaflow-standard',onboardingStep:row.onboarding_step||row.onboardingStep||'Bestilling'};}
function Card({title,icon:Icon,children}:{title:string;icon:any;children:ReactNode}){return <section className="rounded-2xl border-2 bg-white p-4 shadow-sm" style={{borderColor:mix(brand.primary,22),color:brand.text}}><div className="mb-4 flex items-center gap-2"><div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{backgroundColor:mix(brand.primary,12),color:brand.primary}}><Icon size={18}/></div><h3 className="font-serif text-lg">{title}</h3></div>{children}</section>;}
function FieldLabel({children}:{children:ReactNode}){return <p className="mb-1 text-[10px] uppercase tracking-wide opacity-45">{children}</p>;}
function TextInput({value,onChange,placeholder,type='text',disabled=false}:{value:string|number;onChange:(value:string)=>void;placeholder:string;type?:string;disabled?:boolean}){return <input type={type} disabled={disabled} className="w-full rounded-xl border bg-white px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60" style={{borderColor:mix(brand.primary,22),color:brand.text}} value={value} onChange={(e)=>onChange(e.target.value)} placeholder={placeholder}/>;}
function SelectInput({value,onChange,children,disabled=false}:{value:string;onChange:(value:string)=>void;children:ReactNode;disabled?:boolean}){return <select disabled={disabled} className="w-full rounded-xl border bg-white px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60" style={{borderColor:mix(brand.primary,22),color:brand.text}} value={value} onChange={(e)=>onChange(e.target.value)}>{children}</select>;}
function StatusMessage({state,text}:{state:'idle'|'saving'|'success'|'error'|'sending'|'sent';text:string}){if(!text)return null;return <p aria-live="polite" className={`rounded-xl px-3 py-2 text-xs ${state==='error'?'bg-red-50 text-red-700':'bg-black/5'}`}>{text}</p>;}
function LinkRow({label,value,icon:Icon}:{label:string;value:string;icon:any}){const disabled=!value;const content=<div className="flex items-center justify-between gap-3 rounded-xl border p-3" style={{borderColor:mix(brand.primary,16),backgroundColor:disabled?mix(brand.primary,4,'#FFFFFF'):'#FFFFFF'}}><div className="flex min-w-0 items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{backgroundColor:mix(brand.primary,10),color:brand.primary}}><Icon size={17}/></div><div className="min-w-0"><p className="text-sm font-medium">{label}</p><p className="truncate text-[11px] opacity-50">{value||'Ikke satt'}</p></div></div><span className="text-[10px] uppercase opacity-50">{disabled?'Ikke satt':'Åpne'}</span></div>;if(disabled)return <div className="opacity-75">{content}</div>;return <a href={value} target={value.startsWith('http')?'_blank':'_self'} rel="noreferrer">{content}</a>;}
function ModuleToggle({mod,onToggle,disabled}:{mod:ModuleItem;onToggle:(id:string)=>void;disabled:boolean}){return <button type="button" disabled={mod.locked||disabled} onClick={()=>onToggle(mod.id)} className="flex w-full items-center justify-between rounded-xl border p-3 text-left disabled:cursor-not-allowed disabled:opacity-60" style={{borderColor:mix(brand.primary,16),backgroundColor:mod.enabled?mix(brand.primary,5,'#FFFFFF'):'#FFFFFF'}}><div className="min-w-0 pr-3"><p className="truncate text-sm font-medium">{mod.name}</p><p className="text-[11px] opacity-50">{mod.core?'Kjerne · alltid aktiv':mod.later?'Kommer senere':mod.enabled?'Aktiv':'Av'}</p></div><span className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition" style={{backgroundColor:mod.enabled?brand.primary:mix(brand.text,18)}}><span className="inline-block h-5 w-5 transform rounded-full bg-white transition" style={{transform:mod.enabled?'translateX(22px)':'translateX(2px)'}}/></span></button>;}

export function OwnerPanelV2(){
  const [organizations,setOrganizations]=useState<Organization[]>([]);
  const [organization,setOrganization]=useState<Organization>(defaultOrganization);
  const [previousOrganization,setPreviousOrganization]=useState<Organization|null>(null);
  const [isCreating,setIsCreating]=useState(false);
  const [selectorOpen,setSelectorOpen]=useState(false);
  const [searchQuery,setSearchQuery]=useState('');
  const [openCategory,setOpenCategory]=useState<string|null>(null);
  const [modules,setModules]=useState<ModuleItem[]>(defaultModules);
  const [provisioningSteps,setProvisioningSteps]=useState<ProvisioningStep[]>(defaultProvisioningSteps);
  const [errors,setErrors]=useState<OwnerPanelValidationErrors>({});
  const [saveState,setSaveState]=useState<'idle'|'saving'|'success'|'error'>('idle');
  const [saveMessage,setSaveMessage]=useState('');
  const [inviteState,setInviteState]=useState<'idle'|'sending'|'sent'|'error'>('idle');
  const [inviteMessage,setInviteMessage]=useState('');
  const firstErrorRef=useRef<HTMLInputElement|null>(null);
  const isBusy=saveState==='saving'||inviteState==='sending';
  const activeModules=useMemo(()=>modules.filter((mod)=>mod.enabled).length,[modules]);
  const errorSummary=useMemo(()=>getOwnerPanelErrorSummary(errors),[errors]);
  const filteredOrganizations=useMemo(()=>{const q=searchQuery.trim().toLowerCase();if(!q)return organizations;return organizations.filter((org)=>[org.name,org.type,org.domain,org.country,org.adminEmail,org.status,org.hosting].join(' ').toLowerCase().includes(q));},[organizations,searchQuery]);

  useEffect(()=>{if(!supabase)return;supabase.from('organizations').select('*').neq('id','dtim').neq('organization_type','system').order('updated_at',{ascending:false}).then(({data,error})=>{if(error||!data?.length)return;const rows=data.map(normalizeOrganization);setOrganizations(rows);setOrganization(rows[0]);});},[]);
  useEffect(()=>{if(!organization.id)return;localStorage.setItem('yasaflow_owner_selected_organization',organization.id);window.dispatchEvent(new CustomEvent('yasaflow-owner-organization-selected',{detail:{organizationId:organization.id}}));},[organization.id]);
  useEffect(()=>{const handleThemeChanged=(event:Event)=>{const detail=(event as CustomEvent<{organizationId:string;themeId:string}>).detail;if(!detail?.organizationId||!detail.themeId)return;setOrganizations((current)=>current.map((item)=>item.id===detail.organizationId?{...item,themeId:detail.themeId}:item));setOrganization((current)=>current.id===detail.organizationId?{...current,themeId:detail.themeId}:current);};window.addEventListener('yasaflow-owner-theme-changed',handleThemeChanged);return()=>window.removeEventListener('yasaflow-owner-theme-changed',handleThemeChanged);},[]);
  useEffect(()=>{if(isCreating){setModules(defaultModules.map((mod)=>({...mod})));setProvisioningSteps(defaultProvisioningSteps);return;}setModules(defaultModules.map((mod)=>({...mod})));setProvisioningSteps(defaultProvisioningSteps);if(!supabase||!organization.id)return;let cancelled=false;supabase.from('organization_modules').select('module_id, enabled, status').eq('organization_id',organization.id).then(({data,error})=>{if(cancelled||error||!data)return;const savedModules=new Map(data.map((row)=>[row.module_id,row]));setModules(defaultModules.map((mod)=>{if(mod.core)return {...mod,enabled:true,status:'Inkludert'};if(mod.later)return {...mod,enabled:false,status:'Senere'};const saved=savedModules.get(mod.id);if(!saved)return {...mod};return {...mod,enabled:Boolean(saved.enabled),status:saved.status||(saved.enabled?'Aktiv':'Av')};}));});supabase.from('organization_provisioning_steps').select('step_key, label, status').eq('organization_id',organization.id).then(({data,error})=>{if(cancelled||error||!data)return;const savedSteps=new Map(data.map((row)=>[row.step_key,row]));setProvisioningSteps(defaultProvisioningSteps.map((step)=>{const saved=savedSteps.get(step.stepKey);return saved?{stepKey:step.stepKey,label:saved.label||step.label,status:saved.status||'pending'}:step;}));});return()=>{cancelled=true;};},[organization.id,isCreating]);

  const setOrgField=(key:keyof Organization,value:string|number)=>{setOrganization((prev)=>({...prev,[key]:value}));if(key in errors)setErrors((current)=>({...current,[key]:undefined}));};
  const resetFeedback=()=>{setErrors({});setSaveState('idle');setSaveMessage('');setInviteState('idle');setInviteMessage('');};
  const selectOrganization=(org:Organization)=>{setOrganization(org);setIsCreating(false);setPreviousOrganization(null);setSelectorOpen(false);setSearchQuery('');resetFeedback();};
  const startNewOrganization=()=>{if(!isCreating)setPreviousOrganization(organization);setIsCreating(true);setSelectorOpen(false);setSearchQuery('');resetFeedback();setModules(defaultModules.map((mod)=>({...mod})));setOrganization({...defaultOrganization,id:`org-${Date.now()}`});};
  const cancelCreate=()=>{if(previousOrganization)setOrganization(previousOrganization);setIsCreating(false);setPreviousOrganization(null);setSelectorOpen(false);setSearchQuery('');setErrors({});setSaveState('idle');setSaveMessage('Opprettelse avbrutt.');setInviteState('idle');setInviteMessage('');};

  const validateForm=(requireAdminEmail=false)=>{const draft=normalizeOwnerOrganization(organization);const nextErrors=validateOwnerOrganization(draft);if(requireAdminEmail&&!draft.adminEmail)nextErrors.adminEmail='Administratorens e-post er påkrevd for å sende invitasjon.';setOrganization((current)=>({...current,...draft}));setErrors(nextErrors);if(hasOwnerPanelValidationErrors(nextErrors)){window.setTimeout(()=>{const firstField=Object.keys(nextErrors)[0];document.getElementById(`owner-panel-${firstField}`)?.focus();},0);return null;}return {...organization,...draft};};
  const persistOrganization=async(org:Organization)=>{setOrganization(org);if(!supabase)return org;const now=new Date().toISOString();const {error:orgError}=await supabase.from('organizations').upsert({id:org.id,name:org.name,organization_type:org.type,country:org.country,language:org.language,status:org.status,hosting_mode:org.hosting,domain:org.domain||null,live_url:org.liveUrl||null,vercel_url:org.vercelUrl||null,supabase_url:org.supabaseUrl||null,theme_id:org.themeId,onboarding_step:org.onboardingStep,admin_name:org.adminName||null,admin_email:org.adminEmail||null,member_count:org.memberCount||0,updated_at:now},{onConflict:'id'});if(orgError)throw orgError;const {error:moduleError}=await supabase.from('organization_modules').upsert(modules.map((mod)=>({organization_id:org.id,module_id:mod.id,enabled:mod.core?true:mod.later?false:mod.enabled,status:mod.core?'Inkludert':mod.later?'Senere':mod.status,updated_at:now})),{onConflict:'organization_id,module_id'});if(moduleError)throw moduleError;if(org.adminEmail){const {error:adminError}=await supabase.from('organization_admins').upsert({organization_id:org.id,display_name:org.adminName||org.adminEmail,email:org.adminEmail,role:'admin',invitation_status:inviteState==='sent'?'invited':'pending',updated_at:now},{onConflict:'organization_id,email'});if(adminError)throw adminError;}const {error:stepError}=await supabase.from('organization_provisioning_steps').upsert(provisioningSteps.map((step)=>({organization_id:org.id,step_key:step.stepKey,label:step.label,status:step.status,updated_at:now})),{onConflict:'organization_id,step_key'});if(stepError)throw stepError;setOrganizations((current)=>{const exists=current.some((item)=>item.id===org.id);return exists?current.map((item)=>item.id===org.id?org:item):[org,...current];});return org;};
  const save=async()=>{if(isBusy)return;const org=validateForm();if(!org){setSaveState('error');setSaveMessage('Kontroller feltene som er markert.');return;}setSaveState('saving');setSaveMessage('Lagrer...');try{await persistOrganization(org);setErrors({});setSaveState('success');setSaveMessage('Organisasjonen er lagret.');setIsCreating(false);setPreviousOrganization(null);}catch(error){console.error('OwnerPanel save failed',error);setSaveState('error');setSaveMessage(error instanceof Error?error.message:'Kunne ikke lagre.');}};
  const sendInvite=async()=>{if(isBusy)return;const org=validateForm(true);if(!org){setInviteState('error');setInviteMessage('Kontroller feltene som er markert.');return;}setInviteState('sending');setInviteMessage('Sender invitasjon...');try{await persistOrganization(org);setErrors({});setInviteState('sent');setInviteMessage('Invitasjonen er registrert.');}catch(error){console.error('OwnerPanel invitation failed',error);setInviteState('error');setInviteMessage(error instanceof Error?error.message:'Kunne ikke sende invitasjonen.');}};
  const toggleModule=(id:string)=>{if(isBusy)return;setModules((current)=>current.map((mod)=>mod.id===id&&!mod.locked?{...mod,enabled:!mod.enabled,status:!mod.enabled?'Aktiv':'Av'}:mod));};

  return <div className="space-y-4 p-4">
    <section className="rounded-2xl border-2 bg-white p-4 shadow-sm" style={{borderColor:mix(brand.primary,22),color:brand.text}}>
      <div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="text-[10px] uppercase tracking-wide opacity-45">Valgt organisasjon</p><h2 className="truncate font-serif text-xl">{organization.name||'Ny organisasjon'}</h2><p className="text-xs opacity-55">{organization.type} · {organization.status}</p></div><div className="flex gap-2"><button type="button" disabled={isBusy} aria-label="Velg organisasjon" onClick={()=>setSelectorOpen((v)=>!v)} className="rounded-xl border px-3 py-2 text-xs disabled:opacity-60" style={{borderColor:mix(brand.primary,22)}}><Search size={15}/></button><button type="button" disabled={isBusy} onClick={startNewOrganization} className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs disabled:opacity-60" style={{backgroundColor:brand.primary,color:brand.primaryText}}><Plus size={15}/>Ny</button></div></div>
      {selectorOpen&&<div className="mt-4 rounded-2xl border p-3" style={{borderColor:mix(brand.primary,16)}}><TextInput value={searchQuery} onChange={setSearchQuery} placeholder="Søk organisasjon" disabled={isBusy}/><div className="mt-2 max-h-56 space-y-1 overflow-y-auto">{filteredOrganizations.map((org)=><button type="button" key={org.id} disabled={isBusy} onClick={()=>selectOrganization(org)} className="w-full rounded-xl px-3 py-2 text-left hover:bg-black/5 disabled:opacity-60"><p className="text-sm font-medium">{org.name}</p><p className="text-[11px] opacity-50">{org.type} · {org.status}</p></button>)}</div></div>}
    </section>

    {errorSummary.length>0&&<div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><p className="font-medium">Kontroller følgende:</p><ul className="mt-2 list-disc space-y-1 pl-5">{errorSummary.map((message)=><li key={message}>{message}</li>)}</ul></div>}

    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Organisasjon" icon={Building2}><div className="space-y-3"><OwnerPanelFormField field="name" label="Navn" error={errors.name}><OwnerPanelTextInput ref={errors.name?firstErrorRef:undefined} field="name" error={errors.name} disabled={isBusy} value={organization.name} onChange={(e)=>setOrgField('name',e.target.value)} placeholder="Organisasjonsnavn" style={{borderColor:errors.name?undefined:mix(brand.primary,22),color:brand.text}}/></OwnerPanelFormField><OwnerPanelFormField field="id" label="Organisasjons-ID" error={errors.id}><OwnerPanelTextInput field="id" error={errors.id} disabled={isBusy||!isCreating} value={organization.id} onChange={(e)=>setOrgField('id',e.target.value)} placeholder="organisasjon-id" style={{borderColor:errors.id?undefined:mix(brand.primary,22),color:brand.text}}/></OwnerPanelFormField><div className="grid grid-cols-2 gap-3"><div><FieldLabel>Type</FieldLabel><TextInput disabled={isBusy} value={organization.type} onChange={(v)=>setOrgField('type',v)} placeholder="Forening"/></div><div><FieldLabel>Status</FieldLabel><SelectInput disabled={isBusy} value={organization.status} onChange={(v)=>setOrgField('status',v)}><option>Prøve</option><option>Aktiv</option><option>Pause</option></SelectInput></div></div><div className="grid grid-cols-2 gap-3"><div><FieldLabel>Land</FieldLabel><TextInput disabled={isBusy} value={organization.country} onChange={(v)=>setOrgField('country',v)} placeholder="Norge"/></div><div><FieldLabel>Språk</FieldLabel><TextInput disabled={isBusy} value={organization.language} onChange={(v)=>setOrgField('language',v)} placeholder="Norsk"/></div></div></div></Card>
      <Card title="Administrator" icon={ShieldCheck}><div className="space-y-3"><div><FieldLabel>Navn</FieldLabel><TextInput disabled={isBusy} value={organization.adminName} onChange={(v)=>setOrgField('adminName',v)} placeholder="Administrator"/></div><OwnerPanelFormField field="adminEmail" label="E-post" error={errors.adminEmail}><OwnerPanelTextInput field="adminEmail" error={errors.adminEmail} disabled={isBusy} value={organization.adminEmail} onChange={(e)=>setOrgField('adminEmail',e.target.value)} placeholder="admin@forening.no" type="email" autoComplete="email" style={{borderColor:errors.adminEmail?undefined:mix(brand.primary,22),color:brand.text}}/></OwnerPanelFormField><button type="button" disabled={isBusy} onClick={()=>void sendInvite()} className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60" style={{backgroundColor:brand.secondary,color:brand.secondaryText}}><Send size={16}/>{inviteState==='sending'?'Sender...':'Send invitasjon'}</button><StatusMessage state={inviteState} text={inviteMessage}/></div></Card>
      <Card title="Publisering" icon={Rocket}><div className="space-y-3"><OwnerPanelFormField field="domain" label="Domene" error={errors.domain}><OwnerPanelTextInput field="domain" error={errors.domain} disabled={isBusy} value={organization.domain} onChange={(e)=>setOrgField('domain',e.target.value)} placeholder="app.forening.no" style={{borderColor:errors.domain?undefined:mix(brand.primary,22),color:brand.text}}/></OwnerPanelFormField><OwnerPanelFormField field="liveUrl" label="Live-URL" error={errors.liveUrl}><OwnerPanelTextInput field="liveUrl" error={errors.liveUrl} disabled={isBusy} value={organization.liveUrl} onChange={(e)=>setOrgField('liveUrl',e.target.value)} placeholder="https://app.forening.no" style={{borderColor:errors.liveUrl?undefined:mix(brand.primary,22),color:brand.text}}/></OwnerPanelFormField><OwnerPanelFormField field="vercelUrl" label="Vercel-URL" error={errors.vercelUrl}><OwnerPanelTextInput field="vercelUrl" error={errors.vercelUrl} disabled={isBusy} value={organization.vercelUrl} onChange={(e)=>setOrgField('vercelUrl',e.target.value)} placeholder="https://prosjekt.vercel.app" style={{borderColor:errors.vercelUrl?undefined:mix(brand.primary,22),color:brand.text}}/></OwnerPanelFormField><OwnerPanelFormField field="supabaseUrl" label="Supabase-URL" error={errors.supabaseUrl}><OwnerPanelTextInput field="supabaseUrl" error={errors.supabaseUrl} disabled={isBusy} value={organization.supabaseUrl} onChange={(e)=>setOrgField('supabaseUrl',e.target.value)} placeholder="https://prosjekt.supabase.co" style={{borderColor:errors.supabaseUrl?undefined:mix(brand.primary,22),color:brand.text}}/></OwnerPanelFormField><div className="space-y-2 pt-1"><LinkRow label="Live app" value={organization.liveUrl} icon={ExternalLink}/><LinkRow label="Vercel" value={organization.vercelUrl} icon={Server}/><LinkRow label="Supabase" value={organization.supabaseUrl} icon={Server}/></div></div></Card>
      <Card title="Moduler" icon={Boxes}><div className="space-y-3"><p className="text-xs opacity-55">{activeModules} aktive moduler</p>{moduleCategories.map((category)=>{const categoryModules=modules.filter((mod)=>mod.category===category.id);if(!categoryModules.length)return null;const open=openCategory===category.id;return <div key={category.id} className="rounded-xl border" style={{borderColor:mix(brand.primary,16)}}><button type="button" disabled={isBusy} onClick={()=>setOpenCategory(open?null:category.id)} className="flex w-full items-center justify-between p-3 text-left disabled:opacity-60"><span className="text-sm font-medium">{category.icon} {category.name}</span><span>{open?'−':'+'}</span></button>{open&&<div className="space-y-2 border-t p-3" style={{borderColor:mix(brand.primary,12)}}>{categoryModules.map((mod)=><ModuleToggle key={mod.id} mod={mod} onToggle={toggleModule} disabled={isBusy}/>)}</div>}</div>;})}</div></Card>
    </div>

    <div className="flex gap-2">{isCreating&&<button type="button" disabled={isBusy} onClick={cancelCreate} className="flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 text-sm disabled:opacity-60"><X size={16}/>Avbryt</button>}<button type="button" disabled={isBusy} onClick={()=>void save()} className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60" style={{backgroundColor:brand.primary,color:brand.primaryText}}><Save size={16}/>{saveState==='saving'?'Lagrer...':'Lagre'}</button></div><StatusMessage state={saveState} text={saveMessage}/>
  </div>;
}
