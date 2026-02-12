// INITIALISATION DES ÉLÉMENTS DU DOM
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const overlay = document.getElementById('overlay');

// Configuration du canvas
canvas.width = 400;
canvas.height = 600;

// VARIABLES DE CONFIGURATION DU JEU
let score = 0;
let gameActive = true;
let hasStarted = false;
let isPaused = false; // Nouvelle variable pour la pause
const gravity = 0.5;
const jumpStrength = -12;
const superJumpStrength = -22;

// PROPRIÉTÉS DU JOUEUR
const player = {
    x: 185,
    y: 540,
    width: 30,
    height: 30,
    vx: 0,
    vy: 0,
    grounded: true
};

//GESTION DES PLATEFORMES
let platforms = [];

// Fonction pour créer une plateforme à une hauteur Y spécifique
function addPlatform(y) {
    const isSuper = Math.random() < 0.2;
    platforms.push({
        x: Math.random() * (canvas.width - 70),
        y: y,
        width: 70,
        height: 15,
        type: isSuper ? 'super' : 'normal',
        isPassed: false
    });
}

// RESET DE LA PARTIE
function init() {
    // Reset du score et de l'état
    score = 0;
    gameActive = true;
    hasStarted = false;
    isPaused = false;
    scoreElement.innerText = score;
    
    // Reset du joueur au centre
    player.x = canvas.width / 2 - 15;
    player.y = 540;
    player.vy = 0;
    player.vx = 0;
    player.grounded = true;

    // Reset des plateformes
    platforms = [];
    // Le sol de départ
    platforms.push({ x: 0, y: 570, width: canvas.width, height: 30, type: 'normal', isPassed: true });
    // La plateforme de départ au centre
    platforms.push({ x: canvas.width / 2 - 35, y: 570 - 110, width: 70, height: 15, type: 'normal', isPassed: false });

    // Création des premières plateformes visibles
    for(let i = 2; i < 7; i++) { 
        addPlatform(570 - (i * 110)); 
    }

    // Affichage de l'overlay de lancement
    overlay.style.display = 'block';
    overlay.innerHTML = `<h1>TOWER CLIMBER</h1><p>FLECHES: BOUGER</p><p>ESPACE: PAUSE</p><p><i>SAUTER POUR COMMENCER</i></p>`;
}

// REGLAGE DES TOUCHES
const keys = {};
window.onkeydown = (e) => {
    // Gestion de la pause avec Espace (on utilise e.code pour l'espace car universel)
    if (e.code === 'Space') {
        if (!gameActive) {
            init();
            requestAnimationFrame(loop);
        } else if (hasStarted) {
            isPaused = !isPaused;
            overlay.style.display = isPaused ? 'block' : 'none';
            if (isPaused) {
                overlay.innerHTML = `<h1>PAUSE</h1><p><i>ESPACE POUR REPRENDRE</i></p>`;
            }
        }
        return;
    }

    // On utilise e.key pour détecter la lettre réelle (Z, Q, D, etc.)
    keys[e.key.toLowerCase()] = true; // On force en minuscule pour éviter les bugs de Majuscule
    keys[e.code] = true; // On garde e.code pour les flèches (ArrowUp, etc.)
};

window.onkeyup = (e) => {
    keys[e.key.toLowerCase()] = false;
    keys[e.code] = false;
};

// PROGRAMME
function update() {
    if (!gameActive || isPaused) return; // Arret si game over ou pause

    // Déplacement horizontal
    if (keys['arrowleft'] || keys['q'] || keys['a']) player.vx = -6; // J'ajoute 'a' au cas où pour les QWERTY
    else if (keys['arrowright'] || keys['d']) player.vx = 6;
    else player.vx = 0;

    // Saut
    if ((keys['arrowup'] || keys['z'] || keys['w']) && player.grounded) {
        player.vy = jumpStrength;
        player.grounded = false;
        if (!hasStarted) { 
            hasStarted = true; 
            overlay.style.display = 'none'; // Disparition du menu lors du commencement
        }
    }

    // Application de la gravitée
    if (hasStarted || !player.grounded) {
        player.vy += gravity;
        player.y += player.vy;
        player.x += player.vx;
    }

    // Si on par d'un coté on resort de l'autre
    if (player.x + player.width < 0) player.x = canvas.width;
    if (player.x > canvas.width) player.x = -player.width;

    // Collisions / augmentation de points
    let currentlyOnGround = false;
    platforms.forEach(p => {
        // +1 point si le joueur passe une plateforme
        if (player.y < p.y && !p.isPassed) {
            p.isPassed = true;
            score++;
            scoreElement.innerText = score;
        }

        // Atterrissage sur plateforme
        if (player.vy > 0) {
            if (player.x < p.x + p.width && player.x + player.width > p.x &&
                player.y + player.height > p.y && player.y + player.height < p.y + p.height + player.vy) {
                
                player.y = p.y - player.height; //Joueur sur la plateforme
                
                if (p.type === 'super') {
                    player.vy = superJumpStrength; // Rebond si jaune
                    player.grounded = false;
                } else {
                    player.vy = 0; // Stop la chute
                    currentlyOnGround = true;
                }
            }
        }
    });
    player.grounded = currentlyOnGround;

    // Défilement
    if (hasStarted) {
        let scrollSpeed = 1.2;
        platforms.forEach(p => p.y += scrollSpeed);
        player.y += scrollSpeed;

        // Suit le joueur s'il monte trop haut
        if (player.y < canvas.height / 2) {
            let diff = canvas.height / 2 - player.y;
            platforms.forEach(p => p.y += diff);
            player.y += diff;
        }

        // Génération de plateforme en haut (infini)
        if (platforms.length > 0 && platforms[platforms.length - 1].y > 0) {
            addPlatform(platforms[platforms.length - 1].y - 110);
        }
        // Suppression des plateformes plus visibles (optimisation des perfs)
        platforms = platforms.filter(p => p.y < canvas.height + 100);

        // MENU DU GAME OVER / HIGH SCORE
        if (player.y > canvas.height) {
            gameActive = false;
            
            let highScore = localStorage.getItem('towerHighscore') || 0;
            
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('towerHighscore', highScore);
            }

            overlay.innerHTML = `
                <h1>GAME OVER</h1>
                <p>SCORE: ${score}</p>
                <p style="color: #ffff00;">RECORD: ${highScore}</p> 
                <br>
                <p><i>ESPACE POUR REJOUER</i></p>
            `;
            overlay.style.display = 'block';
        }
    }
}

// RENDU GRAPHIQUE
function draw() {
    // Effacement du canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desing des plateformes
    platforms.forEach(p => {
        ctx.fillStyle = (p.type === 'super') ? '#ffff00' : '#00ffcc';
        ctx.fillRect(p.x, p.y, p.width, p.height);
    });

    // Desing du joueur
    ctx.fillStyle = '#ff0055';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Petit indicateur visuel de pause sur le canvas
    if (isPaused) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

// BOUCLE DE JEU
function loop() {
    update();
    draw();
    if (gameActive) requestAnimationFrame(loop);
}

// Lancement initial
init();
loop();
