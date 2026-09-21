import { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ className = '', children, ...props }: CardProps) {
  return (
    <div
      {...props}
      className={`rounded-lg bg-bg-card p-4 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}