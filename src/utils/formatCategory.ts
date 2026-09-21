export function formatCategory(category: string): string {
  const labels: Record<string, string> = {
    landmark: 'Landemerke',
    museum: 'Museum',
    church: 'Kirke',
    food: 'Mat og drikke',
    park: 'Park',
  };

  return labels[category] ?? category;
}
