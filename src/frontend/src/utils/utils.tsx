import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function decodeHtml(html: string): string {
  const txt = document.createElement("textarea");
  txt.innerHTML = html.replace(/<[^>]+>/g, "");
  return txt.value;
}
