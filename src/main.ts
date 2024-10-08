import './app.css'
import { initGeometry } from './geometry'
import { addGeometry, fire, initPhysics, updatePhysics } from './Interactivity'
import type Ammo from 'ammojs-typed'

Ammo().then(function(AmmoLib) {
  Ammo = AmmoLib;
  const el = document.getElementById('canvas-container')!
  initPhysics(Ammo);
  const geo = initGeometry(el, animate)
  scene = geo.scene
  const { orbit, camera, renderer, clock } = geo
  animate();
  addGeometry()

  let status: 'click' | 'drag' | 'none' = 'none'
  const mouseMove = () => status = 'drag'
  const mouseDown = () => status = 'click'
  const mouseUp = (e: MouseEvent) => {
    if (status !== 'click') return
    fire(e, camera)
    status = 'none'
  }

  window.addEventListener('mousemove', mouseMove)
  window.addEventListener('mouseup', mouseUp)
  window.addEventListener('mousedown', mouseDown)

  function animate() {
    const delta = clock.getDelta()
    updatePhysics(delta)
    orbit.update()
    renderer.render(scene, camera)
  }
})

export let scene 
