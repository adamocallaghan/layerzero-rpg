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
        // Small tiles (32x32)
        this.load.image('grass', 'assets/images/Tiles/Grass_Middle.png');
        this.load.image('path', 'assets/images/Tiles/Path_Middle.png');
        this.load.image('water', 'assets/images/Tiles/Water_Middle.png');
        // Large tiles (64x128)
        this.load.image('path_large', 'assets/images/Tiles/Path_Tile.png');
        this.load.image('water_large', 'assets/images/Tiles/Water_Tile.png');
        this.load.image('cliff_large', 'assets/images/Tiles/Cliff_Tile.png');
        // Decorative elements
        this.load.image('house', 'assets/images/Outdoor decoration/House.png');
        this.load.image('tree', 'assets/images/Outdoor decoration/Oak_Tree.png');
        this.load.image('chest', 'assets/images/Outdoor decoration/Chest.png');

        this.load.spritesheet('player', 'assets/images/Player/Player.png', {
            frameWidth: 32,
            frameHeight: 32
        });
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

        // Create multiple chests
        const chestPositions = [
            { x: 500, y: 500 },
            { x: 300, y: 200 },
            { x: 700, y: 400 },
            { x: 200, y: 600 },
            { x: 800, y: 300 }
        ];

        this.chests = this.physics.add.group();
        chestPositions.forEach(pos => {
            const chest = this.physics.add.sprite(pos.x, pos.y, 'chest');
            chest.setScale(1); // Chest is already the right size (32x32)
            this.chests.add(chest);
        });

        // Add trees as physical obstacles
        const treePositions = [
            { x: 150, y: 150 },
            { x: 650, y: 150 },
            { x: 150, y: 650 },
            { x: 650, y: 650 },
            { x: 400, y: 200 },
            { x: 200, y: 400 },
            { x: 600, y: 400 }
        ];

        // Create a physics group for trees
        this.trees = this.physics.add.staticGroup();
        treePositions.forEach(pos => {
            const tree = this.trees.create(pos.x, pos.y, 'tree');
            tree.setScale(0.8);
            // Make collision box smaller and position it at the trunk
            tree.setSize(20, 20);  // Small collision box for the trunk
            tree.setOffset(tree.displayWidth/2 - 10, tree.displayHeight * 0.75);  // Center horizontally, move down to trunk
        });

        // Add collisions
        this.physics.add.collider(this.player, this.trees);
        this.physics.add.overlap(this.player, this.chests, this.collectChest, null, this);

        // Create bank (formerly store)
        this.bank = this.physics.add.sprite(600, 400, 'house');
        this.bank.setScale(0.8);
        this.bank.setImmovable(true);
        this.physics.add.collider(this.player, this.bank);
        this.physics.add.overlap(this.player, this.bank, this.openStore, null, this);

        // Setup controls
        this.cursors = this.input.keyboard.createCursorKeys();

        // Create UI
        this.chestsText = this.add.text(16, 16, 'Chests: 0', { fontSize: '32px', fill: '#fff' });

        // Create store UI (initially hidden)
        this.createStoreUI();
    }

    createWorld() {
        // Set world bounds
        this.physics.world.setBounds(0, 0, 800, 800);

        // Calculate number of tiles needed for width and height
        const numTilesX = Math.ceil(800 / 32);
        const numTilesY = Math.ceil(800 / 32);
        
        // First layer: Place grass tiles across the entire game space
        for (let y = 0; y < numTilesY; y++) {
            for (let x = 0; x < numTilesX; x++) {
                let grass = this.add.sprite(x * 32, y * 32, 'grass');
                grass.setOrigin(0, 0);
                grass.setDisplaySize(32, 32);
            }
        }

        // Second layer: Add paths
        // Add one large path tile (64x128) at an intersection
        const largePath = this.add.sprite(9 * 32, 9 * 32, 'path_large');
        largePath.setOrigin(0, 0);
        largePath.setDisplaySize(64, 128);

        // Add regular path tiles to connect to the large path
        for (let y = 0; y < numTilesY; y++) {
            for (let x = 0; x < numTilesX; x++) {
                // Skip where the large path tile is
                if (x >= 9 && x <= 10 && y >= 9 && y <= 12) continue;
                
                // Create paths connecting to large path tile
                if (x === 10 || y === 10) {
                    let path = this.add.sprite(x * 32, y * 32, 'path');
                    path.setOrigin(0, 0);
                    path.setDisplaySize(32, 32);
                }
            }
        }

        // Third layer: Add cliff tiles at strategic corners
        // Top-left cliff
        const cliffTL = this.add.sprite(32, 32, 'cliff_large');
        cliffTL.setOrigin(0, 0);
        cliffTL.setDisplaySize(64, 128);
        // Bottom-right cliff
        const cliffBR = this.add.sprite(800 - 96, 800 - 160, 'cliff_large');
        cliffBR.setOrigin(0, 0);
        cliffBR.setDisplaySize(64, 128);

        // Fourth layer: Add water border with one large water tile in a corner
        // Add large water tile in top-right corner
        const largeWater = this.add.sprite(800 - 96, 32, 'water_large');
        largeWater.setOrigin(0, 0);
        largeWater.setDisplaySize(64, 128);

        // Add regular water tiles for the rest of the border
        for (let y = 0; y < numTilesY; y++) {
            for (let x = 0; x < numTilesX; x++) {
                // Skip where the large water tile is
                if (x >= numTilesX - 3 && x < numTilesX - 1 && y >= 1 && y <= 4) continue;
                
                // Place water on edges
                if (x === 0 || x === numTilesX - 1 || y === 0 || y === numTilesY - 1) {
                    let water = this.add.sprite(x * 32, y * 32, 'water');
                    water.setOrigin(0, 0);
                    water.setDisplaySize(32, 32);
                }
            }
        }
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

    collectChest(player, chest) {
        chest.destroy();
        this.gemCount += 10;
        this.chestsText.setText('Chests: ' + this.gemCount);
    }

    openStore(player, bank) {
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
        const title = this.add.text(300, 120, 'Bank', { fontSize: '32px', fill: '#fff' });
        const description = this.add.text(220, 180, 'Convert your treasure to tokens!', { fontSize: '24px', fill: '#fff' });
        const chestCount = this.add.text(220, 220, `Current Chests: ${this.gemCount}`, { fontSize: '24px', fill: '#fff' });
        const convertButton = this.add.text(300, 300, 'Convert to Tokens', { fontSize: '24px', fill: '#fff' })
            .setInteractive()
            .on('pointerdown', () => this.convertGemsToTokens());

        // Group all UI elements
        this.storeUI = this.add.container(0, 0, [graphics, title, description, chestCount, convertButton]);
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
            this.chestsText.setText('Chests: ' + this.gemCount);
            
            // Close store UI
            this.storeUI.setVisible(false);
            this.storeOpen = false;
        } else {
            alert('You need to collect some gems first!');
        }
    }
} 