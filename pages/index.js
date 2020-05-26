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
    <section className="content">
      <aside className="sidebar">
        <header className="header">
          <h1 className="title">Reddit Viewer</h1>
          <input
            className="search-bar"
            type="text"
            placeholder="astrophotography"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <p className="description">
            <em>Enter the name of a subreddit</em>
          </p>
        </header>
      </aside>
      <main className="main">
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
