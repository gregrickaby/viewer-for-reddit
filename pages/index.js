import {useFetch, useForm} from '@/lib/hooks'
import Card from '@/components/Card'

const Homepage = () => {
  const [values, handleChange] = useForm({
    subreddit: 'astrophotography'
  })
  const [isLoading, {data}] = useFetch(
    `https://www.reddit.com/r/${values.subreddit}/top/.json?limit=200&show=all`
  )

  let content = <p>Loading Subreddit...</p>

  if (!isLoading) {
    content = (
      <section className="flex space-x-8">
        <aside className="text-lg w-1/4 min-h-screen relative">
          <div className="sticky top-0">
            <h1 className="text-3xl mb-4">Reddit Viewer</h1>
            <input
              className="border-solid border-2 border-gray-600 p-2 mb-2"
              type="text"
              name="subreddit"
              value={values.subreddit}
              onChange={handleChange}
            />
            <p className="text-sm">
              <em>Enter the name of a subreddit</em>
            </p>
          </div>
        </aside>

        <main className="flex flex-wrap space-y-4">
          {data.children.map((post, index) => (
            <Card key={index} data={post} />
          ))}
        </main>
      </section>
    )
  }

  return content
}

export default Homepage
