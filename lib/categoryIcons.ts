import {
  Home,
  BookOpen,
  Truck,
  Leaf,
  Calculator,
  Wrench,
  Camera,
  Globe,
  Sparkles,
  Heart,
  ChefHat,
  MoreHorizontal,
  LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  home: Home,
  'book-open': BookOpen,
  truck: Truck,
  leaf: Leaf,
  calculator: Calculator,
  wrench: Wrench,
  camera: Camera,
  globe: Globe,
  sparkles: Sparkles,
  heart: Heart,
  'chef-hat': ChefHat,
  'more-horizontal': MoreHorizontal,
};

/** 根据图标名称字符串返回对应的 Lucide Icon 组件 */
export function getCategoryIcon(iconName?: string | null): LucideIcon {
  if (!iconName) return MoreHorizontal;
  return iconMap[iconName] ?? MoreHorizontal;
}

export default iconMap;
