import Phaser from "phaser";
import mapImg from "./assets/map1.jpg";
import carImg from "./assets/car.png";
// import enviroment from "./enviroment.js"

const enviroment = {
  car_x: 20,
  car_y: 50,
  game_width: 1050,
  game_height: 700,
  title: "canyon",
  sensorLength: 50
};


const config = {
  type: Phaser.AUTO,
  parent: "phaser-example",
  width: enviroment.game_width,
  height: enviroment.game_height,
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

const game = new Phaser.Game(config);

var car;

function preload() {
  this.load.image("map", mapImg);
  this.load.image("car", carImg);
}

function create() {
  const map = this.add.image(
    enviroment.game_width / 2,
    enviroment.game_height / 2,
    "map"
  );

  car = this.add.sprite(
    enviroment.car_x,
    enviroment.car_y,
    "car"
  );

  car.displayWidth = car.displayWidth * 0.05;
  car.displayHeight = car.displayHeight * 0.05;

  car .angle += 90;
  // this.tweens.add({
  //   targets: logo,
  //   y: 450,
  //   duration: 2000,
  //   ease: "Power2",
  //   yoyo: true,
  //   loop: -1
  // });
}

function update() {
  drive(car);
}

function turnLeft() {
  car.angle -= 5;
}

function turnRight() {
  car.angle += 5;
}

function drive(gameCar) {
  let angle = gameCar.angle * Math.PI / 180.0;
  let cos = Math.cos(angle);
  let sin = Math.sin(angle);
  console.log("angle: ", gameCar.angle, " ;x: ", gameCar.x, " ; y: ", gameCar.y, " ;cos: ", cos, " ; sin: ", sin)
  gameCar.x += sin;
  gameCar.y += cos;
}
