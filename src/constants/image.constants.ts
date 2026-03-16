export const IMAGE_UPLOAD_CONFIG = {
  quality: 0.85,
  base64: true,
  mediaTypes: 'images',
} as const;

export const IMAGE_PICKER_SHEET = {
  options: ['Cancel', 'Take Photo', 'Choose from Library'] as const,
  cancelButtonIndex: 0,
} as const;
