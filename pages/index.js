import {useState, useEffect} from 'react'
import {useDebounce} from '@/lib/hooks'
import Card from '@/components/Card'

const Homepage = () => {
  const [searchTerm, setSearchTerm] = useState('astrophotography')
  const [results, setResults] = useState()
  const [loading, setLoading] = useState(true)
  const debouncedSearchTerm = useDebounce(searchTerm, 750)

  useEffect(() => {
    async function fetchData() {
      if (debouncedSearchTerm) {
        const response = await fetch(
          `https://www.reddit.com/r/${searchTerm}/.json?limit=200&show=all`
        )
        const data = await response.json()
        setResults(data)
        setLoading(false)
      } else {
        setResults('astrophotography')
      }
    }
    fetchData()
  }, [debouncedSearchTerm]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="flex space-x-8">
      <aside className="text-lg min-h-screen" style={{width: '246px'}}>
        <div className="sticky top-0">
          <h1 className="text-3xl mb-4">Reddit Viewer</h1>
          <input
            className="border-solid border-2 border-gray-600 p-2 mb-2"
            type="text"
            placeholder="astrophotography"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <p className="text-sm">
            <em>Enter the name of a subreddit</em>
          </p>
        </div>
      </aside>
      <main className="grid grid-cols-1 gap-4">
        {loading ? (
          <p>Loading sub...</p>
        ) : (
          results.data.children.map((post, index) => (
            <Card key={index} data={post} />
          ))
        )}
      </main>
    </section>
  )
}

export default Homepage
