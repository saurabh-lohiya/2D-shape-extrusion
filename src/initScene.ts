import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/Addons.js"

export class ThreeScene {
	public scene: THREE.Scene
	public camera: THREE.PerspectiveCamera
	public light: THREE.Light
	public renderer: THREE.WebGLRenderer
	public raycaster: THREE.Raycaster
	public controls: OrbitControls
	public mousePosition: THREE.Vector2
	public drawMode: boolean
	public moveMode: boolean
	public vertexEditMode: boolean
	public extrudedObjects: THREE.Mesh[]
	public selectedObject: THREE.Mesh | null
	public extrusionHeight: number
	public drawingLine: THREE.Line | null
	public axisHelper: THREE.AxesHelper
	public objects: THREE.Object3D[]
	public clickCount: number
	public controlPoints: THREE.Vector3[]
	public plane: THREE.Mesh
	public planeId: number
	public offset: THREE.Vector3
	public intersects: THREE.Intersection[]
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
		document.body.appendChild(this.renderer.domElement)
		this.raycaster = new THREE.Raycaster()
		this.controls = new OrbitControls(this.camera, this.renderer.domElement)
		this.mousePosition = new THREE.Vector2()
		this.drawMode = false
		this.moveMode = false
		this.vertexEditMode = false
		this.extrudedObjects = []
		this.selectedObject = null
		this.extrusionHeight = 5
		this.drawingLine = null
		this.axisHelper = new THREE.AxesHelper(20)
		this.controls.update()
		this.camera.position.set(2, 3, 20)
		// this.camera.rotateY(Math.PI / 4)
		// this.camera.rotateX(-Math.PI / 4)
		this.objects = []
		this.plane = this.addHorizontalPlane()
		this.planeId = this.plane.id
		this.clickCount = 0
		this.controlPoints = []
		this.offset = new THREE.Vector3()
		this.intersects = []
		this.setupCamera()
		this.objects.push(this.plane)
		this.addObjectsToScene(this.axisHelper, this.camera, this.light, this.plane)
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

	// Implement drag and drop functionality on mouse drag for selected object
	onPointerMove(e: MouseEvent) {
		this.mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1
		this.mousePosition.y = -(e.clientY / window.innerHeight) * 2 + 1
		this.raycaster.setFromCamera(this.mousePosition, this.camera)
		this.intersects = this.raycaster.intersectObjects(this.objects)
		if (
			this.moveMode &&
			this.selectedObject &&
			this.selectedObject.id !== this.planeId
		) {
			this.controls.enabled = false
			this.selectedObject.position.copy(
				this.intersects[0].point.sub(this.offset)
			)
			this.selectedObject.position.y = 0
		}
	}

	onPointerUp(event: MouseEvent) {
		if (this.moveMode || this.drawMode) {
			this.selectedObject = null
			this.controls.enabled = true
		}
	}

	onPointerDown(event: MouseEvent) {
		this.mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1
		this.mousePosition.y = -(event.clientY / window.innerHeight) * 2 + 1
		this.raycaster.setFromCamera(this.mousePosition, this.camera)
		this.intersects = this.raycaster.intersectObjects(this.objects)
		if (this.intersects.length > 0) {
			this.selectedObject = this.intersects[0].object as THREE.Mesh
			if (event.buttons === 1) {
				if (this.drawMode) {
					// To ensure that the user is not clicking on the same point or any other object in the scene
					if (this.intersects.length === 1) {
						var cp = new THREE.Mesh(
							new THREE.SphereGeometry(0.1, 80, 80),
							new THREE.MeshBasicMaterial({ color: "red" })
						)
						cp.position.copy(this.intersects[0].point)
						this.controlPoints.push(this.intersects[0].point.clone())
						this.scene.add(cp)
					}
				}
				if (this.moveMode) {
					this.selectedObject = this.intersects[0].object as THREE.Mesh
					this.offset
						.copy(this.intersects[0].point)
						.sub(this.selectedObject.position)
				}
			} else if (event.buttons === 2) {
				if (this.drawMode) {
					this.selectedObject = null
					console.log(this.controlPoints)
					const shape = new THREE.Shape()
					for (let i = 0; i < this.controlPoints.length; i++) {
						if (i === 0) {
							shape.moveTo(this.controlPoints[i].x, -this.controlPoints[i].z)
						}
						shape.lineTo(this.controlPoints[i].x, -this.controlPoints[i].z)
					}
					// add shape to scene
					const extrudeSettings = {
						steps: 10,
						depth: 1,
						amount: 2,
						bevelEnabled: false,
					}
					const extrudeGeom = new THREE.ExtrudeGeometry(shape, extrudeSettings)
					extrudeGeom.rotateX(-Math.PI / 2)
					const wall = new THREE.Mesh(
						extrudeGeom,
						new THREE.MeshStandardMaterial({
							color: "gray",
						})
					)
					this.scene.add(wall)
					this.objects.push(wall)
				}
			}
		}
	}
}
