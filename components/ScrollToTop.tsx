import { Button, createStyles } from '@mantine/core';
import { useWindowScroll } from '@mantine/hooks';
import { MdArrowUpward } from 'react-icons/md';

const useStyles = createStyles(() => ({
  scrollToTop: {
    bottom: '24px',
    position: 'fixed',
    right: '24px',
  },
}));

/**
 * ScrollToTop component.
 */
export default function ScrollToTop() {
  const [scroll, scrollTo] = useWindowScroll();
  const { classes } = useStyles();

  return (
    <>
      {scroll && scroll.y > 200 && (
        <div className={classes.scrollToTop}>
          <Button onClick={() => scrollTo({ y: 0 })}>
            <MdArrowUpward /> Scroll to top
          </Button>
        </div>
      )}
    </>
  );
}
