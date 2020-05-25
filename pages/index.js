import {useFetch, useForm} from '@/lib/hooks'
import Card from '@/components/Card'

const Homepage = () => {
  const [values, handleChange] = useForm({
    subreddit: 'astrophotography'
  })

  const [{data}, loading] = useFetch(
    `https://www.reddit.com/r/${values.subreddit}/.json?limit=200&show=all`
  )

  return (
    <section className="flex space-x-8">
      <aside className="text-lg min-h-screen" style={{width: '246px'}}>
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
      <main className="grid grid-cols-1 gap-4">
        {!loading &&
          data.children.map((post, index) => <Card key={index} data={post} />)}
      </main>
    </section>
  )
}

export default Homepage
