import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/Addons.js"
import { Mode, ObjectType } from "./utils/interface"
import {
	addControlPoint,
	createExtrudedPolygon,
	createPlane,
} from "./components"

export class ThreeScene {
	private readonly scene: THREE.Scene
	private readonly camera: THREE.PerspectiveCamera
	private readonly mainLight: THREE.DirectionalLight
	private readonly ambientLight: THREE.AmbientLight
	public readonly renderer: THREE.WebGLRenderer
	private readonly raycaster: THREE.Raycaster
	private readonly controls: OrbitControls
	private readonly axisHelper: THREE.AxesHelper
	private readonly plane: THREE.Mesh
	private mousePosition: THREE.Vector2
	public mode: Mode
	private selectedObject: THREE.Mesh | null
	private controlPoints: THREE.Mesh[]
	private offset: THREE.Vector3
	private intersects: THREE.Intersection[]
	private selectedObjectColor: number
	private highlightColor: number

	constructor() {
		this.scene = new THREE.Scene()
		this.camera = new THREE.PerspectiveCamera(
			75,
			window.innerWidth / window.innerHeight,
			0.1,
			1000
		)
		this.mainLight = new THREE.DirectionalLight(0xffffff, 5)
		this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
		this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
		this.renderer.setSize(window.innerWidth, window.innerHeight)
		this.raycaster = new THREE.Raycaster()
		this.controls = new OrbitControls(this.camera, this.renderer.domElement)
		this.mousePosition = new THREE.Vector2()
		this.mode = Mode.Draw
		this.selectedObject = null
		this.selectedObjectColor = 0x00ff00
		this.highlightColor = 0x89cff3
		this.axisHelper = new THREE.AxesHelper(20)
		this.controls.update()
		this.plane = createPlane()
		this.controlPoints = []
		this.offset = new THREE.Vector3()
		this.intersects = []
		this.sceneSetup()
	}

	setAnimationLoopForRenderer() {
		this.renderer.setAnimationLoop(() => {
			this.renderer.render(this.scene, this.camera)
		})
	}

	sceneSetup() {
		this.camera.rotateY(Math.PI / 4)
		this.camera.rotateX(-Math.PI / 4)
		this.camera.position.set(20, 20, 20)
		this.mainLight.position.set(20, 20, 20)
		this.controls.minPolarAngle = THREE.MathUtils.degToRad(45)
		this.controls.maxPolarAngle = THREE.MathUtils.degToRad(75)
		this.controls.minDistance = 20
		this.controls.maxDistance = 40
		this.controls.enableDamping = true
		this.addObjectsToScene(
			this.axisHelper,
			this.camera,
			this.mainLight,
			this.plane,
			this.ambientLight
		)
		this.controls.addEventListener("change", () => {
			this.mainLight.position.copy(this.camera.position)
		})
		this.renderer.setClearColor(0x000000, 0)
		this.setAnimationLoopForRenderer()
		this.axisHelper.userData.objectType = ObjectType.Fixed
		this.plane.userData.objectType = ObjectType.Fixed
	}

	addObjectsToScene(...objects: THREE.Object3D[]) {
		this.scene.add(...objects)
	}

	updateMode(mode: Mode) {
		this.mode = mode
		if (mode !== this.mode && this.mode === Mode.Draw) {
			this.controlPoints = []
		}
	}

	extrudeSelectedShape(height: number) {
		if (this.selectedObject) {
			if (this.selectedObject.userData.objectType === ObjectType.Fixed) return
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

	updatePolygonOnVertexEdit() {
		if (this.selectedObject?.userData.objectType === ObjectType.ControlPoint) {
			let polygon = this.selectedObject.parent
			this.scene.remove(this.selectedObject)
			this.scene.remove(polygon as THREE.Mesh)
			const cp = addControlPoint(this.intersects[0].point)
			if (polygon) {
				polygon.userData.controlPoints = polygon.userData.controlPoints.map(
					(temp_cp: THREE.Mesh) => {
						if (temp_cp.id === this.selectedObject?.id) {
							return cp
						}
						return temp_cp
					}
				)
			}
			const cps = this.selectedObject.parent?.userData.controlPoints
			if (cps) {
				const polygon = createExtrudedPolygon(cps)
				this.controlPoints = []
				this.scene.add(polygon)
			}
		}
	}

	onPointerUp(e: MouseEvent) {
		this.undoHighlightSelectedObject()
		if (this.mode == Mode.Move || this.mode === Mode.Draw) {
			this.selectedObject = null
		} else if (this.mode === Mode.EditVertex) {
			this.updatePolygonOnVertexEdit()
		}
		this.controls.enabled = true
	}

	shiftSelectedObjectCondition() {
		const selectedObjectType = this.selectedObject?.userData.objectType
		return (
			(this.mode === Mode.Move && selectedObjectType === ObjectType.Polygon) ||
			(this.mode === Mode.EditVertex &&
				selectedObjectType === ObjectType.ControlPoint)
		)
	}

	updateOnWindowResize() {
		this.camera.aspect = window.innerWidth / window.innerHeight
		this.camera.updateProjectionMatrix()
		this.renderer.setSize(window.innerWidth, window.innerHeight)
	}

	highlightSelectedObject() {
		if (this.mode === Mode.Move || this.mode === Mode.Extrude) {
			if (this.selectedObject?.userData.objectType !== ObjectType.Fixed) {
				this.selectedObjectColor = (
					this.selectedObject?.material as THREE.MeshBasicMaterial
				).color.getHex()
				;(
					this.selectedObject?.material as THREE.MeshBasicMaterial
				).color.setHex(this.highlightColor)
			}
		}
	}

	undoHighlightSelectedObject() {
		if (this.mode === Mode.Move || this.mode === Mode.Extrude) {
			if (this.selectedObject?.userData.objectType !== ObjectType.Fixed) {
				;(
					this.selectedObject?.material as THREE.MeshBasicMaterial
				).color.setHex(this.selectedObjectColor)
			}
		}
	}

	onPointerDown(event: MouseEvent) {
		if (this.intersects.length === 0) {
			return
		}
		this.selectedObject = this.intersects[0].object as THREE.Mesh
		if (event.buttons === 1) {
			if (
				this.mode === Mode.Draw &&
				this.intersects[0].object.userData.objectType === ObjectType.Fixed
			) {
				const cp = addControlPoint(this.intersects[0].point)
				if (cp) {
					this.controlPoints.push(cp)
					this.scene.add(cp)
				}
			} else if (this.shiftSelectedObjectCondition()) {
				this.offset.copy(
					this.intersects[0].point.sub(this.selectedObject.position)
				)
				this.offset.y = 0
			}
			if (this.mode === Mode.Move || this.mode === Mode.Extrude) {
				this.highlightSelectedObject()
			}
		} else if (event.buttons === 2) {
			if (this.mode === Mode.Draw && this.controlPoints.length > 2) {
				const polygon = createExtrudedPolygon(this.controlPoints)
				this.controlPoints = []
				this.scene.add(polygon)
			}
		}
	}
}
