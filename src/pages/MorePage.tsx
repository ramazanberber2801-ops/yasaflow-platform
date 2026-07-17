import { Bell, Building2, Contact, CreditCard, FileText, HandCoins, LogIn, MessageCircle, Settings, ShieldCheck, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAppI18n } from '../lib/appI18n';
import { getMorePageCopy } from '../lib/appUiCopy';
import { useOrganizationModules } from '../lib/moduleEngine';
import { DEFAULT_ORGANIZATION_ID } from '../lib/organization';

export function MorePage({ onAdmin, onContact, onDonate, onNotifications, unreadNotifications = 0 }: { onAdmin: () => void; onContact: () => void; onDonate: () => void; onNotifications: () => void; unreadNotifications?: number }) {
  const { isAdmin } = useApp();
  const { language, direction } = useAppI18n();
  const { enabled } = useOrganizationModules(DEFAULT_ORGANIZATION_ID);
  const text = getMorePageCopy(language);
  const items = [
    enabled('push') && { label: text.notifications, icon: Bell, action: onNotifications, badge: unreadNotifications },
    enabled('contact') && { label: text.contact, icon: Contact, action: onContact },
    enabled('documents') && { label: text.documents, icon: FileText },
    enabled('members') && { label: text.members, icon: Users },
    enabled('donation') && { label: text.donations, icon: HandCoins, action: onDonate },
    enabled('payments') && { label: text.payments, icon: CreditCard },
    enabled('chat') && { label: text.chat, icon: MessageCircle },
  ].filter(Boolean) as { label: string; icon: typeof Contact; action?: () => void; badge?: number }[];

  return <div dir={direction} className="min-h-screen pb-28" style={{ background: 'var(--brand-background)', color: 'var(--brand-text)' }}>
    <header className="border-b px-4 py-6" style={{ background: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}><div className="mx-auto max-w-4xl"><p className="text-xs font-semibold uppercase tracking-[.16em] opacity-45">Yasaflow</p><h1 className="mt-1 text-2xl font-semibold">{text.more}</h1></div></header>
    <main className="mx-auto max-w-4xl space-y-5 px-4 py-5">
      <section className="rounded-3xl border p-5 shadow-sm" style={{ background: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}><div className="flex items-center gap-4"><span className="grid h-14 w-14 place-items-center rounded-2xl" style={{ background: 'var(--brand-subtle)', color: 'var(--brand-primary)' }}><Building2 size={24}/></span><div><h2 className="font-semibold">{text.organization}</h2><p className="text-sm opacity-55">{isAdmin ? text.admin : text.visitor}</p></div></div></section>
      <section className="overflow-hidden rounded-3xl border shadow-sm" style={{ background: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>{items.map(({label,icon:Icon,action,badge})=><button key={label} onClick={action} className="flex w-full items-center gap-3 border-b px-5 py-4 text-left last:border-b-0" style={{ borderColor: 'var(--brand-border)' }}><Icon size={19} style={{ color: 'var(--brand-primary)' }}/><span className="flex-1 font-medium">{label}</span>{Boolean(badge) && <span className="grid min-w-6 place-items-center rounded-full bg-red-600 px-2 py-1 text-[11px] font-bold text-white">{badge}</span>}<span className="opacity-35">›</span></button>)}</section>
      <section className="overflow-hidden rounded-3xl border shadow-sm" style={{ background: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}><button onClick={onAdmin} className="flex w-full items-center gap-3 px-5 py-4 text-left"><ShieldCheck size={19} style={{ color: 'var(--brand-primary)' }}/><span className="flex-1 font-medium">{isAdmin ? text.administration : text.login}</span><LogIn size={18} className="opacity-35"/></button>{isAdmin&&<button onClick={onAdmin} className="flex w-full items-center gap-3 border-t px-5 py-4 text-left" style={{borderColor:'var(--brand-border)'}}><Settings size={19} style={{ color: 'var(--brand-primary)' }}/><span className="flex-1 font-medium">{text.settings}</span><span className="opacity-35">›</span></button>}</section>
    </main>
  </div>;
}
