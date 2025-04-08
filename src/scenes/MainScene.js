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

        // Create store (moved to visible area)
        this.store = this.physics.add.sprite(600, 400, 'store');
        this.physics.add.overlap(this.player, this.store, this.openStore, null, this);

        // Setup controls
        this.cursors = this.input.keyboard.createCursorKeys();

        // Create UI
        this.gemsText = this.add.text(16, 16, 'Gems: 0', { fontSize: '32px', fill: '#fff' });

        // Create store UI (initially hidden)
        this.createStoreUI();
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

        // Update store UI gem count
        if (this.storeUI && this.storeOpen) {
            const gemCountText = this.storeUI.list[3];
            gemCountText.setText(`Current Gems: ${this.gemCount}`);
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
            // Stop player movement while store is open
            this.player.setVelocity(0, 0);
        }
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