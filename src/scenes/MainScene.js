import Phaser from 'phaser';

export class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
        this.player = null;
        this.gems = 0;
        this.gemsText = null;
        this.cursors = null;
    }

    preload() {
        // Load game assets
        this.load.image('background', 'assets/images/background.png');
        this.load.image('character', 'assets/images/character.png');
        this.load.image('gem', 'assets/images/gem.png');
        this.load.image('store', 'assets/images/store.png');
    }

    create() {
        // Create background
        this.add.image(400, 300, 'background');

        // Create player
        this.player = this.physics.add.sprite(100, 100, 'character');
        this.player.setCollideWorldBounds(true);

        // Create gems
        this.gem = this.physics.add.sprite(500, 500, 'gem');
        this.physics.add.overlap(this.player, this.gem, this.collectGem, null, this);

        // Create store
        this.store = this.physics.add.sprite(1500, 1500, 'store');
        this.physics.add.overlap(this.player, this.store, this.openStore, null, this);

        // Setup controls
        this.cursors = this.input.keyboard.createCursorKeys();

        // Create UI
        this.gemsText = this.add.text(16, 16, 'Gems: 0', { fontSize: '32px', fill: '#fff' });
    }

    update() {
        // Handle player movement
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-200);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(200);
        } else {
            this.player.setVelocityX(0);
        }

        if (this.cursors.up.isDown) {
            this.player.setVelocityY(-200);
        } else if (this.cursors.down.isDown) {
            this.player.setVelocityY(200);
        } else {
            this.player.setVelocityY(0);
        }
    }

    collectGem(player, gem) {
        gem.destroy();
        this.gems += 10;
        this.gemsText.setText('Gems: ' + this.gems);
    }

    openStore(player, store) {
        // TODO: Implement store UI
        console.log('Store opened!');
    }
} 