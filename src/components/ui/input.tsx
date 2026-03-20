import { TextInput, type TextInputProps } from 'react-native';

type InputProps = TextInputProps;

export default function Input({ className = '', ...props }: InputProps) {
  return (
    <TextInput
      className={`border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 ${className}`}
      placeholderTextColor="#9ca3af"
      {...props}
    />
  );
}
