import { cn, priorityConfig, sendStatusConfig } from '@/lib/utils';

export default function Badge({ children, variant = 'default', className }) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    primary: 'bg-primary-50 text-primary-700',
    success: 'bg-green-50 text-green-700',
    warning: 'bg-yellow-50 text-yellow-700',
    danger: 'bg-red-50 text-red-700',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const config = priorityConfig[priority] || priorityConfig.medium;

  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-md text-sm font-semibold',
        config.bg,
        config.text
      )}
    >
      {config.label}
    </span>
  );
}

export function SendStatusBadge({ status }) {
  const config = sendStatusConfig[status] || sendStatusConfig['미발송'];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        config.bg,
        config.text
      )}
    >
      {status}
    </span>
  );
}
