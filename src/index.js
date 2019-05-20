import Phaser from "phaser";
import mapImg from "./assets/map1.jpg";
import carImg from "./assets/car.png";
// import enviroment from "./enviroment.js"

var enviroment = {
    car_x: 20,
    car_y: 50,
    car_start_angle: 90,
    game_width: 1050,
    game_height: 700,
    title: "canyon",
    sensorLength: 100,
    car_speed: 3,
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

var game;
var gameReady = false;

// defaults
document.getElementById('inputCarX').value = enviroment.car_x;
document.getElementById('inputCarY').value = enviroment.car_y;

document.getElementById("start-btn").onclick = function() {
    console.log("START GAME");
    document.getElementById('game_menu').style.display = 'none';

    var x = document.getElementById('inputCarX').value;
    var y = document.getElementById('inputCarY').value;
    enviroment.car_x = parseInt(x, 10);
    enviroment.car_y = parseInt(y, 10);

    game = new Phaser.Game(config);
};


class Sensor {
    constructor(x, y, context, length, angle, width, color, offset) {
        this.length = length;
        this.graphics = context.add.graphics({lineStyle: {width: width, color: color}});
        this.line = new Phaser.Geom.Line(x, y, x + length, y);
        var point = new Phaser.Geom.Point(x, y);
        Phaser.Geom.Line.RotateAroundPoint(this.line, point, getRadian(angle - offset));
        this.offset = offset;

        this.steps = {
            near: {from: 0, to: 50},
            medium: {from: 30, to: 80},
            far: {from: 60, to: 100},
        };
        this.c2d = document.getElementById('imageMap').getContext('2d');
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

    readRawData() {
        var points = this.line.getPoints(this.length);

        for (let i = 0; i < points.length; i += 1) {
            var pixel = this.c2d.getImageData(points[i].x, points[i].y, 1, 1).data;

            if (pixel[0] == 0 && pixel[1] == 0 && pixel[2] == 0) {
                return i / this.length;
            }
        }
        return 1;
    }

    read() {
        var value = this.readRawData() * 100;
        //console.log("RawData = " + value);
        var dist = {NEAR: 0, MEDIUM: 0, FAR: 0};

        if (this.steps.near.from < value && value <= this.steps.near.to) {
            dist.NEAR = 1;
        }

        if (this.steps.medium.from < value && value <= this.steps.medium.to) {
            dist.MEDIUM = 1;
        }

        if (this.steps.far.from < value && value <= this.steps.far.to) {
            dist.FAR = 1;
        }

        if (dist.NEAR == 1 && dist.MEDIUM == 1) {
            var diff = (value - this.steps.medium.from) / (this.steps.near.to - this.steps.medium.from);
            dist.NEAR -= diff;
            dist.MEDIUM = diff;
        } else if (dist.MEDIUM == 1 && dist.FAR == 1) {
            var diff = (value - this.steps.far.from) / (this.steps.medium.to - this.steps.far.from);
            dist.MEDIUM -= diff;
            dist.FAR = diff;
        }

        return dist;
    }
}

var logs = {};

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
            1, 0x000000, enviroment.car_start_angle + enviroment.sensor_angle);


        this.frontSensor = new Sensor(
            this.car.x, this.car.y, context,
            enviroment.sensorLength, this.car.angle,
            1, 0x000000, enviroment.car_start_angle);

        this.rightSensor = new Sensor(
            this.car.x, this.car.y, context,
            enviroment.sensorLength, this.car.angle,
            1, 0x000000, enviroment.car_start_angle - enviroment.sensor_angle);
    }

    turnLeft() {
        this.car.angle -= 5;
    }



    cmp_sensors(sensor1, sensor2) {
        if (sensor1.NEAR != 0 || sensor2.NEAR != 0)
            return sensor1.NEAR > sensor2.NEAR;
        else if (sensor1.MEDIUM != 0 || sensor2.MEDIUM != 0)
            return sensor1.MEDIUM > sensor2.MEDIUM;
        else
            return false;
    }

    makeDecision() {
        let angle_turn = {
            STRONG_RIGHT: 0,
            STRONG_LEFT: 0,
            MEDIUM_RIGHT: 0,
            MEDIUM_LEFT: 0,
            WEAK_RIGHT: 0,
            WEAK_LEFT: 0
        };
        let front_sensor = this.frontSensor.read();
        let right_sensor = this.rightSensor.read();
        let left_sensor = this.leftSensor.read();
        //let front_sensor = { NEAR: 1, MEDIUM: 0, FAR: 0 };
        //let right_sensor = { NEAR: 0, MEDIUM: 1, FAR: 0 };
        //let left_sensor = { NEAR: 0, MEDIUM: 0, FAR: 1 };
        // console.log("Front Sensor:" + front_sensor.FAR.toString() + " " + front_sensor.MEDIUM.toString() + " " + front_sensor.NEAR.toString());
        // console.log("Right Sensor:" + right_sensor.FAR.toString() + " " + right_sensor.MEDIUM.toString() + " " + right_sensor.NEAR.toString());
        // console.log("Left Sensor:" + left_sensor.FAR.toString() + " " + left_sensor.MEDIUM.toString() + " " + left_sensor.NEAR.toString());
        if (front_sensor.FAR > 0) {
            if (right_sensor.FAR > 0) {
                if (left_sensor.FAR > 0) {
                    if (this.cmp_sensors(right_sensor, left_sensor))
                        angle_turn.WEAK_LEFT += front_sensor.FAR * right_sensor.FAR * left_sensor.FAR;
                    else
                        angle_turn.WEAK_RIGHT += front_sensor.FAR * right_sensor.FAR * left_sensor.FAR;
                }
                if (left_sensor.MEDIUM > 0) {
                    angle_turn.MEDIUM_RIGHT += front_sensor.FAR * right_sensor.FAR * left_sensor.MEDIUM;
                }
                if (left_sensor.NEAR > 0) {
                    angle_turn.STRONG_RIGHT += front_sensor.FAR * right_sensor.FAR * left_sensor.NEAR;
                }
            }
            if (right_sensor.MEDIUM > 0) {
                if (left_sensor.FAR > 0) {
                    angle_turn.MEDIUM_LEFT += front_sensor.FAR * right_sensor.MEDIUM * left_sensor.FAR;
                }
                if (left_sensor.MEDIUM > 0) {
                    if (this.cmp_sensors(right_sensor, left_sensor))
                        angle_turn.WEAK_LEFT += front_sensor.FAR * right_sensor.MEDIUM * left_sensor.MEDIUM;
                    else
                        angle_turn.WEAK_RIGHT += front_sensor.FAR * right_sensor.MEDIUM * left_sensor.MEDIUM;

                }
                if (left_sensor.NEAR > 0) {
                    angle_turn.MEDIUM_RIGHT += front_sensor.FAR * right_sensor.MEDIUM * left_sensor.NEAR;
                }
            }
            if (right_sensor.NEAR > 0) {
                if (left_sensor.FAR > 0) {
                    angle_turn.STRONG_LEFT += front_sensor.FAR * right_sensor.NEAR * left_sensor.FAR;
                }
                if (left_sensor.MEDIUM > 0) {
                    angle_turn.MEDIUM_LEFT += front_sensor.FAR * right_sensor.NEAR * left_sensor.MEDIUM;
                }
                if (left_sensor.NEAR > 0) {
                    if (this.cmp_sensors(right_sensor, left_sensor))
                        angle_turn.WEAK_LEFT += front_sensor.FAR * right_sensor.NEAR * left_sensor.NEAR;
                    else
                        angle_turn.WEAK_RIGHT += front_sensor.FAR * right_sensor.NEAR * left_sensor.NEAR;

                }
            }
        }
        if (front_sensor.MEDIUM > 0) {
            if (right_sensor.FAR > 0) {
                if (left_sensor.FAR > 0) {
                    if (this.cmp_sensors(right_sensor, left_sensor))
                        angle_turn.MEDIUM_LEFT += front_sensor.MEDIUM * right_sensor.FAR * left_sensor.FAR;
                    else
                        angle_turn.MEDIUM_RIGHT += front_sensor.MEDIUM * right_sensor.FAR * left_sensor.FAR;
                }
                if (left_sensor.MEDIUM > 0) {
                    angle_turn.MEDIUM_RIGHT += front_sensor.MEDIUM * right_sensor.FAR * left_sensor.MEDIUM;
                }
                if (left_sensor.NEAR > 0) {
                    angle_turn.STRONG_RIGHT += front_sensor.MEDIUM * right_sensor.FAR * left_sensor.NEAR;
                }
            }
            if (right_sensor.MEDIUM > 0) {
                if (left_sensor.FAR > 0) {
                    angle_turn.MEDIUM_LEFT += front_sensor.MEDIUM * right_sensor.MEDIUM * left_sensor.FAR;
                }
                if (left_sensor.MEDIUM > 0) {
                    if (this.cmp_sensors(right_sensor, left_sensor))
                        angle_turn.WEAK_LEFT += front_sensor.MEDIUM * right_sensor.MEDIUM * left_sensor.MEDIUM;
                    else
                        angle_turn.WEAK_RIGHT += front_sensor.MEDIUM * right_sensor.MEDIUM * left_sensor.MEDIUM;
                }
                if (left_sensor.NEAR > 0) {
                    angle_turn.MEDIUM_RIGHT += front_sensor.MEDIUM * right_sensor.MEDIUM * left_sensor.NEAR;
                }
            }
            if (right_sensor.NEAR > 0) {
                if (left_sensor.FAR > 0) {
                    angle_turn.STRONG_LEFT += front_sensor.MEDIUM * right_sensor.NEAR * left_sensor.FAR;
                }
                if (left_sensor.MEDIUM > 0) {
                    angle_turn.MEDIUM_LEFT += front_sensor.MEDIUM * right_sensor.NEAR * left_sensor.MEDIUM;
                }
                if (left_sensor.NEAR > 0) {
                    if (this.cmp_sensors(right_sensor, left_sensor))
                        angle_turn.WEAK_LEFT += front_sensor.MEDIUM * right_sensor.NEAR * left_sensor.NEAR;
                    else
                        angle_turn.WEAK_RIGHT += front_sensor.MEDIUM * right_sensor.NEAR * left_sensor.NEAR;
                }
            }
        }
        if (front_sensor.NEAR > 0) {
            if (right_sensor.FAR > 0) {
                if (left_sensor.FAR > 0) {
                    if (this.cmp_sensors(right_sensor, left_sensor))
                        angle_turn.STRONG_LEFT += front_sensor.NEAR * right_sensor.FAR * left_sensor.FAR;
                    else
                        angle_turn.STRONG_RIGHT += front_sensor.NEAR * right_sensor.FAR * left_sensor.FAR;
                }
                if (left_sensor.MEDIUM > 0) {
                    angle_turn.STRONG_RIGHT += front_sensor.NEAR * right_sensor.FAR * left_sensor.MEDIUM;
                }
                if (left_sensor.NEAR > 0) {
                    angle_turn.STRONG_RIGHT += front_sensor.NEAR * right_sensor.FAR * left_sensor.NEAR;
                }
            }
            if (right_sensor.MEDIUM > 0) {
                if (left_sensor.FAR > 0) {
                    angle_turn.STRONG_LEFT += front_sensor.NEAR * right_sensor.MEDIUM * left_sensor.FAR;
                }
                if (left_sensor.MEDIUM > 0) {
                    if (this.cmp_sensors(right_sensor, left_sensor))
                        angle_turn.MEDIUM_LEFT += front_sensor.NEAR * right_sensor.MEDIUM * left_sensor.MEDIUM;
                    else
                        angle_turn.MEDIUM_RIGHT += front_sensor.NEAR * right_sensor.MEDIUM * left_sensor.MEDIUM;
                }
                if (left_sensor.NEAR > 0) {
                    angle_turn.MEDIUM_RIGHT += front_sensor.NEAR * right_sensor.MEDIUM * left_sensor.NEAR;
                }
            }
            if (right_sensor.NEAR > 0) {
                if (left_sensor.FAR > 0) {
                    angle_turn.STRONG_LEFT += front_sensor.NEAR * right_sensor.NEAR * left_sensor.FAR;
                }
                if (left_sensor.MEDIUM > 0) {
                    angle_turn.MEDIUM_LEFT += front_sensor.NEAR * right_sensor.NEAR * left_sensor.MEDIUM;
                }
                if (left_sensor.NEAR > 0) {
                    if (this.cmp_sensors(right_sensor, left_sensor))
                        angle_turn.WEAK_LEFT += front_sensor.NEAR * right_sensor.NEAR * left_sensor.NEAR;
                    else
                        angle_turn.WEAK_RIGHT += front_sensor.NEAR * right_sensor.NEAR * left_sensor.NEAR;

                }
            }
        }
        /*angle_turn.WEAK_RIGHT = right_sensor.FAR * (left_sensor.MEDIUM + left_sensor.NEAR) * front_sensor.MEDIUM;
        angle_turn.MEDIUM_RIGHT = right_sensor.MEDIUM * (left_sensor.NEAR + left_sensor.MEDIUM) * front_sensor.NEAR;
        angle_turn.STRONG_RIGHT = right_sensor.FAR * (left_sensor.MEDIUM + left_sensor.NEAR) * front_sensor.NEAR;

        angle_turn.WEAK_LEFT = left_sensor.FAR * (right_sensor.MEDIUM + right_sensor.NEAR + right_sensor.FAR) * front_sensor.MEDIUM;
        angle_turn.MEDIUM_LEFT = left_sensor.MEDIUM * (right_sensor.NEAR + right_sensor.MEDIUM) * front_sensor.NEAR;
        angle_turn.STRONG_LEFT = left_sensor.FAR * (right_sensor.MEDIUM + right_sensor.NEAR + right_sensor.FAR) * front_sensor.NEAR;*/

        this.car.angle += 3 * angle_turn.WEAK_RIGHT + 5 * angle_turn.MEDIUM_RIGHT + 10 * angle_turn.STRONG_RIGHT
            + (-3) * angle_turn.WEAK_LEFT + (-5) * angle_turn.MEDIUM_LEFT + -10 * angle_turn.STRONG_LEFT;
         // console.log("Angle Turn:" + angle_turn.WEAK_RIGHT.toString() + " " + angle_turn.MEDIUM_RIGHT.toString() + " " + angle_turn.STRONG_RIGHT.toString() + " " +
         // angle_turn.WEAK_LEFT.toString() + " " + angle_turn.MEDIUM_LEFT.toString() + " " + angle_turn.STRONG_LEFT.toString() + " Angle = " + this.car.angle );
    }

    drive() {
        this.makeDecision();
        let angle = getRadian(this.car.angle);
        let cos = Math.cos(angle);
        let sin = Math.sin(angle);
        this.car.x += sin * enviroment.car_speed;
        this.car.y -= cos * enviroment.car_speed;
        this.leftSensor.update(this.car.x, this.car.y, this.car.angle);
        this.frontSensor.update(this.car.x, this.car.y, this.car.angle);
        this.rightSensor.update(this.car.x, this.car.y, this.car.angle);
    }
}

var car;
var graphics;
var sensor;

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

    gameReady = true;
}

function update() {
    if (!gameReady) return;

    car.drive();
}
