import { Pressable, Text } from 'react-native';
import type { ReactNode } from 'react';

type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
  children: ReactNode;
  onPress?: () => void;
};

export default function Button({ variant = 'primary', className = '', children, onPress }: ButtonProps) {
  const variants = {
    primary: 'bg-blue-500 active:bg-blue-600',
    secondary: 'bg-zinc-200 dark:bg-zinc-800 active:bg-zinc-300 dark:active:bg-zinc-700',
    outline: 'border border-zinc-300 dark:border-zinc-700',
  };

  return (
    <Pressable
      className={`px-4 py-2 rounded-lg ${variants[variant]} ${className}`}
      onPress={onPress}
    >
      {({ pressed }) => (
        <Text className={`text-center font-medium ${pressed ? 'opacity-70' : ''}`}>
          {children}
        </Text>
      )}
    </Pressable>
  );
}
