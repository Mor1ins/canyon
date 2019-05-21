import Phaser from "phaser";
import carImg from "./assets/car.png";
import mapImg1 from "./assets/Map 1.jpg";
import mapImg2 from "./assets/Map 2.jpg";
import mapImg3 from "./assets/Map 3.jpg";
import mapImg4 from "./assets/Map 4.jpg";
import finishImg from "./assets/finish_black.png";
// import enviroment from "./enviroment.js"

var enviroment = {
    car_x: 20,
    car_y: 50,
    car_start_angle: 90,
    game_width: 1050,
    game_height: 700,
    title: "canyon",
    sensorLength: 100,
    car_max_speed: 3,
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

var example;
var mapImg;

document.getElementById("start-btn").onclick = function () {
    console.log("START GAME");
    document.getElementById('game_menu').style.display = 'none';

    var sensor_length = document.getElementById('length-slider').value;
    var car_speed = document.getElementById('speed-slider').value;
    var mapa = document.getElementById('select-map').value;


    if (mapa == 'Map 1') {
        mapImg = mapImg1;
        enviroment.car_x = 50
        enviroment.car_y = 200
    }

    if (mapa == 'Map 2') {
        mapImg = mapImg2;
        enviroment.car_x = 20
        enviroment.car_y = 50
    }

    if (mapa == 'Map 3') {
        mapImg = mapImg3;
        enviroment.car_x = 50
        enviroment.car_y = 250
    }

    if (mapa == 'Map 4') {
        mapImg = mapImg4;
        enviroment.car_x = 50
        enviroment.car_y = 450
    }


    example = document.getElementById("imageMap");
    example.style.display = 'none';
    var ctx = example.getContext('2d');
    var pic = new Image();
    pic.src = mapImg;
    console.log(pic.src);
    pic.onload = function () {
        ctx.drawImage(pic, 0, 0);
    }

    enviroment.sensorLength = parseInt(sensor_length, 10);
    enviroment.car_max_speed = parseInt(car_speed, 10);

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
            near: {from: 0, to: enviroment.sensorLength / 3 + (0.1 * enviroment.sensorLength)},
            medium: {
                from: enviroment.sensorLength / 3 - (0.1 * enviroment.sensorLength),
                to: 2 * enviroment.sensorLength / 3 + (0.1 * enviroment.sensorLength)
            },
            far: {
                from: 2 * enviroment.sensorLength / 3 - (0.1 * enviroment.sensorLength),
                to: enviroment.sensorLength
            },
        };
        this.c2d = document.getElementById('imageMap').getContext('2d');
    }

    update(x, y, angle) {
        this.line.x1 = x + 6;
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

            if (pixel[0] < 10 && pixel[1] < 10 && pixel[2] < 10) {
                return i / this.length;
            }
        }
        return 1;
    }

    read() {
        var value = this.readRawData() * this.length;
        //console.log("RawData = " + value);
        return value;
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
        this.car.displayWidth = this.car.displayWidth * 0.025;
        this.car.displayHeight = this.car.displayHeight * 0.025;
        this.car.speed = enviroment.car_max_speed / 2;
        this.car.angle = enviroment.car_start_angle;
        this.steps = {
            near: {from: 0, to: enviroment.sensorLength / 3 + (0.1 * enviroment.sensorLength)},
            medium: {
                from: enviroment.sensorLength / 3 - (0.1 * enviroment.sensorLength),
                to: 2 * enviroment.sensorLength / 3 + (0.1 * enviroment.sensorLength)
            },
            far: {
                from: 2 * enviroment.sensorLength / 3 - (0.1 * enviroment.sensorLength),
                to: enviroment.sensorLength
            },
        };
        this.stopped = false;

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


    cmp_sensors(sensor1, sensor2) {
        if (sensor1.NEAR != 0 || sensor2.NEAR != 0)
            return sensor1.NEAR > sensor2.NEAR;
        else if (sensor1.MEDIUM != 0 || sensor2.MEDIUM != 0)
            return sensor1.MEDIUM > sensor2.MEDIUM;
        else
            return false;
    }

    create_value_set(value) {
        var dist = {NEAR: 0, MEDIUM: 0, FAR: 0};

        if (value <= this.steps.near.to) {
            dist.NEAR = 1;
        }

        if (this.steps.medium.from < value && value <= this.steps.medium.to) {
            dist.MEDIUM = 1;
        }

        if (this.steps.far.from < value) {
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

    makeDecision() {
        let angle_turn = {
            STRONG_RIGHT: 0,
            STRONG_LEFT: 0,
            MEDIUM_RIGHT: 0,
            MEDIUM_LEFT: 0,
            WEAK_RIGHT: 0,
            WEAK_LEFT: 0
        };
        let speed = {
            SLOW: 0,
            MEDIUM: 0,
            HIGH: 0
        };
        let steps = {
            slow: {from: 0.1, to: enviroment.car_max_speed / 3 + (0.1 * enviroment.car_max_speed)},
            medium: {
                from: enviroment.car_max_speed / 3 - (0.1 * enviroment.car_max_speed),
                to: 2 * enviroment.car_max_speed / 3 + (0.1 * enviroment.car_max_speed)
            },
            high: {
                from: 2 * enviroment.car_max_speed / 3 - (0.1 * enviroment.car_max_speed),
                to: enviroment.car_max_speed
            },
        };
        let front_value = this.frontSensor.read();
        let right_value = this.rightSensor.read();
        let left_value = this.leftSensor.read();
        let front_sensor = this.create_value_set(front_value);
        let left_sensor = this.create_value_set(left_value);
        let right_sensor = this.create_value_set(right_value);
        if (front_sensor.FAR > 0) {
            if (right_sensor.FAR > 0) {
                if (left_sensor.FAR > 0) {
                    if (right_value < left_value)
                        angle_turn.WEAK_LEFT += front_sensor.FAR * right_sensor.FAR * left_sensor.FAR;
                    else
                        angle_turn.WEAK_RIGHT += front_sensor.FAR * right_sensor.FAR * left_sensor.FAR;
                    speed.HIGH += front_sensor.FAR * right_sensor.FAR * left_sensor.FAR;
                }
                if (left_sensor.MEDIUM > 0) {
                    angle_turn.MEDIUM_RIGHT += front_sensor.FAR * right_sensor.FAR * left_sensor.MEDIUM;
                    speed.HIGH += front_sensor.FAR * right_sensor.FAR * left_sensor.MEDIUM;
                }
                if (left_sensor.NEAR > 0) {
                    angle_turn.STRONG_RIGHT += front_sensor.FAR * right_sensor.FAR * left_sensor.NEAR;
                    speed.HIGH += front_sensor.FAR * right_sensor.FAR * left_sensor.NEAR;
                }
            }
            if (right_sensor.MEDIUM > 0) {
                if (left_sensor.FAR > 0) {
                    angle_turn.MEDIUM_LEFT += front_sensor.FAR * right_sensor.MEDIUM * left_sensor.FAR;
                    speed.HIGH += front_sensor.FAR * right_sensor.MEDIUM * left_sensor.FAR;
                }
                if (left_sensor.MEDIUM > 0) {
                    if (right_value < left_value)
                        angle_turn.MEDIUM_LEFT += front_sensor.FAR * right_sensor.MEDIUM * left_sensor.MEDIUM;
                    else
                        angle_turn.MEDIUM_RIGHT += front_sensor.FAR * right_sensor.MEDIUM * left_sensor.MEDIUM;
                    speed.HIGH += front_sensor.FAR * right_sensor.MEDIUM * left_sensor.MEDIUM;

                }
                if (left_sensor.NEAR > 0) {
                    angle_turn.MEDIUM_RIGHT += front_sensor.FAR * right_sensor.MEDIUM * left_sensor.NEAR;
                    speed.HIGH += front_sensor.FAR * right_sensor.MEDIUM * left_sensor.NEAR;
                }
            }
            if (right_sensor.NEAR > 0) {
                if (left_sensor.FAR > 0) {
                    angle_turn.STRONG_LEFT += front_sensor.FAR * right_sensor.NEAR * left_sensor.FAR;
                    speed.HIGH += front_sensor.FAR * right_sensor.NEAR * left_sensor.FAR;
                }
                if (left_sensor.MEDIUM > 0) {
                    angle_turn.MEDIUM_LEFT += front_sensor.FAR * right_sensor.NEAR * left_sensor.MEDIUM;
                    speed.HIGH += front_sensor.FAR * right_sensor.NEAR * left_sensor.MEDIUM;
                }
                if (left_sensor.NEAR > 0) {
                    if (right_value < left_value)
                        angle_turn.WEAK_LEFT += front_sensor.FAR * right_sensor.NEAR * left_sensor.NEAR;
                    else
                        angle_turn.WEAK_RIGHT += front_sensor.FAR * right_sensor.NEAR * left_sensor.NEAR;
                    speed.HIGH += front_sensor.FAR * right_sensor.NEAR * left_sensor.NEAR;

                }
            }
        }
        if (front_sensor.MEDIUM > 0) {
            if (right_sensor.FAR > 0) {
                if (left_sensor.FAR > 0) {
                    if (right_value < left_value)
                        angle_turn.STRONG_LEFT += front_sensor.MEDIUM * right_sensor.FAR * left_sensor.FAR;
                    else
                        angle_turn.STRONG_RIGHT += front_sensor.MEDIUM * right_sensor.FAR * left_sensor.FAR;
                    speed.MEDIUM += front_sensor.MEDIUM * right_sensor.FAR * left_sensor.FAR;
                }
                if (left_sensor.MEDIUM > 0) {
                    angle_turn.MEDIUM_RIGHT += front_sensor.MEDIUM * right_sensor.FAR * left_sensor.MEDIUM;
                    speed.MEDIUM += front_sensor.MEDIUM * right_sensor.FAR * left_sensor.MEDIUM;
                }
                if (left_sensor.NEAR > 0) {
                    angle_turn.STRONG_RIGHT += front_sensor.MEDIUM * right_sensor.FAR * left_sensor.NEAR;
                    speed.MEDIUM += front_sensor.MEDIUM * right_sensor.FAR * left_sensor.NEAR;
                }
            }
            if (right_sensor.MEDIUM > 0) {
                if (left_sensor.FAR > 0) {
                    angle_turn.MEDIUM_LEFT += front_sensor.MEDIUM * right_sensor.MEDIUM * left_sensor.FAR;
                    speed.MEDIUM += front_sensor.MEDIUM * right_sensor.MEDIUM * left_sensor.FAR;
                }
                if (left_sensor.MEDIUM > 0) {
                    if (right_value < left_value)
                        angle_turn.MEDIUM_LEFT += front_sensor.MEDIUM * right_sensor.MEDIUM * left_sensor.MEDIUM;
                    else
                        angle_turn.MEDIUM_RIGHT += front_sensor.MEDIUM * right_sensor.MEDIUM * left_sensor.MEDIUM;
                    speed.MEDIUM += front_sensor.MEDIUM * right_sensor.MEDIUM * left_sensor.MEDIUM;
                }
                if (left_sensor.NEAR > 0) {
                    angle_turn.MEDIUM_RIGHT += front_sensor.MEDIUM * right_sensor.MEDIUM * left_sensor.NEAR;
                    speed.MEDIUM += front_sensor.MEDIUM * right_sensor.MEDIUM * left_sensor.NEAR;
                }
            }
            if (right_sensor.NEAR > 0) {
                if (left_sensor.FAR > 0) {
                    angle_turn.STRONG_LEFT += front_sensor.MEDIUM * right_sensor.NEAR * left_sensor.FAR;
                    speed.MEDIUM += front_sensor.MEDIUM * right_sensor.NEAR * left_sensor.FAR;
                }
                if (left_sensor.MEDIUM > 0) {
                    angle_turn.MEDIUM_LEFT += front_sensor.MEDIUM * right_sensor.NEAR * left_sensor.MEDIUM;
                    speed.MEDIUM += front_sensor.MEDIUM * right_sensor.NEAR * left_sensor.MEDIUM;
                }
                if (left_sensor.NEAR > 0) {
                    if (right_value < left_value)
                        angle_turn.WEAK_LEFT += front_sensor.MEDIUM * right_sensor.NEAR * left_sensor.NEAR;
                    else
                        angle_turn.WEAK_RIGHT += front_sensor.MEDIUM * right_sensor.NEAR * left_sensor.NEAR;
                    speed.MEDIUM += front_sensor.MEDIUM * right_sensor.NEAR * left_sensor.NEAR;
                }
            }
        }
        if (front_sensor.NEAR > 0) {
            if (right_sensor.FAR > 0) {
                if (left_sensor.FAR > 0) {
                    if (right_value < left_value)
                        angle_turn.STRONG_LEFT += front_sensor.NEAR * right_sensor.FAR * left_sensor.FAR;
                    else
                        angle_turn.STRONG_RIGHT += front_sensor.NEAR * right_sensor.FAR * left_sensor.FAR;
                    speed.SLOW += front_sensor.NEAR * right_sensor.FAR * left_sensor.FAR;
                }
                if (left_sensor.MEDIUM > 0) {
                    angle_turn.STRONG_RIGHT += front_sensor.NEAR * right_sensor.FAR * left_sensor.MEDIUM;
                    speed.SLOW += front_sensor.NEAR * right_sensor.FAR * left_sensor.MEDIUM;
                }
                if (left_sensor.NEAR > 0) {
                    angle_turn.STRONG_RIGHT += front_sensor.NEAR * right_sensor.FAR * left_sensor.NEAR;
                    speed.SLOW += front_sensor.NEAR * right_sensor.FAR * left_sensor.NEAR;
                }
            }
            if (right_sensor.MEDIUM > 0) {
                if (left_sensor.FAR > 0) {
                    angle_turn.STRONG_LEFT += front_sensor.NEAR * right_sensor.MEDIUM * left_sensor.FAR;
                    speed.SLOW += front_sensor.NEAR * right_sensor.MEDIUM * left_sensor.FAR;
                }
                if (left_sensor.MEDIUM > 0) {
                    if (right_value < left_value)
                        angle_turn.MEDIUM_LEFT += front_sensor.NEAR * right_sensor.MEDIUM * left_sensor.MEDIUM;
                    else
                        angle_turn.MEDIUM_RIGHT += front_sensor.NEAR * right_sensor.MEDIUM * left_sensor.MEDIUM;
                    speed.SLOW += front_sensor.NEAR * right_sensor.MEDIUM * left_sensor.MEDIUM;
                }
                if (left_sensor.NEAR > 0) {
                    angle_turn.MEDIUM_RIGHT += front_sensor.NEAR * right_sensor.MEDIUM * left_sensor.NEAR;
                    speed.SLOW += front_sensor.NEAR * right_sensor.MEDIUM * left_sensor.NEAR;
                }
            }
            if (right_sensor.NEAR > 0) {
                if (left_sensor.FAR > 0) {
                    angle_turn.STRONG_LEFT += front_sensor.NEAR * right_sensor.NEAR * left_sensor.FAR;
                    speed.SLOW += front_sensor.NEAR * right_sensor.NEAR * left_sensor.FAR;
                }
                if (left_sensor.MEDIUM > 0) {
                    angle_turn.MEDIUM_LEFT += front_sensor.NEAR * right_sensor.NEAR * left_sensor.MEDIUM;
                    speed.SLOW += front_sensor.NEAR * right_sensor.NEAR * left_sensor.MEDIUM;
                }
                if (left_sensor.NEAR > 0) {
                    if (right_value < left_value)
                        angle_turn.WEAK_LEFT += front_sensor.NEAR * right_sensor.NEAR * left_sensor.NEAR;
                    else
                        angle_turn.WEAK_RIGHT += front_sensor.NEAR * right_sensor.NEAR * left_sensor.NEAR;
                    speed.SLOW += front_sensor.NEAR * right_sensor.NEAR * left_sensor.NEAR;

                }
            }
        }

        this.car.angle += 1 * angle_turn.WEAK_RIGHT + 3 * angle_turn.MEDIUM_RIGHT + 5 * angle_turn.STRONG_RIGHT
            + (-1) * angle_turn.WEAK_LEFT + (-3) * angle_turn.MEDIUM_LEFT + -5 * angle_turn.STRONG_LEFT;
        this.car.speed = speed.SLOW * steps.slow.from + speed.MEDIUM * (steps.medium.to + steps.medium.from) / 2 + speed.HIGH * steps.high.to;

    }

    drive() {
        if (this.stopped) return;

        this.makeDecision();
        let angle = getRadian(this.car.angle);
        let cos = Math.cos(angle);
        let sin = Math.sin(angle);
        this.car.x += sin * this.car.speed;
        this.car.y -= cos * this.car.speed;

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
    this.load.image("finish", finishImg);
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

    if (car.car.x > (enviroment.game_width - 30)) {
        console.log("FINISH GAME");
        car.car.visible = false;
        car.stopped = true;
        gameReady = false;

        this.add.rectangle(
            enviroment.game_width / 2,
            enviroment.game_height / 2,
            enviroment.game_width,
            enviroment.game_height,
            0xffffff);

        const finish = this.add.image(
            enviroment.game_width / 2,
            enviroment.game_height / 2,
            "finish"
        );

        finish.displayHeight = enviroment.game_height;
    }

    car.drive();

}
