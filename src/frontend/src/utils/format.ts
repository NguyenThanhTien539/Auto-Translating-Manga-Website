export function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes} - ${day}/${month}/${year}`;
}

export function getInitials(name: string) {
  if (!name) return "U";
  const words = name.trim().split(" ");
  if (words.length === 1) {
    return words[0][0].toUpperCase();
  }
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}


export function formatPrice(price: number) {
  return `${Number(price).toLocaleString("vi-VN")} VND`;
}