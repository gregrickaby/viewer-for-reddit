import {createStyles, Skeleton} from '@mantine/core'

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

  return (
    <div className={classes.wrapper}>
      <Skeleton height={373} width={373} />
      <Skeleton height={373} width={373} />
      <Skeleton height={373} width={373} />
      <Skeleton height={373} width={373} />
      <Skeleton height={373} width={373} />
      <Skeleton height={373} width={373} />
      <Skeleton height={373} width={373} />
      <Skeleton height={373} width={373} />
      <Skeleton height={373} width={373} />
      <Skeleton height={373} width={373} />
      <Skeleton height={373} width={373} />
      <Skeleton height={373} width={373} />
      <Skeleton height={373} width={373} />
      <Skeleton height={373} width={373} />
      <Skeleton height={373} width={373} />
      <Skeleton height={373} width={373} />
      <Skeleton height={373} width={373} />
      <Skeleton height={373} width={373} />
      <Skeleton height={373} width={373} />
      <Skeleton height={373} width={373} />
      <Skeleton height={373} width={373} />
      <Skeleton height={373} width={373} />
      <Skeleton height={373} width={373} />
      <Skeleton height={373} width={373} />
    </div>
  )
}
