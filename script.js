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
let gameActive = true; // Score de base du joueur
let hasStarted = false; // etat de la boucle de jeu
let isPaused = false; // variable pour la pause
const gravity = 0.5; // force de la gravité
const jumpStrength = -12; // Force du saut normal
const superJumpStrength = -22; // force du rebond

// PROPRIÉTÉS DU JOUEUR
const player = {
    // Position de depart du joueur
    x: 185,
    y: 540,
    // taille du carré
    width: 30,
    height: 30,
    // vitesse de depart du joueur
    vx: 0,
    vy: 0,
    grounded: true // indique que au demarage le joueur est posé sur le sol
};

//GESTION DES PLATEFORMES
let platforms = []; // tableau qui contient toutes les plateformes qu'on voit

// Fonction pour créer une plateforme à une hauteur Y spécifique
function addPlatform(y) {
    const isSuper = Math.random() < 0.2; // 20% chance - plateforme jaune
    platforms.push({
        x: Math.random() * (canvas.width - 70), // position aléatoire sur l'axe x
        y: y, // Position Y donnée en paramètre
        width: 70, // largeur d'une plateforme
        height: 15, // hauteur d'une plateforme
        type: isSuper ? 'super' : 'normal', // type de plateforme
        isPassed: false // deviens true quand le joueur passe au-dessus et augment le score de 1
    });
}

// RESET DE LA PARTIE
function init() {
    // Reset du score et de l'état
    score = 0;
    gameActive = true; // active le systeme du jeu
    hasStarted = false; // Attend le premier saut pour commencer
    isPaused = false; // arrète la pause
    scoreElement.innerText = score; // met a jour l'affichage du score
    
    // Reset du joueur au centre
    player.x = canvas.width / 2 - 15;
    player.y = 540;
    player.vy = 0;
    player.vx = 0;
    player.grounded = true;

    // Reset du tableau des plateformes
    platforms = [];
    // ajout du sol de départ
    platforms.push({ x: 0, y: 570, width: canvas.width, height: 30, type: 'normal', isPassed: true });
    // ajout de la plateforme de départ (forcement au centre)
    platforms.push({ x: canvas.width / 2 - 35, y: 570 - 110, width: 70, height: 15, type: 'normal', isPassed: false });

    // Création des premières plateformes visibles
    for(let i = 2; i < 7; i++) { 
        addPlatform(570 - (i * 110)); // Espacement de 110 pixels entre chacunes
    }

    // Affichage de l'overlay de depart
    overlay.style.display = 'block';
    overlay.innerHTML = `<h1>TOWER CLIMBER</h1><p>FLECHES: BOUGER</p><p>ESPACE: PAUSE</p><p><i>SAUTER POUR COMMENCER</i></p>`;
}

// REGLAGE DES TOUCHES
const keys = {}; // stock quelles touches sont pressées
window.onkeydown = (e) => {
    if (e.code === 'Space') { // Si on appuie sur ESPACE (e.code pour l'espace car universel)
        if (!gameActive) { // si on était mort
            init(); // relancement
            requestAnimationFrame(loop);// relancement de l aboucle
        } else if (hasStarted) { // si on est en partie
            isPaused = !isPaused; // on inverse l'etat de isPaused
            overlay.style.display = isPaused ? 'block' : 'none'; // affiche ou cache le menu
            if (isPaused) {
                overlay.innerHTML = `<h1>PAUSE</h1><p><i>ESPACE POUR REPRENDRE</i></p>`;
            }
        }
        return; // quit la fonction
    }

    // On utilise e.key pour détecter la lettre réelle (Z, Q, D, etc.)
    keys[e.key.toLowerCase()] = true; // On enregistre en minuscule pour éviter les bugs de Majuscule
    keys[e.code] = true; // On garde e.code pour les flèches (ArrowUp, etc.)
};

window.onkeyup = (e) => { // Quand on relâche une touche
    keys[e.key.toLowerCase()] = false;
    keys[e.code] = false;
};

// PROGRAMME
function update() {
    if (!gameActive || isPaused) return; // Arret si game over ou pause

    // Déplacement horizontal
    if (keys['arrowleft'] || keys['q'] || keys['a']) player.vx = -6; // J'ajoute 'a' au cas où pour les QWERTY
    else if (keys['arrowright'] || keys['d']) player.vx = 6;
    else player.vx = 0; // arret direct si on lache

    // Saut
    if ((keys['arrowup'] || keys['z'] || keys['w']) && player.grounded) { // si joueur sur sol et une des 3 touches pressée
        player.vy = jumpStrength; // impulsion vers le haut
        player.grounded = false; // plus sur le sol
        if (!hasStarted) { 
            hasStarted = true; // le jeu commence si pas deja
            overlay.style.display = 'none'; // Cache le menu lors du commencement
        }
    }

    // Application de la gravitée
    if (hasStarted || !player.grounded) {
        player.vy += gravity; // gravité augment vitesse de chute
        // Les positions x et y changent selon la vitesse
        player.y += player.vy;
        player.x += player.vx;
    }

    // Si on par d'un coté on resort de l'autre
    if (player.x + player.width < 0) player.x = canvas.width;
    if (player.x > canvas.width) player.x = -player.width;

    // Collisions
    let currentlyOnGround = false;
    platforms.forEach(p => {
        // +1 point si le joueur passe une plateforme
        if (player.y < p.y && !p.isPassed) {
            p.isPassed = true; // marque comme passée
            score++; // augmente le score
            scoreElement.innerText = score; // actualise le score
        }

        // Atterrissage sur plateforme
        if (player.vy > 0) {
            if (player.x < p.x + p.width && player.x + player.width > p.x &&
                player.y + player.height > p.y && player.y + player.height < p.y + p.height + player.vy) {
                
                player.y = p.y - player.height; //Joueur pile au dessus de la plateforme
                
                if (p.type === 'super') { // si jaune
                    player.vy = superJumpStrength; // Rebond automatique et plus puissant
                    player.grounded = false;
                } else { // si pas jaune
                    player.vy = 0; // Stop la chute
                    currentlyOnGround = true; // on est sur le sol
                }
            }
        }
    });
    player.grounded = currentlyOnGround; // met a jour l'etat du joueur

    // Défilement
    if (hasStarted) {
        let scrollSpeed = 1.2; // Vitesse de descente automatique
        platforms.forEach(p => p.y += scrollSpeed); // les plateformes descendent
        player.y += scrollSpeed; // Le joueur descend aussi avec les plateformes

        // Suit le joueur s'il monte plus haut que la moitié
        if (player.y < canvas.height / 2) {
            let diff = canvas.height / 2 - player.y; // calcule de combien on doit dessendre
            platforms.forEach(p => p.y += diff); // descente de toutes les plateformes
            player.y += diff; // descente aussi du joueur
        }

        // Génération de plateforme en haut (infini)
        if (platforms.length > 0 && platforms[platforms.length - 1].y > 0) { // si la plateforme la plus haute devient visible
            addPlatform(platforms[platforms.length - 1].y - 110); // ajout d'une plateforme plus haut
        }
        // Suppression des plateformes plus visibles 
        platforms = platforms.filter(p => p.y < canvas.height + 100);

        // MENU DU GAME OVER 
        if (player.y > canvas.height) { // si le joueur tombe sous le bas de l'écran
            gameActive = false; // Arrête le jeu

            let highScore = localStorage.getItem('towerHighscore') || 0; // Récupère le record stocké dasn le navigateur
            
            if (score > highScore) { // si le score actuel est meilleur que le record
                highScore = score;
                localStorage.setItem('towerHighscore', highScore); // sauvegarde le nouveau record
            }

            overlay.innerHTML = `
                <h1>GAME OVER</h1>
                <p>SCORE: ${score}</p>
                <p style="color: #ffff00;">RECORD: ${highScore}</p> 
                <br>
                <p><i>ESPACE POUR REJOUER</i></p>
            `;
            overlay.style.display = 'block'; // Affiche l'écran de fin
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
    
    // fond assombri si pause
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
