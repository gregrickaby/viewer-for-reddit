/* eslint-disable @next/next/no-img-element -- a Reddit-hosted avatar; see components/media/post-media.tsx */
import { SubscribeButton } from '@/components/islands/subscribe-button'
import { absoluteTime, compactNumber } from '@/lib/format'
import type { ProfileView } from '@/lib/view-models'

import styles from './profile-header.module.css'

const cakeDay = new Intl.DateTimeFormat('en', { dateStyle: 'long', timeZone: 'UTC' })

/**
 * Avatar, karma, cake day, and Follow. A suspended account
 * gets a plain explanation instead.
 */
export function ProfileHeader({
  profile,
  viewer,
}: {
  profile: ProfileView
  viewer: string | null
}) {
  if (profile.kind === 'suspended') {
    return (
      <header className={styles.root}>
        <h1 className={styles.name}>u/{profile.name}</h1>
        <p className={styles.suspended}>This account has been suspended by Reddit.</p>
      </header>
    )
  }

  const { user } = profile
  const isMe = viewer?.toLowerCase() === user.name.toLowerCase()
  return (
    <header className={styles.root}>
      <div className={styles.identity}>
        {user.icon ? (
          <img alt="" className={styles.avatar} height={72} src={user.icon} width={72} />
        ) : (
          <span aria-hidden="true" className={styles.avatarFallback}>
            {user.name.slice(0, 1).toUpperCase()}
          </span>
        )}
        <div className={styles.names}>
          <h1 className={styles.name}>u/{user.name}</h1>
          <p className={styles.meta}>
            <span>{compactNumber(user.karma.total)} karma</span>
            <span title={absoluteTime(user.createdUtc)}>
              Cake day {cakeDay.format(user.createdUtc * 1000)}
            </span>
            {user.nsfw ? <span className={styles.nsfw}>NSFW</span> : null}
          </p>
        </div>
        {isMe ? null : (
          <SubscribeButton
            key={String(user.followed)}
            kind="user"
            name={user.name}
            subscribed={user.followed}
          />
        )}
      </div>
      {user.bio ? <p className={styles.bio}>{user.bio}</p> : null}
    </header>
  )
}

export function ProfileHeaderSkeleton() {
  return (
    <div aria-busy="true" className={styles.root}>
      <span className="visually-hidden">Loading profile…</span>
      <div aria-hidden="true" className={styles.identity}>
        <span className={`skeleton ${styles.avatarFallback}`} />
        <div className={styles.names}>
          <span className={`skeleton ${styles.nameSkeleton}`} />
          <span className={`skeleton ${styles.metaSkeleton}`} />
        </div>
      </div>
    </div>
  )
}
