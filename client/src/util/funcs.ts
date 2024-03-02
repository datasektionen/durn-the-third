export function compareList<T>(a: T[], b:T[]): number {
  for (let i = 0; i <= a.length && i <= b.length; i++) {
    if (a[i] < b[i]) return -1
    if (b[i] < a[i]) return 1
  }
  return a.length - b.length
}