import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | undefined | null): string {
  if (!date) return "";
  const parsedDate = typeof date === "string" ? new Date(date) : date;
  return format(parsedDate, "dd/MM/yyyy");
}