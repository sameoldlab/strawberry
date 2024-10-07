import * as T from 'three/src/Three.js'
import glossyMat from './glossyMat'

export const createDrup = (radius = 3, color: string | undefined = undefined) => {
  const boxGeo = new T.SphereGeometry(radius, 32, 32)
  const drup = new T.Mesh(boxGeo, glossyMat(color))
  drup.castShadow = true
  drup.receiveShadow = true

  return drup
}

export const createShadowCatcher = () => {

  // Floor
  const shadowCatcher = new T.Mesh(
    new T.CircleGeometry(100, 100),
    new T.ShadowMaterial({
      opacity: 0.4,
    }),
  )
  shadowCatcher.receiveShadow = true
  shadowCatcher.rotation.x = -Math.PI / 2

  return shadowCatcher
}
