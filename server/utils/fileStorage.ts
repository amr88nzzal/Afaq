import fs from 'fs';
import path from 'path';

export interface SavedFileResult {
  fileUrl: string;
  fileName: string;
  fileSize: string;
}

/**
 * حفظ ملف الوثيقة المرفوعة على قرص السيرفر واستخراج مسار URL دائم
 */
export function saveUploadedDocument(
  appId: string | number,
  docType: string,
  originalFileName: string,
  fileData: string
): SavedFileResult {
  const cleanAppId = String(appId).replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanDocType = String(docType).replace(/[^a-zA-Z0-9_-]/g, '_');
  const ext = path.extname(originalFileName) || '.pdf';
  const baseName = path.basename(originalFileName, ext).replace(/[^a-zA-Z0-9_-]/g, '_') || 'document';
  
  const timestamp = Date.now();
  const diskFileName = `${cleanAppId}_${cleanDocType}_${timestamp}_${baseName}${ext}`;

  // تأكيد وجود المجلدات على السيرفر
  const publicUploadsDir = path.join(process.cwd(), 'public', 'uploads', 'documents');
  const rootUploadsDir = path.join(process.cwd(), 'uploads', 'documents');

  if (!fs.existsSync(publicUploadsDir)) {
    fs.mkdirSync(publicUploadsDir, { recursive: true });
  }
  if (!fs.existsSync(rootUploadsDir)) {
    fs.mkdirSync(rootUploadsDir, { recursive: true });
  }

  let buffer: Buffer;
  if (fileData && fileData.startsWith('data:')) {
    const base64Content = fileData.split(',')[1] || '';
    buffer = Buffer.from(base64Content, 'base64');
  } else if (fileData && fileData.length > 500) {
    buffer = Buffer.from(fileData, 'base64');
  } else {
    // إذا كان الرابط هو مسار قديم أو نص عادي
    return {
      fileUrl: fileData || `/uploads/documents/${diskFileName}`,
      fileName: originalFileName,
      fileSize: '1.2 MB'
    };
  }

  // كتابة الملف على القرص
  const publicFilePath = path.join(publicUploadsDir, diskFileName);
  const rootFilePath = path.join(rootUploadsDir, diskFileName);

  fs.writeFileSync(publicFilePath, buffer);
  try {
    fs.writeFileSync(rootFilePath, buffer);
  } catch (e) {}

  const sizeMB = (buffer.length / (1024 * 1024)).toFixed(2);
  const sizeKB = Math.round(buffer.length / 1024);
  const formattedSize = buffer.length >= 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`;

  return {
    fileUrl: `/uploads/documents/${diskFileName}`,
    fileName: originalFileName,
    fileSize: formattedSize,
  };
}
