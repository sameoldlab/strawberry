import { getContext, setContext } from "svelte";
import type * as T from 'three'
type Ctx = {
  renderer: T.WebGLRenderer
  scene: T.Scene
  camera: T.PerspectiveCamera
  animate: (fn: () => void) => void
}

export function getThree() {
  return getContext('ctx') as Ctx
}

export function setThree(ctx: Ctx) {
  setContext('ctx', ctx)
}
