import { FeedData } from '../types';

export const SAMPLE_FEED_DATA: FeedData = {
  providerName: 'Personal TV',
  lastUpdated: new Date().toISOString(),
  language: 'en-US',
  categories: ['All', 'Horror', 'Sci-Fi', 'Comedy', 'Classic', 'Drama', 'Romance'],
  videos: [
    {
      id: '1',
      title: 'Nosferatu (1922)',
      description: 'An unauthorized adaptation of Dracula, this German Expressionist masterpiece follows Count Orlok as he terrorizes a young couple and their Transylvanian village. Directed by F.W. Murnau.',
      thumbnail: 'https://archive.org/services/img/nosferatu-1922',
      url: 'https://archive.org/download/nosferatu-1922/Nosferatu%20(1922).mp4',
      duration: 5658,
      category: 'Horror',
      releaseDate: '1922',
      rating: 'NR',
      artist: 'F.W. Murnau'
    },
    {
      id: '2',
      title: 'Sherlock Jr. (1924)',
      description: 'A film projectionist who longs to be a detective falls asleep on the job and dreams himself into the movie on screen. Buster Keaton\'s inventive comedy is a meditation on cinema itself.',
      thumbnail: 'https://archive.org/services/img/sherlockjr1924_201909',
      url: 'https://archive.org/download/sherlockjr1924_201909/Sherlock%20Jr.%20-%20Buster%20Keaton%20(1924)%20HD%20%5B720p%5D.mp4',
      duration: 2674,
      category: 'Comedy',
      releaseDate: '1924',
      rating: 'NR',
      artist: 'Buster Keaton'
    },
    {
      id: '3',
      title: 'Battleship Potemkin (1925)',
      description: 'Sergei Eisenstein\'s revolutionary silent film depicts the 1905 mutiny aboard the Russian battleship Potemkin and the brutal suppression of civilians on the Odessa Steps. A landmark of world cinema.',
      thumbnail: 'https://archive.org/services/img/BattleshipPotemkin',
      url: 'https://archive.org/download/BattleshipPotemkin/Battleship_Potemkin_512kb.mp4',
      duration: 4381,
      category: 'Drama',
      releaseDate: '1925',
      rating: 'NR',
      artist: 'Sergei Eisenstein'
    },
    {
      id: '4',
      title: 'The General (1926)',
      description: 'Confederate train engineer Johnnie Gray pursues Union spies who have stolen his beloved locomotive during the Civil War. Buster Keaton\'s comedic masterpiece with incredible practical stunts.',
      thumbnail: 'https://archive.org/services/img/TheGeneral_201312',
      url: 'https://archive.org/download/TheGeneral_201312/The-General-v2.mp4',
      duration: 4714,
      category: 'Comedy',
      releaseDate: '1926',
      rating: 'NR',
      artist: 'Buster Keaton'
    },
    {
      id: '5',
      title: 'Metropolis (1927)',
      description: 'In a dystopian future city, the son of a wealthy industrialist falls in love with a working-class prophet who advocates for the rights of the oppressed. Fritz Lang\'s landmark science fiction epic.',
      thumbnail: 'https://archive.org/services/img/Metropolis1927EnglishVersion',
      url: 'https://archive.org/download/Metropolis1927EnglishVersion/Metropolis_1927_English_Version.mp4',
      duration: 7117,
      category: 'Sci-Fi',
      releaseDate: '1927',
      rating: 'NR',
      artist: 'Fritz Lang'
    },
    {
      id: '6',
      title: 'Safety Last! (1923)',
      description: 'A small-town boy moves to the big city and, desperate to impress his girlfriend, promises to arrange a spectacular publicity stunt — leading to the most iconic building-climbing sequence in cinema history.',
      thumbnail: 'https://archive.org/services/img/SafetyLastHaroldLloyd1923.FullMovieexcellentQuality.',
      url: 'https://archive.org/download/SafetyLastHaroldLloyd1923.FullMovieexcellentQuality./Safety%20Last%20-%20Harold%20Lloyd%201923.%20Full%20movie%2Cexcellent%20quality..mp4',
      duration: 4414,
      category: 'Classic',
      releaseDate: '1923',
      rating: 'NR',
      artist: 'Harold Lloyd'
    },
    {
      id: '7',
      title: 'His Girl Friday (1940)',
      description: 'A fast-talking newspaper editor tries to prevent his star reporter and ex-wife from marrying another man by entangling her in a big murder story. One of the greatest screwball comedies ever made, starring Cary Grant and Rosalind Russell.',
      thumbnail: 'https://archive.org/services/img/HisGirlFriday1940',
      url: 'https://archive.org/download/HisGirlFriday1940/seqhisgirlfridayfull1d.mp4',
      duration: 5554,
      category: 'Romance',
      releaseDate: '1940',
      rating: 'NR',
      artist: 'Howard Hawks'
    },
    {
      id: '8',
      title: 'Night of the Living Dead (1968)',
      description: 'A group of people barricade themselves in a rural farmhouse to survive an onslaught of flesh-eating zombies. George A. Romero\'s groundbreaking horror film that defined the zombie genre.',
      thumbnail: 'https://archive.org/services/img/night_of_the_living_dead_dvd',
      url: 'https://archive.org/download/night_of_the_living_dead_dvd/Night.mp4',
      duration: 5760,
      category: 'Horror',
      releaseDate: '1968',
      rating: 'NR',
      artist: 'George A. Romero'
    }
  ]
};
