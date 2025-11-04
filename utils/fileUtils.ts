import type { ExcelData } from "../types";

// Make sure SheetJS (XLSX) is loaded from the CDN in index.html
declare var XLSX: any;

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // remove the data url prefix: 'data:[...];base64,'
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const parseCsvFile = (file: File): Promise<ExcelData> => {
  return new Promise((resolve, reject) => {
    if (typeof XLSX === 'undefined') {
      return reject(new Error("XLSX library is not loaded."));
    }
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const excelData: ExcelData = { sheets: [] };

        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          // { header: 1 } creates an array of arrays, which matches our string[][] type
          const sheetDataArray: string[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          excelData.sheets.push({
            sheetName: sheetName,
            data: sheetDataArray,
          });
        });
        resolve(excelData);
      } catch (error) {
        console.error("Error parsing CSV file:", error);
        reject(new Error("Failed to parse the CSV file. It might be corrupted."));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};


// Helper function to calculate column widths
const getColumnWidths = (data: string[][]): { wch: number }[] => {
  const colWidths: number[] = [];
  if (!data || data.length === 0) return [];

  // Iterate over rows to find max length for each column
  for (const row of data) {
    row.forEach((cell, i) => {
      const cellLength = (cell || '').toString().length;
      if (!colWidths[i] || cellLength > colWidths[i]) {
        colWidths[i] = cellLength;
      }
    });
  }

  // Return in the format SheetJS expects, with a little extra padding
  // and a max width to prevent ridiculously wide columns. A min width is also useful.
  return colWidths.map(width => ({ wch: Math.max(10, Math.min(width + 2, 80)) }));
};


export const downloadExcel = (data: ExcelData, fileName: string) => {
  if (typeof XLSX === 'undefined') {
    console.error("XLSX library is not loaded. Make sure it's included via CDN.");
    alert("Error: Could not create Excel file. The required library is missing.");
    return;
  }
  
  const workbook = XLSX.utils.book_new();

  data.sheets.forEach(sheetInfo => {
    // Sanitize sheet name for Excel's constraints (e.g., length, no special chars)
    const safeSheetName = sheetInfo.sheetName.replace(/[\/\\?*\[\]]/g, '').substring(0, 31);
    
    // Ensure data is not empty, which can cause errors
    if(sheetInfo.data && sheetInfo.data.length > 0) {
       const worksheet = XLSX.utils.aoa_to_sheet(sheetInfo.data);
       // Set column widths for better formatting
       worksheet['!cols'] = getColumnWidths(sheetInfo.data);
       XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);
    } else {
       // Create an empty sheet if there's no data
       const worksheet = XLSX.utils.aoa_to_sheet([["No data extracted for this sheet"]]);
       XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);
    }
  });
  
  // If no sheets were added at all, add a default one to avoid creating an empty/corrupt file
  if(workbook.SheetNames.length === 0){
     const worksheet = XLSX.utils.aoa_to_sheet([["No data could be extracted from the file."]]);
     XLSX.utils.book_append_sheet(workbook, worksheet, "Extraction Report");
  }

  XLSX.writeFile(workbook, fileName);
};