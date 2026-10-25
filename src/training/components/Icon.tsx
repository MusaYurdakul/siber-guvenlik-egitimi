import {
  Activity, AlarmClock, Archive, Banknote, Briefcase, Bug, Camera, Check, Clock, Cloud, Code, Crown, DoorClosed,
  Droplets, Eye, Factory, File, FileCheck, FileCode, FilePlus, FileText, FileX, Gamepad2, Gift, IdCard, Image,
  KeyRound, Languages, Laptop, Lock, Mail, MessageSquare, Monitor, NotebookPen, Phone, RefreshCw, Search, Send,
  Shield, Sparkles, Tag, Trash2, TriangleAlert, Unplug, User, UserX, Users, type LucideIcon,
} from 'lucide-react';

const icons: Record<string, LucideIcon> = {
  activity: Activity, alarm: AlarmClock, archive: Archive, banknote: Banknote, briefcase: Briefcase, bug: Bug,
  camera: Camera, check: Check, clock: Clock, cloud: Cloud, code: Code, crown: Crown, doorClosed: DoorClosed,
  leak: Droplets, eye: Eye, factory: Factory, file: File, fileCheck: FileCheck, fileCode: FileCode,
  filePlus: FilePlus, fileText: FileText, fileX: FileX, gamepad: Gamepad2, gift: Gift, idCard: IdCard, image: Image,
  key: KeyRound, languages: Languages, laptop: Laptop, lock: Lock, mail: Mail, message: MessageSquare,
  monitor: Monitor, notes: NotebookPen, phone: Phone, refresh: RefreshCw, search: Search, send: Send,
  shield: Shield, sparkles: Sparkles, tag: Tag, trash: Trash2, alert: TriangleAlert, plug: Unplug, user: User,
  userX: UserX, users: Users,
};

export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const Cmp = icons[name] ?? File;
  return <Cmp size={size} aria-hidden="true" />;
}
