import reddit from 'lib/reddit/connector'

export default function subreddit(req, res) {
  const subreddit = req.query.id

  if (!subreddit) {
    return res.status(400).send({
      error:
        'Please send a subreddit name in your request. /api/subreddit?id=SUBREDDIT_NAME'
    })
  }

  return reddit
    .getSubreddit(subreddit)
    .getHot()
    .then((response) => res.status(200).json(response.map((post) => post.id)))
    .catch((error) => res.status(400).send(error))
}
