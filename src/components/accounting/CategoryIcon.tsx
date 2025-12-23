import { 
  Utensils, Car, ShoppingCart, Gamepad2, Home, Pill, BookOpen, 
  Wallet, Gift, TrendingUp, Briefcase, Plane, Film, Coffee, 
  Dumbbell, Scissors, Dog, Smartphone, Lightbulb, Package,
  CreditCard, Trophy, PiggyBank, Banknote, ChartLine, ReceiptText,
  Heart, Stethoscope, Baby, Shirt, Bus, Train, Bike, Fuel,
  Wine, Pizza, IceCream, Music, Camera, Palette, Wrench, Hammer,
  LucideIcon
} from 'lucide-react';

// Map icon names to Lucide components
const iconMap: Record<string, LucideIcon> = {
  // Expense icons
  utensils: Utensils,
  car: Car,
  'shopping-cart': ShoppingCart,
  gamepad: Gamepad2,
  home: Home,
  pill: Pill,
  book: BookOpen,
  gift: Gift,
  dumbbell: Dumbbell,
  dog: Dog,
  smartphone: Smartphone,
  package: Package,
  plane: Plane,
  film: Film,
  coffee: Coffee,
  scissors: Scissors,
  lightbulb: Lightbulb,
  heart: Heart,
  stethoscope: Stethoscope,
  baby: Baby,
  shirt: Shirt,
  bus: Bus,
  train: Train,
  bike: Bike,
  fuel: Fuel,
  wine: Wine,
  pizza: Pizza,
  'ice-cream': IceCream,
  music: Music,
  camera: Camera,
  palette: Palette,
  wrench: Wrench,
  hammer: Hammer,
  // Income icons
  wallet: Wallet,
  'trending-up': TrendingUp,
  briefcase: Briefcase,
  'credit-card': CreditCard,
  trophy: Trophy,
  'piggy-bank': PiggyBank,
  banknote: Banknote,
  'chart-line': ChartLine,
  receipt: ReceiptText,
};

// All available icons for the icon picker
export const CATEGORY_ICONS = [
  'utensils', 'car', 'shopping-cart', 'gamepad', 'home', 'pill', 'book',
  'gift', 'dumbbell', 'dog', 'smartphone', 'package', 'plane', 'film',
  'coffee', 'scissors', 'lightbulb', 'heart', 'stethoscope', 'baby',
  'shirt', 'bus', 'train', 'bike', 'fuel', 'wine', 'pizza', 'ice-cream',
  'music', 'camera', 'palette', 'wrench', 'hammer', 'wallet', 'trending-up',
  'briefcase', 'credit-card', 'trophy', 'piggy-bank', 'banknote', 'chart-line', 'receipt'
];

interface CategoryIconProps {
  icon: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function CategoryIcon({ icon, color, size = 'md', className = '' }: CategoryIconProps) {
  const IconComponent = iconMap[icon];
  
  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  if (!IconComponent) {
    // Fallback for emoji icons (legacy support)
    return <span className={className}>{icon}</span>;
  }

  return (
    <IconComponent 
      className={`${sizeClasses[size]} ${className}`} 
      style={color ? { color } : undefined}
    />
  );
}
