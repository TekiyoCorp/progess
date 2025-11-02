import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { differenceInDays, endOfMonth, format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date utilities
export function getDaysRemainingInMonth(): number {
  const now = new Date()
  const endOfCurrentMonth = endOfMonth(now)
  return differenceInDays(endOfCurrentMonth, now)
}

export function getCurrentMonth(): number {
  return new Date().getMonth() + 1 // 1-12
}

export function getCurrentYear(): number {
  return new Date().getFullYear()
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'dd MMM yyyy')
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'dd MMM yyyy HH:mm')
}

// Format utilities
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatPercentage(percentage: number): string {
  return `${percentage.toFixed(1)}%`
}

// Task icon mapping
export function getTaskIcon(type: string): string {
  const icons: Record<string, string> = {
    call: '📞',
    design: '🎨',
    video: '🎬',
    email: '✉️',
    other: '📌',
  }
  return icons[type] || icons.other
}

// LocalStorage utilities (fallback when Supabase is unavailable)
export function saveToLocalStorage<T>(key: string, data: T): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  }
}

export function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window !== 'undefined') {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error('Error loading from localStorage:', error)
      return defaultValue
    }
  }
  return defaultValue
}

export function removeFromLocalStorage(key: string): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('Error removing from localStorage:', error)
    }
  }
}

// Progress calculation
export function calculateTotalProgress(tasks: Array<{ completed: boolean; percentage: number }>): number {
  return tasks
    .filter(task => task.completed)
    .reduce((sum, task) => sum + task.percentage, 0)
}

// Amount estimation based on percentage (rough calculation)
export function estimateAmount(percentage: number, monthlyGoal: number = 50000): number {
  return (percentage / 100) * monthlyGoal
}
