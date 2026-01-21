/**
 * User profile not found page.
 * Shown when notFound() is called from a user profile page.
 */
export default function UserNotFound() {
  return (
    <div style={{padding: '2rem', textAlign: 'center'}}>
      <h1>User not found</h1>
      <p>This user account doesn't exist or has been deleted.</p>
      <a href="/">Go Home</a>
    </div>
  )
}
