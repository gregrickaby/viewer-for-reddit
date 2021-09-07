export default function filterTextPosts(response) {
  // Filter out any self or stickied posts.
  return response.filter((post) => {
    return post.post_hint && post.post_hint !== 'self' && post.stickied !== true
  })
}
