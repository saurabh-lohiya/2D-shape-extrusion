import * as BABYLON from "babylonjs";
import { AbstractMesh } from "babylonjs"
import { scene } from "../index"

export function extrudeShape(shapePoints: any, height: number) {
	// Create a 2D polygon from the points
	const polygon = BABYLON.MeshBuilder.CreatePolygon(
		"extrudePolygon",
		{
			shape: shapePoints,
			depth: 0.1, // Initial depth for the 2D shape
		},
		scene as any
	)

	// Extrude the 2D polygon to create a 3D object
	const extrudedObject = BABYLON.MeshBuilder.ExtrudePolygon(
		"extrudedObject",
		{
			shape: shapePoints,
			depth: height, // Extrusion height
		},
		scene as any
	)

	// Dispose of the 2D polygon as it is no longer needed
	polygon.dispose()
	return extrudedObject
}

// Function to get the position on the ground plane
export function getGroundPosition(event: PointerEvent) {
	const pickInfo = scene.pick(scene.pointerX, scene.pointerY)
	if (pickInfo.hit) {
		return pickInfo.pickedPoint
	}
	return null
}

export function getClosestVertexIndex(mesh: AbstractMesh, event: PointerEvent) {
	const pickResult = scene.pick(scene.pointerX, scene.pointerY)
	if (pickResult.hit) {
		const pickedVertex = getClosestVertexIndex(mesh, event)
		if (pickedVertex) {
			const vertexPositions = (pickedVertex as any).positions
			const clickPoint = getGroundPosition(event)
			let closestDist = Number.MAX_VALUE
			let closestIndex = null

			for (let i = 0; i < vertexPositions.length; i += 3) {
				const vertex = new BABYLON.Vector3(
					vertexPositions[i],
					vertexPositions[i + 1],
					vertexPositions[i + 2]
				)
				if (clickPoint) {
					const dist = BABYLON.Vector3.DistanceSquared(
						clickPoint as any,
						vertex
					)
					if (dist < closestDist) {
						closestDist = dist
						closestIndex = i / 3 // Vertex indices are represented in groups of 3 (x, y, z)
					}
				}

				return closestIndex
			}
		}
	}
	return null
}

// Function to edit the selected vertex
export function editVertex(
	mesh: BABYLON.Mesh,
	vertexIndex: number | null,
	delta: { x: number; y: number; z: number }
) {
	const vertexData = BABYLON.VertexData.ExtractFromMesh(mesh)
	const positions = vertexData.positions

	if (vertexIndex !== null && positions) {
		// Update the position of the selected vertex
		positions[vertexIndex * 3] += delta.x
		positions[vertexIndex * 3 + 1] += delta.y
		positions[vertexIndex * 3 + 2] += delta.z

		// Apply the updated positions to the mesh
		vertexData.applyToMesh(mesh)
	}
}
