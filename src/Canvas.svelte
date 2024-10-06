<script lang="ts">
  import { onMount } from "svelte";
  import { setThree } from "./lib/threeCtx";
  import * as T from 'three'
  import { RoomEnvironment } from './lib/environment'
  let { children } = $props()

  let container: HTMLDivElement
  const scene: T.Scene = $state(new T.Scene())
  const camera: T.PerspectiveCamera = $state(new T.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000))
  const renderer: T.WebGLRenderer = $state(new T.WebGLRenderer({
    antialias: true,

  }))
  camera.lookAt(scene.position)
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setAnimationLoop(animate)
  renderer.toneMapping = T.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = T.PCFSoftShadowMap


  export const environment = new RoomEnvironment()
  export const pmremGenerator = new T.PMREMGenerator(renderer)
  scene.background = new T.Color(0xff5692)
  scene.environment = pmremGenerator.fromScene(environment).texture
  camera.position.set(-3, 6, 5);
  let [loop, setLoop] = useLoop()
  const ctx = $derived({
    renderer,
    scene,
    camera,
    animate: setLoop
  });

  setThree(ctx);

  function useLoop() {
    let anime = $state(() => {})
    const getA = () => {return anime}
    const setA = (fn: () => void) => {
      console.log('assigned')
      anime = fn
    }
    return [getA, setA] as const
  }

  onMount(()=> {
    container.appendChild(renderer.domElement)
  })
  function animate() {
    loop()()
    renderer.render(scene, camera)
  }

  const tanFOV = Math.tan(((Math.PI / 180) * camera.fov) / 2)
  const initialHeight = window.innerHeight

  // https://jsfiddle.net/Q4Jpu/
  const handleResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.fov = (360 / Math.PI) * Math.atan(tanFOV * (window.innerHeight / initialHeight))

    camera.updateProjectionMatrix()
    camera.lookAt(scene.position)

    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.render(scene, camera)
  }
</script>

<svelte:window onresize={handleResize} />

<div bind:this={container} id="canvas-container">
  {#if renderer}
    {@render children()}
  {/if}
</div>

<style>
div {
  width: 100%;
  height: 100%;
}
</style>
