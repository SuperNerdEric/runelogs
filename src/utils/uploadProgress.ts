export const UPLOAD_FILE_OVERALL_WEIGHT = 35;
export const PARSE_OVERALL_WEIGHT = 65;

export function combineOverallUploadProgress(
  uploadPercent: number,
  parsePercent: number | null,
): number {
  const uploadSlice =
    (Math.min(100, Math.max(0, uploadPercent)) / 100) *
    UPLOAD_FILE_OVERALL_WEIGHT;
  if (parsePercent === null) {
    return uploadSlice;
  }
  const parseSlice =
    (Math.min(100, Math.max(0, parsePercent)) / 100) * PARSE_OVERALL_WEIGHT;
  return uploadSlice + parseSlice;
}
