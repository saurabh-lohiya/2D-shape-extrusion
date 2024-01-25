import * as THREE from "three"
import { ObjectType } from "../utils/interface"

export function createExtrudedPolygon(controlPoints: THREE.Mesh[]) {
	const geometry = new THREE.BufferGeometry()
	const vertices: any = []
	const indices: any = []

	controlPoints.forEach((cp, i) => {
		vertices.push(cp.position.x, cp.position.y, cp.position.z)
		indices.push(i)
	})

	const cpVertices = new Float32Array(vertices)
	geometry.setAttribute("position", new THREE.BufferAttribute(cpVertices, 3))

	const faces = []
	for (let i = 1; i < controlPoints.length - 1; i++) {
		faces.push(0, i, i + 1)
	}
	geometry.setIndex(faces)

	const material = new THREE.MeshStandardMaterial({
		color: 0x00ff00,
		side: THREE.DoubleSide,
	})

	const polygon = new THREE.Mesh(geometry, material)
	polygon.add(...controlPoints)
	polygon.userData.controlPoints = controlPoints
	polygon.userData.objectType = ObjectType.Polygon
	return polygon
}
