import { Image } from 'react-native';

/** Matches `app.json` splash.backgroundColor. */
export const SPLASH_BG = '#020202';

export const SPLASH_SOURCE = Image.resolveAssetSource(
  require('../assets/splash-icon.png'),
);

/** Same math as Expo splash `resizeMode: "contain"`. */
export function getContainRect(
  containerW: number,
  containerH: number,
  contentW: number,
  contentH: number,
) {
  const scale = Math.min(containerW / contentW, containerH / contentH);
  const width = contentW * scale;
  const height = contentH * scale;
  return {
    left: (containerW - width) / 2,
    top: (containerH - height) / 2,
    width,
    height,
  };
}
