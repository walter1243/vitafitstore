import {
  Leaf,
  Zap,
  Truck,
  ShieldCheck,
  Clock,
  RotateCcw,
  Heart,
  Star,
  Gift,
  Lock,
  Sparkles,
  Award,
  type LucideIcon,
} from 'lucide-react';
import type { IconKey } from '@/lib/site-content-defaults';

export const ICON_MAP: Record<IconKey, LucideIcon> = {
  leaf: Leaf,
  zap: Zap,
  truck: Truck,
  shield: ShieldCheck,
  clock: Clock,
  rotate: RotateCcw,
  heart: Heart,
  star: Star,
  gift: Gift,
  lock: Lock,
  sparkles: Sparkles,
  award: Award,
};

export function getIcon(key: IconKey): LucideIcon {
  return ICON_MAP[key] ?? Sparkles;
}
