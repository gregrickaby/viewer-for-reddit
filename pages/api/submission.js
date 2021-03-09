import reddit from 'lib/reddit/connector'

export default function submission(req, res) {
  const submission = req.query.id

  if (!submission) {
    return res.status(400).send({
      error:
        'Please send a submission in your request. /api/submission?id=2np694'
    })
  }

  return reddit
    .getSubmission(submission)
    .fetch()
    .then((response) =>
      res.status(200).json({
        author: response.author.name,
        comments: response.num_comments,
        hint: response.post_hint,
        image: response.preview.images[0].source,
        title: response.title,
        ups: response.ups,
        url: response.url,
        permalink: response.permalink,
        video: response.preview.reddit_video_preview
      })
    )
    .catch((error) => res.status(400).send(error))
}
