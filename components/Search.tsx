import {useState} from 'react'
import Results from './Results'

/**
 * Search component.
 */
export default function Search() {
  const [inputValue, setValue] = useState('itookapicture')
  const [sort, setSort] = useState('hot')
  const [subreddit, setSubreddit] = useState(inputValue)
  const [toggleHelp, setToggleHelp] = useState(false)

  function helpToggler() {
    setToggleHelp((prev) => !prev)
  }

  function handleSearch(event) {
    event.preventDefault()
    setSubreddit(inputValue)
  }

  function handleSort(event) {
    event.preventDefault()
    setSort(event.target.value)
  }

  return (
    <>
      <form onSubmit={handleSearch}>
        <div>
          <span>r/</span>
          <input
            autoCapitalize="none"
            id="search"
            minLength={2}
            onChange={(e) => setValue(e.target.value.trim())}
            pattern="^[^~`^<>]+$"
            placeholder="pics"
            type="text"
            value={inputValue}
          />
          <select id="search" name="search" onChange={handleSort} value={sort}>
            <option value="hot">hot</option>
            <option value="top">top</option>
            <option value="new">new</option>
            <option value="best">best</option>
            <option value="rising">rising</option>
          </select>
          <button>Search</button>
        </div>
        <label htmlFor="search">
          Type the name of a subreddit and press enter.{' '}
          <button onClick={helpToggler}>
            Help <span>&#9662;</span>
          </button>
          {toggleHelp && (
            <p>
              You can also combine subreddits. For example:{' '}
              <span>all+popular+funny+aww+pics</span>
            </p>
          )}
        </label>
      </form>
      <main>
        <Results subreddit={subreddit} sortBy={sort} />
      </main>
    </>
  )
}
