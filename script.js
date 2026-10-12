const SHAPE_TYPES = ['square', 'circle', 'triangle'];

// Genereaza o culoare HSL aleatorie
function randomColor() {
    const hue = Math.floor(Math.random() * 360);
    const saturation = 70;
    const lightness = 55;
    return "hsl(" + hue + ", " + saturation + "%, " + lightness + "%)";
}

// Alege aleatoriu un tip din cele 3 forme
function randomShapeType() {
    const index = Math.floor(Math.random() * SHAPE_TYPES.length);
    return SHAPE_TYPES[index];
}

function clamp(value, min, max) {
    if (value < min) return min;
    if (value > max) return max;
    return value;
}

class Shape {
    constructor(x, y, size, color, type) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
        if (type) {
            this.type = type;
        } else {
            this.type = randomShapeType();
        }
        this.speedY = 0; // viteza pe verticala
    }

    // Actualizeaza pozitia formei cu gravitatie
    update(gravity) {
        this.speedY += gravity;
        this.y += this.speedY;
    }

    draw(ctx) {
        const half = this.size / 2;
        ctx.fillStyle = this.color;
        ctx.beginPath();

        if (this.type === 'square') {
            ctx.fillRect(this.x, this.y, this.size, this.size);
        } else if (this.type === 'circle') {
            ctx.arc(this.x + half, this.y + half, half, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'triangle') {
            ctx.moveTo(this.x + half, this.y);
            ctx.lineTo(this.x, this.y + this.size);
            ctx.lineTo(this.x + this.size, this.y + this.size);
            ctx.closePath();
            ctx.fill();
        }
    }

    // Verifica daca s-a dat click pe această forma
    isClicked(mouseX, mouseY) {
        if (this.type === 'circle') {
            const cx = this.x + this.size / 2;
            const cy = this.y + this.size / 2;
            const dx = mouseX - cx;
            const dy = mouseY - cy;
            return dx * dx + dy * dy <= (this.size / 2) * (this.size / 2);
        } else {
            if (mouseX >= this.x && mouseX <= this.x + this.size && mouseY >= this.y && mouseY <= this.y + this.size) {
                return true;
            }
            return false;
        }
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.shapes = [];
        this.gravity = 0.3;
        this.shapesPerSecond = 1;
        this.minShapesPerSecond = 1;
        this.maxShapesPerSecond = 10;
        this.spawnInterval = 1000 / this.shapesPerSecond;
        this.lastSpawnTime = 0;

        this.bindControls();
        this.bindCanvas();
        this.updateValues();
        this.loop(0);
    }

    bindControls() {
        const btnFpsMinus = document.getElementById('btn-fps-minus');
        const btnFpsPlus = document.getElementById('btn-fps-plus');
        const btnGravMinus = document.getElementById('btn-grav-minus');
        const btnGravPlus = document.getElementById('btn-grav-plus');

        if (btnFpsMinus) {
            btnFpsMinus.addEventListener('click', () => {
                this.updateSpawnRate(-1);
            });
        }
        if (btnFpsPlus) {
            btnFpsPlus.addEventListener('click', () => {
                this.updateSpawnRate(1);
            });
        }

        if (btnGravMinus) {
            btnGravMinus.addEventListener('click', () => {
                this.gravity = Math.max(0.1, Number((this.gravity - 0.1).toFixed(1)));
                this.updateValues();
            });
        }
        if (btnGravPlus) {
            btnGravPlus.addEventListener('click', () => {
                this.gravity = Math.min(2, Number((this.gravity + 0.1).toFixed(1)));
                this.updateValues();
            });
        }
    }

    // click-ul pe canvas
    bindCanvas() {
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            let clickedIndex = -1;
            for (let i = 0; i < this.shapes.length; i++) {
                if (this.shapes[i].isClicked(mouseX, mouseY)) {
                    clickedIndex = i;
                    break;
                }
            }

            if (clickedIndex !== -1) {
                this.shapes.splice(clickedIndex, 1);
            } else {
                const size = 40;
                this.shapes.push(new Shape(mouseX, mouseY, size, randomColor(), randomShapeType()));
            }

            this.updateHUD();
        });
    }

    updateSpawnRate(delta) {
        this.shapesPerSecond = clamp(this.shapesPerSecond + delta, this.minShapesPerSecond, this.maxShapesPerSecond);
        this.spawnInterval = 1000 / this.shapesPerSecond;
        this.updateValues();
    }

    updateValues() {
        const fpsValue = document.getElementById('val-fps');
        const gravityValue = document.getElementById('val-grav');

        if (fpsValue) fpsValue.textContent = String(this.shapesPerSecond);
        if (gravityValue) gravityValue.textContent = Number(this.gravity).toFixed(1);
    }

    // Genereaza automat o forma noua sus pe ecran
    spawnShape() {
        const size = 40;
        const randomX = Math.random() * (this.canvas.width - size);
        this.shapes.push(new Shape(randomX, -size, size, randomColor(), randomShapeType()));
    }

    loop(timestamp) {
        if (timestamp - this.lastSpawnTime >= this.spawnInterval) {
            this.spawnShape();
            this.lastSpawnTime = timestamp;
            this.updateHUD();
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (let i = this.shapes.length - 1; i >= 0; i--) {
            let shape = this.shapes[i];
            shape.update(this.gravity);
            shape.draw(this.ctx);

            if (shape.y > this.canvas.height + shape.size) {
                this.shapes.splice(i, 1);
                this.updateHUD();
            }
        }

        requestAnimationFrame((ts) => {
            this.loop(ts);
        });
    }

    // Actualizeaza panoul
    updateHUD() {
        document.getElementById('shape-count').textContent = this.shapes.length;

        let totalArea = 0;
        for (let i = 0; i < this.shapes.length; i++) {
            totalArea += this.shapes[i].size * this.shapes[i].size;
        }

        document.getElementById('shape-area').textContent = totalArea + ' px²';
    }
}

window.onload = function() {
    new Game();
};