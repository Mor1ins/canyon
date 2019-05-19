import Phaser from "phaser";
import logoImg from "./assets/logo.png";
import mapImg from "./assets/map1.jpg";
// import enviroment from "./enviroment.js"

const enviroment = {
  game_width: 1050,
  game_height: 700
};


const config = {
  type: Phaser.AUTO,
  parent: "phaser-example",
  width: enviroment.game_width,
  height: enviroment.game_height,
  scene: {
    preload: preload,
    create: create
  }
};

const game = new Phaser.Game(config);

function preload() {
  this.load.image("map", mapImg);
}

function create() {
  const logo = this.add.image(
    enviroment.game_width / 2,
    enviroment.game_height / 2,
    "map"
  );

  // this.tweens.add({
  //   targets: logo,
  //   y: 450,
  //   duration: 2000,
  //   ease: "Power2",
  //   yoyo: true,
  //   loop: -1
  // });
}
