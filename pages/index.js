import {useFetch, useForm} from '@/lib/hooks'
import Card from '@/components/Card'

const Homepage = () => {
  const [values, handleChange] = useForm({
    subreddit: 'apple'
  })
  const [isLoading, {data}] = useFetch(
    `https://www.reddit.com/r/${values.subreddit}/top/.json?limit=10`
  )

  let content = <p>Loading Subreddit...</p>

  if (!isLoading) {
    content = (
      <div className="flex space-x-8">
        <div className="text-lg w-1/4 min-h-screen relative">
          <div className="sticky">
            <p>Enter the name of a subreddit, e.g., apple</p>
            <input
              className="border-solid border-2 border-gray-600 p-2"
              type="text"
              name="subreddit"
              value={values.subreddit}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="display">
          {data.children.map((post, index) => (
            <Card key={index} data={post} />
          ))}
        </div>
      </div>
    )
  }

  return content
}

export default Homepage
