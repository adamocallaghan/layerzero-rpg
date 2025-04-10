import Phaser from 'phaser';

export class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
        this.player = null;
        this.gemCount = 0;
        this.chestsText = null;
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

        // Create player - spawn in center of expanded world
        this.player = this.physics.add.sprite(800, 800, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setSize(24, 24);
        this.player.setOffset(4, 8);

        // Setup camera to follow player
        this.cameras.main.setBounds(0, 0, 1600, 1600);
        this.cameras.main.startFollow(this.player, true);
        this.cameras.main.setZoom(1);  // Adjust zoom level if needed

        // Create multiple chests spread across the expanded world
        const chestPositions = [
            // Top-left quadrant
            { x: 500, y: 500 },
            { x: 300, y: 200 },
            // Top-right quadrant
            { x: 1200, y: 300 },
            { x: 1400, y: 500 },
            // Bottom-left quadrant
            { x: 200, y: 1200 },
            { x: 500, y: 1400 },
            // Bottom-right quadrant
            { x: 1300, y: 1200 },
            { x: 1400, y: 1400 },
            // Center area - moved away from player spawn
            { x: 900, y: 900 }  // Moved from 800,800 to 900,900
        ];

        this.chests = this.physics.add.group();
        chestPositions.forEach(pos => {
            const chest = this.physics.add.sprite(pos.x, pos.y, 'chest');
            chest.setScale(1);
            this.chests.add(chest);
        });

        // Add trees as physical obstacles spread across the expanded world
        const treePositions = [
            // Top-left quadrant
            { x: 150, y: 150 },
            { x: 400, y: 200 },
            // Top-right quadrant
            { x: 1200, y: 150 },
            { x: 1400, y: 300 },
            // Bottom-left quadrant
            { x: 200, y: 1200 },
            { x: 400, y: 1400 },
            // Bottom-right quadrant
            { x: 1200, y: 1200 },
            { x: 1400, y: 1400 },
            // Center area
            { x: 750, y: 750 },
            { x: 850, y: 850 },
            // Additional decorative trees
            { x: 600, y: 1000 },
            { x: 1000, y: 600 },
            { x: 300, y: 800 },
            { x: 800, y: 300 }
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
        this.physics.add.overlap(this.player, this.bank, this.openStore, null, this);

        // Setup controls
        this.cursors = this.input.keyboard.createCursorKeys();

        // Initialize the chest count display with the starting value
        this.gemCount = 0;  // Ensure we start at 0
        this.chestsText = this.add.text(16, 16, 'Chests: ' + this.gemCount, { fontSize: '32px', fill: '#fff' })
            .setScrollFactor(0);  // This makes the text stay fixed on screen

        // Create store UI (initially hidden)
        this.createStoreUI();
    }

    createWorld() {
        // Set expanded world bounds (2x2 of original size)
        this.physics.world.setBounds(0, 0, 1600, 1600);

        // Calculate number of tiles needed for width and height
        const numTilesX = Math.ceil(1600 / 32);
        const numTilesY = Math.ceil(1600 / 32);
        
        // First layer: Place grass tiles across the entire expanded game space
        for (let y = 0; y < numTilesY; y++) {
            for (let x = 0; x < numTilesX; x++) {
                let grass = this.add.sprite(x * 32, y * 32, 'grass');
                grass.setOrigin(0, 0);
                grass.setDisplaySize(32, 32);
            }
        }

        // Second layer: Add paths in various patterns across quadrants
        // Original quadrant path (top-left)
        this.createLargePathWithConnections(9 * 32, 9 * 32);

        // Second quadrant path (top-right)
        this.createLargePathWithConnections(35 * 32, 12 * 32);

        // Third quadrant path (bottom-left)
        this.createLargePathWithConnections(15 * 32, 35 * 32);

        // Fourth quadrant path (bottom-right)
        this.createLargePathWithConnections(40 * 32, 38 * 32);

        // Add additional connecting paths
        for (let y = 0; y < numTilesY; y++) {
            for (let x = 0; x < numTilesX; x++) {
                // Create main crossroads
                if (x === 25 || y === 25) {
                    let path = this.add.sprite(x * 32, y * 32, 'path');
                    path.setOrigin(0, 0);
                    path.setDisplaySize(32, 32);
                }
            }
        }

        // Third layer: Add cliff tiles at strategic locations
        const cliffPositions = [
            { x: 32, y: 32 },                    // Top-left original
            { x: 1600 - 96, y: 1600 - 160 },     // Bottom-right original
            { x: 1600 - 96, y: 32 },             // Top-right
            { x: 32, y: 1600 - 160 },            // Bottom-left
            { x: 800 - 96, y: 800 - 160 },       // Center
            { x: 400, y: 1200 },                 // Bottom quadrant
            { x: 1200, y: 400 }                  // Right quadrant
        ];

        cliffPositions.forEach(pos => {
            const cliff = this.add.sprite(pos.x, pos.y, 'cliff_large');
            cliff.setOrigin(0, 0);
            cliff.setDisplaySize(64, 128);
        });

        // Fourth layer: Add water features
        const waterPositions = [
            { x: 1600 - 96, y: 32 },             // Original top-right
            { x: 32, y: 1600 - 160 },            // Bottom-left
            { x: 800 - 96, y: 800 - 160 },       // Center
            { x: 400, y: 32 },                   // Top quadrant
            { x: 1200, y: 1400 }                 // Bottom-right quadrant
        ];

        waterPositions.forEach(pos => {
            const water = this.add.sprite(pos.x, pos.y, 'water_large');
            water.setOrigin(0, 0);
            water.setDisplaySize(64, 128);
        });

        // Add regular water tiles for the expanded border
        for (let y = 0; y < numTilesY; y++) {
            for (let x = 0; x < numTilesX; x++) {
                if (x === 0 || x === numTilesX - 1 || y === 0 || y === numTilesY - 1) {
                    let water = this.add.sprite(x * 32, y * 32, 'water');
                    water.setOrigin(0, 0);
                    water.setDisplaySize(32, 32);
                }
            }
        }
    }

    // Helper method to create a large path tile with its connections
    createLargePathWithConnections(x, y) {
        // Add large path tile
        const largePath = this.add.sprite(x, y, 'path_large');
        largePath.setOrigin(0, 0);
        largePath.setDisplaySize(64, 128);

        // Add connecting paths
        for (let i = -5; i < 15; i++) {
            // Horizontal connections
            let pathH = this.add.sprite((x/32 + i) * 32, y + 64, 'path');
            pathH.setOrigin(0, 0);
            pathH.setDisplaySize(32, 32);
            
            // Vertical connections
            let pathV = this.add.sprite(x + 32, (y/32 + i) * 32, 'path');
            pathV.setOrigin(0, 0);
            pathV.setDisplaySize(32, 32);
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
        this.gemCount += 1;
        this.chestsText.setText('Chests: ' + this.gemCount);
    }

    openStore(player, bank) {
        if (!this.storeOpen) {
            // Position UI in center of camera view
            const camera = this.cameras.main;
            const centerX = camera.width / 2;
            const centerY = camera.height / 2;
            
            this.storeUI.setPosition(centerX - 200, centerY - 200);  // Center the 400x400 UI
            this.storeUI.setVisible(true);
            this.storeOpen = true;
            
            // Update the chest count text
            const chestCountText = this.storeUI.list[3];
            chestCountText.setText(`Current Chests: ${this.gemCount}`);
        }
    }

    createStoreUI() {
        // Create a semi-transparent background
        const graphics = this.add.graphics();
        graphics.fillStyle(0x000000, 0.5);
        graphics.fillRect(0, 0, 400, 400);
        
        // Create store UI elements with word wrap
        const title = this.add.text(200, 20, 'Bank', { 
            fontSize: '32px', 
            fill: '#fff',
            align: 'center'
        }).setOrigin(0.5, 0);

        const description = this.add.text(200, 80, 'Convert your treasure to tokens!', { 
            fontSize: '24px', 
            fill: '#fff',
            align: 'center',
            wordWrap: { width: 360 }  // Leave 20px margin on each side
        }).setOrigin(0.5, 0);

        const chestCount = this.add.text(200, 160, `Current Chests: ${this.gemCount}`, { 
            fontSize: '24px', 
            fill: '#fff',
            align: 'center',
            wordWrap: { width: 360 }
        }).setOrigin(0.5, 0);

        const convertButton = this.add.text(200, 240, 'Convert to Tokens', { 
            fontSize: '24px', 
            fill: '#fff',
            align: 'center',
            wordWrap: { width: 360 }
        })
            .setOrigin(0.5, 0)
            .setInteractive()
            .on('pointerdown', () => this.convertGemsToTokens());

        // Group all UI elements
        this.storeUI = this.add.container(0, 0, [graphics, title, description, chestCount, convertButton]);
        this.storeUI.setVisible(false);
        // Make UI stay fixed relative to camera
        this.storeUI.setScrollFactor(0);
    }

    convertGemsToTokens() {
        if (this.gemCount > 0) {
            // TODO: Implement actual blockchain transaction
            console.log(`Converting ${this.gemCount} gems to tokens`);
            
            // For now, just simulate the transaction
            alert(`Converting ${this.gemCount} chests to tokens...\n(This would trigger a blockchain transaction in the real game)`);
            
            // Reset gems after conversion
            this.gemCount = 0;
            this.chestsText.setText('Chests: ' + this.gemCount);
            
            // Close store UI
            this.storeUI.setVisible(false);
            this.storeOpen = false;
        } else {
            alert('You need to collect some chests first!');
        }
    }
} 