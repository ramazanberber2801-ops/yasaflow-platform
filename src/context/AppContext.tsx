import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { clearStoredAdminSession, getCurrentOrganizationId, readStoredAdminSession, writeStoredAdminSession } from '../lib/organization';
import { sendPushNotification } from '../lib/pushNotifications';
import { supabase } from '../lib/supabase';
import { trackEvent } from '../lib/analytics';
import { useAppI18n } from '../lib/appI18n';
import { getSystemTranslation } from '../lib/systemTranslations';

interface AppContextType {
  news:any[]; staff:any[]; sohbet:any[]; settings:any; inspiration:any; admins:any[];
  currentAdmin:any|null; loading:boolean; isAdmin:boolean; isInitialized:boolean;
  login:(u:string,p:string,r?:string)=>Promise<boolean>; logout:()=>void;
  addNews:(item:any)=>Promise<void>; updateNews:(id:string,item:any)=>Promise<void>; deleteNews:(id:string)=>Promise<void>;
  addStaff:(item:any)=>Promise<void>; updateStaff:(id:string,item:any)=>Promise<void>; deleteStaff:(id:string)=>Promise<void>;
  addSohbet:(item:any)=>Promise<void>; updateSohbet:(id:string,item:any)=>Promise<void>; deleteSohbet:(id:string)=>Promise<void>;
  sendSohbetReminder:(item:any)=>Promise<void>; updateSettings:(settings:any)=>Promise<void>; updateInspiration:(updates:any)=>Promise<void>;
  addAdmin:(admin:any)=>Promise<void>; deleteAdmin:(id:string)=>Promise<void>; updateAdminPassword:(id:string,newPass:string)=>Promise<void>;
}

const AppContext=createContext<AppContextType|undefined>(undefined);
const ADMIN_SAFE_COLUMNS='id, username, display_name, role, auth_user_id';
const ORGANIZATION_ADMIN_COLUMNS='id, organization_id, user_id, display_name, email, role, invitation_status';

const sanitizeAdmin=(admin:any|null)=>{
  if(!admin)return null;
  const {password:_password,security_question:_securityQuestion,security_answer:_securityAnswer,...safeAdmin}=admin;
  return {...safeAdmin,username:safeAdmin.username||safeAdmin.email,auth_user_id:safeAdmin.auth_user_id||safeAdmin.user_id,displayName:safeAdmin.displayName||safeAdmin.display_name||safeAdmin.username||safeAdmin.email};
};
const getSavedAdmin=()=>sanitizeAdmin(readStoredAdminSession());
const mapNews=(row:any,category:string)=>({id:row.id,title:row.title||'',content:row.content||row.summary||'',summary:row.summary||'',category,date:row.published_at||row.created_at,image_base64:row.image_url||'',imageBase64:row.image_url||'',status:row.status,visibility:row.visibility||'public'});
const mapActivity=(row:any)=>({id:row.id,title:row.title||'',description:row.description||'',date:row.activity_date||'',time:row.start_time?String(row.start_time).slice(0,5):'',location:row.location||'',speaker:'',status:row.status,visibility:row.visibility||'public',contactPersonId:row.contact_person_id||''});
const mapStaff=(row:any)=>({id:row.id,name:row.name||'',position:row.position||'',phone:row.phone||'',email:row.email||'',active:row.active,allow_call:row.allow_call,allow_sms:row.allow_sms,allow_whatsapp:row.allow_whatsapp,allow_email:row.allow_email,whatsapp_number:row.whatsapp_number||'',bio:row.bio||'',image_url:row.image_url||''});
const mapSettingsFromDb=(row:any)=>({id:row.organization_id,mosqueName:row.display_name||'',shortName:row.short_name||'',vippsNumber:row.donation_number||'',vippsButtonEnabled:Boolean(row.donation_number||row.donation_url),vippsDonationUrl:row.donation_url||'',brandingPrimaryColor:'#0A8DFF',brandingSecondaryColor:'#071B53',brandingBackgroundColor:'#F4FAFF',brandingTextColor:'#071B53',address:row.address||'',mapUrl:row.map_url||'',phone:row.phone||'',email:row.email||'',whatsappNumber:row.whatsapp_number||'',bankAccount:row.bank_account||'',iban:row.iban||'',openingHours:row.opening_hours||'',fridayPrayer:row.weekly_event||'',brandingLogoUrl:row.logo_url||'',brandingAppIconUrl:row.app_icon_url||'',ramadanEnabled:row.ramadan_enabled||false,ramadanStartDate:row.ramadan_start_date||'',ramadanEndDate:row.ramadan_end_date||'',kurbanEnabled:row.kurban_enabled||false,kurbanStartDate:row.kurban_start_date||''});
const mapSettingsToDb=(s:any,organizationId:string)=>({organization_id:organizationId,display_name:s.mosqueName||s.displayName||'',short_name:s.shortName||'',donation_number:s.vippsNumber||'',donation_url:s.vippsDonationUrl||null,address:s.address||'',map_url:s.mapUrl||'',phone:s.phone||'',email:s.email||'',whatsapp_number:s.whatsappNumber||'',bank_account:s.bankAccount||'',iban:s.iban||'',opening_hours:s.openingHours||'',weekly_event:s.fridayPrayer||'',logo_url:s.brandingLogoUrl||null,app_icon_url:s.brandingAppIconUrl||null,ramadan_enabled:!!s.ramadanEnabled,ramadan_start_date:s.ramadanStartDate||null,ramadan_end_date:s.ramadanEndDate||null,kurban_enabled:!!s.kurbanEnabled,kurban_start_date:s.kurbanStartDate||null,updated_at:new Date().toISOString()});

export const AppProvider:React.FC<{children:React.ReactNode}>=({children})=>{
  const { language } = useAppI18n();
  const t=useCallback((key:string)=>getSystemTranslation(language,key),[language]);
  const savedAdmin=getSavedAdmin();
  const [news,setNews]=useState<any[]>([]); const [staff,setStaff]=useState<any[]>([]); const [sohbet,setSohbet]=useState<any[]>([]);
  const [settings,setSettings]=useState<any>({vippsNumber:'',vippsButtonEnabled:false,vippsDonationUrl:'',brandingPrimaryColor:'#0A8DFF',brandingSecondaryColor:'#071B53',brandingBackgroundColor:'#F4FAFF',brandingTextColor:'#071B53'});
  const [inspiration,setInspiration]=useState<any>({}); const [admins,setAdmins]=useState<any[]>([]); const [currentAdmin,setCurrentAdmin]=useState<any|null>(savedAdmin);
  const [loading,setLoading]=useState(true); const [isAdmin,setIsAdmin]=useState(!!savedAdmin); const [isInitialized]=useState(true);
  const organizationId=getCurrentOrganizationId();

  const sendPush=async(title:string,body:string)=>{try{await sendPushNotification({title,body,url:`/?org=${encodeURIComponent(organizationId)}`,organizationId});await trackEvent('push_sent','',title);}catch(e){console.error('PUSH ERROR:',e);}};
  const sendSohbetReminder=async(item:any)=>sendPush(`🔔 ${item.title}`,`${item.date} ${item.time}${item.speaker?` - ${item.speaker}`:''}`);

  const loadAllData=useCallback(async()=>{
    const client=supabase;if(!client){setLoading(false);return;}
    setLoading(true);
    try{
      const [n,s,activities,insp,a,setRes]=await Promise.all([
        client.rpc('get_visible_organization_news',{p_organization_id:organizationId}),
        client.from('organization_staff').select('*').eq('organization_id',organizationId).eq('active',true).eq('public_visible',true).order('sort_order'),
        client.rpc('get_visible_organization_activities',{p_organization_id:organizationId}),
        client.from('inspiration').select('*').limit(1).maybeSingle(),
        client.from('admins').select(ADMIN_SAFE_COLUMNS),
        client.from('organization_settings').select('*').eq('organization_id',organizationId).maybeSingle(),
      ]);
      if(n.data)setNews(n.data.map((row:any)=>mapNews(row,t('announcement')))); else setNews([]);
      if(s.data)setStaff(s.data.map(mapStaff)); else setStaff([]);
      if(activities.data)setSohbet(activities.data.map(mapActivity)); else setSohbet([]);
      if(insp.data)setInspiration(insp.data); if(a.data)setAdmins(a.data.map(sanitizeAdmin)); if(setRes.data)setSettings(mapSettingsFromDb(setRes.data));
    }catch(e){console.error(t('loadOrganizationData'),e);}finally{setLoading(false);}
  },[organizationId,t]);

  useEffect(()=>{void loadAllData();const client=supabase;if(!client)return;const {data}=client.auth.onAuthStateChange(()=>void loadAllData());const refresh=()=>void loadAllData();window.addEventListener('yasaflow-membership-changed',refresh);return()=>{data.subscription.unsubscribe();window.removeEventListener('yasaflow-membership-changed',refresh);};},[loadAllData]);

  const login=async(email:string,password:string):Promise<boolean>=>{
    if(!supabase)return false;const normalizedEmail=email.trim().toLowerCase();const {data:authData,error:authError}=await supabase.auth.signInWithPassword({email:normalizedEmail,password});if(authError||!authData.user)return false;
    const legacyResult=await supabase.from('admins').select(ADMIN_SAFE_COLUMNS).eq('auth_user_id',authData.user.id).maybeSingle();let adminProfile=legacyResult.data;let profileError=legacyResult.error;
    if(!adminProfile){const organizationResult=await supabase.from('organization_admins').select(ORGANIZATION_ADMIN_COLUMNS).eq('user_id',authData.user.id).maybeSingle();if(organizationResult.data){adminProfile={...organizationResult.data,username:organizationResult.data.email||normalizedEmail,auth_user_id:organizationResult.data.user_id};profileError=null;if(organizationResult.data.invitation_status!=='accepted')await supabase.from('organization_admins').update({invitation_status:'accepted',updated_at:new Date().toISOString()}).eq('id',organizationResult.data.id);}else profileError=organizationResult.error||profileError;}
    if(!adminProfile){console.error('Admin profile not found:',profileError);await supabase.auth.signOut();return false;}const safeAdmin=sanitizeAdmin(adminProfile);setCurrentAdmin(safeAdmin);setIsAdmin(true);writeStoredAdminSession(safeAdmin);window.dispatchEvent(new Event('yasaflow-organization-changed'));await loadAllData();return true;
  };
  const logout=()=>{if(supabase)void supabase.auth.signOut();clearStoredAdminSession();setIsAdmin(false);setCurrentAdmin(null);};

  const addNews=async(item:any)=>{if(!supabase)return;const shouldSendPush=item._sendPush===true;const payload={organization_id:organizationId,title:item.title||'',summary:item.summary||null,content:item.content||'',image_url:item.image_url||item.imageBase64||null,status:item.status==='draft'?'draft':'published',visibility:item.visibility||'public',allowed_group_ids:item.allowed_group_ids||[],published_at:item.date||new Date().toISOString(),updated_at:new Date().toISOString()};const {error}=await supabase.from('organization_news').insert(payload);if(error)return alert(`${t('newsCreate')} ${error.message}`);if(shouldSendPush)await sendPush(t('newsPushTitle'),payload.title||t('newsCreatedPush'));await loadAllData();};
  const updateNews=async(id:string,item:any)=>{if(!supabase)return;const shouldSendPush=item._sendPush===true;const payload={title:item.title||'',summary:item.summary||null,content:item.content||'',image_url:item.image_url||item.imageBase64||null,status:item.status==='draft'?'draft':'published',visibility:item.visibility||'public',allowed_group_ids:item.allowed_group_ids||[],published_at:item.date||new Date().toISOString(),updated_at:new Date().toISOString()};const {error}=await supabase.from('organization_news').update(payload).eq('id',id).eq('organization_id',organizationId);if(error)return alert(`${t('newsUpdate')} ${error.message}`);if(shouldSendPush)await sendPush(t('newsUpdatedPush'),payload.title);await loadAllData();};
  const deleteNews=async(id:string)=>{if(!supabase)return;const {error}=await supabase.from('organization_news').delete().eq('id',id).eq('organization_id',organizationId);if(error)return alert(`${t('newsDelete')} ${error.message}`);await loadAllData();};
  const addStaff=async(item:any)=>{if(!supabase)return;const {error}=await supabase.from('organization_staff').insert({organization_id:organizationId,name:item.name||'',position:item.position||null,phone:item.phone||null,email:item.email||null,active:item.active!==false,public_visible:item.public_visible!==false});if(error)return alert(`${t('staffCreate')} ${error.message}`);await loadAllData();};
  const updateStaff=async(id:string,item:any)=>{if(!supabase)return;const {error}=await supabase.from('organization_staff').update({name:item.name||'',position:item.position||null,phone:item.phone||null,email:item.email||null,active:item.active!==false,public_visible:item.public_visible!==false,updated_at:new Date().toISOString()}).eq('id',id).eq('organization_id',organizationId);if(error)return alert(`${t('staffUpdate')} ${error.message}`);await loadAllData();};
  const deleteStaff=async(id:string)=>{if(!supabase)return;const {error}=await supabase.from('organization_staff').delete().eq('id',id).eq('organization_id',organizationId);if(error)return alert(`${t('staffDelete')} ${error.message}`);await loadAllData();};
  const activityPayload=(item:any)=>({organization_id:organizationId,title:item.title||'',description:item.description||'',activity_date:item.date||new Date().toISOString().slice(0,10),start_time:item.time||null,location:item.location||null,status:item.status==='draft'?'draft':'published',visibility:item.visibility||'public',allowed_group_ids:item.allowed_group_ids||[],contact_person_id:item.contactPersonId||null,published_at:new Date().toISOString(),updated_at:new Date().toISOString()});
  const addSohbet=async(item:any)=>{if(!supabase)return;const shouldSendPush=item._sendPush===true;const payload=activityPayload(item);const {error}=await supabase.from('organization_activities').insert(payload);if(error)return alert(`${t('activityCreate')} ${error.message}`);if(shouldSendPush)await sendPush(t('activityNewPush'),payload.title);await loadAllData();};
  const updateSohbet=async(id:string,item:any)=>{if(!supabase)return;const shouldSendPush=item._sendPush===true;const payload=activityPayload(item);const {error}=await supabase.from('organization_activities').update(payload).eq('id',id).eq('organization_id',organizationId);if(error)return alert(`${t('activityUpdate')} ${error.message}`);if(shouldSendPush)await sendPush(t('activityUpdatedPush'),payload.title);await loadAllData();};
  const deleteSohbet=async(id:string)=>{if(!supabase)return;const {error}=await supabase.from('organization_activities').delete().eq('id',id).eq('organization_id',organizationId);if(error)return alert(`${t('activityDelete')} ${error.message}`);await loadAllData();};
  const updateSettings=async(s:any)=>{if(!supabase)return;const {data,error}=await supabase.from('organization_settings').upsert(mapSettingsToDb(s,organizationId),{onConflict:'organization_id'}).select('*').single();if(error)return alert(`${t('settingsSave')} ${error.message}`);setSettings(mapSettingsFromDb(data));};
  const updateInspiration=async(updates:any)=>{if(!supabase||!inspiration?.id)return;const {error}=await supabase.from('inspiration').update(updates).eq('id',inspiration.id);if(error)return alert(`${t('inspirationUpdate')} ${error.message}`);await loadAllData();};
  const addAdmin=async(admin:any)=>{if(!supabase)return;const cleanAdmin={id:admin.id,username:admin.username,display_name:admin.display_name||admin.displayName||admin.username,role:admin.role||'admin',auth_user_id:admin.auth_user_id||null};const {error}=await supabase.from('admins').insert([cleanAdmin]);if(error)return alert(`${t('adminCreate')} ${error.message}`);await loadAllData();};
  const deleteAdmin=async(id:string)=>{if(!supabase)return;const {error}=await supabase.from('admins').delete().eq('id',id);if(error)return alert(`${t('adminDelete')} ${error.message}`);await loadAllData();};
  const updateAdminPassword=async(_id:string,newPass:string)=>{if(!supabase)return;const {error}=await supabase.auth.updateUser({password:newPass});if(error)alert(`${t('passwordUpdate')} ${error.message}`);};

  return <AppContext.Provider value={{news,staff,sohbet,settings,inspiration,admins,currentAdmin,loading,isAdmin,isInitialized,login,logout,addNews,updateNews,deleteNews,addStaff,updateStaff,deleteStaff,addSohbet,updateSohbet,deleteSohbet,sendSohbetReminder,updateSettings,updateInspiration,addAdmin,deleteAdmin,updateAdminPassword}}>{children}</AppContext.Provider>;
};

export const useApp=()=>{const context=useContext(AppContext);if(!context)throw new Error('useApp must be used inside AppProvider');return context;};