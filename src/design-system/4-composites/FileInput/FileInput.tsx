import React, { useRef, useState } from 'react';
import styles from './FileInput.module.css';
import { Icon } from '../../3-primitives/Icon';
import { IconButton } from '../../3-primitives/IconButton';

export interface FileInputFile {
  file: File;
  id: string;
}

export interface FileInputProps {
  label: string;
  hideLabel?: boolean;
  description?: string;
  error?: string;
  value: FileInputFile[];
  onChange: (files: FileInputFile[]) => void;
  accept?: string; // e.g., ".pdf,.doc,.docx" or "image/*"
  multiple?: boolean;
  maxSize?: number; // in bytes
  disabled?: boolean;
  required?: boolean;
  id?: string;
  width?: string;
}

export const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(
  (
    {
      label,
      hideLabel = false,
      description,
      error,
      value,
      onChange,
      accept,
      multiple = false,
      maxSize,
      disabled = false,
      required = false,
      id,
      width,
    },
    ref
  ) => {
    const generatedId = React.useId();
    const fileInputId = id || generatedId;
    const errorId = `${fileInputId}-error`;
    const descriptionId = `${fileInputId}-description`;

    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const dragCounter = useRef(0);

    // Merge refs
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
      const fileArray = Array.from(newFiles);

      if (!multiple && fileArray.length > 1) {
        return;
      }

      const validFiles: File[] = [];

      for (const file of fileArray) {
        const validationError = validateFile(file);
        if (validationError) {
          // Validation error will be shown in error prop from parent
          return;
        }
        validFiles.push(file);
      }

      const fileInputFiles: FileInputFile[] = validFiles.map((file) => ({
        file,
        id: `${file.name}-${Date.now()}-${Math.random()}`,
      }));

      const newFilesList = multiple ? [...value, ...fileInputFiles] : fileInputFiles;
      onChange(newFilesList);
    };

    const handleRemoveFile = (fileId: string) => {
      const newFiles = value.filter((f) => f.id !== fileId);
      onChange(newFiles);
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

    const getFileIcon = (file: File): 'document' | 'image' | 'file-text' => {
      if (file.type.startsWith('image/')) {
        return 'image';
      }
      if (
        file.type.includes('pdf') ||
        file.type.includes('word') ||
        file.type.includes('document')
      ) {
        return 'document';
      }
      return 'file-text';
    };

    const ariaDescribedBy = [error ? errorId : null, description ? descriptionId : null]
      .filter(Boolean)
      .join(' ');

    return (
      <div data-ink-component="FileInput" className={styles.wrapper} style={{ width }}>
        <label
          htmlFor={fileInputId}
          className={`${styles.label} ${hideLabel ? styles.visuallyHidden : ''} ${
            disabled ? styles.labelDisabled : ''
          }`}
        >
          {label}
          {required && <span className={styles.required}> *</span>}
        </label>

        {description && !error && (
          <div id={descriptionId} className={styles.description}>
            {description}
          </div>
        )}

        <div
          className={`${styles.dropzone} ${isDragging ? styles.dragging : ''} ${
            disabled ? styles.disabled : ''
          } ${error ? styles.error : ''}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleClick}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-describedby={ariaDescribedBy || undefined}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
              e.preventDefault();
              handleClick();
            }
          }}
        >
          <input
            ref={inputRef}
            id={fileInputId}
            type="file"
            className={styles.input}
            onChange={handleInputChange}
            accept={accept}
            multiple={multiple}
            disabled={disabled}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-required={required || undefined}
          />

          <div className={styles.dropzoneContent}>
            <Icon name="upload" size={32} className={styles.uploadIcon} />
            <div className={styles.dropzoneText}>
              Click to upload or drag and drop
            </div>
            <div className={styles.dropzoneHelper}>
              {accept
                ? `Accepted formats: ${accept}`
                : 'All file types accepted'}
              {maxSize && ` • Max file size: ${formatFileSize(maxSize)}`}
            </div>
          </div>
        </div>

        {error && (
          <div id={errorId} className={styles.errorMessage}>
            <span className={styles.errorIcon}>
              <Icon name="status-error" size="small" />
            </span>
            <span>{error}</span>
          </div>
        )}

        {value.length > 0 && (
          <div className={styles.fileList}>
            {value.map((fileInputFile) => {
              const iconName = getFileIcon(fileInputFile.file);

              return (
                <div key={fileInputFile.id} className={styles.fileItem}>
                  <div className={styles.filePreview}>
                    <Icon name={iconName} size="medium" className={styles.fileIcon} />
                  </div>

                  <div className={styles.fileInfo}>
                    <div className={styles.fileName}>{fileInputFile.file.name}</div>
                    <div className={styles.fileSize}>
                      {formatFileSize(fileInputFile.file.size)}
                    </div>
                  </div>

                  <IconButton
                    icon="close"
                    size="small"
                    variant="tertiary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile(fileInputFile.id);
                    }}
                    aria-label={`Remove ${fileInputFile.file.name}`}
                    disabled={disabled}
                    className={styles.removeButton}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
);

FileInput.displayName = 'InkFileInput';
