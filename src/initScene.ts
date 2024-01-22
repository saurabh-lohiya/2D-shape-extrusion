import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/Addons.js"
import { Mode } from "."

export class ThreeScene {
	private scene: THREE.Scene
	private camera: THREE.PerspectiveCamera
	private light: THREE.Light
	public renderer: THREE.WebGLRenderer
	private raycaster: THREE.Raycaster
	private controls: OrbitControls
	private mousePosition: THREE.Vector2
	public mode: Mode
	private selectedObject: THREE.Mesh | null
	private axisHelper: THREE.AxesHelper
	private axisHelperId: number
	private controlPoints: THREE.Mesh[]
	private plane: THREE.Mesh
	private planeId: number
	private offset: THREE.Vector3
	private intersects: THREE.Intersection[]
	private selectedVertex: THREE.Mesh

	constructor() {
		this.scene = new THREE.Scene()
		this.camera = new THREE.PerspectiveCamera(
			75,
			window.innerWidth / window.innerHeight,
			0.1,
			1000
		)
		this.light = new THREE.DirectionalLight(0xffffff, 2)
		this.renderer = new THREE.WebGLRenderer()
		this.renderer.setSize(window.innerWidth, window.innerHeight)
		this.raycaster = new THREE.Raycaster()
		this.controls = new OrbitControls(this.camera, this.renderer.domElement)
		this.mousePosition = new THREE.Vector2()
		this.mode = Mode.Draw
		this.selectedObject = null
		this.axisHelper = new THREE.AxesHelper(20)
		this.controls.update()
		this.camera.position.set(2, 3, 20)
		this.plane = this.addHorizontalPlane()
		this.planeId = this.plane.id
		this.axisHelperId = this.axisHelper.id
		this.controlPoints = []
		this.offset = new THREE.Vector3()
		this.intersects = []
		this.selectedVertex = new THREE.Mesh()
		this.setupCamera()
		this.addObjectsToScene(this.axisHelper, this.camera, this.light, this.plane)
		this.setAnimationLoopForRenderer()
	}

	setAnimationLoopForRenderer() {
		this.renderer.setAnimationLoop(() => {
			this.renderer.render(this.scene, this.camera)
		})
	}

	setupCamera() {
		this.camera.rotateY(Math.PI / 4)
		this.camera.rotateX(-Math.PI / 4)
		this.camera.position.set(20, 15, 20)
	}

	addObjectsToScene(...objects: THREE.Object3D[]) {
		this.scene.add(...objects)
	}

	addHorizontalPlane() {
		const geometry = new THREE.PlaneGeometry(50, 50)
		const material = new THREE.MeshBasicMaterial({
			color: 0xffffff,
			side: THREE.DoubleSide,
		})
		const plane = new THREE.Mesh(geometry, material)
		plane.rotation.x = Math.PI / 2
		return plane
	}

	updateMode(mode: Mode) {
		this.mode = mode
		if (mode !== this.mode && this.mode === Mode.Draw) {
			this.controlPoints = []
		}
	}

	extrudeSelectedShape(height: number) {
		if (this.selectedObject) {
			this.selectedObject.scale.y = height
		}
	}

	// Implement drag and drop functionality on mouse drag for selected object
	onPointerMove(e: MouseEvent) {
		this.mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1
		this.mousePosition.y = -(e.clientY / window.innerHeight) * 2 + 1
		this.raycaster.setFromCamera(this.mousePosition, this.camera)
		this.intersects = this.raycaster.intersectObjects(this.scene.children)
		if (this.shiftSelectedObjectCondition()) {
			this.controls.enabled = false
			if (this.selectedObject) {
				this.selectedObject.position.copy(
					this.intersects[0].point.sub(this.offset)
				)
				this.selectedObject.position.y = 0
			}
		}
	}

	onPointerUp(event: MouseEvent) {
		if (this.mode === Mode.Move || this.mode === Mode.Draw) {
			this.selectedObject = null
			// this.offset = []
		} else if (this.mode === Mode.EditVertex) {
			if (this.selectedObject?.userData.name === "controlPoint") {
				//
				let polygon = this.selectedObject.parent
				this.scene.remove(this.selectedObject)
				this.scene.remove(polygon as THREE.Mesh)
				const cp = new THREE.Mesh(
					new THREE.SphereGeometry(0.1, 80, 80),
					new THREE.MeshBasicMaterial({ color: "red" })
				)
				cp.position.copy(this.intersects[0].point)
				cp.position.y = 0
				if (polygon) {
					polygon.userData.controlPoints =
						polygon.userData.controlPoints.filter(
							(cp: THREE.Mesh) => cp.id !== this.selectedObject?.id
						)
				}
				cp.userData.name = "controlPoint"
				this.selectedObject.parent?.userData.controlPoints.push(cp)
				const cps = this.selectedObject.parent?.userData.controlPoints
				if (cps) {
					this.createExtrudedPolygon(cps)
				}
			}
		}
		this.controls.enabled = true
	}

	createExtrudedPolygon(controlPoints: THREE.Mesh[]) {
		this.selectedObject = null
		const cps = controlPoints.map((cp) => {
			return new THREE.Vector2(cp.position.x, -1 * cp.position.z)
		})
		const shape = new THREE.Shape(cps)
		const extrudeSettings = {
			steps: 20,
			depth: 1,
			amount: 5,
			bevelEnabled: false,
		}
		const extrudeGeom = new THREE.ExtrudeGeometry(shape, extrudeSettings)
		extrudeGeom.rotateX(-Math.PI / 2)
		const polygon = new THREE.Mesh(
			extrudeGeom,
			new THREE.MeshPhongMaterial({ color: 0x00ff00 })
		)
		for (let i = 0; i < controlPoints.length; i++) {
			polygon.add(controlPoints[i])
		}
		polygon.userData.controlPoints = controlPoints
		polygon.userData.extrudeSettings = extrudeSettings
		this.controlPoints = []
		this.scene.add(polygon)
	}

	shiftSelectedObjectCondition() {
		return (
			this.selectedObject &&
			this.selectedObject.id !== this.planeId &&
			this.selectedObject.id !== this.axisHelperId &&
			((this.selectedObject.userData.name !== "controlPoint" &&
				this.mode === Mode.Move) ||
				(this.mode === Mode.EditVertex &&
					this.selectedObject.userData.name === "controlPoint"))
		)
	}
	updateOnWindowResize() {
		this.camera.aspect = window.innerWidth / window.innerHeight
		this.camera.updateProjectionMatrix()
		this.renderer.setSize(window.innerWidth, window.innerHeight)
	}

	onPointerDown(event: MouseEvent) {
		if (this.intersects.length === 0) {
			return
		}
		this.selectedObject = this.intersects[0].object as THREE.Mesh
		if (event.buttons === 1) {
			if (this.mode === Mode.Draw) {
				// To ensure that the user is not clicking on the same point or any other object in the scene
				if (this.intersects.length === 1) {
					var cp = new THREE.Mesh(
						new THREE.SphereGeometry(0.1, 80, 80),
						new THREE.MeshBasicMaterial({ color: "red" })
					)
					// Placing the control point on the plane
					cp.position.copy(this.intersects[0].point)
					cp.position.y = 0
					cp.userData.name = "controlPoint"
					this.controlPoints.push(cp)
					this.scene.add(cp)
				}
			} else if (this.mode === Mode.Move || this.mode === Mode.EditVertex) {
				console.log("Hi")
				if (
					this.mode === Mode.Move &&
					this.selectedObject.userData.name === "controlPoint"
				) {
					return
				}
				this.selectedObject = this.intersects[0].object as THREE.Mesh
				console.log(this.selectedObject.userData.controlPoints)
				this.offset.copy(
					this.intersects[0].point.sub(this.selectedObject.position)
				)
				this.offset.y = 0
			}
		} else if (event.buttons === 2) {
			if (this.mode === Mode.Draw && this.controlPoints.length > 2) {
				this.createExtrudedPolygon(this.controlPoints)
			}
		}
	}
}
