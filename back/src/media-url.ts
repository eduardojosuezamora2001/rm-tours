export function mediaUrl(path: string, admin = false) {
  return `/api/v1/${admin ? 'admin/' : ''}media/${path.split('/').map(encodeURIComponent).join('/')}`
}
