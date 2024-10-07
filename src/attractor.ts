import './app.css'
import * as THREE from 'three'
import type Ammo from 'ammojs-typed'
import { initGeometry } from '../initGeometry';
import { createDrup } from './meshes'

// Initialize Ammo.js
Ammo().then(function(AmmoLib) {
  Ammo = AmmoLib;
  initPhysics();
  animate();
});

const el = document.getElementById('canvas-container')!
const { scene, renderer, camera } = initGeometry(el)
let physicsWorld, rigidBodies: { mesh: THREE.Mesh, body: Ammo.btRigidBody }[] = [], attractorPoint, tmpTrans;

function initPhysics() {
  // Set up collision configuration
  let collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
  let dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
  let overlappingPairCache = new Ammo.btDbvtBroadphase();
  let solver = new Ammo.btSequentialImpulseConstraintSolver();

  // Create the physics world
  physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
  physicsWorld.setGravity(new Ammo.btVector3(0, 0, 0));

  // Create attractor point
  attractorPoint = new Ammo.btVector3(0, 0, 0);
  tmpTrans = new Ammo.btTransform()

  // Create some objects (simplified)
  for (let i = 0; i < 10; i++) {
    createObject();
  }
}

function createObject() {
  // Create a sphere
  let mass = 1;
  let radius = 3;
  let sphere = createDrup()
  scene.add(sphere);

  // Create Ammo.js rigid body
  let transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3(Math.random() * 10 - 5, Math.random() * 10 + 5, Math.random() * 10 - 5));

  let motionState = new Ammo.btDefaultMotionState(transform);
  let sphereShape = new Ammo.btSphereShape(radius);
  sphereShape.setMargin(0.05);

  let localInertia = new Ammo.btVector3(0, 0, 0);
  sphereShape.calculateLocalInertia(mass, localInertia);

  let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, sphereShape, localInertia);
  let body = new Ammo.btRigidBody(rbInfo);

  physicsWorld.addRigidBody(body);

  rigidBodies.push({ mesh: sphere, body: body });
}

function animate() {

  let deltaTime = 1 / 60;

  updatePhysics(deltaTime);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function updatePhysics(deltaTime) {
  // Step the physics world
  physicsWorld.stepSimulation(deltaTime, 10);

  // Apply attractor force to each object
  rigidBodies.forEach(obj => {
    let body = obj.body;
    let pos = body.getWorldTransform().getOrigin();

    // Calculate direction to attractor
    let direction = new Ammo.btVector3(
      attractorPoint.x() - pos.x(),
      attractorPoint.y() - pos.y(),
      attractorPoint.z() - pos.z()
    );

    // Normalize and scale the force
    direction.normalize();
    direction.op_mul(10); // Adjust this value to change attraction strength

    // Apply the force
    body.applyCentralForce(direction);

    // Update Three.js mesh position
    let ms = body.getMotionState();
    if (ms) {
      ms.getWorldTransform(tmpTrans);
      let p = tmpTrans.getOrigin();
      obj.mesh.position.set(p.x(), p.y(), p.z());
    }
  });
}
