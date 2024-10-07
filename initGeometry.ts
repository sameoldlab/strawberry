import * as T from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RoomEnvironment } from './src/lib/environment'

export const initGeometry = (el: HTMLElement, animate: () => void) => {
  const scene: T.Scene = new T.Scene()
  const camera: T.PerspectiveCamera = new T.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000)
  const renderer: T.WebGLRenderer = new T.WebGLRenderer({
    antialias: true,
  })

  // Initialize Renderer
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.toneMapping = T.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = T.PCFSoftShadowMap
  el.appendChild(renderer.domElement)
  renderer.setAnimationLoop(animate)

  // Environment
  const environment = new RoomEnvironment()
  const pmremGenerator = new T.PMREMGenerator(renderer)
  scene.background = new T.Color(0xff5692)
  scene.environment = pmremGenerator.fromScene(environment).texture

  // Camera
  camera.lookAt(scene.position)
  camera.position.set(-3, 6, 5)
  const tanFOV = Math.tan(((Math.PI / 180) * camera.fov) / 2)
  const initialHeight = window.innerHeight
  const origin = new T.Vector3(0, 3, 0)
  const orbit = new OrbitControls(camera, renderer.domElement)
  orbit.enablePan = false
  orbit.enableDamping = true
  orbit.target = origin
  orbit.maxZoom = 48
  orbit.maxDistance = 48
  orbit.minDistance = 16
  orbit.minZoom = 16
  orbit.update()

  // Light
  let light = new T.DirectionalLight(0xffffff, 3)
  light.position.set(8, 20, 8)
  light.target.position.set(0, 4, 0)
  light.castShadow = true
  const D = 10
  light.shadow.camera.left = -D
  light.shadow.camera.right = D
  light.shadow.camera.top = D
  light.shadow.camera.bottom = -D
  light.shadow.mapSize.set(1024, 1024)
  scene.add(light)


  // Event Listeners
  const resize = () => {
    // https://jsfiddle.net/Q4Jpu/
    camera.aspect = window.innerWidth / window.innerHeight
    camera.fov = (360 / Math.PI) * Math.atan(tanFOV * (window.innerHeight / initialHeight))

    camera.updateProjectionMatrix()
    camera.lookAt(scene.position)

    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.render(scene, camera)
  }
  window.addEventListener('resize', resize)

  return {
    renderer,
    orbit,
    camera,
    scene,
    clock: new T.Clock(),
    textureLoader: new T.TextureLoader(),
  }
}

