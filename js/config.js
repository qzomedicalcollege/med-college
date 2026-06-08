export const SUPABASE_URL = 'https://wfxldgdfxilqtmgezlwf.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_-B-7IqrYeYBPS7V8GK1cuw_yMos3zqe';
export const STORAGE_BUCKET = 'college-files';

export const SECTIONS = {
  news: 'Новости',
  about: 'О колледже',
  students: 'Студентам'
};

export const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain'
]);

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
export const MAX_FILES_PER_POST = 8;
