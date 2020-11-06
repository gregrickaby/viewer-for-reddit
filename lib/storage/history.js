const STORAGE_KEY = 'searched_history_storage'

/**
 * Get all saved search terms.
 *
 * @param {string} term  The search term.
 * @return {string}      An array of saved search terms.
 */
export function getAllSavedValue() {
  const savedHistory = window.sessionStorage.getItem(STORAGE_KEY)
  if (!savedHistory) {
    return []
  }
  return JSON.parse(savedHistory)
}

/**
 * Store a search term to history storage.
 *
 * @param {string} term The search term.
 * @return {void}
 */
export function storeValue(term) {
  const savedHistory = getAllSavedValue()
  const found = savedHistory.find((item) => item === term)
  if (!found) {
    const updatedHistoryStorage = [...savedHistory, term]
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updatedHistoryStorage)
    )
  }
}
