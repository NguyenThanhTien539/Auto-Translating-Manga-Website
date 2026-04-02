export type MangaWorkflowStatus =
  | "draft"
  | "processing"
  | "pending_review"
  | "published"
  | "rejected"
  | "processing_failed";

const STATUS_LABELS: Record<MangaWorkflowStatus, string> = {
  draft: "Bản nháp",
  processing: "Đang xử lý",
  pending_review: "Chờ duyệt",
  published: "Đã xuất bản",
  rejected: "Bị từ chối",
  processing_failed: "Xử lý thất bại",
};

export const normalizeMangaStatus = (status?: string): MangaWorkflowStatus => {
  const value = String(status || "")
    .trim()
    .toLowerCase();

  if (value === "draft") return "draft";
  if (value === "processing") return "processing";
  if (value === "pending_review") return "pending_review";
  if (value === "published") return "published";
  if (value === "rejected") return "rejected";
  if (value === "processing_failed") return "processing_failed";

  // Backward-compat for legacy values still in old data
  if (value === "pending") return "pending_review";
  if (value === "approved") return "published";
  if (value === "ongoing") return "published";
  if (value === "completed") return "published";
  if (value === "dropped") return "rejected";
  if (value === "published") return "published";

  return "draft";
};

export const toVietnameseMangaStatus = (status?: string): string => {
  return STATUS_LABELS[normalizeMangaStatus(status)];
};

export const isPublishedMangaStatus = (status?: string): boolean => {
  return normalizeMangaStatus(status) === "published";
};
