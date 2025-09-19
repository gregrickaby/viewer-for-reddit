'use client'

import {HlsPlayer} from '@/components/HlsPlayer/HlsPlayer'
import {Settings} from '@/components/Settings/Settings'
import {StoreProvider} from '@/lib/store/StoreProvider'
import {MantineProvider} from '@mantine/core'
import {Notifications} from '@mantine/notifications'

// Test video URLs - using public test videos
const TEST_VIDEOS = [
  {
    title: 'HLS Test Video',
    src: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    fallbackUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
  },
  {
    title: 'MP4 Test Video',
    fallbackUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
  }
]

export default function VideoTestPage() {
  return (
    <StoreProvider>
      <MantineProvider>
        <Notifications />
        <div style={{padding: '20px', maxWidth: '800px', margin: '0 auto'}}>
          <h1>Audio Volume Test Page</h1>
          <p>This page demonstrates the fixed audio volume issues:</p>
          <ul>
            <li>✅ Mute button syncs correctly with Redux state</li>
            <li>✅ Volume slider is responsive on mobile devices</li>
            <li>📱 Device volume control integration</li>
          </ul>

          <div style={{position: 'fixed', top: '20px', right: '20px', zIndex: 1000}}>
            <Settings />
          </div>

          <h2>Test Instructions:</h2>
          <ol>
            <li>Toggle the global mute setting in the Settings menu (top right)</li>
            <li>Notice how the video player mute button syncs immediately</li>
            <li>Resize the browser window to test mobile responsive behavior</li>
            <li>Try adjusting volume with device controls (if available)</li>
          </ol>

          {TEST_VIDEOS.map((video, index) => (
            <div key={index} style={{marginBottom: '40px', border: '1px solid #ccc', borderRadius: '8px', padding: '20px'}}>
              <h3>{video.title}</h3>
              <div style={{backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden'}}>
                <HlsPlayer
                  src={video.src}
                  fallbackUrl={video.fallbackUrl}
                  poster="https://via.placeholder.com/800x450/000000/FFFFFF?text=Video+Player"
                  id={`test-video-${index}`}
                  dataHint="video"
                  controls={true}
                  loop={true}
                  playsInline={true}
                />
              </div>
              <p style={{fontSize: '14px', color: '#666', marginTop: '10px'}}>
                {video.src ? `HLS Source: ${video.src}` : ''}
                <br />
                Fallback: {video.fallbackUrl}
              </p>
            </div>
          ))}

          <div style={{marginTop: '40px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px'}}>
            <h3>Technical Details:</h3>
            <p><strong>Issue 1 - Mute Synchronization:</strong> Fixed by ensuring HTML muted attribute syncs with Redux state using useEffect</p>
            <p><strong>Issue 2 - Mobile Volume Slider:</strong> Added responsive CSS to minimize/hide volume slider on small screens</p>
            <p><strong>Issue 3 - Device Volume Sync:</strong> Media Chrome automatically handles volume change events from the video element</p>
          </div>
        </div>
      </MantineProvider>
    </StoreProvider>
  )
}