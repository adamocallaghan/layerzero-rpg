import Phaser from 'phaser';

export class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
        this.player = null;
        this.gemCount = 0;
        this.gemsText = null;
        this.cursors = null;
        this.storeUI = null;
        this.storeOpen = false;
        this.playerDirection = 'down';
        this.playerMoving = false;
    }

    preload() {
        // Load game assets
        this.load.image('grass', 'assets/images/Tiles/Grass_Middle.png');
        this.load.image('path', 'assets/images/Tiles/Path_Middle.png');
        this.load.image('water', 'assets/images/Tiles/Water_Middle.png');
        this.load.spritesheet('player', 'assets/images/Player/Player.png', {
            frameWidth: 32,
            frameHeight: 32
        });
        this.load.image('gem', 'assets/images/gem.png');
        this.load.image('store', 'assets/images/store.png');
    }

    create() {
        // Create tilemap
        this.createWorld();

        // Create player animations
        this.createPlayerAnimations();

        // Create player
        this.player = this.physics.add.sprite(400, 300, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setSize(24, 24);
        this.player.setOffset(4, 8);

        // Create multiple gems
        const gemPositions = [
            { x: 500, y: 500 },
            { x: 300, y: 200 },
            { x: 700, y: 400 },
            { x: 200, y: 600 },
            { x: 800, y: 300 }
        ];

        this.gems = this.physics.add.group();
        gemPositions.forEach(pos => {
            const gem = this.physics.add.sprite(pos.x, pos.y, 'gem');
            this.gems.add(gem);
        });

        this.physics.add.overlap(this.player, this.gems, this.collectGem, null, this);

        // Create store
        this.store = this.physics.add.sprite(600, 400, 'store');
        this.physics.add.overlap(this.player, this.store, this.openStore, null, this);

        // Setup controls
        this.cursors = this.input.keyboard.createCursorKeys();

        // Create UI
        this.gemsText = this.add.text(16, 16, 'Gems: 0', { fontSize: '32px', fill: '#fff' });

        // Create store UI (initially hidden)
        this.createStoreUI();
    }

    createWorld() {
        // We'll rebuild the tile system from scratch
        // For now, just set the world bounds for player movement
        this.physics.world.setBounds(0, 0, 800, 800);
    }

    createPlayerAnimations() {
        // Standing animations
        this.anims.create({
            key: 'stand-down',
            frames: [{ key: 'player', frame: 0 }],
            frameRate: 10
        });
        this.anims.create({
            key: 'stand-right',
            frames: [{ key: 'player', frame: 1 }],
            frameRate: 10
        });
        this.anims.create({
            key: 'stand-up',
            frames: [{ key: 'player', frame: 2 }],
            frameRate: 10
        });

        // Walking animations
        this.anims.create({
            key: 'walk-down',
            frames: this.anims.generateFrameNumbers('player', { start: 3, end: 5 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'walk-right',
            frames: this.anims.generateFrameNumbers('player', { start: 6, end: 8 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'walk-up',
            frames: this.anims.generateFrameNumbers('player', { start: 12, end: 14 }),
            frameRate: 10,
            repeat: -1
        });
    }

    update() {
        if (this.storeOpen) {
            this.player.setVelocity(0, 0);
            return;
        }

        const speed = 200;
        let moving = false;

        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-speed);
            this.playerDirection = 'left';
            moving = true;
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(speed);
            this.playerDirection = 'right';
            moving = true;
        } else {
            this.player.setVelocityX(0);
        }

        if (this.cursors.up.isDown) {
            this.player.setVelocityY(-speed);
            this.playerDirection = 'up';
            moving = true;
        } else if (this.cursors.down.isDown) {
            this.player.setVelocityY(speed);
            this.playerDirection = 'down';
            moving = true;
        } else {
            this.player.setVelocityY(0);
        }

        // Update player animation
        if (moving) {
            if (this.playerDirection === 'left') {
                this.player.setFlipX(true);
                this.player.anims.play('walk-right', true);
            } else if (this.playerDirection === 'right') {
                this.player.setFlipX(false);
                this.player.anims.play('walk-right', true);
            } else if (this.playerDirection === 'up') {
                this.player.anims.play('walk-up', true);
            } else if (this.playerDirection === 'down') {
                this.player.anims.play('walk-down', true);
            }
        } else {
            if (this.playerDirection === 'left') {
                this.player.setFlipX(true);
                this.player.anims.play('stand-right', true);
            } else if (this.playerDirection === 'right') {
                this.player.setFlipX(false);
                this.player.anims.play('stand-right', true);
            } else if (this.playerDirection === 'up') {
                this.player.anims.play('stand-up', true);
            } else if (this.playerDirection === 'down') {
                this.player.anims.play('stand-down', true);
            }
        }
    }

    collectGem(player, gem) {
        gem.destroy();
        this.gemCount += 10;
        this.gemsText.setText('Gems: ' + this.gemCount);
    }

    openStore(player, store) {
        if (!this.storeOpen) {
            this.storeUI.setVisible(true);
            this.storeOpen = true;
        }
    }

    createStoreUI() {
        // Create a semi-transparent background
        const graphics = this.add.graphics();
        graphics.fillStyle(0x000000, 0.5);
        graphics.fillRect(200, 100, 400, 400);
        
        // Create store UI elements
        const title = this.add.text(300, 120, 'Store', { fontSize: '32px', fill: '#fff' });
        const description = this.add.text(220, 180, 'Convert your gems to tokens!', { fontSize: '24px', fill: '#fff' });
        const gemCount = this.add.text(220, 220, `Current Gems: ${this.gemCount}`, { fontSize: '24px', fill: '#fff' });
        const convertButton = this.add.text(300, 300, 'Convert to Tokens', { fontSize: '24px', fill: '#fff' })
            .setInteractive()
            .on('pointerdown', () => this.convertGemsToTokens());

        // Group all UI elements
        this.storeUI = this.add.container(0, 0, [graphics, title, description, gemCount, convertButton]);
        this.storeUI.setVisible(false);
    }

    convertGemsToTokens() {
        if (this.gemCount > 0) {
            // TODO: Implement actual blockchain transaction
            console.log(`Converting ${this.gemCount} gems to tokens`);
            
            // For now, just simulate the transaction
            alert(`Converting ${this.gemCount} gems to tokens...\n(This would trigger a blockchain transaction in the real game)`);
            
            // Reset gems after conversion
            this.gemCount = 0;
            this.gemsText.setText('Gems: ' + this.gemCount);
            
            // Close store UI
            this.storeUI.setVisible(false);
            this.storeOpen = false;
        } else {
            alert('You need to collect some gems first!');
        }
    }
} 