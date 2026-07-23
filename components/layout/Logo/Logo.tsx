import AppIcon from '@/app/icon.png'
import {AppLink} from '@/components/ui/AppLink/AppLink'
import {appConfig} from '@/lib/config/app.config'
import {Group, Title} from '@mantine/core'
import Image from 'next/image'

/** Application logo with icon and text. */
export function Logo() {
  return (
    <AppLink href="/">
      <Group gap="xs" wrap="nowrap">
        <Image
          alt={`${appConfig.site.name} Logo`}
          height={32}
          priority
          src={AppIcon}
          style={{display: 'block'}}
          width={32}
        />
        <Title order={1} size="h3" visibleFrom="sm">
          {appConfig.site.name}
        </Title>
      </Group>
    </AppLink>
  )
}
