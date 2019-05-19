import Phaser from "phaser";
import mapImg from "./assets/map1.jpg";
import carImg from "./assets/car.png";
// import enviroment from "./enviroment.js"

const enviroment = {
  car_x: 20,
  car_y: 50,
  car_start_angle: 90,
  game_width: 1050,
  game_height: 700,
  title: "canyon",
  sensorLength: 50,
  car_speed: 5,
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

class Car {
  constructor(context, image) {
    this.car = context.add.sprite(
      enviroment.car_x,
      enviroment.car_y,
      image
    );

    this.car.displayWidth = this.car.displayWidth * 0.05;
    this.car.displayHeight = this.car.displayHeight * 0.05;

    this.car.angle = enviroment.car_start_angle;
  }

  turnLeft() {
    this.car.angle -= 5;
  }

  turnRight() {
    this.car.angle += 5;
  }

  drive() {
    let angle = this.car.angle * Math.PI / 180.0;
    let cos = Math.cos(angle);
    let sin = Math.sin(angle);
    // console.log("angle: ", this.car.angle, " ;x: ", gameCar.x, " ; y: ", gameCar.y, " ;cos: ", cos, " ; sin: ", sin)
    this.car.x += sin * enviroment.car_speed;
    this.car.y -= cos * enviroment.car_speed;
  }

  readSensors() {

  }
}

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

  car = new Car(this, "car");
}

function update() {
  makeDecision(car);
  car.drive(car);
}

function makeDecision(gameCar) {
  if (Math.random() > 0.5) {
    car.turnLeft();
  }
  else {
    car.turnRight();
  }
}
