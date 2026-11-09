// Insere uma transformação do Cloudinary na URL (ex.: redimensionar, formato automático).
// https://res.cloudinary.com/<cloud>/image/upload/<transformação>/v123/arquivo.jpg
export function withTransform(url: string, transform: string) {
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
  return url.replace('/upload/', `/upload/${transform}/`);
}
