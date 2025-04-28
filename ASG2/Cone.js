/// ChatGPT helped me with this class
class Cone {
    constructor() {
        this.type = 'cone';
        this.color = [1.0, 0.0, 0.0, 1.0]; // red
        this.matrix = new Matrix4();
        this.segments = 20; // smoother if higher
    }

    render() {
        var rgba = this.color;
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        let angleStep = 360 / this.segments;

        // Draw side triangles
        for (let i = 0; i < 360; i += angleStep) {
            let angle1 = i * Math.PI / 180;
            let angle2 = (i + angleStep) * Math.PI / 180;

            let x1 = Math.cos(angle1);
            let z1 = Math.sin(angle1);
            let x2 = Math.cos(angle2);
            let z2 = Math.sin(angle2);

            drawTriangle3D([
                0, 1, 0, // Top vertex
                x1, 0, z1, // Base vertex 1
                x2, 0, z2  // Base vertex 2
            ]);
        }

        // Draw base disk (optional)
        for (let i = 0; i < 360; i += angleStep) {
            let angle1 = i * Math.PI / 180;
            let angle2 = (i + angleStep) * Math.PI / 180;

            let x1 = Math.cos(angle1);
            let z1 = Math.sin(angle1);
            let x2 = Math.cos(angle2);
            let z2 = Math.sin(angle2);

            drawTriangle3D([
                0, 0, 0,
                x2, 0, z2,
                x1, 0, z1
            ]);
        }
    }
}
