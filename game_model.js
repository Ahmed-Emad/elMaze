"use strict";
var DIRECTION = {"LEFT": 1, "UP": 3, "RIGHT": 2, "DOWN": 0};

var MovingObject = function (x, y, width, height, velocity, health, imageSrc, blockDim) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.velocity = velocity;
    this.blockDim = blockDim;
    this.direction = DIRECTION.RIGHT;
    this.health = health;
    this.sprite;    
    this.lastShotTime = Date.now();

    this.fireRate;
    this.fireImageKey;
    this.fireGroup;

    this.isDead = false;

    game.load.spritesheet(imageSrc, imageSrc, width, height);

    this.create = function (group) {
        if (group === undefined) {
            this.sprite = game.add.sprite(this.x, this.y, imageSrc);    
        } else {
            this.sprite = group.create(this.x, this.y, imageSrc);    
        }
        game.physics.arcade.enable(this.sprite);

        this.sprite.animations.add('down', [0, 1, 2, 3], 10, true);
        this.sprite.animations.add('left', [4, 5, 6, 7], 10, true);
        this.sprite.animations.add('right', [8, 9, 10, 11], 10, true);
        this.sprite.animations.add('up', [12, 13, 14, 15], 10, true); 

        this.sprite.body.collideWorldBounds = true;
        this.sprite.superClass = this;

        this.health = new Health(this.x, this.y, this.width, this.health);
    }

    /**
    *  Four booleans to set is key down or not.
    */
    this.move = function (left, up, right, down) {
        // new Fire(this.sprite.body.x, this.sprite.body.y, 150, platforms.getChildAt(0), 'firePlayer', firesPlayer);
        this.updateGraphics();
        this.sprite.body.velocity.x = 0;
        this.sprite.body.velocity.y = 0;
        if(!(left || up || right || down)) {
            this.sprite.animations.stop();
            this.sprite.frame = this.direction * 4;
            return;
        }
        if (left) this.setDirection(DIRECTION.LEFT);
        if (right) this.setDirection(DIRECTION.RIGHT);
        if (up) this.setDirection(DIRECTION.UP);
        if (down) this.setDirection(DIRECTION.DOWN);
    }

    this.stop = function () {        
        this.sprite.body.velocity.x = 0;
        this.sprite.body.velocity.y = 0;        
        this.sprite.animations.stop();
    }

    this.setDirection = function (direction) {        
        switch(direction) {
            case DIRECTION.LEFT:
                this.sprite.body.velocity.x = -this.velocity;
                this.sprite.animations.play('left');
                break;
            case DIRECTION.UP:
                this.sprite.body.velocity.y = -this.velocity;
                this.sprite.animations.play('up');
                break;
            case DIRECTION.RIGHT:
                this.sprite.body.velocity.x = this.velocity;
                this.sprite.animations.play('right');
                break;
            case DIRECTION.DOWN:
                this.sprite.body.velocity.y = this.velocity;
                this.sprite.animations.play('down');
                break;
            default:
                return;
        }
        this.direction = direction;
    }

    this.turnRand = function () {
        this.stop();
        this.setDirection(nextRand(4));
    }

    this.updateGraphics = function () {
        if (this.isDead) return;
        this.health.updateGraphics(this.sprite.body.x, this.sprite.body.y);
    }

    this.getCurrentXBlock = function () {
        return Math.floor((this.sprite.body.x + this.width / 2) / this.blockDim);
    }

    this.getCurrentYBlock = function () {
        return Math.floor((this.sprite.body.y + this.height / 2) / this.blockDim);
    }

    this.setFire = function (fireRate, fireImageKey, fireGroup) {
        this.fireRate = fireRate;
        this.fireImageKey = fireImageKey;
        this.fireGroup = fireGroup;
    }

    this.attack = function () {
        this.updateGraphics();
        if (Date.now() - this.lastShotTime >= this.fireRate) {
            this.lastShotTime = Date.now();

            var targetX = this.sprite.body.x + blockDim / 4;
            var targetY = this.sprite.body.y + blockDim / 4;

            switch(this.direction) {
                case DIRECTION.LEFT:
                    targetX = -7;
                    break;
                case DIRECTION.UP:
                    targetY = -7;
                    break;
                case DIRECTION.RIGHT:
                    targetX = 7777777;
                    break;
                case DIRECTION.DOWN:
                    targetY = 7777777;
                    break;
                default:
                    return;
            }

            new Fire(this.sprite.body.x + blockDim / 4, 
                this.sprite.body.y + blockDim / 4, 
                250, 
                targetX, 
                targetY, 
                this.fireImageKey,
                this.fireGroup);
            return true;
        }
        return false;
    }

    this.causeDamage = function (damage) {
        this.health.reduce(damage);
        this.health.updateGraphics();
        if (this.health.value <= 0) {
            this.isDead = true;
        }
    }

    this.clearGraphics = function() {
        this.health.clearGraphics();
    }
}

var Health = function (x, y, width, health) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.maxHealth = health;
    this.value = health;

    this.graphic = game.add.graphics(x, y);
    this.graphic.lineStyle(1, 0x000000, 250);
    this.graphic.drawRect(0, -5, width, 3);
    this.graphic.beginFill(0x000000, 250);
    this.graphic.drawRect(0, -5, width, 3);

    this.updateGraphics = function(x, y) {
        this.graphic.position.x = x;
        this.graphic.position.y = y;

        this.graphic.clear();
        this.graphic.lineStyle(1, 0x000000, 250);
        this.graphic.drawRect(0, -5, this.width, 3);
        this.graphic.beginFill(0x000000, 250);
        this.graphic.drawRect(0, -5,
                              Math.max(this.width * ((this.value) / (this.maxHealth)), 0), 
                              3);
    }

    this.reduce = function (value) {
        this.value -= value;
    }

    this.clearGraphics = function() {
        this.graphic.clear();
    }
}

// fireRate is in ms.
var Tower = function(i, k, sprite, player, fireRate, fireImageKey, fireGroup, blockDim) {
    this.i = i;
    this.k = k;
    this.sprite = sprite;
    this.player = player;
    this.fireRate = fireRate;
    this.fireGroup = fireGroup;
    this.fireImageKey = fireImageKey;
    this.blockDim = blockDim;

    this.sprite.frame = 6;
    this.lastShotTime = Date.now();

    this.attack = function () {
        if (Date.now() - this.lastShotTime >= this.fireRate) {
            this.lastShotTime = Date.now();
            new Fire(this.k * blockDim + blockDim / 2, this.i * blockDim + blockDim / 2, 200, 
                this.player.sprite.body.x + blockDim / 4, this.player.sprite.body.y + blockDim / 4, 
                this.fireImageKey, this.fireGroup);
        }
        this.updateGraphics();
    }

    this.updateGraphics = function () {
        var target = this.player.sprite;
        // Up
        if (Math.abs(target.body.x - this.sprite.body.x) < 12 && target.body.y < this.sprite.body.y)
            this.sprite.frame = 4;
        // Down
        else if (Math.abs(target.body.x - this.sprite.body.x) < 12 && target.body.y > this.sprite.body.y)
            this.sprite.frame = 0;
        //Right
        else if (Math.abs(target.body.y - this.sprite.body.y) < 12 && target.body.x > this.sprite.body.x)
            this.sprite.frame = 2; 
        //Left
        else if (Math.abs(target.body.y - this.sprite.body.y) < 12 && target.body.x < this.sprite.body.x)
            this.sprite.frame = 6; 
        //TopRight
        else if (target.body.x > this.sprite.body.x && target.body.y < this.sprite.body.y)
            this.sprite.frame = 3; 
        //TopLeft
        else if (target.body.x < this.sprite.body.x && target.body.y < this.sprite.body.y)
            this.sprite.frame = 5; 
        //DownRight
        else if (target.body.x > this.sprite.body.x && target.body.y > this.sprite.body.y)
            this.sprite.frame = 1;
        //DownLeft
        else if (target.body.x < this.sprite.body.x && target.body.y > this.sprite.body.y)
            this.sprite.frame = 7; 
    }

}


var Fire = function(i, k, velocity, targetX, targetY, imageKey, group) {
    this.fire = group.create(i, k, imageKey);
    this.fire.body.immovable = true;
    game.physics.arcade.moveToXY(this.fire, targetX, targetY, velocity, 0);
}