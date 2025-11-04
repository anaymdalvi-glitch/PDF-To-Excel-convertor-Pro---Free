export interface SheetData {
  sheetName: string;
  data: string[][];
}

export interface ExcelData {
  sheets: SheetData[];
}