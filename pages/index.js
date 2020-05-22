import { useForm, useFetch } from "../lib/hooks";
import Card from "../components/Card";

const Homepage = () => {
  const [values, handleChange] = useForm({
    subreddit: "apple",
  });

  const [isLoading, { data }] = useFetch(
    `https://www.reddit.com/r/${values.subreddit}/.json`
  );

  let content = <p>Loading Subreddit...</p>;

  if (!isLoading) {
    content = (
      <div className="App">
        <div className="search">
          <p>Enter the name of a subreddit, e.g., "apple"</p>
          <input
            type="text"
            name="subreddit"
            value={values.subreddit}
            onChange={handleChange}
          />
        </div>

        <div className="display">
          {data.children.map((post, index) => (
            <Card key={index} data={post} />
          ))}
        </div>
      </div>
    );
  }

  return content;
};

export default Homepage;
