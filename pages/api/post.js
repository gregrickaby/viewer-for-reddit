import reddit from 'lib/reddit'

/**
 *
 * @param {*} req
 * @param {*} res
 * @returns
 */
export default function sub(req, res) {
  const {id} = req.query

  console.log(id)

  try {
    if (!id) {
      return res.status(400).send({
        error: 'Please send an id in your request. /api/post?id=2np694'
      })
    }

    return reddit
      .getSubmission(id)
      .body((response) => res.status(200).json(response))
  } catch (err) {
    // Issue? Leave a message and bail.
    res.status(500).json({message: err.message})
  }
}
