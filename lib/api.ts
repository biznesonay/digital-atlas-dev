export async function fetchObjectSuggestions(
  query: string,
  language = 'ru'
): Promise<string[]> {
  if (!query) return []
  try {
    const params = new URLSearchParams()
    params.set('lang', language)
    params.set('search', query)

    const res = await fetch(`/api/objects?${params.toString()}`)
    if (!res.ok) return []
    const data = await res.json()
    const names: string[] = data.data
      .map((obj: any) => obj.name)
      .filter(Boolean)
    return Array.from(new Set(names)).slice(0, 10)
  } catch (error) {
    console.error('Error fetching object suggestions:', error)
    return []
  }
}