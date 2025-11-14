import type { MediaItem } from '../types';

/**
 * Sample Media Data for POC Testing
 *
 * Contains mix of images and videos:
 * - 3 images (portrait + landscape)
 * - 2 videos (Big Buck Bunny, Elephant's Dream)
 */
export const sampleMedia: MediaItem[] = [
  {
    id: '1',
    type: 'image',
    url: 'https://picsum.photos/1080/1920?random=1',
    thumbnail: 'https://picsum.photos/200/300?random=1',
  },
  {
    id: '2',
    type: 'video',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnail: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
  },
  {
    id: '3',
    type: 'image',
    url: 'https://picsum.photos/1920/1080?random=2',
    thumbnail: 'https://picsum.photos/300/200?random=2',
  },
  {
    id: '4',
    type: 'video',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnail: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg',
  },
  {
    id: '5',
    type: 'image',
    url: 'https://picsum.photos/1080/1920?random=3',
    thumbnail: 'https://picsum.photos/200/300?random=3',
  },
];
