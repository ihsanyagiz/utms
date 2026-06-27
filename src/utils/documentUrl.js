export function getDocumentUrl(filePath) {
  if (!filePath) return '#';
  if (/^https?:\/\//i.test(filePath)) return filePath;
  if (filePath.startsWith('/')) return filePath;
  return `/${filePath}`;
}
