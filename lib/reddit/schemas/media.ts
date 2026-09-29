import 'server-only'
import * as z from 'zod'
import {
  ImageSchema,
  MediaMetadataItemSchema,
  OembedSchema,
  PreviewSchema,
  RedditVideoSchema,
  SourceSchema,
  VariantsSchema,
} from './generated'

/*
 * Media shapes shared by links and comments. Every field here feeds media
 * detection (docs/design.md §8.7), so each one is loosened to what Reddit
 * may omit rather than what our samples happened to contain.
 */

export const ImageSource = SourceSchema

export const PreviewImage = ImageSchema.pick({ source: true, resolutions: true }).extend({
  // gif, mp4, obfuscated (pre-blurred), nsfw (pre-blurred)
  variants: VariantsSchema.optional(),
})

export const RedditVideo = RedditVideoSchema.pick({
  hls_url: true,
  fallback_url: true,
  width: true,
  height: true,
}).extend({
  dash_url: z.string().optional(),
  duration: z.number().optional(),
  is_gif: z.boolean().optional(),
  has_audio: z.boolean().optional(),
})

export const Preview = PreviewSchema.pick({
  images: true,
  reddit_video_preview: true,
  enabled: true,
}).extend({
  images: z.array(PreviewImage),
  // Reddit's own (silent) transcode of GIFs and external clips.
  reddit_video_preview: RedditVideo.optional(),
  enabled: z.boolean().optional(),
})

// `html` is deliberately not picked: oEmbed markup is never rendered (design §8.7).
export const Oembed = OembedSchema.pick({
  provider_name: true,
  title: true,
  thumbnail_url: true,
  thumbnail_width: true,
  thumbnail_height: true,
  width: true,
  height: true,
}).partial()

export const MediaObject = z.object({
  reddit_video: RedditVideo.optional(),
  type: z.string().optional(), // e.g. "youtube.com", "redgifs.com"
  oembed: Oembed.optional(),
})

/**
 * One `media_metadata` entry, keyed by media id on the parent. Only `status`
 * is guaranteed: failed and unprocessed items carry nothing else.
 */
export const MediaMetadataItem = MediaMetadataItemSchema.pick({
  status: true,
  e: true, // "Image" | "AnimatedImage" | "RedditVideo"
  m: true,
  p: true, // preview resolutions
  s: true, // source: u (image) or gif/mp4 (animated)
  o: true, // obfuscated (pre-blurred) renditions
  x: true,
  y: true,
  hlsUrl: true,
  dashUrl: true,
  isGif: true,
  id: true,
})

/** The map itself stays unparsed: a malformed entry must drop only that entry. */
export const MediaMetadata = z.record(z.string(), z.unknown())

export type RedditPreviewImage = z.infer<typeof PreviewImage>
export type RedditVideoData = z.infer<typeof RedditVideo>
export type RedditMediaMetadataItem = z.infer<typeof MediaMetadataItem>
