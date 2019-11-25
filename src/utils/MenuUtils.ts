import electron from 'electron'
import path from 'path'

export function loadMenuIcon(npath : string) {
  let pathr = path.posix.join(window.appDir, npath);
  let img = electron.remote.nativeImage.createFromPath(pathr);
  return img
}