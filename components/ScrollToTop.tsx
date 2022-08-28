import { Button } from '@mantine/core';
import { useWindowScroll } from '@mantine/hooks';

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
            position: 'fixed',
            bottom: '24px',
            right: '24px',
          }}
        >
          <Button onClick={() => scrollTo({ y: 0 })}>Scroll to top</Button>
        </div>
      )}
    </>
  );
}
