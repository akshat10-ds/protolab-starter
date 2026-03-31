import * as React from 'react';
import { cn } from '@/lib/utils';
import styles from './FileUpload.module.css';
import { Icon } from '@/design-system';
import { IconButton } from '../../3-primitives/IconButton';

export type FileStatus = 'uploading' | 'success' | 'error';

export interface UploadedFile {
  file: File;
  id: string;
  status: FileStatus;
  progress: number;
  error?: string;
}

export interface FileUploadProps {
  /** Callback when files are selected */
  onFilesSelect?: (files: File[]) => void;
  /** Callback when file upload status changes */
  onFileChange?: (files: UploadedFile[]) => void;
  /** Callback when a file is removed */
  onFileRemove?: (fileId: string) => void;
  /** Accepted file types (e.g., 'image/*', '.pdf', etc.) */
  accept?: string;
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Maximum number of files */
  maxFiles?: number;
  /** Whether to allow multiple files */
  multiple?: boolean;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Custom placeholder text */
  placeholder?: string;
  /** Helper text */
  helperText?: string;
  /** Label */
  label?: string;
  /** Show file list */
  showFileList?: boolean;
  /** Custom className */
  className?: string;
}

const FileUpload = React.forwardRef<HTMLInputElement, FileUploadProps>(
  (
    {
      onFilesSelect,
      onFileChange,
      onFileRemove,
      accept,
      maxSize = 10 * 1024 * 1024, // 10MB default
      maxFiles = 5,
      multiple = true,
      disabled = false,
      placeholder = 'Drag and drop files here or click to browse',
      helperText,
      label,
      showFileList = true,
      className,
    },
    ref
  ) => {
    const [isDragging, setIsDragging] = React.useState(false);
    const [files, setFiles] = React.useState<UploadedFile[]>([]);
    const [error, setError] = React.useState<string>('');
    const inputRef = React.useRef<HTMLInputElement>(null);
    const dragCounter = React.useRef(0);

    React.useImperativeHandle(ref, () => inputRef.current!);

    const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    const validateFile = (file: File): string | null => {
      if (maxSize && file.size > maxSize) {
        return `File size exceeds ${formatFileSize(maxSize)}`;
      }

      if (accept) {
        const acceptedTypes = accept.split(',').map((type) => type.trim());
        const fileType = file.type;
        const fileName = file.name;
        const fileExtension = '.' + fileName.split('.').pop()?.toLowerCase();

        const isValid = acceptedTypes.some((acceptedType) => {
          if (acceptedType.startsWith('.')) {
            return fileExtension === acceptedType.toLowerCase();
          }
          if (acceptedType.endsWith('/*')) {
            const category = acceptedType.split('/')[0];
            return fileType.startsWith(category + '/');
          }
          return fileType === acceptedType;
        });

        if (!isValid) {
          return `File type not accepted. Allowed: ${accept}`;
        }
      }

      return null;
    };

    const handleFiles = (newFiles: FileList | File[]) => {
      setError('');
      const fileArray = Array.from(newFiles);

      if (!multiple && fileArray.length > 1) {
        setError('Only one file allowed');
        return;
      }

      if (files.length + fileArray.length > maxFiles) {
        setError(`Maximum ${maxFiles} files allowed`);
        return;
      }

      const validFiles: File[] = [];
      let hasError = false;

      for (const file of fileArray) {
        const validationError = validateFile(file);
        if (validationError) {
          setError(validationError);
          hasError = true;
          break;
        }
        validFiles.push(file);
      }

      if (hasError) return;

      const uploadedFiles: UploadedFile[] = validFiles.map((file) => ({
        file,
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        status: 'uploading' as FileStatus,
        progress: 0,
      }));

      const newFilesList = multiple ? [...files, ...uploadedFiles] : uploadedFiles;
      setFiles(newFilesList);
      onFilesSelect?.(validFiles);

      // Simulate upload progress
      uploadedFiles.forEach((uploadedFile) => {
        simulateUpload(uploadedFile.id);
      });
    };

    const simulateUpload = (fileId: string) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;

        setFiles((prevFiles) => {
          const updatedFiles = prevFiles.map((f) => {
            if (f.id === fileId) {
              if (progress >= 100) {
                clearInterval(interval);
                return { ...f, status: 'success' as FileStatus, progress: 100 };
              }
              return { ...f, progress };
            }
            return f;
          });
          onFileChange?.(updatedFiles);
          return updatedFiles;
        });
      }, 200);
    };

    const handleRemoveFile = (fileId: string) => {
      const newFiles = files.filter((f) => f.id !== fileId);
      setFiles(newFiles);
      onFileRemove?.(fileId);
      onFileChange?.(newFiles);
    };

    const handleDragEnter = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current += 1;
      if (!disabled) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current -= 1;
      if (dragCounter.current === 0) {
        setIsDragging(false);
      }
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounter.current = 0;

      if (disabled) return;

      const droppedFiles = e.dataTransfer.files;
      if (droppedFiles.length > 0) {
        handleFiles(droppedFiles);
      }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files;
      if (selectedFiles && selectedFiles.length > 0) {
        handleFiles(selectedFiles);
      }
      // Reset input value to allow selecting the same file again
      e.target.value = '';
    };

    const handleClick = () => {
      if (!disabled) {
        inputRef.current?.click();
      }
    };

    const getFileIcon = (file: File) => {
      if (file.type.startsWith('image/')) {
        return URL.createObjectURL(file);
      }
      return null;
    };

    return (
      <div data-ink-component="FileUpload" className={cn(styles.wrapper, className)}>
        {label && <label className={styles.label}>{label}</label>}

        <div
          className={cn(
            styles.dropzone,
            isDragging && styles.dragging,
            disabled && styles.disabled,
            error && styles.error
          )}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <input
            ref={inputRef}
            type="file"
            className={styles.input}
            onChange={handleInputChange}
            accept={accept}
            multiple={multiple}
            disabled={disabled}
          />

          <div className={styles.dropzoneContent}>
            <Icon name="upload" size="lg" className={styles.uploadIcon} />
            <div className={styles.dropzoneText}>{placeholder}</div>
            {helperText && !error && <div className={styles.dropzoneHelper}>{helperText}</div>}
            {error && <div className={styles.errorText}>{error}</div>}
            {maxSize && (
              <div className={styles.dropzoneHelper}>Max file size: {formatFileSize(maxSize)}</div>
            )}
          </div>
        </div>

        {showFileList && files.length > 0 && (
          <div className={styles.fileList}>
            {files.map((uploadedFile) => {
              const fileIcon = getFileIcon(uploadedFile.file);

              return (
                <div key={uploadedFile.id} className={styles.fileItem}>
                  <div className={styles.filePreview}>
                    {fileIcon ? (
                      <img
                        src={fileIcon}
                        alt={uploadedFile.file.name}
                        className={styles.fileImage}
                      />
                    ) : (
                      <Icon name="document" size="medium" className={styles.fileIconDefault} />
                    )}
                  </div>

                  <div className={styles.fileInfo}>
                    <div className={styles.fileName}>{uploadedFile.file.name}</div>
                    <div className={styles.fileSize}>{formatFileSize(uploadedFile.file.size)}</div>

                    {uploadedFile.status === 'uploading' && (
                      <div className={styles.progressBar}>
                        <div
                          className={styles.progressFill}
                          style={{ width: `${uploadedFile.progress}%` }}
                        />
                      </div>
                    )}

                    {uploadedFile.error && (
                      <div className={styles.fileError}>{uploadedFile.error}</div>
                    )}
                  </div>

                  <div className={styles.fileActions}>
                    {uploadedFile.status === 'success' && (
                      <Icon
                        name="status-check"
                        size="small"
                        className={styles.statusIcon}
                        style={{ color: 'var(--ink-green-60)' }}
                      />
                    )}
                    {uploadedFile.status === 'error' && (
                      <Icon
                        name="status-error"
                        size="small"
                        className={styles.statusIcon}
                        style={{ color: 'var(--ink-red-60)' }}
                      />
                    )}
                    <IconButton
                      icon="close"
                      size="small"
                      variant="tertiary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile(uploadedFile.id);
                      }}
                      aria-label="Remove file"
                      className={styles.removeButton}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
);

FileUpload.displayName = 'InkFileUpload';

export { FileUpload };
