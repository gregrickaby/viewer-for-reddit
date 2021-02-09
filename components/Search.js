import {useState} from 'react'
import Results from './Results'

export default function Search() {
  const [inputValue, setValue] = useState('itookapicture')
  const [subreddit, setSubreddit] = useState(inputValue)
  const [toggleHelp, setToggleHelp] = useState(false)

  function helpToggler() {
    setToggleHelp((prev) => !prev)
  }

  function handleSearch(event) {
    event.preventDefault()
    setSubreddit(inputValue)
  }

  return (
    <>
      <form className="text-lg m-auto text-center" onSubmit={handleSearch}>
        <div className="flex">
          <span className="mr-1 self-center">r/</span>
          <input
            autoCapitalize="none"
            className="border w-full p-2"
            id="search"
            minLength="2"
            onChange={(e) => setValue(e.target.value.trim())}
            pattern="^[^~`^<>]+$"
            placeholder="itookapicture"
            type="text"
            value={inputValue}
          />
          <button className="border py-2 px-4 ml-1">Search</button>
        </div>
        <label htmlFor="search" className="text-sm italic">
          Type the name of a subreddit and press enter.{' '}
          <button onClick={helpToggler}>
            Help <span className="text-lg leading-none">&#9662;</span>
          </button>
          {toggleHelp && (
            <p className="not-italic text-md mt-2">
              You can also combine subreddits. For example:{' '}
              <span className="font-mono tracking-wide">
                all+popular+funny+aww+pics
              </span>
            </p>
          )}
        </label>
      </form>
      <Results subreddit={subreddit} />
    </>
  )
}
