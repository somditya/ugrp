'use client';

import { useState, useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { GrievanceFormData } from './page';
import { useDropzone } from 'react-dropzone';

interface Step2Props {
  onNext: () => void;
  onBack: () => void;
}

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const MAX_SIZE = 5 * 1024 * 1024;

export default function Step2Description({ onNext, onBack }: Step2Props) {
  const { register, formState: { errors }, watch, setValue } = useFormContext<GrievanceFormData>();
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const description = watch('description') || '';
  const attachments = watch('attachments') || [];

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        alert(`${file.name}: Unsupported file type`);
        return null;
      }
      if (file.size > MAX_SIZE) {
        alert(`${file.name}: File exceeds 5MB limit`);
        return null;
      }

      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

      const simulateProgress = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = (prev[file.name] || 0) + 10;
          if (newProgress >= 100) {
            clearInterval(simulateProgress);
            return prev;
          }
          return { ...prev, [file.name]: newProgress };
        });
      }, 100);

      return {
        name: file.name,
        size: file.size,
        type: file.type,
      };
    }).filter(Boolean);

    const totalFiles = attachments.length + newFiles.length;
    if (totalFiles > 5) {
      alert('Maximum 5 files allowed');
      return;
    }

    setValue('attachments', [...attachments, ...newFiles]);
  }, [attachments, setValue]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: MAX_SIZE,
    multiple: true,
  });

  const removeFile = (name: string) => {
    setValue('attachments', attachments.filter((a) => a.name !== name));
    setUploadProgress(prev => {
      const { [name]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleContinue = () => {
    if (!errors.description && description.length >= 50) {
      onNext();
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-serif font-semibold text-gray-800">
        Step 2: Description & Attachments
      </h2>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description of Grievance
        </label>
        <textarea
          {...register('description')}
          rows={6}
          placeholder="Please describe your grievance in detail (minimum 50 characters)..."
          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition resize-none ${
            errors.description ? 'border-red-300' : 'border-gray-300'
          }`}
        />
        <div className="flex justify-between items-center mt-1">
          {errors.description ? (
            <p className="text-sm text-red-600">{errors.description.message}</p>
          ) : (
            <p className="text-sm text-gray-500">
              Be as detailed as possible to help us understand your concern
            </p>
          )}
          <span className={`text-sm ${
            description.length < 50 ? 'text-red-500' : 'text-gray-600'
          }`}>
            {description.length}/2000
          </span>
        </div>
      </div>

      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Supporting Documents (Optional)
        </label>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
            isDragActive ? 'border-amber-500 bg-amber-50' : 'border-gray-300 hover:border-amber-400'
          }`}
        >
          <input {...getInputProps()} />
          <svg className="w-10 h-10 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v8" />
          </svg>
          <p className="text-gray-600">
            Drop files here or <span className="text-amber-600 font-medium">click to browse</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            PDF, JPEG, PNG, DOCX • Max 5MB each • Up to 5 files
          </p>
        </div>

        {/* File Preview */}
        {attachments.length > 0 && (
          <div className="mt-4 space-y-3">
            {attachments.map((file) => (
              <div key={file.name} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <svg className="w-8 h-8 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-6-4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatSize(file.size)}</p>
                  {uploadProgress[file.name] !== undefined && uploadProgress[file.name] < 100 && (
                    <div className="w-full h-1 bg-gray-200 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-amber-600 transition-all" style={{ width: `${uploadProgress[file.name]}%` }} />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(file.name)}
                  className="p-1 text-gray-400 hover:text-red-600 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-2.5 px-4 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleContinue}
          disabled={description.length < 50}
          className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition ${
            description.length < 50
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-amber-600 text-white hover:bg-amber-700'
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}