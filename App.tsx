import React, { useState, useCallback } from 'react';
import { FileUpload } from './components/FileUpload';
import { Button } from './components/Button';
import { Spinner } from './components/Spinner';
import { DownloadIcon, AlertIcon, CheckCircleIcon } from './components/Icons';
import { PreviewTable } from './components/PreviewTable';
import { convertPdfToExcelData, convertTextToExcelData } from './services/geminiService';
import { downloadExcel, parseCsvFile } from './utils/fileUtils';
import type { ExcelData } from './types';
import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from './constants';

const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [excelData, setExcelData] = useState<ExcelData | null>(null);

  const handleFileSelect = (file: File | null) => {
    setError(null);
    setExcelData(null);

    if (file) {
      const allowedTypes = ['application/pdf', 'text/csv', 'text/plain'];
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Please upload a PDF, CSV, or TXT file.');
        setSelectedFile(null);
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError(`File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
        setSelectedFile(null);
        return;
      }
    }
    setSelectedFile(file);
  };

  const handleConvert = useCallback(async () => {
    if (!selectedFile) {
      setError('Please select a file first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setExcelData(null);

    try {
      let data: ExcelData | null = null;
      switch (selectedFile.type) {
        case 'application/pdf':
          data = await convertPdfToExcelData(selectedFile);
          break;
        case 'text/plain':
          data = await convertTextToExcelData(selectedFile);
          break;
        case 'text/csv':
          data = await parseCsvFile(selectedFile);
          break;
        default:
          throw new Error(`Unsupported file type: ${selectedFile.type}`);
      }
      setExcelData(data);
    } catch (err) {
      console.error(err);
      setError('Failed to convert file. The document might be corrupted or in an unsupported format. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedFile]);

  const handleDownload = () => {
    if (excelData && selectedFile) {
      const outputFilename = `${selectedFile.name.replace(/\.[^/.]+$/, '')}.xlsx`;
      downloadExcel(excelData, outputFilename);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setExcelData(null);
    setError(null);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 font-sans text-slate-800 dark:text-slate-200">
      <div className="w-full max-w-2xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">
            File to Excel Converter
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            Intelligently extract data from your PDF, CSV, or TXT files into structured Excel sheets.
          </p>
        </header>

        <main className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-2xl shadow-slate-200/50 dark:shadow-black/20 p-6 md:p-10 transition-all duration-300">
          {!isLoading && !excelData && (
            <div className="space-y-6">
              <FileUpload onFileSelect={handleFileSelect} disabled={isLoading} />
              {selectedFile && (
                <div className="text-center text-sm text-slate-500 dark:text-slate-400">
                  Selected: <span className="font-medium text-slate-700 dark:text-slate-300">{selectedFile.name}</span>
                </div>
              )}
              <Button onClick={handleConvert} disabled={!selectedFile || isLoading}>
                {isLoading ? 'Converting...' : 'Convert to Excel'}
              </Button>
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center space-y-4 text-center h-48">
              <Spinner />
              <p className="font-medium text-slate-600 dark:text-slate-300">Analyzing your file...</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">This may take a moment for large or complex files.</p>
            </div>
          )}

          {excelData && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="flex flex-col items-center text-green-600 dark:text-green-400">
                  <CheckCircleIcon className="w-16 h-16"/>
                  <h2 className="text-2xl font-semibold mt-4">Conversion Successful!</h2>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">Your well-formatted Excel file is ready.</p>
                </div>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto rounded-lg bg-slate-50 dark:bg-slate-900/50 p-4 border border-slate-200 dark:border-slate-700">
                 <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 sticky top-0 bg-slate-50 dark:bg-slate-900/50 py-2">Extracted Data Preview</h3>
                {excelData.sheets.map((sheet, index) => (
                    <PreviewTable key={index} sheetName={sheet.sheetName} data={sheet.data} />
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 border-t border-slate-200 dark:border-slate-700">
                 <Button onClick={handleDownload} variant="primary" className="w-full sm:w-auto">
                  <DownloadIcon className="w-5 h-5 mr-2" />
                  Download Excel
                </Button>
                 <Button onClick={handleReset} variant="secondary" className="w-full sm:w-auto">
                  Convert Another File
                </Button>
              </div>
            </div>
          )}
          
          {error && (
            <div className="mt-6 flex items-start p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg text-red-700 dark:text-red-300">
              <AlertIcon className="w-5 h-5 mr-3 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

        </main>
        <footer className="text-center mt-8">
            <p className="text-sm text-slate-500 dark:text-slate-500">
                Powered by Google Gemini. Max file size: {MAX_FILE_SIZE_MB}MB.
            </p>
        </footer>
      </div>
    </div>
  );
};

export default App;