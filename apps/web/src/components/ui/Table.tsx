import React from "react";

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
}

export function Table({ children, className = "", ...props }: TableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={`w-full text-left text-14 border-collapse ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <thead className={`border-b border-border bg-surface text-12 font-medium text-muted uppercase tracking-wider ${className}`}>
      {children}
    </thead>
  );
}

export function TableRow({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <tr
      onClick={onClick}
      className={`h-12 border-b border-border hover:bg-raised transition-colors ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
    >
      {children}
    </tr>
  );
}

export interface TableHeaderCellProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  children?: React.ReactNode;
}

export function TableHeaderCell({
  children,
  className = "",
  ...props
}: TableHeaderCellProps) {
  return (
    <th className={`h-12 px-4 font-medium text-12 text-muted uppercase tracking-wider ${className}`} {...props}>
      {children}
    </th>
  );
}

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children?: React.ReactNode;
}

export function TableCell({
  children,
  className = "",
  ...props
}: TableCellProps) {
  return (
    <td className={`h-12 px-4 text-14 text-text ${className}`} {...props}>
      {children}
    </td>
  );
}
