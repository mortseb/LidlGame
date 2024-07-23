import { GameObjects, Scene } from 'phaser'
import { EventBus } from '../EventBus'
import { GlobalState } from '../../GlobalState'
import { gsap } from 'gsap'

export class MainMenu extends Scene
{
  background: GameObjects.Image
  overlay: GameObjects.Graphics
  logo: GameObjects.Image
  title: GameObjects.Text
  classicButton: GameObjects.Text
  classicButtonTooltip: GameObjects.Text
  speedrunButtonTooltip: GameObjects.Text
  inputElement: HTMLInputElement
  logoTween: Phaser.Tweens.Tween | null

  constructor ()
  {
    super('MainMenu')
    this.logoTween = null
  }

  create ()
  {
    this.background = this.add.image(512, 384, 'background')
    this.overlay = this.add.graphics()
    this.overlay.fillStyle(0x000000, 0.5) // Noir avec une opacité de 0.5
    this.overlay.fillRect(0, 0, 1024, 768) // Remplir l'écran
    this.logo = this.add.image(512, 200, 'logo').setDepth(100)
    this.logo.setScale(0.2)

    this.classicButton = this.add.text(512, 380, 'Classic Mode', {
      fontFamily: 'Arial Black', fontSize: 38, color: 'yellow',
      stroke: 'red', strokeThickness: 8,
      align: 'center'
    }).setOrigin(0.5).setDepth(100)

    this.classicButtonTooltip = this.add.text(512, 340, '30 seconds to get the most items you can.', {
      fontFamily: 'Arial', fontSize: 20, color: 'white',
      backgroundColor: 'black',
      align: 'center'
    }).setOrigin(0.5).setDepth(100).setVisible(false)

    this.classicButton.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
      this.startGame('Game')
    })

    this.classicButton.on('pointerover', () => {
      this.classicButton.setStyle({ color: '#ff0' }) // Change color on hover
      this.classicButtonTooltip.setVisible(true) // Show tooltip
    })

    this.classicButton.on('pointerout', () => {
      this.classicButton.setStyle({ color: 'yellow' }) // Reset color when not hovering
      this.classicButtonTooltip.setVisible(false) // Hide tooltip
    })

    this.title = this.add.text(512, 480, 'Speedrun Mode', {
      fontFamily: 'Arial Black', fontSize: 38, color: 'yellow',
      stroke: 'red', strokeThickness: 8,
      align: 'center'
    }).setOrigin(0.5).setDepth(100)

    this.speedrunButtonTooltip = this.add.text(512, 520, 'Get every item in a minimum of time', {
      fontFamily: 'Arial', fontSize: 20, color: 'white',
      backgroundColor: 'black',
      align: 'center'
    }).setOrigin(0.5).setDepth(100).setVisible(false)

    // Ajoutez l'écouteur d'événements pour le clic
    this.title.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
      this.startGame('Game2')
    })

    this.title.on('pointerover', () => {
      this.title.setStyle({ color: '#ff0' }) // Change color on hover
      this.speedrunButtonTooltip.setVisible(true) // Show tooltip
    })

    this.title.on('pointerout', () => {
      this.title.setStyle({ color: 'yellow' }) // Reset color when not hovering
      this.speedrunButtonTooltip.setVisible(false) // Hide tooltip
    })

    // Create input element
    this.createInput()

    EventBus.emit('current-scene-ready', this)
  }

  createInput ()
  {
    this.inputElement = document.createElement('input')
    this.inputElement.type = 'text'
    this.inputElement.placeholder = 'Enter your pseudonym'
    this.inputElement.style.position = 'absolute'
    this.inputElement.style.left = '44.7%'
    this.inputElement.style.top = '80%'
    this.inputElement.style.transform = 'translate(-50%, -50%)'
    this.inputElement.style.fontSize = '16px'
    this.inputElement.style.padding = '10px'
    document.body.appendChild(this.inputElement)
  }

  startGame (sceneName: string)
  {
    const pseudonym = this.inputElement.value

    if (!pseudonym)
    {
      alert('Please enter a pseudonym before starting the game.')
      return
    }

    if (this.logoTween)
    {
      this.logoTween.stop()
      this.logoTween = null
    }

    console.log('Pseudonym:', pseudonym) // You can handle the pseudonym value here

    // Enregistrez le pseudonyme dans l'état global
    GlobalState.pseudonym = pseudonym

    // Remove input element from DOM
    this.inputElement.remove()

    this.scene.start(sceneName)
  }

  moveLogo (vueCallback: ({ x, y }: { x: number, y: number }) => void)
  {
    if (this.logoTween)
    {
      if (this.logoTween.isPlaying())
      {
        this.logoTween.pause()
      }
      else
      {
        this.logoTween.play()
      }
    } 
    else
    {
      this.logoTween = this.tweens.add({
        targets: this.logo,
        x: { value: 750, duration: 3000, ease: 'Back.easeInOut' },
        y: { value: 80, duration: 1500, ease: 'Sine.easeOut' },
        yoyo: true,
        repeat: -1,
        onUpdate: () => {
          if (vueCallback)
          {
            vueCallback({
              x: Math.floor(this.logo.x),
              y: Math.floor(this.logo.y)
            })
          }
        }
      })
    }
  }
}
