// The words the demo starts with, so every box has something in it.

import { toStored, type Content } from '@/panel/field-list'
import { fieldList } from '@/fields'

/** The demo site's content as if it had been saved once already. */
export const sampleContent: Content = {
  sections: toStored(fieldList),
  values: {
    top: { name: 'Northside Ceramics' },
    welcome: {
      title: 'Handmade cups and bowls',
      intro: 'Every piece is thrown, glazed and fired in a small studio by the river.',
      photo: '',
      accent: '#0f766e',
    },
    banner: { picture: '' },
    gallery: { pictures: ['', ''] },
    film: { video: '' },
    products: {
      list: {
        collections: [
          { id: 'cups', name: 'Cups' },
          { id: 'bowls', name: 'Bowls' },
        ],
        items: [
          { id: 'tall-cup', name: 'Tall cup', tag: 'STONEWARE', picture: '', collection: 'cups' },
          { id: 'small-cup', name: 'Small cup', tag: 'PORCELAIN', picture: '', collection: 'cups' },
          { id: 'deep-bowl', name: 'Deep bowl', tag: 'STONEWARE', picture: '', collection: 'bowls' },
        ],
      },
    },
    contact: {
      email: 'hello@example.com',
      links: [
        { id: 'instagram', platform: 'instagram', text: '@northside', url: 'https://instagram.com/northside' },
        { id: 'youtube', platform: 'youtube', text: 'Northside', url: 'https://youtube.com/@northside' },
      ],
    },
    search: {
      title: 'Northside Ceramics, handmade cups and bowls',
      description: 'Stoneware and porcelain thrown, glazed and fired in a small studio by the river.',
    },
  },
}
