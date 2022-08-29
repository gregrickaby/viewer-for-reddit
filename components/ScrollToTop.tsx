import { Button } from '@mantine/core';
import { useWindowScroll } from '@mantine/hooks';
import { MdArrowUpward } from 'react-icons/md';

/**
 * ScrollToTop component.
 */
export default function ScrollToTop() {
  const [scroll, scrollTo] = useWindowScroll();

  return (
    <>
      {scroll && scroll.y > 200 && (
        <div
          style={{
            bottom: '24px',
            position: 'fixed',
            right: '24px',
          }}
        >
          <Button onClick={() => scrollTo({ y: 0 })} size="md">
            <MdArrowUpward /> Scroll to top
          </Button>
        </div>
      )}
    </>
  );
}
