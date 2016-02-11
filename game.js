"use strict";

var xBlockCount = 31;
var yBlockCount = 18;
var blockDim = 50;
var towerCount = 10;
var mazeDifficuilty = 40;
var monsterCount = 5;
var minesCount = 5;
var tntsCount = 4;
var fireCount = 40;

var platforms;
var monsters;

var tnt_sound;
var win_sound;
var bullet_sound;


var firesPlayer;
var firesTower;

var player;
var monsterObjects = [];
var keys = [];
var field;

var towers = {};
var maxTowerRange = 2;

var blocks = {};

var mines;
var tnts;
var explosions;
var hidden;

var visionRadius = 3;

var score;
var startDoor;
var endDoor;

var fireText;
var mineText;
var tntText;
var timeText
var scoreText;
var startTime;

var resources = {
  "T": {
    "type": "sprite",
    "imagePath": "assets/tower.png",
    "width": 50,
    "height": 50
  },
  "F": {
    "type": "image",
    "imagePath": ["assets/block8.png", "assets/block6.png", "assets/block9.png", "assets/block7.png"]
  },
  "*": {
    "type": "image",
    "imagePath": ["assets/block3.png", "assets/block4.png", "assets/block5.png"]
  },
  "D": {
    "type": "sprite",
    "imagePath": "assets/door.png",
    "width": 37,
    "height": 50
  },
  "S": {
    "type": "sprite",
    "imagePath": "assets/door.png",
    "width": 37,
    "height": 50
  },
}


var game = new Phaser.Game(xBlockCount * blockDim + 100, yBlockCount * blockDim, Phaser.AUTO, '', {
  preload: preload,
  create: create,
  update: update
});


function preload() {

  game.load.image('hidden', 'assets/black.png');
  game.load.image('bullets', 'assets/bullets.png');
  game.load.image('time', 'assets/timer.png');
  game.load.image('score', 'assets/treasure.png');

  game.load.image('sky', 'assets/sky.png');
  game.load.image('firePlayer', 'assets/fire.png');
  game.load.image('fireTower', 'assets/towerfire.png');

  game.load.image('mine', 'assets/mine.png');
  game.load.image('tnt', 'assets/tnt.png');
  game.load.image('tnt2', 'assets/tnt2.png');
  game.load.spritesheet('explosion', 'assets/explosion.png', 40, 40);
  game.load.spritesheet('tntExplosion', 'assets/explosion3.png', 128, 64);

  game.load.audio('tntsound', ['assets/tntsound.mp3']);
  game.load.audio('win', ['assets/win.mp3']);
  game.load.audio('bulletsound', ['assets/bullet.mp3']);

  player = new MovingObject(20, 100, 30, 45, 150, 100, 'assets/roshan.png', blockDim);

  for (var i = 0; i < monsterCount; i++) {
    monsterObjects.push(new MovingObject(50, 50, 45, 41, 100 + nextRand(5) * 10, 10, 'assets/beat2.png', blockDim));
  }

  for (var key in resources) {
    if (resources[key].type == "image") {
      for (var i = 0; i < resources[key].imagePath.length; i++) {
        game.load.image(key + i, resources[key].imagePath[i]);
      }
    } else if (resources[key].type == "sprite") {
      game.load.spritesheet(key, resources[key].imagePath, resources[key].width, resources[key].height);
    }
  }
}

function create() {
  game.add.sprite(0, 0, 'sky');
  this.game.input.keyboard.onDownCallback = function(e) {
    keys[e.keyCode] = true;
  };
  this.game.input.keyboard.onUpCallback = function(e) {
    keys[e.keyCode] = false;
  };


  platforms = game.add.group();
  platforms.enableBody = true;

  mines = game.add.group();
  mines.enableBody = true;

  tnts = game.add.group();
  tnts.enableBody = true;

  monsters = game.add.group();
  monsters.enableBody = true;


  firesPlayer = game.add.group();
  firesPlayer.enableBody = true;

  firesTower = game.add.group();
  firesTower.enableBody = true;

  explosions = game.add.group();
  explosions.enableBody = true;

  hidden = game.add.group();
  hidden.enableBody = true;

  tnt_sound = game.add.audio('tntsound');
  win_sound = game.add.audio('win');
  bullet_sound = game.add.audio('bulletsound');

  startTime = Date.now();
  score = 0;

  for (var i = 0; i < yBlockCount; i++) {
    for (var k = 0; k < xBlockCount; k++) {
      hidden.create(k * blockDim, i * blockDim, 'hidden');
    }
  }

  field = getMaze(yBlockCount, xBlockCount, towerCount, mazeDifficuilty);

  for (var i = 0; i < yBlockCount; i++) {
    for (var k = 0; k < xBlockCount; k++) {
      if (field[i][k] == "-") continue;

      if (field[i][k] == "S") {
        player.x = k * blockDim + blockDim / 2;
        player.y = i * blockDim;

        startDoor = platforms.create(k * blockDim, i * blockDim, field[i][k]);
        startDoor.body.immovable = true;
        startDoor.animations.add('open', [0, 1, 2, 3, 4], 15, false);
        continue;
      } else if (field[i][k] == "D") {
        for (var h = 0; h < monsterCount; h++) {
          monsterObjects[h].x = (k - 1) * (blockDim);
          monsterObjects[h].y = i * (blockDim);
        }
        endDoor = platforms.create(k * blockDim, i * blockDim, field[i][k]);
        endDoor.body.immovable = true;
        endDoor.animations.add('close', [4, 3, 2, 1, 0], 15, false);
        endDoor.frame = 4;
        continue;
      } else if (field[i][k] == "T") {
        var tower = platforms.create(k * blockDim, i * blockDim, field[i][k]);
        tower.body.immovable = true;
        towers[i + "," + k] = new Tower(i, k, tower, player, (nextRand(5) + 1) * 100,
          'fireTower', firesTower, blockDim);
        continue;
      }

      var block;
      if (resources[field[i][k]].type == "image") {
        block = platforms.create(k * blockDim, i * blockDim,
          field[i][k] + getImageKey(i, k));
        blocks[i + "," + k] = block;
      } else {
        block = platforms.create(k * blockDim, i * blockDim, field[i][k]);
      }
      block.body.immovable = true;
      block.i = i;
      block.k = k;
    }
  }

  player.create();
  player.setFire(170, 'firePlayer', firesPlayer);

  for (var i = 0; i < monsterCount; i++) {
    monsterObjects[i].create(monsters);
    monsterObjects[i].move(true, false, false, false);
    monsterObjects[i].turnRand();
  }

  startDoor.animations.play('open');

  game.add.sprite(game.world.width - 80, 20, 'bullets');
  fireText = game.add.text(game.world.width - 50, 23, ': ' + fireCount, {
    fontSize: '5px',
    fill: '#A05'
  });

  game.add.sprite(game.world.width - 95, 70, 'mine');
  mineText = game.add.text(game.world.width - 50, 80, ': ' + minesCount, {
    fontSize: '5px',
    fill: '#359'
  });

  game.add.sprite(game.world.width - 95, 130, 'tnt2');
  tntText = game.add.text(game.world.width - 50, 140, ': ' + tntsCount, {
    fontSize: '5px',
    fill: '#A05'
  });

  game.add.sprite(game.world.width - 95, 200, 'time');
  timeText = game.add.text(game.world.width - 50, 210, ': ' + Math.ceil((Date.now() - startTime) / 1000), {
    fontSize: '5px',
    fill: '#000'
  });

  game.add.sprite(game.world.width - 96, 270, 'score');
  scoreText = game.add.text(game.world.width - 45, 290, '' + score, {
    fontSize: '5px',
    fill: '#000'
  });
}


function update() {

  timeText.text = ': ' + Math.floor((Date.now() - startTime) / 1000);

  game.physics.arcade.collide(endDoor, player.sprite, endGame, null, this);
  game.physics.arcade.collide(player.sprite, platforms);
  game.physics.arcade.overlap(player.sprite, monsters, playerMonstersCollide, null, this);
  game.physics.arcade.overlap(firesPlayer, platforms, killFire, null, this);
  game.physics.arcade.overlap(firesPlayer, monsters, hurtMonster, null, this);
  game.physics.arcade.overlap(player.sprite, firesTower, hurtPlayer, null, this);
  game.physics.arcade.collide(monsters, platforms, changeDirection, null, this);
  game.physics.arcade.overlap(monsters, mines, killMonster, null, this);


  for (var i = 0; i < monsterCount; i++) {
    monsterObjects[i].updateGraphics();
  }

  player.sprite.body.velocity.x = 0;
  player.sprite.body.velocity.y = 0;

  showArea(player.getCurrentYBlock(), player.getCurrentXBlock());

  player.move(keys[Phaser.Keyboard.LEFT], keys[Phaser.Keyboard.UP],
    keys[Phaser.Keyboard.RIGHT], keys[Phaser.Keyboard.DOWN]);

  if (keys[Phaser.Keyboard.SPACEBAR]) {
    if (player.attack()) {
      fireCount--;
      bullet_sound.play();
      fireText.text = ": " + fireCount;
    }
  }
  if (keys[Phaser.Keyboard.M]) tryPlantMine();
  if (keys[Phaser.Keyboard.T]) tryPlantTNT();

  for (var i = -maxTowerRange; i < maxTowerRange; i++) {
    if (player.getCurrentYBlock() + i < 0 || player.getCurrentYBlock() + i >= yBlockCount) continue;
    for (var k = -maxTowerRange; k < maxTowerRange; k++) {
      if (player.getCurrentXBlock() + k < 0 || player.getCurrentXBlock() + k >= xBlockCount) continue;
      var towerI = player.getCurrentYBlock() + i;
      var towerK = player.getCurrentXBlock() + k;
      if (towers[towerI + "," + towerK]) {
        towers[towerI + "," + towerK].attack();
      }
    }
  }

}

function playerMonstersCollide(player, monster) {
  player.superClass.causeDamage(1);
  monster.superClass.causeDamage(1);
  if (player.superClass.isDead) {
    player.superClass.clearGraphics();
    player.kill();
    player.destroy();
    //hidden.callAll("kill", null);
    setTimeout(function() {
      alert("You  Lose  :(");
      location.reload(true);
    }, 100);
  }
  if (monster.superClass.isDead) {
    score += Math.ceil(200 / Math.floor((Date.now() - startTime) / 1000));
    scoreText.text = '' + score;
    monster.superClass.clearGraphics();
    monster.kill();
  }
}

function killMonster(monster, mine) {
  field[mine.i] = edit(field[mine.i], mine.k, '-');
  monster.superClass.causeDamage(777777);
  monster.kill();

  score += Math.ceil(250 / Math.floor((Date.now() - startTime) / 1000));
  scoreText.text = '' + score;

  var exp = explosions.create(mine.k * blockDim, mine.i * blockDim, 'explosion');
  exp.animations.add('explode', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 15, false);
  exp.animations.play('explode');

  mine.kill();
}

function tryPlantTNT() {
  if (tntsCount == 0) return;
  var i = player.getCurrentYBlock();
  var k = player.getCurrentXBlock();
  if (field[i][k] != '-') return;
  tntsCount--;
  tntText.text = ": " + tntsCount;
  field[i] = edit(field[i], k, '7');
  var tnt = tnts.create(k * blockDim, i * blockDim, 'tnt');
  tnt.i = i;
  tnt.k = k;
  setTimeout('tntExploded(' + i + ', ' + k + ')', 1000);
}


function tntExploded(i, k) {
  var x = explosions.create(k * blockDim - 39, i * blockDim - 7, 'tntExplosion');
  game.physics.arcade.enable(x);
  x.animations.add('explote', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], 20, false);
  x.animations.play('explote');
  tnt_sound.play();

  field[i] = edit(field[i], k, '-');

  tnts.forEach(function(item) {
    if (item.i == i && item.k == k) {
      item.kill();
    }
  }, this);

  killPlatformAt(i + 1, k);
  killPlatformAt(i, k + 1);
  killPlatformAt(i - 1, k);
  killPlatformAt(i, k - 1);


}

function killPlatformAt(i, k) {
  if (field[i][k] == '*') {
    field[i] = edit(field[i], k, '-');
    blocks[i + "," + k].kill();
  } else if (field[i][k] == 'T') {
    field[i] = edit(field[i], k, '-');
    towers[i + "," + k].sprite.kill();
    score += Math.ceil(400 / Math.floor((Date.now() - startTime) / 1000));
    scoreText.text = '' + score;
    delete towers[i + "," + k];
  }
}

function tryPlantMine() {
  if (minesCount == 0) return;
  var i = player.getCurrentYBlock();
  var k = player.getCurrentXBlock();
  if (field[i][k] != '-') return;
  minesCount--;
  mineText.text = ": " + minesCount;
  field[i] = edit(field[i], k, '7');
  var mine = mines.create(k * blockDim, i * blockDim, 'mine');
  mine.i = i;
  mine.k = k;
}

function killFire(fire, block) {
  fire.kill();
}

function hurtPlayer(player, fire) {
  player.superClass.causeDamage(4);
  fire.kill();
  if (player.superClass.isDead) {
    player.superClass.clearGraphics();
    player.kill();
    player.destroy();
    hidden.callAll("kill", null);
    setTimeout(function() {
      alert("You  Lose  :(");
      location.reload(true);
    }, 100);
  }
}

function hurtMonster(fire, monster) {
  monster.superClass.causeDamage(2);
  fire.kill();
  if (monster.superClass.isDead) {
    monster.superClass.clearGraphics();
    monster.kill();
    monsters.remove(monster, true, true);
    score += Math.ceil(250 / Math.floor((Date.now() - startTime) / 1000));
    scoreText.text = '' + score;
  }
}

function endGame(door, player) {
  hidden.callAll("kill", null);
  door.animations.play('close');
  win_sound.play();
  setTimeout(function() {
    alert("You  Won  :)\nYour Score: " + score + "\nTime: " + Math.ceil((Date.now() - startTime) / 1000));
    location.reload(true);
  }, 270);
}


function changeDirection(movingObject, block) {
  movingObject.superClass.turnRand();
}

// Gets random integer number from 0 to limit, limit not included.
function nextRand(limit) {
  return Math.ceil(Math.random() * 7827) % limit;
}


function getImageKey(i, k) {
  if (i == 0) return '1';
  else if (i == yBlockCount - 1) return '3';
  else if (k == 0) return '0';
  else if (k == xBlockCount - 1) return '2';

  return nextRand(resources[field[i][k]].imagePath.length);
}

function showArea(ci, ck) {
  var n = visionRadius * 2 + 1;
  for (var i = 0; i < n; ++i) {
    for (var k = 0; k < 2 * Math.min(n - 1 - i, i) + 1; ++k) {
      var ii = ci + i - visionRadius;
      var kk = ck + k - visionRadius;
      if (ii < 0 || ii >= yBlockCount || kk < 0 || kk >= xBlockCount) continue;
      hidden.getChildAt(ii * xBlockCount + kk).kill();
    }
  }
}