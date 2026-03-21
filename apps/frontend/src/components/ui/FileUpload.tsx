import React, { useCallback, useState } from 'react';
import { Upload, AlertTriangle, CheckCircle, X } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { logger } from '../../services/logger';
import Button from './Button';

interface FileUploadProps {
  onUploadComplete: (data: any[]) => void;
  acceptedFormats?: string[];
  maxFileSize?: number; // in MB
}

const FileUpload: React.FC<FileUploadProps> = ({
  onUploadComplete,
  acceptedFormats = ['.csv', '.txt', '.xlsx', '.xls'],
  maxFileSize = 10
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Validate file size
      if (file.size > maxFileSize * 1024 * 1024) {
        throw new Error(`La taille du fichier dépasse la limite de ${maxFileSize}MB`);
      }

      // Validate file type
      const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
      if (!acceptedFormats.includes(fileExtension)) {
        throw new Error(`Type de fichier invalide. Formats acceptés: ${acceptedFormats.join(', ')}`);
      }

      let data: any[] = [];

      if (fileExtension === '.csv' || fileExtension === '.txt') {
        // Parse CSV/TXT with specific encoding and delimiter
        const text = await file.text();
        const result = await new Promise((resolve, reject) => {
          Papa.parse(text, {
            header: false,
            delimiter: ',',
            skipEmptyLines: true,
            encoding: 'UTF-8',
            complete: resolve,
            error: reject,
            transform: (value: string) => value.trim()
          });
        });
        
        data = (result as Papa.ParseResult<any>).data;
      } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        data = XLSX.utils.sheet_to_json(worksheet);
      }

      // Remove any empty rows
      data = data.filter(row => Object.values(row).some(value => value));

      logger.info('system', 'File processed successfully', {
        fileName: file.name,
        rowCount: data.length
      });

      setUploadedFile(file);
      onUploadComplete(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Échec du traitement du fichier';
      setError(errorMessage);
      logger.error('system', 'File processing error', { error: errorMessage });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, []);

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setError(null);
  };

  return (
    <div className="w-full">
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center
          ${isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300'}
          ${error ? 'border-error-500 bg-error-50' : ''}
          ${uploadedFile ? 'border-success-500 bg-success-50' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isProcessing ? (
          <div className="space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
            <p className="text-sm text-gray-600">Traitement du fichier en cours...</p>
          </div>
        ) : uploadedFile ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="h-6 w-6 text-success-500" />
              <span className="text-success-700 font-medium">{uploadedFile.name}</span>
              <button
                onClick={handleRemoveFile}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Fichier chargé avec succès ! Cliquez sur traiter pour mettre à jour les statistiques.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-center">
              {error ? (
                <AlertTriangle className="h-12 w-12 text-error-500" />
              ) : (
                <Upload className="h-12 w-12 text-gray-400" />
              )}
            </div>
            
            {error ? (
              <div className="space-y-2">
                <p className="text-error-500 font-medium">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveFile}
                >
                  Réessayer
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <p className="text-gray-500">
                    Glissez et déposez votre fichier ici, ou cliquez pour sélectionner
                  </p>
                  <p className="text-sm text-gray-400">
                    Formats supportés : {acceptedFormats.join(', ')}
                  </p>
                  <p className="text-sm text-gray-400">
                    Taille maximale : {maxFileSize}MB
                  </p>
                </div>
                
                <Button variant="outline" size="sm">
                  <label className="cursor-pointer">
                    Sélectionner un fichier
                    <input
                      type="file"
                      className="hidden"
                      accept={acceptedFormats.join(',')}
                      onChange={handleFileSelect}
                    />
                  </label>
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;