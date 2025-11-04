import { GoogleGenAI, Type } from "@google/genai";
import { fileToBase64 } from "../utils/fileUtils";
import type { ExcelData } from "../types";

const responseSchema = {
    type: Type.OBJECT,
    properties: {
      sheets: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            sheetName: {
              type: Type.STRING,
              description: "The name of the worksheet, which should be descriptive of its content (e.g., 'Sales Q1', 'Employee List').",
            },
            data: {
              type: Type.ARRAY,
              description: "A 2D array representing the table. The first inner array MUST be the column headers. Subsequent inner arrays are the data rows. All cell values should be represented as strings.",
              items: {
                type: Type.ARRAY,
                items: {
                    type: Type.STRING,
                }
              },
            },
          },
          required: ['sheetName', 'data'],
        },
      },
    },
    required: ['sheets'],
};

const parseGeminiResponse = (responseText: string): ExcelData => {
    const jsonText = responseText.trim();
    try {
        const parsedData = JSON.parse(jsonText);
        // Basic validation to ensure the parsed data matches the expected structure
        if (parsedData && Array.isArray(parsedData.sheets)) {
            return parsedData;
        } else {
            throw new Error("Parsed JSON does not match the expected ExcelData structure.");
        }
    } catch (e) {
        console.error("Failed to parse Gemini response:", e);
        console.error("Raw response text:", jsonText);
        throw new Error("Could not parse the data from the document. The format may be unsupported.");
    }
};

export const convertPdfToExcelData = async (file: File): Promise<ExcelData> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const base64Pdf = await fileToBase64(file);

    const pdfPart = {
        inlineData: {
            mimeType: 'application/pdf',
            data: base64Pdf,
        },
    };

    const textPart = {
        text: `Act as an expert data extraction AI. Your primary mission is to analyze the provided PDF document, which may be a native file or a scanned image, and convert all tabular data into a structured JSON format. Apply advanced OCR if necessary.

Key formatting and extraction instructions:
1.  **Advanced Table Recognition:**
    *   Identify all distinct tables, even those with complex layouts, merged cells, or unconventional formatting.
    *   If a table spans multiple pages, intelligently merge it into a single, continuous sheet.
    *   Use visual cues like lines, borders, and cell alignment to accurately define table boundaries.
2.  **Distinguish Tables from Text:**
    *   Crucially, you must differentiate between actual tabular data and text formatted in multiple columns (like a newsletter or article). **Only extract data that is clearly structured in a table format.** Do not extract multi-column paragraphs.
3.  **OCR for Scanned Documents:**
    *   The document may be a scan. Use your OCR capabilities to accurately read text, numbers, and symbols from the image. Pay close attention to characters that can be easily confused (e.g., O and 0, 1 and l).
4.  **Data Integrity and Cleaning:**
    *   **Headers:** The first row for each sheet's data must be the column headers.
    *   **Cleaning:** Trim all leading/trailing whitespace from cells. Correct for unnecessary line breaks or OCR artifacts within a cell's content.
    *   **Structure:** Maintain the original row and column structure with precision.
5.  **Sheet Organization:**
    *   Place each distinct table on its own sheet.
    *   Assign a concise, descriptive name to each sheet based on the table's content or title.
6.  **Output Format:** The final output must be a single JSON object that strictly conforms to the provided schema. It will contain a 'sheets' array, where each element represents a table with its 'sheetName' and 'data' (a 2D array of strings).`
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [textPart, pdfPart] },
        config: {
            responseMimeType: 'application/json',
            responseSchema: responseSchema,
        },
    });

    return parseGeminiResponse(response.text);
};

export const convertTextToExcelData = async (file: File): Promise<ExcelData> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const base64Text = await fileToBase64(file);

    const filePart = {
        inlineData: {
            mimeType: 'text/plain',
            data: base64Text,
        },
    };

    const textPart = {
        text: `Act as a data analyst. Your task is to analyze the attached plain text file and extract any data that appears to be in a tabular format. The data may be delimited by commas, tabs, spaces, or other characters.
Key instructions:
1.  **Identify Tables:** Scan the entire document for data structured in rows and columns.
2.  **Infer Headers:** If possible, determine the column headers from the text. If no headers are present, create logical names like 'Column 1', 'Column 2', etc.
3.  **Sheet Naming:** If multiple distinct tables are found, create a separate sheet for each. Name them 'Table 1', 'Table 2', and so on. If only one table is found, name the sheet 'Extracted Data'.
4.  **Data Cleaning:** Clean the data by trimming whitespace from each cell. Ensure consistent column counts for all rows within a table.
5.  **Output Format:** The output must be a JSON object that strictly adheres to the provided schema. Each sheet will be an object with 'sheetName' and 'data' (a 2D array of strings).`
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [textPart, filePart] },
        config: {
            responseMimeType: 'application/json',
            responseSchema: responseSchema,
        },
    });

    return parseGeminiResponse(response.text);
};