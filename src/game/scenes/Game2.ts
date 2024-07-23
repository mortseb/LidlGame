import { EventBus } from '../EventBus'
import { Scene } from 'phaser'

export class Game2 extends Scene {
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    gameText: Phaser.GameObjects.Text;
    player: Phaser.Physics.Arcade.Sprite;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    spaceKey: Phaser.Input.Keyboard.Key;
    inventory: { [key: string]: { count: number, price: number } } = {};
    inventoryText: Phaser.GameObjects.Text;
    solids: Phaser.Physics.Arcade.StaticGroup;
    lastCollectTime: number = 0;
    initialPlayerPosition = { x: 962, y: 384 };
    startTime: number = 0;
    timerText: Phaser.GameObjects.Text;
    itemsToCollect: string[] = ['Vin', 'Banane', 'Pomme', 'Charcuterie', 'Eau Plate', 'Eau Gazeuze', 'Croissants', 'Savons', 'Citrons', 'Fromage', 'Frites', 'Pates', 'Patates', 'Pains', 'Bonbons', 'Biscuits'];
    timerStarted: boolean = false;

    constructor() {
        super('Game2');
    }

    create() {
        // Définir la couleur de fond de la caméra à bleu clair
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0xadd8e6);

        // Ajouter un arrière-plan avec transparence
        this.background = this.add.image(512, 384, 'background');
        this.background.setAlpha(0.5);

        // Ajouter le joueur (petit personnage)
        this.player = this.physics.add.sprite(this.initialPlayerPosition.x, this.initialPlayerPosition.y, 'player');
        this.player.setScale(0.15);
        this.player.setOrigin(0.5, 0.5); // Centrer l'origine du joueur
        this.player.setCollideWorldBounds(true);

        // Créer un groupe d'objets solides
        this.solids = this.physics.add.staticGroup();

        const createRayons = (positions: { x: number, y: number, item: string, price: number }[], key: string, scale: number) => {
            positions.forEach(pos => {
                const rayon = this.solids.create(pos.x, pos.y, key) as Phaser.Physics.Arcade.Sprite;
                rayon.setScale(scale);
                rayon.setOrigin(0, 0); // Centrer l'origine des rayons
                rayon.setData('item', pos.item); // Ajouter l'objet associé au rayon
                rayon.setData('price', pos.price); // Ajouter l'objet associé au rayon

                // Ajuster la taille et l'offset du corps physique
                const width = rayon.width * scale;
                const height = rayon.height * scale;
                rayon.body.setSize(width, height);
                rayon.body.setOffset(-width / 2, -height / 2); // Centrer le corps physique sur l'image

                rayon.refreshBody();
            });
        };

        // Ajouter les rayons en utilisant les fonctions
        createRayons([
            { x: 0, y: 0, item: 'Vin', price: 3.4 }, { x: 150, y: 0, item: 'Banane', price: 0.2 },
            { x: 300, y: 0, item: 'Pomme', price: 0.4 }, { x: 450, y: 0, item: 'Charcuterie', price: 0.8 },
            { x: 600, y: 0, item: 'Eau Plate', price: 0.3 }, { x: 750, y: 0, item: 'Eau Gazeuze', price: 0.4 },
            { x: 900, y: 0, item: 'Croissants', price: 0.9 }
        ], 'rayon', 0.2);

        createRayons([
            { x: 95, y: 354, item: "Savons", price: 2.5 }, { x: 95, y: 234, item: 'Citrons', price: 0.7 },
            { x: 287, y: 354, item: 'Fromage', price: 1.2 }, { x: 287, y: 234, item: 'Frites', price: 1 },
            { x: 479, y: 354, item: 'Pates', price: 0.9 }, { x: 479, y: 234, item: 'Patates', price: 0.6 }
        ], 'rayon2', 0.4);

        createRayons([
            { x: 95, y: 590, item: 'Pains', price: 1.2 }, { x: 487, y: 590, item: 'Bonbons', price: 1.4 },
            { x: 879, y: 590, item: 'Biscuits', price: 1.5 }
        ], 'rayon3', 0.4);

        // Ajouter une collision entre le joueur et les objets solides
        this.physics.add.collider(this.player, this.solids, this.onCollideRayon, undefined, this);

        // Configurer les touches fléchées
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Afficher l'inventaire
        this.inventoryText = this.add.text(0, 70, 'Inventaire:', {
            fontFamily: 'Arial', fontSize: 16, color: 'black', backgroundColor: 'white', padding: 4
        }).setScrollFactor(0).setDepth(1000);

        // Créer le texte du chrono
        this.timerText = this.add.text(512, 750, 'Time: 0', {
            fontFamily: 'Arial', fontSize: 18, color: 'black', backgroundColor: 'white', padding: 4
        }).setScrollFactor(0).setDepth(1000);
        this.timerText.setOrigin(0.5, 0.5);

        EventBus.emit('current-scene-ready', this);
    }

    update() {
        // Vérifier le mouvement du joueur pour démarrer le chrono
        if (!this.timerStarted && (this.cursors.left.isDown || this.cursors.right.isDown || this.cursors.up.isDown || this.cursors.down.isDown)) {
            this.startTime = this.time.now;
            this.timerStarted = true;
        }

        // Déplacer le joueur en fonction des touches fléchées
        const { left, right, up, down } = this.cursors;

        if (left.isDown) {
            this.player.setVelocityX(-200);
        } else if (right.isDown) {
            this.player.setVelocityX(200);
        } else {
            this.player.setVelocityX(0);
        }

        if (up.isDown) {
            this.player.setVelocityY(-200);
        } else if (down.isDown) {
            this.player.setVelocityY(200);
        } else {
            this.player.setVelocityY(0);
        }

        // Actions supplémentaires lorsque la touche espace est enfoncée
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            console.log("Space key pressed");
        }

        // Mise à jour de l'affichage de l'inventaire
        this.updateInventoryText();

        // Mise à jour du texte du chrono
        if (this.timerStarted) {
            this.updateTimerText();
        }
    }

    onCollideRayon(player: Phaser.GameObjects.GameObject, rayon: Phaser.GameObjects.GameObject) {
        const currentTime = this.time.now;
        if (currentTime - this.lastCollectTime < 500) {
            return;
        }

        if (!rayon) {
            return;
        }

        const item = rayon.getData('item');
        const price = rayon.getData('price');
        if (item) {
            if (this.inventory[item] && this.inventory[item].count > 0) {
                return; // L'objet a déjà été collecté
            }

            this.inventory[item] = { count: 1, price: price };
            this.updateInventoryText();
            this.checkCompletion();

            // Assombrir le sprite du rayon
            (rayon as Phaser.GameObjects.Sprite).setAlpha(0.5);

            this.lastCollectTime = currentTime; // Mettre à jour le temps de la dernière collecte
        }
    }

    updateInventoryText() {
        this.inventoryText.setText('Inventaire :\n\n' + Object.entries(this.inventory).map(([item, data]) => `${item}: ${data.count}`).join('\n'));
    }

    updateTimerText() {
        const elapsed = this.time.now - this.startTime;
        const elapsedSeconds = Math.floor(elapsed / 1000);
        this.timerText.setText(`Time: ${elapsedSeconds}s`);
    }

    checkCompletion() {
        const allItemsCollected = this.itemsToCollect.every(item => this.inventory[item] && this.inventory[item].count > 0);
        if (allItemsCollected) {
            this.endGame();
        }
    }

    changeScene() {
        this.scene.start('GameOver');
    }

    endGame() {
        // Désactiver le mouvement du joueur
        this.player.setVelocity(0, 0);
        this.player.body.moves = false;

        // Afficher un écran de récapitulatif de l'inventaire
        this.showInventorySummary();
    }

    showInventorySummary() {
        // Créer un fond semi-transparent pour l'écran de récapitulatif
        const graphics = this.add.graphics();
        graphics.fillStyle(0x000000, 0.6);
        graphics.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
        graphics.setDepth(1001);

        // Afficher le texte de récapitulatif de l'inventaire
         this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, this.getInventorySummary(), {
            fontFamily: 'Arial', fontSize: 24, color: 'white', align: 'center'
        }).setOrigin(0.5, 0.5).setDepth(1002);
    }

    getInventorySummary() {
        let summary = 'Votre temps:\n\n';

        const elapsed = this.time.now - this.startTime;
        const elapsedSeconds = Math.floor(elapsed / 1000);
        const elapsedMilliseconds = (elapsed % 1000).toString().padStart(3, '0').slice(0, 3);
        summary += `\n ${elapsedSeconds}.${elapsedMilliseconds}s`;
        return summary;
    }
}
