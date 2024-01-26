import * as THREE from "three"
import { ObjectType } from "../utils/interface"

export function createExtrudedPolygon(
	controlPoints: THREE.Mesh[],
	vertices: Float32Array,
	faces: number[]
) {
	// const cpVectors = controlPoints.map((cp) => cp.position)
	const geometry = new THREE.BufferGeometry()
	const material = new THREE.MeshStandardMaterial({
		color: 0x00ff00,
		side: THREE.DoubleSide,
	})
	geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3))
	geometry.setIndex(faces)
	const polygon = new THREE.Mesh(geometry, material)
	polygon.geometry.computeVertexNormals()
	polygon.add(...controlPoints)
	polygon.userData.controlPoints = controlPoints
	polygon.userData.objectType = ObjectType.Polygon
	return polygon
}

