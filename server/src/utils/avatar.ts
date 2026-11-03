/**
 * Generate a random avatar URL from the provided cute animal avatars.
 * These avatars are consistent - same seed will always return the same avatar.
 * 
 * Avatar images are stored in client/public/avatar/ and served as /avatar/*.png
 */

const AVATARS = [
  '/avatar/avatar-01-fox.png',
  '/avatar/avatar-02-bear.png',
  '/avatar/avatar-03-cat.png',
  '/avatar/avatar-04-bunny.png',
  '/avatar/avatar-05-owl.png',
  '/avatar/avatar-06-penguin.png',
  '/avatar/avatar-07-frog.png',
  '/avatar/avatar-08-panda.png',
  '/avatar/avatar-09-dino.png',
  '/avatar/avatar-10-chick.png',
  '/avatar/avatar-11-pig.png',
  '/avatar/avatar-12-koala.png',
  '/avatar/avatar-13-lion.png',
  '/avatar/avatar-14-monkey.png',
  '/avatar/avatar-15-sheep.png',
  '/avatar/avatar-16-duck.png',
  '/avatar/avatar-17-whale.png',
  '/avatar/avatar-18-octopus.png',
  '/avatar/avatar-19-hedgehog.png',
  '/avatar/avatar-20-robot.png',
];

/**
 * Get a random avatar URL.
 * @returns A random avatar URL from the predefined list
 */
export function getRandomAvatar(): string {
  const randomIndex = Math.floor(Math.random() * AVATARS.length);
  return AVATARS[randomIndex];
}

/**
 * Get a deterministic avatar based on a seed (e.g., email).
 * Same seed will always return the same avatar.
 * @param seed - A string to use as seed (e.g., user's email)
 * @returns A deterministic avatar URL
 */
export function getAvatarFromSeed(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  const index = Math.abs(hash) % AVATARS.length;
  return AVATARS[index];
}

/**
 * Check if a URL is one of the default avatars
 * @param url - Avatar URL to check
 * @returns true if the URL is a default avatar
 */
export function isDefaultAvatar(url: string | null): boolean {
  if (!url) return false;
  return AVATARS.includes(url);
}
