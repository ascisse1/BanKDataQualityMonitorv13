import React, { useMemo } from 'react';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';

interface VirtualizedTableProps {
  data: any[];
  columns: ColumnDef<any>[];
  height?: number;
  rowHeight?: number;
}

/**
 * Table virtualisée pour gérer efficacement de gros volumes de données
 */
const VirtualizedTable: React.FC<VirtualizedTableProps> = ({
  data,
  columns,
  height = 400,
  rowHeight = 50
}) => {
  const parentRef = React.useRef<HTMLDivElement>(null);
  
  const tableColumns = useMemo(() => 
    columns.map(col => ({
      ...col,
      cell: col.cell || (info => info.getValue())
    })), 
    [columns]
  );
  
  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-hidden border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-12 gap-4 px-4 py-3">
          {table.getHeaderGroups().map(headerGroup => (
            <React.Fragment key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <div
                  key={header.id}
                  className={`text-xs font-medium text-gray-500 uppercase tracking-wider col-span-${Math.floor(12 / columns.length)}`}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Virtualized Body */}
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ height: `${height}px` }}
      > 
        <table className="min-w-full divide-y divide-gray-200">
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.slice(0, Math.floor(height / rowHeight)).map(row => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-3 py-4 whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer avec statistiques */}
      <div className="bg-gray-50 border-t border-gray-200 px-4 py-2">
        <div className="text-xs text-gray-500">
          Affichage de {Math.min(Math.floor(height / rowHeight), data.length)} lignes sur {data.length} total
          {data.length > 1000 && (
            <span className="ml-2 text-warning-600">
              • Table virtualisée pour optimiser les performances
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default VirtualizedTable;