import { cn } from '@/lib/utils';

export default function Table({ children, className }) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('min-w-full divide-y divide-gray-200', className)}>
        {children}
      </table>
    </div>
  );
}

export function Thead({ children }) {
  return <thead className="bg-gray-50">{children}</thead>;
}

export function Tbody({ children }) {
  return (
    <tbody className="bg-white divide-y divide-gray-200">{children}</tbody>
  );
}

export function Tr({ children, className, onClick, clickable }) {
  return (
    <tr
      className={cn(
        clickable && 'cursor-pointer hover:bg-gray-50',
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function Th({ children, className }) {
  return (
    <th
      className={cn(
        'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
        className
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className }) {
  return (
    <td
      className={cn('px-6 py-4 whitespace-nowrap text-sm text-gray-900', className)}
    >
      {children}
    </td>
  );
}

export function EmptyState({ message = '데이터가 없습니다.' }) {
  return (
    <tr>
      <td colSpan="100%" className="px-6 py-12 text-center text-gray-500">
        {message}
      </td>
    </tr>
  );
}
