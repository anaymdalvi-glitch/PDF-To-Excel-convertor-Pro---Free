import React from 'react';
import type { SheetData } from '../types';

export const PreviewTable: React.FC<SheetData> = ({ sheetName, data }) => {
  if (!data || data.length === 0) {
    return (
       <div className="mb-6">
        <h3 className="text-md font-semibold text-slate-700 dark:text-slate-300 mb-2">{sheetName}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">No data was extracted for this sheet.</p>
      </div>
    );
  }

  const headers = data[0];
  const rows = data.slice(1);

  return (
    <div className="mb-6 last:mb-0">
      <h3 className="text-md font-semibold text-slate-700 dark:text-slate-300 mb-2">{sheetName}</h3>
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
          <thead className="bg-slate-100 dark:bg-slate-800">
            <tr>
              {headers.map((header, index) => (
                <th key={index} scope="col" className="px-4 py-2 text-left font-medium text-slate-600 dark:text-slate-300">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800/50 divide-y divide-slate-200 dark:divide-slate-700">
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
             {rows.length === 0 && (
                <tr>
                    <td colSpan={headers.length} className="text-center px-4 py-4 text-slate-500 dark:text-slate-400">
                        No data rows found.
                    </td>
                </tr>
             )}
          </tbody>
        </table>
      </div>
    </div>
  );
};