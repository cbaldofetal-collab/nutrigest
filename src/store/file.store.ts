import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FileUpload, ProcessedData } from '../types/file.types';

interface FileStore {
  files: FileUpload[];
  currentFile: FileUpload | null;
  processedData: ProcessedData | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setFiles: (files: FileUpload[]) => void;
  setCurrentFile: (file: FileUpload | null) => void;
  setProcessedData: (data: ProcessedData | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addFile: (file: FileUpload) => void;
  removeFile: (fileId: string) => void;
  uploadFile: (file: File) => Promise<void>;
  processFile: (fileId: string) => Promise<void>;
}

export const useFileStore = create<FileStore>()(
  persist(
    (set, get) => ({
      files: [],
      currentFile: null,
      processedData: null,
      isLoading: false,
      error: null,

      setFiles: (files: FileUpload[]) => {
        set({ files });
      },

      setCurrentFile: (file: FileUpload | null) => {
        set({ currentFile: file });
      },

      setProcessedData: (data: ProcessedData | null) => {
        set({ processedData: data });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      addFile: (file: FileUpload) => {
        set((state) => ({ files: [...state.files, file] }));
      },

      removeFile: (fileId: string) => {
        set((state) => ({ 
          files: state.files.filter(f => f.id !== fileId),
          currentFile: state.currentFile?.id === fileId ? null : state.currentFile
        }));
      },

      uploadFile: async (file: File) => {
        set({ isLoading: true, error: null });
        try {
          // Simulação de upload - será substituído por integração real
          const newFile: FileUpload = {
            id: Date.now().toString(),
            filename: file.name,
            originalName: file.name,
            fileType: file.type,
            fileSize: file.size,
            storagePath: `/uploads/${file.name}`,
            metadata: {
              sheets: ['Planilha1'],
              headers: ['Coluna A', 'Coluna B', 'Coluna C'],
              dataTypes: {}
            },
            columnSchema: [
              {
                name: 'Coluna A',
                type: 'string',
                nullable: true,
                unique: false,
                sampleValues: ['Dado 1', 'Dado 2', 'Dado 3']
              }
            ],
            rowCount: 100,
            createdAt: new Date()
          };
          
          get().addFile(newFile);
          set({ currentFile: newFile, isLoading: false });
        } catch (error) {
          set({ error: 'Erro ao fazer upload do arquivo', isLoading: false });
        }
      },

      processFile: async (fileId: string) => {
        set({ isLoading: true, error: null });
        try {
          // Simulação de processamento - será substituído por integração real
          const mockData: ProcessedData = {
            sheets: [{
              name: 'Planilha1',
              data: [
                { 'Coluna A': 'Dado 1', 'Coluna B': 100, 'Coluna C': new Date() },
                { 'Coluna A': 'Dado 2', 'Coluna B': 200, 'Coluna C': new Date() },
                { 'Coluna A': 'Dado 3', 'Coluna B': 300, 'Coluna C': new Date() }
              ],
              headers: ['Coluna A', 'Coluna B', 'Coluna C']
            }],
            data: [
              { 'Coluna A': 'Dado 1', 'Coluna B': 100, 'Coluna C': new Date() },
              { 'Coluna A': 'Dado 2', 'Coluna B': 200, 'Coluna C': new Date() },
              { 'Coluna A': 'Dado 3', 'Coluna B': 300, 'Coluna C': new Date() }
            ],
            schema: [{
              name: 'Coluna A',
              type: 'string',
              nullable: true,
              unique: false,
              sampleValues: ['Dado 1', 'Dado 2', 'Dado 3']
            }],
            statistics: {
              totalRows: 3,
              totalColumns: 3,
              nullCount: 0,
              duplicateCount: 0,
              columnStats: {}
            }
          };
          
          set({ processedData: mockData, isLoading: false });
        } catch (error) {
          set({ error: 'Erro ao processar arquivo', isLoading: false });
        }
      }
    }),
    {
      name: 'file-storage',
      partialize: (state) => ({
        files: state.files
      })
    }
  )
);