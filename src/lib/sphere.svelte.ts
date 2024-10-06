import * as T from 'three'

const material = new T.MeshBasicMaterial({ color: 'red' })
const geometry = new T.SphereGeometry(0.1, 16, 16)

export class Sphere {
  position
  rotation
  velocity
  acceleration
  #mesh: T.Mesh

  constructor(position: T.Vector3) {
    this.position = position
    this.#mesh = new T.Mesh(geometry, material)
    this.#mesh = position
  }

}
