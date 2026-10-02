export interface GreenScreenBackground {
  id: string;
  name: string;
  category: 'Studio' | 'Cyberpunk' | 'Nature & Travel' | 'Luxury & City' | 'Abstract';
  url: string;
  thumbUrl: string;
  type: 'image' | 'video';
  tags: string[];
}

export const GREEN_SCREEN_BACKGROUNDS: GreenScreenBackground[] = [
  // Studio & Creator
  {
    id: 'studio_neon_pod',
    name: 'Podcast Creator Studio',
    category: 'Studio',
    url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1280&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=300&q=80',
    type: 'image',
    tags: ['studio', 'podcast', 'lights', 'mic', 'recording', 'creator'],
  },
  {
    id: 'studio_newsroom',
    name: 'Live TV Newsroom',
    category: 'Studio',
    url: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1280&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=300&q=80',
    type: 'image',
    tags: ['news', 'broadcast', 'anchor', 'screens', 'professional'],
  },
  {
    id: 'studio_concert_stage',
    name: 'Arena Concert Stage & Beams',
    category: 'Studio',
    url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1280&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=300&q=80',
    type: 'image',
    tags: ['concert', 'lights', 'stage', 'music', 'party', 'festival'],
  },

  // Cyberpunk & Tech
  {
    id: 'cyber_shibuya_alley',
    name: 'Neo Shibuya Cyber Alley',
    category: 'Cyberpunk',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1280&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=300&q=80',
    type: 'image',
    tags: ['cyberpunk', 'neon', 'tokyo', 'japan', 'rain', 'night', 'futuristic'],
  },
  {
    id: 'cyber_matrix_hall',
    name: 'Matrix Data Corridor',
    category: 'Cyberpunk',
    url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1280&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=300&q=80',
    type: 'image',
    tags: ['tech', 'matrix', 'coding', 'cyber', 'terminal', 'green'],
  },
  {
    id: 'cyber_synthwave_grid',
    name: 'Outrun 80s Synthwave Sun',
    category: 'Cyberpunk',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1280&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80',
    type: 'image',
    tags: ['synthwave', 'grid', 'sunset', '80s', 'retro', 'purple', 'neon'],
  },

  // Luxury & City
  {
    id: 'city_lagos_skyline',
    name: 'Lagos Island Sunset Skyline',
    category: 'Luxury & City',
    url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1280&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=300&q=80',
    type: 'image',
    tags: ['lagos', 'nigeria', 'skyline', 'sunset', 'city', 'buildings'],
  },
  {
    id: 'luxury_penthouse_night',
    name: 'High-Rise Luxury Penthouse',
    category: 'Luxury & City',
    url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1280&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=300&q=80',
    type: 'image',
    tags: ['penthouse', 'luxury', 'wealth', 'interior', 'cityscape', 'mansion'],
  },
  {
    id: 'city_newyork_times_square',
    name: 'Times Square Billboards',
    category: 'Luxury & City',
    url: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=1280&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=300&q=80',
    type: 'image',
    tags: ['newyork', 'nyc', 'billboards', 'timesquare', 'famous', 'crowd'],
  },

  // Nature & Travel
  {
    id: 'nature_tropical_beach',
    name: 'Maldives Turquoise Beach',
    category: 'Nature & Travel',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1280&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=300&q=80',
    type: 'image',
    tags: ['beach', 'ocean', 'summer', 'palms', 'travel', 'paradise', 'tropical'],
  },
  {
    id: 'nature_outer_space',
    name: 'Deep Cosmos & Earth Orbit',
    category: 'Nature & Travel',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1280&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=300&q=80',
    type: 'image',
    tags: ['space', 'earth', 'stars', 'galaxy', 'astronaut', 'orbit', 'universe'],
  },
  {
    id: 'nature_alps_snow',
    name: 'Alpine Snowy Mountain Peaks',
    category: 'Nature & Travel',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1280&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=300&q=80',
    type: 'image',
    tags: ['mountains', 'snow', 'nature', 'landscape', 'epic', 'climbing'],
  },

  // Abstract & Artistic
  {
    id: 'abstract_liquid_flow',
    name: 'Electric Fluid Motion',
    category: 'Abstract',
    url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1280&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=300&q=80',
    type: 'image',
    tags: ['abstract', 'fluid', 'colors', 'art', 'dynamic', 'wallpaper'],
  },
  {
    id: 'abstract_dark_particles',
    name: 'Golden Dust Particle Wave',
    category: 'Abstract',
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1280&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=300&q=80',
    type: 'image',
    tags: ['particles', 'gold', 'wave', 'luxury', 'dark', 'cinematic'],
  },
];
