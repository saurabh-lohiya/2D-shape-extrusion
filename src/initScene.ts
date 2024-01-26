import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/Addons.js"
import { Mode, ObjectType } from "./utils/interface"
import {
	addControlPoint,
	createExtrudedPolygon,
	createPlane,
} from "./components"
import { getPolygonFaces, getPolygonVertices } from "./utils/getPolygonFaces"
import {
	Scene,
	PerspectiveCamera,
	DirectionalLight,
	AmbientLight,
	WebGLRenderer,
	Raycaster,
	Vector2,
	Object3D,
	AxesHelper,
	MathUtils,
	Mesh,
	MeshBasicMaterial,
	Intersection,
	Vector3,
} from "three"

export class ThreeScene {
	private readonly scene: Scene
	private readonly camera: PerspectiveCamera
	private readonly mainLight: DirectionalLight
	private readonly ambientLight: AmbientLight
	public readonly renderer: WebGLRenderer
	private readonly raycaster: Raycaster
	private readonly controls: OrbitControls
	private readonly axisHelper: AxesHelper
	private readonly XZplane: Mesh
	private readonly YZplane: Mesh
	private readonly XYplane: Mesh
	private mousePosition: Vector2
	public mode: Mode
	private selectedObject: Mesh | null
	private controlPoints: Mesh[]
	private offset: Vector3
	private intersects: Intersection[]
	private selectedObjectColor: number
	private SOP: Vector3 | null
	private SOPC: Vector3 | null
	private highlightColor: number
	public extrudeSelectedPolygon: boolean

	constructor() {
		this.scene = new Scene()
		this.camera = new PerspectiveCamera(
			75,
			window.innerWidth / window.innerHeight,
			0.1,
			1000
		)
		this.mainLight = new DirectionalLight(0xffffff, 5)
		this.ambientLight = new AmbientLight(0xffffff, 0.5)
		this.renderer = new WebGLRenderer({ alpha: true, antialias: true })
		this.renderer.setSize(window.innerWidth, window.innerHeight)
		this.raycaster = new Raycaster()
		this.controls = new OrbitControls(this.camera, this.renderer.domElement)
		this.mousePosition = new Vector2()
		this.mode = Mode.Draw
		this.selectedObject = null
		this.selectedObjectColor = 0x00ff00
		this.SOP = null
		this.SOPC = null
		this.highlightColor = 0x89cff3
		this.axisHelper = new AxesHelper(100)
		this.controls.update()
		this.XYplane = createPlane(0xffffaa, true, 0.1, new Vector3(0, 0, 0))
		this.YZplane = createPlane(
			0xffffff,
			true,
			0.1,
			new Vector3(0, Math.PI / 2, 0)
		)
		this.XZplane = createPlane(
			0xffffff,
			true,
			1,
			new Vector3(Math.PI / 2, 0, 0)
		)
		// this.XYplane.position.y = -0.5
		this.XYplane.visible = false
		this.YZplane.visible = false
		this.controlPoints = []
		this.offset = new Vector3()
		this.intersects = []
		this.extrudeSelectedPolygon = false
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
		this.controls.minPolarAngle = MathUtils.degToRad(45)
		this.controls.maxPolarAngle = MathUtils.degToRad(75)
		this.controls.minDistance = 20
		this.controls.maxDistance = 40
		this.controls.enableDamping = true
		this.addObjectsToScene(
			this.axisHelper,
			this.camera,
			this.mainLight,
			this.XYplane,
			this.YZplane,
			this.XZplane,
			this.ambientLight
		)
		this.controls.addEventListener("change", () => {
			this.mainLight.position.copy(this.camera.position)
		})
		this.renderer.setClearColor(0x000000, 0)
		this.setAnimationLoopForRenderer()
		this.axisHelper.userData.objectType = ObjectType.Fixed
		this.XZplane.userData.objectType = ObjectType.Fixed
		this.XYplane.userData.objectType = ObjectType.Fixed
		this.YZplane.userData.objectType = ObjectType.Fixed
	}

	addObjectsToScene(...objects: Object3D[]) {
		this.scene.add(...objects)
	}

	updateMode(mode: Mode) {
		this.mode = mode
		if (mode !== this.mode && this.mode === Mode.Draw) {
			this.controlPoints = []
		}
	}

	extrudeSelectedShape(height: number) {
		const SO = this.intersects.find((intersect) => {
			return intersect.object.userData.objectType === ObjectType.Polygon
		})
		const cps: Mesh[] = (SO?.object.children || []).map((obj) => obj as Mesh)
		const newControlPoints = cps.map((cp) => {
			const newCP = cp.clone()
			newCP.position.set(newCP.position.x, height, newCP.position.z)
			return newCP
		})
		const ucps = cps.concat(newControlPoints)
		const polygonVertices = getPolygonVertices(ucps)
		const topFaces = []
		const sideFaces = []
		const n = cps.length
		for (let i = n + 1; i < 2 * cps.length - 1; i++) {
			topFaces.push(n, i, i + 1)
		}
		for (let i = 0; i < n; i++) {
			sideFaces.push(i, i + n, n + ((i + 1) % n))
			sideFaces.push(i, (i + 1) % n, n + ((i + 1) % n))
		}
		const polygon = createExtrudedPolygon(
			ucps,
			polygonVertices,
			sideFaces.concat(topFaces)
		)
		if (SO?.object) {
			this.scene.remove(SO.object)
			polygon.add(SO.object)
		}
		polygon.userData.objectType = ObjectType.ExtrudedPolygon
		this.scene.add(polygon)
	}

	// Implement drag and drop functionality on mouse drag for selected object
	onPointerMove(e: MouseEvent) {
		this.mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1
		this.mousePosition.y = -(e.clientY / window.innerHeight) * 2 + 1
		this.raycaster.setFromCamera(this.mousePosition, this.camera)
		this.intersects = this.raycaster.intersectObjects(this.scene.children)
		const SOT = this.selectedObject?.userData.objectType
		if (
			(this.mode === Mode.Move &&
				(SOT === ObjectType.Polygon || SOT === ObjectType.ExtrudedPolygon)) ||
			(this.mode === Mode.EditVertex && SOT === ObjectType.ControlPoint)
		) {
			this.controls.enabled = false
			this.SOPC = this.intersects[0].point.sub(this.offset)
		}
	}

	moveObjectsInThreeD(e: KeyboardEvent) {
		if (this.selectedObject) {
			console.log(this.SOP)
			if (this.SOP && this.SOPC) {
				if (e.key === "y") {
					this.selectedObject.position.set(this.SOPC.x, this.SOP.y, this.SOPC.z)
				} else if (e.key === "x") {
					this.selectedObject.position.set(this.SOP.x, this.SOPC.y, this.SOPC.z)
				} else if (e.key === "z") {
					this.selectedObject.position.set(this.SOPC.x, this.SOPC.y, this.SOP.z)
				}
			}
		}
	}

	updatePolygonOnVertexEdit() {
		if (this.selectedObject?.userData.objectType === ObjectType.ControlPoint) {
			let polygon = this.selectedObject.parent

			polygon.userData.controlPoints = polygon.userData.controlPoints.map(
				(temp_cp: Mesh) => {
					if (temp_cp.id === this.selectedObject?.id) {
						return cp
					}
					return temp_cp
				}
			)
		}
	}

	onPointerUp(e: MouseEvent) {
		this.undoHighlightSelectedObject()
		if (
			this.mode == Mode.Move ||
			this.mode === Mode.Draw ||
			this.mode === Mode.EditVertex
		) {
			this.selectedObject = null
		}
		if (this.mode === Mode.EditVertex) {
			this.updatePolygonOnVertexEdit()
		}
		this.controls.enabled = true
	}

	updateOnWindowResize() {
		this.camera.aspect = window.innerWidth / window.innerHeight
		this.camera.updateProjectionMatrix()
		this.renderer.setSize(window.innerWidth, window.innerHeight)
	}

	highlightSelectedObject() {
		if (this.selectedObject?.userData.objectType !== ObjectType.Fixed) {
			this.selectedObjectColor = (
				this.selectedObject?.material as MeshBasicMaterial
			)?.color.getHex()
			;(this.selectedObject?.material as MeshBasicMaterial)?.color.setHex(
				this.highlightColor
			)
		}
	}

	undoHighlightSelectedObject() {
		if (this.selectedObject?.userData.objectType !== ObjectType.Fixed) {
			;(this.selectedObject?.material as MeshBasicMaterial)?.color.setHex(
				this.selectedObjectColor
			)
		}
	}

	onPointerDown(event: MouseEvent) {
		if (this.intersects.length === 0) {
			return
		}
		this.selectedObject = this.intersects[0].object as Mesh
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
			} else if (
				this.mode === Mode.Move ||
				this.mode === Mode.Extrude ||
				this.mode === Mode.EditVertex
			) {
				this.highlightSelectedObject()
				if (this.mode === Mode.EditVertex || this.mode === Mode.Move) {
					this.SOP = this.selectedObject.position.clone()
					this.offset.copy(
						this.intersects[0].point.sub(this.selectedObject.position)
					)
				}
				const SO = this.intersects.find((intersect) => {
					return intersect.object.userData.objectType === ObjectType.Polygon
				})
				console.log(SO)
				if (this.mode === Mode.Extrude && SO) {
					this.extrudeSelectedShape(5)
				}
			}
		} else if (event.buttons === 2) {
			if (this.mode === Mode.Draw && this.controlPoints.length > 2) {
				const polygonVertices = getPolygonVertices(this.controlPoints)
				const polygonFaces = getPolygonFaces(this.controlPoints)
				const polygon = createExtrudedPolygon(
					this.controlPoints,
					polygonVertices,
					polygonFaces
				)
				this.scene.add(polygon)
			}
		}
	}
}
