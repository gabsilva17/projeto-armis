export const IMAGE_UPLOAD_CONFIG = {
  quality: 0.85,
  base64: true,
  mediaTypes: 'images',
} as const;

export const DOCUMENT_PICKER_CONFIG = {
  type: ['application/pdf'],
  copyToCacheDirectory: true,
} as const;
