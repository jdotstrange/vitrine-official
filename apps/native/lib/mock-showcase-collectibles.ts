// Mock collectibles for showcase creation
// These represent the user's own collectibles that can be added to showcases

export interface ShowcaseCollectible {
  id: string;
  name: string;
  image: string;
  type: string;
  category: string;
  value: number;
}

export const MOCK_SHOWCASE_COLLECTIBLES: ShowcaseCollectible[] = [
  {
    id: '1',
    name: '1986 Fleer Michael Jordan Rookie',
    image: '/basketball-rookie-card.png',
    type: 'Cards',
    category: 'Basketball',
    value: 450000,
  },
  {
    id: '2',
    name: 'LeBron James 2003 Topps Chrome',
    image: '/lebron-james-rookie-card.jpg',
    type: 'Cards',
    category: 'Basketball',
    value: 3200,
  },
  {
    id: '3',
    name: 'Air Jordan 1 Retro High OG Chicago',
    image: '/air-jordan-1-chicago-og-sneaker.jpg',
    type: 'Sneakers',
    category: 'Basketball',
    value: 2800,
  },
  {
    id: '4',
    name: 'Nike Dunk Low Panda',
    image: '/nike-dunk-panda.jpg',
    type: 'Sneakers',
    category: 'Lifestyle',
    value: 150,
  },
  {
    id: '5',
    name: 'Rolex Submariner Date 116610LN',
    image: '/rolex-submariner.jpg',
    type: 'Watches',
    category: 'Luxury',
    value: 12500,
  },
  {
    id: '6',
    name: 'Amazing Spider-Man #300',
    image: '/amazing-spiderman-300-comic.jpg',
    type: 'Comics',
    category: 'Marvel',
    value: 850,
  },
  {
    id: '7',
    name: 'Babe Ruth Signed Baseball',
    image: '/babe-ruth-signed-baseball.jpg',
    type: 'Memorabilia',
    category: 'Baseball',
    value: 25000,
  },
  {
    id: '8',
    name: '1952 Topps Mickey Mantle',
    image: '/mickey-mantle-1952-topps.jpg',
    type: 'Cards',
    category: 'Baseball',
    value: 500000,
  },
];
