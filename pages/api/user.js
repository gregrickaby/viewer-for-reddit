import reddit from '@/api/connector'

export default function user(req, res) {
  const user = req.query.id

  if (!user) {
    return res.status(400).send({
      error: 'Please send a user in your request. /api/user?id=USERNAME'
    })
  }

  return reddit
    .getUser(user)
    .fetch()
    .then((response) => res.status(200).json(response))
    .catch((error) => res.status(400).send(error))
}
