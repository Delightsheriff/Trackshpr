import { View, type ViewProps } from 'react-native';

type CardProps = ViewProps;

export default function Card({ className = '', ...props }: CardProps) {
  return (
    <View className={`rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 ${className}`} {...props} />
  );
}
