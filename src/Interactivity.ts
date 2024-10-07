import * as T from 'three'
import type AmmoT from 'ammojs-typed'
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
import { scene } from './main'
import { createDrup } from './meshes'

interface BufferGeometry extends T.BufferGeometry {
  ammoIndices: T.TypedArray
  ammoVertices: T.TypedArray
  ammoIndexAssociation: number[]
}

const rigidBodies: T.Mesh[] = []
const softBodies: T.Mesh[] = []
const drupMass = 1
const drupRadius = 1.5
const GRAVITY = 0 //-9.8 / 4
const DRAG = 0.5
const MARGIN = 0.05
const ATTRACTOR_STRENGTH = 150
let transformAux1: AmmoT.btTransform
let softBodyHelpers: AmmoT.btSoftBodyHelpers
let physicsWorld: AmmoT.btSoftRigidDynamicsWorld
let attractor: AmmoT.btVector3
let Ammo: typeof AmmoT

let pos = new T.Vector3(),
  quat = new T.Quaternion()
const mouse = new T.Vector2()
const raycaster = new T.Raycaster()

export function initPhysics(_Ammo: typeof AmmoT) {
  Ammo = _Ammo
  const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration()
  physicsWorld = new Ammo.btSoftRigidDynamicsWorld(
    new Ammo.btCollisionDispatcher(collisionConfiguration),
    new Ammo.btDbvtBroadphase(),
    new Ammo.btSequentialImpulseConstraintSolver(),
    collisionConfiguration,
    new Ammo.btDefaultSoftBodySolver(),
  )
  physicsWorld.setGravity(new Ammo.btVector3(0, GRAVITY, 0))
  physicsWorld.getWorldInfo().set_m_gravity(new Ammo.btVector3(0, GRAVITY, 0))
  attractor = new Ammo.btVector3(0, 4, 0)

  transformAux1 = new Ammo.btTransform()
  softBodyHelpers = new Ammo.btSoftBodyHelpers()
  return { transformAux1, softBodyHelpers, physicsWorld }
}

export function addGeometry() {
  const drup = createDrup(.75, '#005c33')
  pos.set(0, 8, 0)
  quat.set(0, 0, 0, 1)
  const { body } = createRigidBody(drup, 3, drupMass * 1.2, pos, quat)
  physicsWorld.addRigidBody(body);
  body.setFriction(DRAG)
  scene.add(drup)
  return [drup]
}

export function fire(e: MouseEvent, camera: T.Camera) {
  mouse.set(
    (e.clientX / window.innerWidth) * 2 - 1,
    (e.clientY / window.innerHeight) * 2 + 1
  )

  const drup = createDrup(drupRadius)

  raycaster.setFromCamera(mouse, camera)
  pos.copy(raycaster.ray.direction)
  pos.add(raycaster.ray.origin)
  quat.set(0, 0, 0, 1)

  const { body: drupBody } = createRigidBody(drup, drupRadius, drupMass, pos, quat)
  scene.add(drup);
  physicsWorld.addRigidBody(drupBody);
  drupBody.setFriction(0.5)

  pos.copy(raycaster.ray.direction)
  pos.multiplyScalar(32)
  drupBody.setLinearVelocity(new Ammo.btVector3(pos.x, pos.y, pos.z))
}

function createRigidBody(mesh: T.Mesh, radius: number, mass: number, pos: T.Vector3, quat: T.Quaternion) {
  mesh.position.copy(pos)
  mesh.quaternion.copy(quat)

  const transform = new Ammo.btTransform()
  transform.setIdentity()
  // TODO: TbT how I was writing about 3D file formats and vastly overestimating the interop from code
  // Only to find myself converting threejs vec3 position and quaternion
  // to ammojs vec3 position and quaternion
  // I *think* thi.ng and four are slightly better, but there is no "store contract" afaict in the 3d world
  transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z))
  transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w))
  const motionState = new Ammo.btDefaultMotionState(transform)
  const physicsShape = new Ammo.btSphereShape(radius)
  physicsShape.setMargin(MARGIN)

  const localInertia = new Ammo.btVector3(0, 0, 0)
  physicsShape.calculateLocalInertia(mass, localInertia)

  const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, physicsShape, localInertia)
  const body = new Ammo.btRigidBody(rbInfo)

  mesh.userData.physicsBody = body

  if (mass > 0) {
    rigidBodies.push(mesh);
    // Disable deactivation
    body.setActivationState(4)
  }
  // physicsWorld.addRigidBody(body);

  return { body, mesh }
}

function createSoftVolume(bufferGeom, mass: number, pressure: number) {

  processGeometry(bufferGeom)

  const volume = new T.Mesh(bufferGeom, new T.MeshPhongMaterial({ color: 0xFFFFFF }))
  volume.castShadow = true
  volume.receiveShadow = true
  volume.frustumCulled = false
  scene.add(volume)

  // Volume physic object

  const volumeSoftBody = softBodyHelpers.CreateFromTriMesh(
    physicsWorld.getWorldInfo(),
    bufferGeom.ammoVertices,
    bufferGeom.ammoIndices,
    bufferGeom.ammoIndices.length / 3,
    true)

  const sbConfig = volumeSoftBody.get_m_cfg()
  sbConfig.set_viterations(40)
  sbConfig.set_piterations(40)

  // Soft-soft and soft-rigid collisions
  sbConfig.set_collisions(0x11)

  // Friction
  sbConfig.set_kDF(0.1)
  // Damping
  sbConfig.set_kDP(0.01)
  // Pressure
  sbConfig.set_kPR(pressure)
  // Stiffness
  volumeSoftBody.get_m_materials().at(0).set_m_kLST(0.9)
  volumeSoftBody.get_m_materials().at(0).set_m_kAST(0.9)

  volumeSoftBody.setTotalMass(mass, false)
  Ammo.castObject(volumeSoftBody, Ammo.btCollisionObject).getCollisionShape().setMargin(margin)
  physicsWorld.addSoftBody(volumeSoftBody, 1, - 1)
  volume.userData.physicsBody = volumeSoftBody
  // Disable deactivation
  volumeSoftBody.setActivationState(4)

  softBodies.push(volume)
}

function processGeometry(bufGeometry: T.BufferGeometry) {
  // Ony consider the position values when merging the vertices
  const posOnlyBufGeometry = new T.BufferGeometry();
  posOnlyBufGeometry.setAttribute('position', bufGeometry.getAttribute('position'));
  posOnlyBufGeometry.setIndex(bufGeometry.getIndex());

  // Merge the vertices so the triangle soup is converted to indexed triangles
  const indexedBufferGeom = mergeVertices(posOnlyBufGeometry);

  // Create index arrays mapping the indexed vertices to bufGeometry vertices
  mapIndices(bufGeometry, indexedBufferGeom);
}

function isEqual(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number) {
  const delta = 0.000001;
  return Math.abs(x2 - x1) < delta &&
    Math.abs(y2 - y1) < delta &&
    Math.abs(z2 - z1) < delta;
}

function mapIndices(bufGeometry: BufferGeometry, indexedBufferGeom: BufferGeometry) {

  // Creates ammoVertices, ammoIndices and ammoIndexAssociation in bufGeometry

  const vertices = bufGeometry.attributes.position.array;
  const idxVertices = indexedBufferGeom.attributes.position.array;
  const indices = indexedBufferGeom.index.array;

  const numIdxVertices = idxVertices.length / 3;
  const numVertices = vertices.length / 3;

  bufGeometry.ammoVertices = idxVertices;
  bufGeometry.ammoIndices = indices;
  bufGeometry.ammoIndexAssociation = [];

  for (let i = 0; i < numIdxVertices; i++) {
    const association: number[] = [];
    bufGeometry.ammoIndexAssociation.push(association);

    const i3 = i * 3;
    for (let j = 0; j < numVertices; j++) {
      const j3 = j * 3;
      if (isEqual(idxVertices[i3], idxVertices[i3 + 1], idxVertices[i3 + 2],
        vertices[j3], vertices[j3 + 1], vertices[j3 + 2])) {
        association.push(j3);
      }
    }
  }
}

export function updatePhysics(deltaTime: number) {

  // Step world
  physicsWorld.stepSimulation(deltaTime, 10);

  // Update soft volumes
  for (let i = 0, len = softBodies.length; i < len; i++) {

    const volume = softBodies[i];
    const geometry = volume.geometry;
    const softBody = volume.userData.physicsBody;
    const volumePositions = geometry.attributes.position.array;
    const volumeNormals = geometry.attributes.normal.array;
    const association = geometry.ammoIndexAssociation;
    const numVerts = association.length;
    const nodes = softBody.get_m_nodes();
    for (let j = 0; j < numVerts; j++) {

      const node = nodes.at(j);
      const nodePos = node.get_m_x();
      const x = nodePos.x();
      const y = nodePos.y();
      const z = nodePos.z();
      const nodeNormal = node.get_m_n();
      const nx = nodeNormal.x();
      const ny = nodeNormal.y();
      const nz = nodeNormal.z();

      const assocVertex = association[j];

      for (let k = 0, kl = assocVertex.length; k < kl; k++) {

        let indexVertex = assocVertex[k];
        volumePositions[indexVertex] = x;
        volumeNormals[indexVertex] = nx;
        indexVertex++;
        volumePositions[indexVertex] = y;
        volumeNormals[indexVertex] = ny;
        indexVertex++;
        volumePositions[indexVertex] = z;
        volumeNormals[indexVertex] = nz;

      }

    }

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.normal.needsUpdate = true;

  }

  // Update rigid bodies
  for (let i = 0, len = rigidBodies.length; i < len; i++) {

    const mesh = rigidBodies[i];
    const body: AmmoT.btRigidBody = mesh.userData.physicsBody;
    const ms = body.getMotionState();
    const velocity = body.getLinearVelocity();
    let dragForce = new Ammo.btVector3(
      -velocity.x() * DRAG,
      -velocity.y() * DRAG,
      -velocity.z() * DRAG,
    );
    body.applyCentralForce(dragForce)
    let pos = body.getWorldTransform().getOrigin()
    // Calculate direction to attractor
    let direction = new Ammo.btVector3(
      attractor.x() - pos.x(),
      attractor.y() - pos.y(),
      attractor.z() - pos.z()
    );

    // Normalize and scale the force
    direction.normalize();
    direction.op_mul(ATTRACTOR_STRENGTH);
    body.applyCentralForce(direction);
    body.applyCentralForce(dragForce)

    if (ms) {
      ms.getWorldTransform(transformAux1);
      const p = transformAux1.getOrigin();
      const q = transformAux1.getRotation();
      mesh.position.set(p.x(), p.y(), p.z());
      mesh.quaternion.set(q.x(), q.y(), q.z(), q.w());
    }
  }
}
