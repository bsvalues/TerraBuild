import React from 'react';
import { 
  File, 
  FileText, 
  FileCode, 
  FileSpreadsheet, 
  FileImage, 
  FileArchive, 
  FileAudio, 
  FileVideo, 
  Database, 
  FilePen, 
  FileJson,
  Folder
} from 'lucide-react';

interface FileTypeIconProps {
  filename: string;
  type: 'file' | 'directory';
  className?: string;
}

const FileTypeIcon: React.FC<FileTypeIconProps> = ({ 
  filename, 
  type, 
  className = "h-4 w-4" 
}) => {
  if (type === 'directory') {
    return <Folder className={className} />;
  }
  
  // Extract file extension
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  
  // Map extensions to icons
  switch (extension) {
    // Text files
    case 'txt':
    case 'log':
    case 'md':
    case 'rtf':
      return <FileText className={className} />;
      
    // Code files
    case 'js':
    case 'ts':
    case 'jsx':
    case 'tsx':
    case 'css':
    case 'html':
    case 'xml':
    case 'py':
    case 'java':
    case 'c':
    case 'cpp':
    case 'h':
    case 'cs':
    case 'php':
    case 'rb':
    case 'go':
    case 'rs':
    case 'swift':
    case 'kt':
      return <FileCode className={className} />;
      
    // Spreadsheet files
    case 'csv':
    case 'xlsx':
    case 'xls':
    case 'ods':
      return <FileSpreadsheet className={className} />;
      
    // Image files
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
    case 'svg':
    case 'webp':
    case 'tiff':
    case 'ico':
      return <FileImage className={className} />;
      
    // Archive files
    case 'zip':
    case 'rar':
    case 'tar':
    case 'gz':
    case '7z':
    case 'bz2':
      return <FileArchive className={className} />;
      
    // Audio files
    case 'mp3':
    case 'wav':
    case 'ogg':
    case 'flac':
    case 'm4a':
      return <FileAudio className={className} />;
      
    // Video files
    case 'mp4':
    case 'avi':
    case 'mov':
    case 'wmv':
    case 'mkv':
    case 'webm':
      return <FileVideo className={className} />;
      
    // Database files
    case 'db':
    case 'sqlite':
    case 'sql':
      return <Database className={className} />;
      
    // Document files
    case 'doc':
    case 'docx':
    case 'pdf':
    case 'odt':
      return <FilePen className={className} />;
      
    // JSON files
    case 'json':
      return <FileJson className={className} />;
      
    // Default for other file types
    default:
      return <File className={className} />;
  }
};

export default FileTypeIcon;