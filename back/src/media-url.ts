export function thumbnailPath(path: string) {
  return `${path}.card.webp`
}

export function mainWebpPath(path: string) {
  return `${path}.main.webp`
}

export function mediaPaths(paths: string[]) {
  return paths.flatMap((path) => [path, thumbnailPath(path), mainWebpPath(path)])
}

export function mediaUrl(path: string, admin = false, thumbnail = false) {
  return `/api/v1/${admin ? 'admin/' : ''}media/${path.split('/').map(encodeURIComponent).join('/')}${thumbnail ? '?variant=card' : ''}`
}
