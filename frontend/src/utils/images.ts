// Barber-shop photography (Unsplash – free to use). Every <SafeImage> falls back to
// a barber-pole pattern if an image fails to load, so the UI never shows broken images.
// Replace these URLs with your own photos to brand the template.

const unsplash = (id: string, w = 1600): string => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const BARBER_IMAGES = {
  hero: unsplash('photo-1503951914875-452162b0f3f1', 1800),
  chair: unsplash('photo-1585747860715-2ba37e788b70'),
  cut: unsplash('photo-1599351431202-1e0f0137899a'),
  beard: unsplash('photo-1621605815971-fbc98d665033'),
  tools: unsplash('photo-1622286342621-4bd786c2447c'),
  interior: unsplash('photo-1512690459411-b9245aed614b'),
} as const;

export const GALLERY: { src: string; alt: string }[] = [
  { src: BARBER_IMAGES.cut, alt: 'Бръснар подстригва клиент' },
  { src: BARBER_IMAGES.beard, alt: 'Оформяне на брада' },
  { src: BARBER_IMAGES.chair, alt: 'Бръснарски стол' },
  { src: BARBER_IMAGES.tools, alt: 'Инструменти на бръснаря' },
];
