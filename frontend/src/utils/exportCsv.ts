import { toast } from 'sonner';

export function exportToCsv(
  filename: string,
  rows: Record<string, string | number | null | undefined>[],
) {
  if (rows.length === 0) {
    toast.warning('Não há dados para exportar.');
    return;
  }

  const headers = Object.keys(rows[0]);

  const csvContent = [
    headers.join(';'),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = row[header] ?? '';
          return `"${String(value).replace(/"/g, '""')}"`;
        })
        .join(';'),
    ),
  ].join('\n');

  const blob = new Blob([`\uFEFF${csvContent}`], {
    type: 'text/csv;charset=utf-8;',
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}