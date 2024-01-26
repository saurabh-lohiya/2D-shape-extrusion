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
	private controlPoints: Mesh[]
	private offset: Vector3
	private intersects: Intersection[]
	// SO = Selected Object
	// SOOP = Selected Object Original Position
	// SOCP = Selected Object Current Position
	// MOP = Modified Object Position
	// SOHC = Selected Object Highlight Color
	// SOC = Selected Object Color
	// SOT = Selected Object Type
	private SO: Mesh | null
	private SOC: number
	private SOOP: Vector3 | null
	private SOCP: Vector3 | null
	private MOP: Vector3 | null
	private SOHC: number
	public extrusionHeight: number

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
		this.SO = null
		this.SOC = 0x00ff00
		this.SOOP = null
		this.SOCP = null
		this.MOP = null
		this.SOHC = 0x89cff3
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
		this.XYplane.visible = false
		this.YZplane.visible = false
		this.controlPoints = []
		this.offset = new Vector3()
		this.intersects = []
		this.extrusionHeight = 1
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
		this.camera.position.set(50, 50, 50)
		this.controls.minPolarAngle = MathUtils.degToRad(30)
		this.controls.maxPolarAngle = MathUtils.degToRad(75)
		this.controls.minDistance = 20
		this.controls.maxDistance = 80
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
		// OP: Original Polygon
		const OP = this.intersects.find((intersect) => {
			return intersect.object.userData.objectType === ObjectType.Polygon
		})
		const cps: Mesh[] = (OP?.object.children || []).map((obj) => obj as Mesh)
		const newControlPoints = cps.map((cp) => {
			const newCP = cp.clone()
			newCP.position.set(
				newCP.position.x,
				newCP.position.y + height,
				newCP.position.z
			)
			return newCP
		})
		const ucps = cps.concat(newControlPoints)
		const polygonVertices = getPolygonVertices(ucps)
		const topFaces = []
		const sideFaces = []
		const bottomFaces = []
		const n = cps.length
		for (let i = n + 1; i < 2 * cps.length - 1; i++) {
			topFaces.push(n, i, i + 1)
		}
		for (let i = 0; i < n; i++) {
			sideFaces.push(i, i + n, n + ((i + 1) % n))
			sideFaces.push(i, (i + 1) % n, n + ((i + 1) % n))
		}
		for (let i = 1; i < n - 1; i++) {
			bottomFaces.push(0, i, i + 1)
		}
		const faces = sideFaces.concat(topFaces).concat(bottomFaces)
		const polygon = createExtrudedPolygon(ucps, polygonVertices, faces)
		if (OP?.object) {
			this.scene.remove(OP.object)
		}
		polygon.userData.objectType = ObjectType.ExtrudedPolygon
		this.scene.add(polygon)
	}

	onKeyUp(e: KeyboardEvent) {
		if (e.key === "x") {
			this.scene.add(this.XYplane)
		}
		if (e.key === "z") {
			this.scene.add(this.YZplane)
		}
	}

	onPointerMove(e: MouseEvent) {
		this.mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1
		this.mousePosition.y = -(e.clientY / window.innerHeight) * 2 + 1
		this.raycaster.setFromCamera(this.mousePosition, this.camera)
		this.intersects = this.raycaster.intersectObjects(this.scene.children)
		const SOT = this.SO?.userData.objectType
		if (
			(this.mode === Mode.Move &&
				(SOT === ObjectType.Polygon || SOT === ObjectType.ExtrudedPolygon)) ||
			(this.mode === Mode.EditVertex && SOT === ObjectType.ControlPoint)
		) {
			this.controls.enabled = false
			this.SOCP = this.intersects[0].point.sub(this.offset)
			this.SOCP.y = this.SOCP.y < 0 ? 0 : this.SOCP.y
		}
	}

	moveObjectsInThreeD(e: KeyboardEvent) {
		if (this.SO) {
			if (this.SOOP && this.SOCP) {
				this.MOP = new Vector3(this.SOCP.x, this.SOCP.y, this.SOCP.z)
				if (e.key === "y") {
					this.MOP.y = this.SOOP.y
				} else if (e.key === "x") {
					this.scene.remove(this.XYplane)
					this.MOP.x = this.SOOP.x
				} else if (e.key === "z") {
					this.scene.remove(this.YZplane)
					this.MOP.z = this.SOOP.z
				}
				this.SO.position.copy(this.MOP)
			}
		}
	}

	updatePolygonOnVertexEdit() {
		// Update the polygon on vertex edit
		if (this.SO?.userData.objectType === ObjectType.ControlPoint && this.MOP) {
			const cp = this.SO
			const polygon = cp.parent
			const selectedCPindex = polygon?.children.findIndex(
				(cp) => cp.uuid === this.SO?.uuid
			)
			if (!polygon || !(polygon instanceof THREE.Mesh)) {
				return
			}
			const polygonGeometry = polygon.geometry as THREE.BufferGeometry
			const polygonVertices = polygonGeometry.getAttribute(
				"position"
			) as THREE.BufferAttribute
			const newCP = addControlPoint(this.MOP)
			polygon.remove(cp)
			this.scene.remove(cp)
			polygon.add(newCP)
			if (this.MOP) {
				polygonVertices.setXYZ(
					selectedCPindex as number,
					this.MOP.x,
					this.MOP.y,
					this.MOP.z
				)
			}
			polygonVertices.needsUpdate = true
		}
	}

	onPointerUp(e: MouseEvent) {
		this.undoHighlightSelectedObject()
		if (this.mode == Mode.Move || this.mode === Mode.Draw) {
			this.SO = null
		}
		if (this.mode === Mode.EditVertex) {
			this.updatePolygonOnVertexEdit()
		}
		this.controls.enabled = true
		this.MOP = null
		this.SOOP = null
		this.SOCP = null
	}

	updateOnWindowResize() {
		this.camera.aspect = window.innerWidth / window.innerHeight
		this.camera.updateProjectionMatrix()
		this.renderer.setSize(window.innerWidth, window.innerHeight)
	}

	highlightSelectedObject() {
		if (this.SO?.userData.objectType !== ObjectType.Fixed) {
			;(this.SO?.material as MeshBasicMaterial)?.color.setHex(this.SOHC)
		}
	}

	undoHighlightSelectedObject() {
		if (this.SO?.userData.objectType !== ObjectType.Fixed) {
			;(this.SO?.material as MeshBasicMaterial)?.color.setHex(this.SOC)
		}
	}

	onPointerDown(event: MouseEvent) {
		if (this.intersects.length === 0) {
			return
		}
		this.SO = this.intersects[0].object as Mesh
		this.SOC = (this.SO?.material as MeshBasicMaterial)?.color.getHex()
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
					this.SOOP = this.SO.position.clone()
					this.offset.copy(this.intersects[0].point.sub(this.SO.position))
				}
				// OP: Original Polygon
				const OP = this.intersects.find((intersect) => {
					return intersect.object.userData.objectType === ObjectType.Polygon
				})
				if (this.mode === Mode.Extrude && OP) {
					this.extrudeSelectedShape(this.extrusionHeight)
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
				this.controlPoints = []
			}
		}
	}
}
