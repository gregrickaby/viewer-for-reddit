import {createStyles, Skeleton} from '@mantine/core'
import {useViewportSize} from '@mantine/hooks'

const useStyles = createStyles((theme) => ({
  wrapper: {
    alignItems: 'start',
    display: 'grid',
    gridGap: theme.spacing.md,
    gridTemplateColumns: `repeat(auto-fit, 373px)`,
    justifyContent: 'center'
  }
}))

/**
 * Skeleton wrapper component.
 */
export default function SkeletonWrapper() {
  const {classes} = useStyles()
  const {width} = useViewportSize()

  // For tablet and above, show 6 skeletons in a grid.
  if (width > 768) {
    return (
      <div className={classes.wrapper}>
        <Skeleton height={490} radius={0} width={368} />
        <Skeleton height={490} radius={0} width={368} />
        <Skeleton height={490} radius={0} width={368} />
        <Skeleton height={490} radius={0} width={368} />
        <Skeleton height={490} radius={0} width={368} />
        <Skeleton height={490} radius={0} width={368} />
      </div>
    )
  }

  // For mobile, show 2 skeletons without a grid.
  return (
    <>
      <Skeleton height={490} radius={0} width={342} />
      <Skeleton height={490} radius={0} width={342} />
    </>
  )
}
