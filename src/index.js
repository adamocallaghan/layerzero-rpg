import Phaser from 'phaser';
import { MainScene } from './scenes/MainScene';
import { BlockchainManager } from './managers/BlockchainManager';

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [MainScene]
};

class Game extends Phaser.Game {
    constructor() {
        super(config);
        this.blockchainManager = new BlockchainManager();
    }
}

window.game = new Game(); 