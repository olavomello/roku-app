import { FeedData } from '../types';

export const SAMPLE_FEED_DATA: FeedData = {
  providerName: 'Personal TV',
  lastUpdated: new Date().toISOString(),
  language: 'en-US',
  categories: ['All', 'Animation', 'Documentary', 'Short Films', 'Nature', 'Sci-Fi'],
  videos: [
    {
      id: '1',
      title: 'Big Buck Bunny',
      description: 'A large and lovable rabbit deals with three mischievous rodents in a peaceful forest landscape. An open-source classic created by the Blender Foundation.',
      thumbnail: 'https://images.unsplash.com/photo-1574063413132-355dbfd83e0c?q=80&w=800&auto=format&fit=crop',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      duration: 596,
      category: 'Animation',
      releaseDate: '2008',
      rating: 'G',
      artist: 'Blender Foundation'
    },
    {
      id: '2',
      title: 'Elephant\'s Dream',
      description: 'Proog and Emo explore a strange mechanical world inside a giant living clockwork structure in this pioneering open-source 3D animated short film.',
      thumbnail: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?q=80&w=800&auto=format&fit=crop',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      duration: 653,
      category: 'Animation',
      releaseDate: '2006',
      rating: 'PG',
      artist: 'Orange Open Movie Project'
    },
    {
      id: '3',
      title: 'For Bigger Blazes',
      description: 'Experience stunning high-speed cinematography capturing breathtaking wildfire containment tactics, aerial fire suppression, and heroic team efforts.',
      thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      duration: 15,
      category: 'Documentary',
      releaseDate: '2023',
      rating: 'G',
      artist: 'Google Sample Showcase'
    },
    {
      id: '4',
      title: 'Tears of Steel',
      description: 'Set in a dystopian future Amsterdam, a group of scientists and soldiers attempt to save the world from an invading horde of rogue robotics.',
      thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800&auto=format&fit=crop',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      duration: 734,
      category: 'Sci-Fi',
      releaseDate: '2012',
      rating: 'PG-13',
      artist: 'Mango Open Movie Team'
    },
    {
      id: '5',
      title: 'Sintel',
      description: 'A lonely young woman named Sintel searches for a lost baby dragon that she befriended, embarking on a perilous quest across snowy mountains and desolate lands.',
      thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
      duration: 888,
      category: 'Animation',
      releaseDate: '2010',
      rating: 'PG',
      artist: 'Durian Open Movie Team'
    },
    {
      id: '6',
      title: 'Sublime Coastal Views',
      description: 'Ultra HD aerial drone footage exploring rugged ocean cliffs, emerald coastal waters, and soothing tide sounds across pristine northern beaches.',
      thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      duration: 15,
      category: 'Nature',
      releaseDate: '2024',
      rating: 'G',
      artist: 'Nature Stream'
    },
    {
      id: '7',
      title: 'For Bigger Fun',
      description: 'Dynamic Chromecast demo reel showcasing vibrant high-definition digital playback and smooth UI animation sequences.',
      thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=800&auto=format&fit=crop',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      duration: 60,
      category: 'Short Films',
      releaseDate: '2022',
      rating: 'G',
      artist: 'Cast Showcase'
    },
    {
      id: '8',
      title: 'We Are Going On Bullrun',
      description: 'An adrenaline-fueled automotive documentary capturing high-performance endurance road rallies and supercar culture across continental highways.',
      thumbnail: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=800&auto=format&fit=crop',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
      duration: 47,
      category: 'Documentary',
      releaseDate: '2021',
      rating: 'PG',
      artist: 'Supercar Journal'
    }
  ]
};
