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
  sensorLength: 100,
  car_speed: 2,
  sensor_angle: 30,
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

function getRadian(degrees) {
  return degrees * Math.PI / 180.0
}

var game = new Phaser.Game(config);
var gameReady = false;

class Sensor {
  constructor(x, y, context, length, angle, width, color, offset) {
    this.length = length;
    this.graphics = context.add.graphics({ lineStyle: { width: width, color: color } });
    this.line = new Phaser.Geom.Line(x, y, x + length, y);
    var point = new Phaser.Geom.Point(x, y);
    Phaser.Geom.Line.RotateAroundPoint(this.line, point, getRadian(angle - offset));
    this.offset = offset;
  }

  update(x, y, angle) {
    this.line.x1 = x + 12;
    this.line.y1 = y;
    this.line.x2 = this.line.x1 + this.length;
    this.line.y2 = this.line.y1;
    var point = new Phaser.Geom.Point(x, y);
    Phaser.Geom.Line.RotateAroundPoint(this.line, point, getRadian(angle - this.offset));
    this.graphics.clear();
    this.graphics.strokeLineShape(this.line);
  }
}

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


    this.leftSensor = new Sensor(
      this.car.x, this.car.y, context,
      enviroment.sensorLength, this.car.angle,
      2, 0x000000, enviroment.car_start_angle + 30);


    this.frontSensor = new Sensor(
      this.car.x, this.car.y, context,
      enviroment.sensorLength, this.car.angle,
      2, 0x000000, enviroment.car_start_angle);

    this.rightSensor = new Sensor(
      this.car.x, this.car.y, context,
      enviroment.sensorLength, this.car.angle,
      2, 0x000000, enviroment.car_start_angle - 30);
  }

  turnLeft() {
    this.car.angle -= 5;
  }

  turnRight() {
    this.car.angle += 5;
  }

  drive() {
    let angle = getRadian(this.car.angle);
    let cos = Math.cos(angle);
    let sin = Math.sin(angle);
    // console.log("angle: ", this.car.angle, " ;x: ", gameCar.x, " ; y: ", gameCar.y, " ;cos: ", cos, " ; sin: ", sin)
    this.car.x += sin * enviroment.car_speed;
    this.car.y -= cos * enviroment.car_speed;
    this.leftSensor.update(this.car.x, this.car.y, this.car.angle);
    this.frontSensor.update(this.car.x, this.car.y, this.car.angle);
    this.rightSensor.update(this.car.x, this.car.y, this.car.angle);
  }

  readSensors() {

  }
}

var car;
var graphics;
var sensor;
var angle_ddd = 20;
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

  gameReady = true; // line: {x1, y1, x2, y2}
}

function update() {
  if (!gameReady) return
  makeDecision(car);
  car.drive();
}

function makeDecision(gameCar) {
  if (Math.random() > 0.5) {
    car.turnLeft();
  }
  else {
    car.turnRight();
  }
}
