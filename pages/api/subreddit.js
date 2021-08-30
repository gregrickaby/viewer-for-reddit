import reddit from 'lib/reddit'

export default function subreddit(req, res) {
  // Destructure the request.
  const {name} = req.query

  try {
    if (!name) {
      return res.status(400).send({
        error:
          'Please send a subreddit name in your request. /api/subreddit?name=pics'
      })
    }

    return reddit
      .getSubreddit(name)
      .getHot()
      .then((response) => res.status(200).json(response))
      .catch((error) => res.status(400).send(error))
  } catch (err) {
    // Issue? Leave a message and bail.
    res.status(500).json({message: err.message})
  }
}
