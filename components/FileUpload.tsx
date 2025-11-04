import React, { useCallback, useState, useRef } from 'react';
import { UploadIcon } from './Icons';

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, disabled = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const dragDropClasses = isDragging
    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30'
    : 'border-slate-300 dark:border-slate-600 hover:border-indigo-500 dark:hover:border-indigo-400';

  return (
    <div
      className={`relative flex flex-col items-center justify-center w-full p-8 text-center border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200 ${dragDropClasses} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={!disabled ? handleDrop : undefined}
      onClick={!disabled ? handleClick : undefined}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.csv,.txt"
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />
      <div className="flex flex-col items-center">
        <UploadIcon className="w-12 h-12 text-slate-400 dark:text-slate-500 mb-4" />
        <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
          Drop your file here or <span className="text-indigo-600 dark:text-indigo-400">browse</span>
        </p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Supports PDF, CSV, and TXT files
        </p>
      </div>
    </div>
  );
};