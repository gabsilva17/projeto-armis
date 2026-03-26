export const IMAGE_UPLOAD_CONFIG = {
  quality: 0.85,
  base64: true,
  mediaTypes: 'images',
} as const;

export const IMAGE_PICKER_SHEET = {
  options: ['Cancel', 'Take Photo', 'Choose from Library', 'Choose PDF'] as const,
  cancelButtonIndex: 0,
} as const;

export const DOCUMENT_PICKER_CONFIG = {
  type: ['application/pdf'],
  copyToCacheDirectory: true,
} as const;
