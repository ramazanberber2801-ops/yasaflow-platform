import { useState, useRef, type FormEvent } from 'react';
import {
  X, Newspaper, UserPlus, Users, LogOut, Trash2, Edit3, Plus,
  Upload, Save, ArrowLeft, ShieldCheck, Mic, Settings as SettingsIcon, UserCog, Check, Eye, EyeOff,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fileToOptimizedBase64 } from '../lib/imageUtils';
import type { NewsItem, StaffMember, SohbetItem, MosqueSettings, AdminAccount } from '../types';

interface AdminPanelProps {
  open: boolean;
  onClose: () => void;
}

interface SettingsManagerProps {
  settings: MosqueSettings;
  onUpdate: (updates: Partial<MosqueSettings>) => void;
  currentAdmin: AdminAccount | null;
  onUpdatePassword: (username: string, newPassword: string) => void;
}
