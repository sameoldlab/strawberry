import './app.css'
import { initGeometry } from '../initGeometry'
import { addGeometry, fire, initPhysics, updatePhysics } from './Interactivity'
import type Ammo from 'ammojs-typed'
import { createDrup } from './meshes'

export const A = await Ammo()

const el = document.getElementById('canvas-container')!
export const { scene, orbit, camera, renderer, clock, textureLoader } = initGeometry(el, animate)
initPhysics(A)
addGeometry()

let status: 'click' | 'drag' | 'none' = 'none'
const mouseMove = () => status = 'drag'
const mouseDown = () => status = 'click'
const mouseUp = (e: MouseEvent) => {
  if (status !== 'click') return
  console.log('fire')
  fire(e, camera)
  status = 'none'
}

window.addEventListener('mousemove', mouseMove)
window.addEventListener('mouseup', mouseUp)
window.addEventListener('mousedown', mouseDown)

function animate() {
  const delta = clock.getDelta()
  // drup.position.y = Math.cos(clock.getElapsedTime()) + 4
  updatePhysics(delta)
  orbit.update()
  renderer.render(scene, camera)
}
