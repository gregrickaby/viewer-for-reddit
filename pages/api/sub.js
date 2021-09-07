import reddit from 'lib/reddit'
import filterTextPosts from '@/functions/filterTextPosts'

/**
 *
 * @param {*} req
 * @param {*} res
 * @returns
 */
export default function sub(req, res) {
  const {name} = req.query

  try {
    if (!name) {
      return res.status(400).send({
        error:
          'Please send a subreddit name in your request. /api/sub?name=pics'
      })
    }

    return reddit
      .getSubreddit(name)
      .getHot()
      .then((response) => res.status(200).json(filterTextPosts(response)))
      .catch((error) => res.status(400).send(error))
  } catch (err) {
    // Issue? Leave a message and bail.
    res.status(500).json({message: err.message})
  }
}
