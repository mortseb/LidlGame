import { EventBus } from '../EventBus'
import { Scene } from 'phaser'
import axios from 'axios'

export class Game extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera
  background: Phaser.GameObjects.Image
  gameText: Phaser.GameObjects.Text
  player: Phaser.Physics.Arcade.Sprite
  cursors: Phaser.Types.Input.Keyboard.CursorKeys
  spaceKey: Phaser.Input.Keyboard.Key
  inventory: { [key: string]: { count: number, price: number } } = {}
  inventoryText: Phaser.GameObjects.Text
  solids: Phaser.Physics.Arcade.StaticGroup
  lastCollectTime: number = 0
  initialPlayerPosition = { x: 962, y: 384 }
  timerEvent: Phaser.Time.TimerEvent
  timerText: Phaser.GameObjects.Text
  timerStarted: boolean = false

  constructor() {
    super('Game')
  }

  create() {
    this.timerStarted = false; // Réinitialiser le timerStarted
    this.lastCollectTime = 0; // Réinitialiser lastCollectTime
    this.inventory = {}; // Réinitialiser l'inventaire

    // Définir la couleur de fond de la caméra à bleu clair
    this.camera = this.cameras.main
    this.camera.setBackgroundColor(0xadd8e6)

    // Ajouter un arrière-plan avec transparence
    this.background = this.add.image(512, 384, 'background')
    this.background.setAlpha(0.5)

    // Ajouter le joueur (petit personnage)
    this.player = this.physics.add.sprite(this.initialPlayerPosition.x, this.initialPlayerPosition.y, 'player')
    this.player.setScale(0.15)
    this.player.setOrigin(0.5, 0.5)
    this.player.setCollideWorldBounds(true)

    // Créer un groupe d'objets solides
    this.solids = this.physics.add.staticGroup()

    const createRayons = (positions: { x: number, y: number, item: string, price: number }[], key: string, scale: number) => {
      positions.forEach(pos => {
        const rayon = this.solids.create(pos.x, pos.y, key) as Phaser.Physics.Arcade.Sprite
        rayon.setScale(scale)
        rayon.setOrigin(0, 0)
        rayon.setData('item', pos.item)
        rayon.setData('price', pos.price)

        const width = rayon.width * scale
        const height = rayon.height * scale
        rayon.body.setSize(width, height)
        rayon.body.setOffset(-width / 2, -height / 2)

        rayon.refreshBody()
      })
    }

    createRayons([
      { x: 0, y: 0, item: 'Vin', price: 3.4 }, { x: 150, y: 0, item: 'Banane', price: 0.2 },
      { x: 300, y: 0, item: 'Pomme', price: 0.4 }, { x: 450, y: 0, item: 'Charcuterie', price: 0.8 },
      { x: 600, y: 0, item: 'Eau Plate', price: 0.3 }, { x: 750, y: 0, item: 'Eau Gazeuze', price: 0.4 },
      { x: 900, y: 0, item: 'Croissants', price: 0.9 }
    ], 'rayon', 0.2)

    createRayons([
      { x: 95, y: 354, item: "Savons", price: 2.5 }, { x: 95, y: 234, item: 'Citrons', price: 0.7 },
      { x: 287, y: 354, item: 'Fromage', price: 1.2 }, { x: 287, y: 234, item: 'Frites', price: 1 },
      { x: 479, y: 354, item: 'Pates', price: 0.9 }, { x: 479, y: 234, item: 'Patates', price: 0.6 }
    ], 'rayon2', 0.4)

    createRayons([
      { x: 95, y: 590, item: 'Pains', price: 1.2 }, { x: 487, y: 590, item: 'Bonbons', price: 1.4 },
      { x: 879, y: 590, item: 'Biscuits', price: 1.5 }
    ], 'rayon3', 0.4)

    this.physics.add.collider(this.player, this.solids, this.onCollideRayon, undefined, this)

    this.cursors = this.input.keyboard.createCursorKeys()
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)

    this.inventoryText = this.add.text(0, 70, 'Inventaire:', {
      fontFamily: 'Arial', fontSize: 16, color: 'black', backgroundColor: 'white', padding: 4
    }).setScrollFactor(0).setDepth(1000)

    this.timerText = this.add.text(512, 750, 'Time: 30', {
      fontFamily: 'Arial', fontSize: 18, color: 'black', backgroundColor: 'white', padding: 4
    }).setScrollFactor(0).setDepth(1000)
    this.timerText.setOrigin(0.5, 0.5)

    EventBus.emit('current-scene-ready', this)
  }

  update() {
    const { left, right, up, down } = this.cursors

    if (left.isDown) {
      this.player.setVelocityX(-200)
      this.startTimer()
    } else if (right.isDown) {
      this.player.setVelocityX(200)
      this.startTimer()
    } else {
      this.player.setVelocityX(0)
    }

    if (up.isDown) {
      this.player.setVelocityY(-200)
      this.startTimer()
    } else if (down.isDown) {
      this.player.setVelocityY(200)
      this.startTimer()
    } else {
      this.player.setVelocityY(0)
    }

    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      console.log("Space key pressed")
    }

    this.updateInventoryText()

    if (this.timerStarted) {
      this.updateTimerText()
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

    if (rayon.getData('unavailable')) {
        return;
    }

    const item = rayon.getData('item');
    const price = rayon.getData('price');
    if (item) {
        if (!this.inventory[item]) {
            this.inventory[item] = { count: 0, price: price };
        }
        this.inventory[item].count++;
        this.updateInventoryText();

        const cooldownDuration = Phaser.Math.Between(5000, 30000);
        this.makeRayonUnavailable(rayon, cooldownDuration);

        this.lastCollectTime = currentTime;
    }
  }

  makeRayonUnavailable(rayon: Phaser.GameObjects.GameObject, duration: number) {
    (rayon as Phaser.GameObjects.Sprite).setAlpha(0.5);
    rayon.setData('unavailable', true);

    const circle = this.add.graphics();
    const radius = 10;

    const x = rayon.x + rayon.width * rayon.scaleX / 2;
    const y = rayon.y + rayon.height * rayon.scaleY / 2;

    circle.lineStyle(4, 0xff0000, 1);
    circle.fillStyle(0xffffff, 1);
    circle.strokeCircle(x, y, radius);
    circle.fillCircle(x, y, radius);

    const timerText = this.add.text(x, y, `${Math.ceil(duration / 1000)}`, {
      fontFamily: 'Arial', fontSize: 14, color: 'black'
    }).setOrigin(0.5);

    const endTime = this.time.now + duration;

    const interval = setInterval(() => {
      const remainingTime = Math.max(0, Math.ceil((endTime - this.time.now) / 1000));
      timerText.setText(`${remainingTime}`);

      if (remainingTime <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    this.time.delayedCall(duration, () => {
      (rayon as Phaser.GameObjects.Sprite).setAlpha(1);
      rayon.setData('unavailable', false);
      timerText.destroy();
      circle.destroy();
      clearInterval(interval);
    });
  }

  updateInventoryText() {
    this.inventoryText.setText('Inventaire :\n\n' + Object.entries(this.inventory).map(([item, data]) => `${item}: ${data.count}`).join('\n'))
  }

  updateTimerText() {
    const remainingTime = Math.ceil((this.timerEvent.delay - this.timerEvent.getElapsed()) / 1000)
    this.timerText.setText(`${remainingTime}s remaining`)
  }

  changeScene() {
    this.scene.start('GameOver')
  }

  startTimer() {
    if (!this.timerStarted) {
      this.timerStarted = true
      this.timerEvent = this.time.addEvent({
        delay: 30000, // 30 secondes
        callback: this.endGame,
        callbackScope: this
      })
    }
  }

  endGame() {
    this.player.setPosition(this.initialPlayerPosition.x, this.initialPlayerPosition.y)
    this.player.setVelocity(0, 0)
    this.player.body.moves = false

    this.showInventorySummary()
  }

  showInventorySummary() {
    const graphics = this.add.graphics()
    graphics.fillStyle(0x000000, 0.7)
    graphics.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height)
    graphics.setDepth(1001)

    const summaryText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, this.getInventorySummary(), {
      fontFamily: 'Arial', fontSize: 24, color: 'white', align: 'center'
    }).setOrigin(0.5, 0.5).setDepth(1002)

    const mainMenuButton = this.add.text(this.cameras.main.width / 2 - 400, this.cameras.main.height / 2 - 30, 'Main Menu', {
      fontFamily: 'Arial', fontSize: 20, color: 'black', backgroundColor: 'white', padding: 10
    }).setOrigin(0.5, 0.5).setInteractive().setDepth(1003)

    mainMenuButton.on('pointerdown', () => {
      this.scene.start('MainMenu')
    })

    const restartButton = this.add.text(this.cameras.main.width / 2 - 400, this.cameras.main.height / 2 + 30, 'Restart', {
      fontFamily: 'Arial', fontSize: 20, color: 'black', backgroundColor: 'white', padding: 10
    }).setOrigin(0.5, 0.5).setInteractive().setDepth(1003)

    restartButton.on('pointerdown', () => {
      this.scene.restart()
    })

    // Enregistrer le score après l'affichage du résumé
    this.saveScore();
  }

  getInventorySummary() {
    let summary = 'Votre liste:\n\n'
    let totalCost = 0
    summary += Object.entries(this.inventory).map(([item, data]) => {
      totalCost += data.count * data.price
      return `${item}: ${data.count} * ${data.price.toFixed(2)} €`
    }).join('\n')
    summary += `\n\nPanier total: ${totalCost.toFixed(2)} €`
    return summary
  }

  async saveScore() {
    const pseudonym = GlobalState.pseudonym;
    const totalCost = Object.values(this.inventory).reduce((sum, item) => sum + item.count * item.price, 0);

    try {
      const response = await axios.post('http://localhost:3000/save-score', {
        pseudonym,
        score: totalCost
      });
      console.log(response.data);
    } catch (error) {
      console.error('Error saving score:', error);
    }
  }
}
