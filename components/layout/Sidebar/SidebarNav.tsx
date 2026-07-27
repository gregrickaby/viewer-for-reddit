'use client'

import {CollapsibleSection} from '@/components/ui/CollapsibleSection/CollapsibleSection'
import {NavLink, Stack} from '@mantine/core'
import {
  IconBrandGithub,
  IconExternalLink,
  IconFlame,
  IconHeart,
  IconInfoCircle
} from '@tabler/icons-react'
import Link from 'next/link'
import {useState} from 'react'

interface SidebarNavProps {
  /**
   * Popular/All/Saved -- gated on auth, rendered wherever the caller wraps
   * it in `<Suspense>`. Positioned between Home and About to match the
   * pre-split link order.
   */
  personalizedLinksSlot: React.ReactNode
}

/**
 * The sidebar's "Navigation" section. Fully static (no data dependency), so
 * it renders immediately -- the personalized feed links (Popular/All/Saved)
 * are the only part that defers, via the slot the caller supplies.
 */
export function SidebarNav({personalizedLinksSlot}: Readonly<SidebarNavProps>) {
  const [navigationOpen, setNavigationOpen] = useState(true)

  return (
    <CollapsibleSection
      title="Navigation"
      isOpen={navigationOpen}
      onToggle={setNavigationOpen}
    >
      <Stack gap={4}>
        <NavLink
          component={Link}
          href="/"
          label="Home"
          leftSection={<IconFlame size={16} />}
          data-testid="sidebar-home-link"
        />
        {personalizedLinksSlot}
        <NavLink
          component={Link}
          href="/about"
          label="About"
          leftSection={<IconInfoCircle size={16} />}
        />
        <NavLink
          component={Link}
          href="/donate"
          label="Donate"
          leftSection={<IconHeart size={16} />}
        />
        <NavLink
          component="a"
          href="https://github.com/gregrickaby/viewer-for-reddit"
          label="GitHub"
          leftSection={<IconBrandGithub size={16} />}
          rightSection={<IconExternalLink size={14} />}
          target="_blank"
          rel="noopener noreferrer"
        />
      </Stack>
    </CollapsibleSection>
  )
}
