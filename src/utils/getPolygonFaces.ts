export function getPolygonVertices(controlPoints: THREE.Mesh[]) {
	const vertices: number[] = []
	controlPoints.forEach((cp) => {
		vertices.push(cp.position.x, cp.position.y, cp.position.z)
	})
	return new Float32Array(vertices)
}

export function getPolygonFaces(controlPoints: THREE.Mesh[]) {
	const faces = []
	for (let i = 1; i < controlPoints.length - 1; i++) {
		faces.push(0, i, i + 1)
	}
	return faces
}
