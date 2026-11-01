/** Build CSV text. Cells starting with = + - @ are prefixed with ' to block spreadsheet formulas. */
export function toCsv(rows: (string | number | boolean | null | undefined)[][]): string {
  const cell = (value: string | number | boolean | null | undefined) => {
    let s = value === null || value === undefined ? '' : String(value);
    if (/^[=+\-@]/.test(s)) s = `'${s}`;
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return rows.map((row) => row.map(cell).join(',')).join('\n');
}
