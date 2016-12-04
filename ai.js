const myTeamId = parseInt(readline()); // if 0 you need to score on the right of the map, if 1 you need to score on the left
const poleSize = 600; // More than the true size to avoid bouncing on it
const leftGoal = {
  center: {x: 0, y: 3750},
  point1: {x: 0, y: 1750 - poleSize},
  point2: {x: 0, y: 5750 - poleSize}
};
const rightGoal = {
  center: {x: 16000, y: 3750},
  point1: {x: 16000, y: 1750 - poleSize},
  point2: {x: 16000, y: 5750 - poleSize}
};
const goalToScore = myTeamId === 1 ? leftGoal : rightGoal;
const goalToProtect = myTeamId === 1 ? rightGoal : leftGoal;

const spell = {
  accio: {
    cost: 20
  },
  flipendo: {
    cost: 20
  },
  petrificus: {
    cost: 10
  }
};

const type = {
  snaffle: 'SNAFFLE',
  bludger: 'BLUDGER',
  wizard: 'WIZARD',
  enemyWizard: 'ENEMY_WIZARD'
};

const size = {
  snaffle: 150,
  bludger: 200,
  wizard: 400
};

const mass = {
  snaffle: 0.5,
  bludger: 8,
  wizard: 1
};

const friction = {
  snaffle: 0.75,
  bludger: 0.9,
  wizard: 0.75
};

class Vector2 {
  constructor (x, y) {
    this.x = x;
    this.y = y;
  }

  clone () {
    return new Vector2(this.x, this.y);
  }

  add (vec) {
    return new Vector2(this.x + vec.x, this.y + vec.y);
  }

  sub (vec) {
    return new Vector2(this.x - vec.x, this.y - vec.y);
  }

  mult (cst) {
    return new Vector2(this.x * cst, this.y * cst);
  }

  dist (vec) {
    return Math.sqrt((this.x - vec.x) * (this.x - vec.x) + (this.y - vec.y) * (this.y - vec.y));
  }

  normalizeDirection (vec) {
    let v = new Vector2(vec.x - this.x, vec.y - this.y);
    return v.normalize();
  }

  normalize () {
    let norm = this.norm();
    return new Vector2(this.x / norm, this.y / norm);
  }

  norm () {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  dot (vec) {
    return (this.x * vec.x + this.y * vec.y);
  }
}

class Entity {
  constructor (id, type, x, y, vx, vy, size, friction, mass) {
    this.id = id;
    this.pos = new Vector2(x, y);
    this.vel = new Vector2(vx, vy);
    this.type = type;
    this.size = size;
    this.friction = friction;
    this.mass = mass;
  }

  dist (entity) {
    return this.pos.dist(entity.pos);
  }

  clone () {
    return new Entity(this.id, this.type, this.pos.x, this.pos.y, this.vel.x, this.vel.y, this.size, this.friction, this.mass);
  }

  applyMovement (dt = 1) {
    this.pos.x = this.pos.x + round(this.vel.x * dt);
    this.pos.y = this.pos.y + round(this.vel.y * dt);
  }
  applyFriction () {
    this.vel.x = round(this.vel.x * this.friction);
    this.vel.y = round(this.vel.y * this.friction);
  }

  applyThrust (target, thrust) {
    let normalized = this.pos.normalizeDirection(target);
    this.vel.x = this.vel.x + round(normalized.x * (thrust / this.mass));
    this.vel.y = this.vel.y + round(normalized.y * (thrust / this.mass));
  }

}

class AbstractWizard extends Entity {
  constructor (id, type, x, y, vx, vy, isHoldingSnaffe) {
    super(id, type, x, y, vx, vy, size.wizard, friction.wizard, mass.wizard);
    this.isHoldingSnaffe = isHoldingSnaffe;
  }

  clone () {
    return new AbstractWizard(this.id, this.type, this.pos.x, this.pos.y, this.vel.x, this.vel.y, this.isHoldingSnaffe);
  }
}

class Wizard extends AbstractWizard {
  constructor (id, x, y, vx, vy, isHoldingSnaffe) {
    super(id, type.wizard, x, y, vx, vy, isHoldingSnaffe);
  }
}

class EnemyWizard extends AbstractWizard {
  constructor (id, x, y, vx, vy, isHoldingSnaffe) {
    super(id, type.enemyWizard, x, y, vx, vy, isHoldingSnaffe);
  }
}

class Bludger extends Entity {
  constructor (id, x, y, vx, vy, lastTargetId) {
    super(id, type.bludger, x, y, vx, vy, size.bludger, friction.bludger, mass.bludger);
    this.lastTargetId = lastTargetId;
  }
}

class Snaffle extends Entity {
  constructor (id, x, y, vx, vy) {
    super(id, type.snaffle, x, y, vx, vy, size.snaffle, friction.snaffle, mass.snaffle);
  }
}

class State {
  constructor (entities) {
    this.score = 0;
    this.enemyScore = 0;
    this.energy = 0;

    this.entities = entities;
    this.wizards = [];
    this.enemyWizards = [];
    this.snaffles = [];
    this.bludgers = [];
    this.allWizards = [];
    this.entities.forEach(entity => {
      if (entity.type === type.wizard) {
        this.wizards.push(entity);
        this.allWizards.push(entity);
      } else if (entity.type === type.enemyWizard) {
        this.enemyWizards.push(entity);
        this.allWizards.push(entity);
      } else if (entity.type === type.snaffle) {
        this.snaffles.push(entity);
      } else if (entity.type === type.bludger) {
        this.bludgers.push(entity);
      }
    });
  }

  update (entities) {
    let newSnaffles = [];

    this.entities = entities;
    this.wizards = [];
    this.enemyWizards = [];
    this.bludgers = [];
    this.allWizards = [];
    entities.forEach(entity => {
      if (entity.type === type.wizard) {
        this.wizards.push(entity);
        this.allWizards.push(entity);
      } else if (entity.type === type.enemyWizard) {
        this.enemyWizards.push(entity);
        this.allWizards.push(entity);
      } else if (entity.type === type.snaffle) {
        newSnaffles.push(entity);
      } else if (entity.type === type.bludger) {
        this.bludgers.push(entity);
      }
    });

    // Update score
    if (this.snaffles.length > newSnaffles.length) {
      let goaledSnaffles = this.snaffles.filter(snaffle => {
        for (let i = 0; i < newSnaffles.length; i++) {
          if (newSnaffles[i].id === snaffle.id) {
            return false;
          }
        }
        return true;
      });
      goaledSnaffles.forEach(snaffle => {
        if (snaffle.pos.dist(goalToProtect.center) > snaffle.pos.dist(goalToScore.center)) {
          ++this.score;
        } else {
          ++this.enemyScore;
        }
      });
    } else if (this.snaffles.length < newSnaffles.length) {
      let notGoaledSnaffles = newSnaffles.filter(snaffle => {
        for (let i = 0; i < this.snaffles.length; i++) {
          if (this.snaffles[i].id === snaffle.id) {
            return false;
          }
        }
        return true;
      });

      notGoaledSnaffles.forEach(snaffle => {
        if (snaffle.pos.dist(goalToProtect.center) > snaffle.pos.dist(goalToScore.center)) {
          --this.score;
        } else {
          --this.enemyScore;
        }
      });
    }
    this.snaffles = newSnaffles;
  }

  computeBludgersThrust () {
    this.bludgers.forEach(bludger => {
      let possibleTargets = [];
      this.allWizards.forEach(wizard => {
        if (bludger.lastTargetId === wizard.id) return;

        possibleTargets.push(wizard);
      });

      let target = getclosestEntity(bludger, possibleTargets).entity;

      // Apply Bludger thrust
      bludger.applyThrust(target.pos, 1000);
    });
  }

  computeEnemiesAction () {
    for (let i = 0; i < this.enemyWizards.length; i++) {
      let enemy = this.enemyWizards[i];
      let snaffle = getclosestEntity(enemy, this.snaffles).entity;

      if (enemy.isHoldingSnaffe) {
        enemy.action = throwSnaffle(goalToProtect.center.x, goalToProtect.center.y, 500);
        snaffle.applyThrust(goalToProtect.center, 500);
      } else {
        enemy.applyThrust(snaffle.pos, 150);
      }
    }
  }

  simulateOneTurn () {
    let time = 0.0;
    while (time < 1.0) {
      let firstCollision = {time: Infinity};

      for (let i = 0; i < this.bludgers.length; i++) {
        let bludger1 = this.bludgers[i];

        let collision = willCollideWithWall(bludger1);
        if (collision && collision.time < firstCollision.time && collision.time + time < 1.0) {
          firstCollision = collision;
        }

        for (let j = i + 1; j < this.bludgers.length; j++) {
          let bludger2 = this.bludgers[j];
          let collision = willCollide(bludger1, bludger2);
          if (collision && collision.time < firstCollision.time && collision.time + time < 1.0) {
            firstCollision = collision;
          }
        }

        this.allWizards.forEach(wizard => {
          let collision = willCollide(bludger1, wizard);
          if (collision && collision.time < firstCollision.time && collision.time + time < 1.0) {
            firstCollision = collision;
          }
        });

        this.snaffles.forEach(snaffle => {
          let collision = willCollide(bludger1, snaffle);
          if (collision && collision.time < firstCollision.time && collision.time + time < 1.0) {
            firstCollision = collision;
          }
        });
      }

      for (let i = 0; i < this.allWizards.length; i++) {
        let wizard = this.allWizards[i];

        let collision = willCollideWithWall(wizard);
        if (collision && collision.time < firstCollision.time && collision.time + time < 1.0) {
          firstCollision = collision;
        }

        for (let j = i + 1; j < this.allWizards.length; j++) {
          let wizard2 = this.allWizards[j];
          let collision = willCollide(wizard, wizard2);
          if (collision && collision.time < firstCollision.time && collision.time + time < 1.0) {
            firstCollision = collision;
          }
        }
        this.snaffles.forEach(snaffle => {
          let collision = willCollide(wizard, snaffle);
          if (collision && collision.time < firstCollision.time && collision.time + time < 1.0) {
            firstCollision = collision;
          }
        });
      }

      for (let i = 0; i < this.snaffles.length; i++) {
        let snaffle = this.snaffles[i];

        let collision = willCollideWithWall(snaffle);
        if (collision && collision.time < firstCollision.time && collision.time + time < 1.0) {
          firstCollision = collision;
        }

        for (let j = i + 1; j < this.snaffles.length; j++) {
          let snaffle2 = this.snaffles[j];
          let collision = willCollide(snaffle, snaffle2);
          if (collision && collision.time < firstCollision.time && collision.time + time < 1.0) {
            firstCollision = collision;
          }
        }
      }

      // No more collision
      if (firstCollision.time === Infinity) {
        this.entities.forEach(entity => {
          entity.applyMovement(1.0 - time);
        });
        time = 1.0;
      } else {
        this.entities.forEach(entity => {
          entity.applyMovement(firstCollision.time);
        });

        if (firstCollision.wall) {
          applyWallBounce(firstCollision);
          if (firstCollision.goal === 'goalToScore') {
            debug(firstCollision.entity.id + ' GOAL :)');
            this.entities.splice(this.entities.indexOf(firstCollision.entity), 1);
            this.snaffles.splice(this.snaffles.indexOf(firstCollision.entity), 1);
            ++this.score; // Score increment can be wrong or not detected, this is corrected on update() method
          } else if (firstCollision.goal === 'goalToProtect') {
            debug(firstCollision.entity.id + ' GOAL :(');
            this.entities.splice(this.entities.indexOf(firstCollision.entity), 1);
            this.snaffles.splice(this.snaffles.indexOf(firstCollision.entity), 1);
            ++this.enemyScore;
          }
        } else {
          let entityA = firstCollision.entityA;
          let entityB = firstCollision.entityB;
          bounce(entityA, entityB);
          if (entityA.type === type.bludger && (entityB.type === type.wizard || entityB.type === type.enemyWizard)) {
            lastTargetIdBludger[entityA.id] = entityB.id;
          }
        }

        time += firstCollision.time;
      }
    }

    ++this.energy;
    this.snaffles.forEach(snaffle => {
      debug(snaffle);
    });

    debug('[end] Score : ' + this.score + ' & EnemyScore : ' + this.enemyScore);
    debug('[end] Energy : ' + this.energy);
  }

  setClosestSnaffleData () {
    // If only one snaffle target it
    if (this.snaffles.length === 1) {
      for (let i = 0; i < this.wizards.length; i++) {
        this.wizards[i].closestSnaffData = {distance: this.wizards[i].dist(this.snaffles[0]), entityId: this.snaffles[0].id};
      }
      return;
    }

    // Or only one snaffle with not willGoal target it
    let snaffleWithNotGoalCount = 0;
    let snaffleWithNotGoal = null;
    for (let i = 0; i < this.snaffles.length; i++) {
      let snaffle = this.snaffles[i];
      if (!snaffle.willGoal) {
        snaffleWithNotGoal = snaffle;
        ++snaffleWithNotGoalCount;
        if (snaffleWithNotGoalCount > 1) break;
      }
    }
    if (snaffleWithNotGoalCount === 1) {
      for (let i = 0; i < this.wizards.length; i++) {
        this.wizards[i].closestSnaffData = {distance: this.wizards[i].dist(snaffleWithNotGoal), entityId: snaffleWithNotGoal.id};
      }
      return;
    }

    for (let i = 0; i < this.wizards.length; i++) {
      let wizard = this.wizards[i];
      wizard.closestSnaffData = this.getclosestSnaffNotGoal(wizard);
    }

    if (this.wizards[0].closestSnaffData.entityId === this.wizards[1].closestSnaffData.entityId) {
      let wizardWithRightTarget = null;
      let wizardNeedChangeTarget = null;
      if (this.wizards[0].closestSnaffData.distance > this.wizards[1].closestSnaffData.distance) {
        wizardWithRightTarget = this.wizards[1];
        wizardNeedChangeTarget = this.wizards[0];
      } else {
        wizardWithRightTarget = this.wizards[0];
        wizardNeedChangeTarget = this.wizards[1];
      }
      this.getEntity(wizardWithRightTarget.closestSnaffData.entityId).targetedBy = wizardWithRightTarget.id;
      wizardNeedChangeTarget.closestSnaffData = this.getclosestSnaffNotTargetedAndNotGoal(wizardNeedChangeTarget);
      this.getEntity(wizardNeedChangeTarget.closestSnaffData.entityId).targetedBy = wizardNeedChangeTarget.id;
    }
  }

  getclosestSnaffNotGoal (wizard) {
    let closestSnaff = null;
    let minDist = Infinity;

    this.snaffles.forEach(snaffle => {
      if (!snaffle.willGoal) {
        let distance = wizard.dist(snaffle);
        if (distance < minDist) {
          minDist = distance;
          closestSnaff = snaffle;
        }
      }
    });

    return {distance: minDist, entityId: closestSnaff.id};
  }

  getclosestSnaffNotTargetedAndNotGoal (wizard) {
    let closestSnaff = null;
    let minDist = Infinity;

    this.snaffles.forEach(snaffle => {
      if (snaffle.targetedBy === undefined && !snaffle.willGoal) {
        let distance = wizard.dist(snaffle);
        if (distance < minDist) {
          minDist = distance;
          closestSnaff = snaffle;
        }
      }
    });
    if (closestSnaff !== null) {
      closestSnaff.targetedBy = wizard.id;
    }
    return {distance: minDist, entityId: closestSnaff.id};
  }

  /*
  * Set snaffle.needStop to true if the snaffle will enter
  * to goalToProtect according to his velocity
  * Set snaffle.willGoal to true if the snaffle will enter
  * to goalToScore according to his velocity
  */
  setSnaffleWillGoal () {
    this.snaffles.forEach(snaffle => {
      let newVelocity = snaffle.vel.clone();
      let newPos = snaffle.pos.clone();

      if (lineIntersect(snaffle.pos.x, snaffle.pos.y, parseInt(newPos.x) + parseInt(newVelocity.x), parseInt(newPos.y) + parseInt(newVelocity.y),
                            goalToProtect.point1.x, goalToProtect.point1.y, goalToProtect.point2.x, goalToProtect.point2.y)) {
        debug('Snaffle ' + snaffle.id + ' too fast, cant be stopped with petri');
        return;
      }

      while (Math.abs(newVelocity.x) + Math.abs(newVelocity.y) > 100) {
        newPos = {x: parseInt(newPos.x) + parseInt(newVelocity.x), y: parseInt(newPos.y) + parseInt(newVelocity.y)};
        newVelocity = {x: round(newVelocity.x * friction.snaffle), y: round(newVelocity.y * friction.snaffle)};
      }

      if (lineIntersect(snaffle.pos.x, snaffle.pos.y, newPos.x, newPos.y,
                            goalToProtect.point1.x, goalToProtect.point1.y, goalToProtect.point2.x, goalToProtect.point2.y)) {
        debug('Snaffle ' + snaffle.id + ' risk, need to be stopped');
        snaffle.needStop = true;
      } else if (lineIntersect(snaffle.x, snaffle.y, newPos.x, newPos.y,
                            goalToScore.point1.x, goalToScore.point1.y, goalToScore.point2.x, goalToScore.point2.y)) {
        if (getclosestEntity(snaffle, this.enemyWizards).distance > 1000) {
          debug('Snaffle ' + snaffle.id + ' will goal :)');
          snaffle.willGoal = true;
        }
      }
    });
  }

  checkAccio (wizard) {
    if (this.energy < spell.accio.cost + 10) {
      return false;
    }

    for (let i = 0; i < this.snaffles.length; i++) {
      let snaffle = this.snaffles[i];

      // Don't use Accio when the snaffle would be pulled away from goal to score
      if (goalToScore.center.x === 0) {
        if (snaffle.pos.x < wizard.pos.x) {
          continue;
        }
      } else {
        if (snaffle.pos.x > wizard.pos.x) {
          continue;
        }
      }

      // Don't use Accio when the snaffle is too close or too far from the wizard
      let distance = wizard.dist(snaffle);
      if (distance < 1000 || distance > 5000) {
        continue;
      }

      wizard.action = accio(snaffle.id);
      this.energy -= spell.accio.cost;
      return true;
    }

    return false;
  }

  checkFlipendo (wizard) {
    if (this.energy < spell.flipendo.cost) {
      return false;
    }

    for (let k = 0; k < this.snaffles.length; k++) {
      let snaffle = this.snaffles[k];

      if (snaffle.dist(wizard) < size.snaffle + size.wizard + 500) {
        return false;
      }

      if (snaffle.willGoal) {
        return false;
      }

      // -- Flipendo simul--

      // clone entities
      let clonedSnaffle = snaffle.clone();
      let clonedWizard = wizard.clone();
      let clonedEntities = [];
      for (let i = 0; i < this.entities.length; i++) {
        if (this.entities[i].id === clonedSnaffle.id || this.entities[i].id === clonedWizard.id) {
          continue;
        }
        clonedEntities.push(this.entities[i].clone());
      }

      // Spell trigger one turn after
      clonedSnaffle.applyMovement();
      clonedWizard.applyMovement();

      clonedSnaffle.applyFriction();
      clonedWizard.applyFriction();
      for (let i = 0; i < clonedEntities.length; i++) {
        clonedEntities[i].applyMovement();
        clonedEntities[i].applyFriction();
      }

      // Apply thrust
      let thrust = Math.min(6000 / Math.pow(clonedSnaffle.dist(clonedWizard) / 1000, 2), 1000);
      let normalized = clonedWizard.pos.normalizeDirection(clonedSnaffle.pos);

      clonedSnaffle.vel.x = clonedSnaffle.vel.x + round(normalized.x * (thrust / mass.snaffle));
      clonedSnaffle.vel.y = clonedSnaffle.vel.y + round(normalized.y * (thrust / mass.snaffle));

      while (Math.abs(clonedSnaffle.vel.x) + Math.abs(clonedSnaffle.vel.y) > 300) {
        if (willCollideNextTurn(clonedSnaffle, clonedEntities)) {
          return false;
        }
        clonedSnaffle.applyMovement();
        clonedWizard.applyMovement();
        clonedSnaffle.applyFriction();
        clonedWizard.applyFriction();
        for (let i = 0; i < clonedEntities.length; i++) {
          clonedEntities[i].applyMovement();
          clonedEntities[i].applyFriction();
        }
      }

      if (lineIntersect(snaffle.pos.x, snaffle.pos.y, clonedSnaffle.pos.x, clonedSnaffle.pos.y,
                          goalToScore.point1.x, goalToScore.point1.y, goalToScore.point2.x, goalToScore.point2.y)) {
        debug('Flipendo snaffle target position : ' + clonedSnaffle.pos.x + ' ' + clonedSnaffle.pos.y);
        wizard.action = flipendo(snaffle.id);
        this.energy -= spell.flipendo.cost;
        return true;
      }
    }
  }

  checkPetrificus (wizard) {
    if (this.energy < spell.petrificus.cost) {
      return false;
    }

    let farestSnaff = null;
    let maxDist = 0;

    // Get the farest snaffle from enemies
    this.snaffles.forEach(snaffle => {
      if (snaffle.needStop) {
        let minDistSnaffleEnemies = Infinity;
        this.enemyWizards.forEach(enemyWizard => {
          let dist = enemyWizard.dist(snaffle);
          if (dist < minDistSnaffleEnemies) {
            minDistSnaffleEnemies = dist;
          }
        });

        if (minDistSnaffleEnemies > maxDist) {
          maxDist = minDistSnaffleEnemies;
          farestSnaff = snaffle;
        }
      }
    });

    if (farestSnaff && maxDist > 3000) {
      farestSnaff.needStop = false;
      wizard.action = petrificus(farestSnaff.id);
      this.energy -= spell.petrificus.cost;
      return true;
    }

    return false;
  }

  getEntity (id) {
    for (let i = 0; i < this.entities.length; i++) {
      if (this.entities[i].id === id) {
        return this.entities[i];
      }
    }
  }

  computeWizardsAction () {
    for (let i = 0; i < this.wizards.length; i++) {
      let wizard = this.wizards[i];

      if (wizard.isHoldingSnaffe) {
        let wizardNextPos = wizard.pos.add(wizard.vel);
        let needToHold = false;
        this.enemyWizards.forEach(function (enemy) {
          let enemyNextPos = enemy.pos.add(enemy.vel);
          if (interceptOnCircle(goalToScore.center, wizardNextPos, enemyNextPos, 200)) {
            needToHold = true;
            return false;
          }
        });

        if (needToHold) {
          wizard.action = move(goalToScore.center.x, goalToScore.center.y, 150) + ' HOLD';
        } else {
          wizard.action = throwSnaffle(goalToScore.center.x, goalToScore.center.y, 500);
        }
        continue;
      }

      if (this.checkPetrificus(wizard)) {
        continue;
      }

      if (this.checkFlipendo(wizard)) {
        continue;
      }

      if (this.checkAccio(wizard)) {
        continue;
      }

      let closestSnaff = this.getEntity(wizard.closestSnaffData.entityId);
      wizard.action = move(closestSnaff.pos.x, closestSnaff.pos.y, 150);
    }

    this.wizards.forEach(wizard => {
      print(wizard.action);
    });
  }

  evaluate () {
    return 1;
  }

  clone () {
    let clonedEnt = [];
    for (var i = 0; i < this.entities.length; i++) {
      clonedEnt.push(this.entities[i].clone());
    }
    let clonedState = new State(clonedEnt);
    clonedState.score = this.score;
    clonedState.enemyScore = this.enemyScore;
    clonedState.energy = this.energy;
    return clonedState;
  }
}

var lastTargetIdBludger = [];

let state = null;

// Main
while (true) {
  var entities = [];

  const entitiesCount = parseInt(readline()); // number of entities still in game
  for (let i = 0; i < entitiesCount; i++) {
    const inputs = readline().split(' ');
    const entityId = parseInt(inputs[0]); // entity identifier
    const entityType = inputs[1]; // "WIZARD", "OPPONENT_WIZARD" or "SNAFFLE" (or "BLUDGER" after first league)
    const x = parseInt(inputs[2]); // position
    const y = parseInt(inputs[3]); // position
    const vx = parseInt(inputs[4]); // velocity
    const vy = parseInt(inputs[5]); // velocity
    const state = parseInt(inputs[6]); // 1 if the wizard is holding a Snaffle, 0 otherwise

    if (entityType === 'WIZARD') {
      let wizard = new Wizard(entityId, x, y, vx, vy, state === 1);
      entities.push(wizard);
    } else if (entityType === 'OPPONENT_WIZARD') {
      let enemyWizard = new EnemyWizard(entityId, x, y, vx, vy, state === 1);
      entities.push(enemyWizard);
    } else if (entityType === 'SNAFFLE') {
      let snaffle = new Snaffle(entityId, x, y, vx, vy);
      entities.push(snaffle);
    } else if (entityType === 'BLUDGER') {
      let bludger = new Bludger(entityId, x, y, vx, vy, lastTargetIdBludger[entityId]);
      entities.push(bludger);
    }
  }

  if (state) {
    state.update(entities);
  } else {
    state = new State(entities);
  }

  state.setSnaffleWillGoal();

  state.setClosestSnaffleData();

  state.computeBludgersThrust();

  state.computeEnemiesAction();

  state.computeWizardsAction();

  state.simulateOneTurn();
}

// Outputs functions
function move (x, y, trust) {
  return ('MOVE ' + x + ' ' + y + ' ' + trust);
}

function throwSnaffle (x, y, trust) {
  return ('THROW ' + x + ' ' + y + ' ' + trust);
}
function obliviate (entityId) {
  return launchSpell('OBLIVIATE', entityId);
}
function petrificus (entityId) {
  return launchSpell('PETRIFICUS', entityId);
}
function accio (entityId) {
  return launchSpell('ACCIO', entityId);
}
function flipendo (entityId) {
  return launchSpell('FLIPENDO', entityId);
}
function launchSpell (name, entityId) {
  return (name + ' ' + entityId);
}
// Logs
function debug (input) {
  printErr(JSON.stringify(input));
}

function lineIntersect (x1, y1, x2, y2, x3, y3, x4, y4) {
  let x = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / ((x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4));
  let y = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / ((x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4));
  if (isNaN(x) || isNaN(y)) {
    return false;
  } else {
    if (x1 >= x2) {
      if (!(x2 <= x && x <= x1)) { return false; }
    } else {
      if (!(x1 <= x && x <= x2)) { return false; }
    }
    if (y1 >= y2) {
      if (!(y2 <= y && y <= y1)) { return false; }
    } else {
      if (!(y1 <= y && y <= y2)) { return false; }
    }
    if (x3 >= x4) {
      if (!(x4 <= x && x <= x3)) { return false; }
    } else {
      if (!(x3 <= x && x <= x4)) { return false; }
    }
    if (y3 >= y4) {
      if (!(y4 <= y && y <= y3)) { return false; }
    } else {
      if (!(y3 <= y && y <= y4)) { return false; }
    }
  }
  return true;
}

// Source: http://stackoverflow.com/questions/1073336/circle-line-segment-collision-detection-algorithm
function interceptOnCircle (p1, p2, c, r) {
    // p1 is the first line point
    // p2 is the second line point
    // c is the circle's center
    // r is the circle's radius

  let p3 = {x: p1.x - c.x, y: p1.y - c.y}; // shifted line points
  let p4 = {x: p2.x - c.x, y: p2.y - c.y};

  let m = (p4.y - p3.y) / (p4.x - p3.x); // slope of the line
  let b = p3.y - m * p3.x; // y-intercept of line

  let underRadical = Math.pow(r, 2) * Math.pow(m, 2) + Math.pow(r, 2) - Math.pow(b, 2); // the value under the square root sign

  if (underRadical < 0) {
        // line completely missed
    return false;
  } else {
    let t1 = (-m * b + Math.sqrt(underRadical)) / (Math.pow(m, 2) + 1); // one of the intercept x's
    let t2 = (-m * b - Math.sqrt(underRadical)) / (Math.pow(m, 2) + 1); // other intercept's x
    let i1 = {x: t1 + c.x, y: m * t1 + b + c.y}; // intercept point 1
    let i2 = {x: t2 + c.x, y: m * t2 + b + c.y}; // intercept point 2
    return [i1, i2];
  }
}

// Round half away from zero
function round (nb) {
  return parseInt(nb.toFixed(0));
}

function bounce (entity1, entity2) {
  // First, find the normalized vector n from the center of
  // circle1 to the center of circle2
  let n = entity2.pos.sub(entity1.pos);

  n = n.normalize();
  // Find the length of the component of each of the movement
  // vectors along n.
  // a1 = v1 . n
  // a2 = v2 . n
  let v1 = entity1.vel.clone();
  let v2 = entity2.vel.clone();
  let a1 = v1.dot(n);
  let a2 = v2.dot(n);

  // Using the optimized version,
  // optimizedP =  2(a1 - a2)
  //              -----------
  //                m1 + m2
  let optimizedP = (2.0 * (a1 - a2)) / (entity1.mass + entity2.mass);

  // Calculate v1', the new movement vector of circle1
  // v1' = v1 - optimizedP * m2 * n
  let newVelocity1 = {};
  newVelocity1.x = v1.x - optimizedP * entity2.mass * n.x;
  newVelocity1.y = v1.y - optimizedP * entity2.mass * n.y;

  // Calculate v1', the new movement vector of circle1
  // v2' = v2 + optimizedP * m1 * n
  let newVelocity2 = {};
  newVelocity2.x = v2.x + optimizedP * entity1.mass * n.x;
  newVelocity2.y = v2.y + optimizedP * entity1.mass * n.y;

  entity1.vel.x = round(newVelocity1.x);
  entity1.vel.y = round(newVelocity1.y);
  entity2.vel.x = round(newVelocity2.x);
  entity2.vel.y = round(newVelocity2.y);
}

// http://www.gamasutra.com/view/feature/131424/pool_hall_lessons_fast_accurate_.php?page=2
function willCollide (entityA, entityB) {
  // Translate entityA movement to entityB become stationary
  let moveVec = entityA.vel.sub(entityB.vel);

  // Early Escape test: if the length of the movevec is less
  // than distance between the centers of these circles minus
  // their radii, there's no way they can hit.
  // let moveVec = {x: entityA.vx, y: entityA.vy};
  let dist = entityA.dist(entityB);
  let sumRadii = (entityA.size + entityB.size);
  dist -= sumRadii;
  if (moveVec.norm() < dist) {
    return false;
  }

  // Normalize the movevec
  let N = moveVec.normalize();

  // Find C, the vector from the center of the moving
  // circle A to the center of B
  let C = entityB.pos.sub(entityA.pos);

  // D = N . C = ||C|| * cos(angle between N and C)
  let D = C.dot(N);

  // Another early escape: Make sure that A is moving
  // towards B! If the dot product between the movevec and
  // B.center - A.center is less that or equal to 0,
  // A isn't isn't moving towards B
  if (D <= 0) {
    return false;
  }
  // Find the length of the vector C
  let lengthC = C.norm();

  let F = (lengthC * lengthC) - (D * D);

  // Escape test: if the closest that A will get to B
  // is more than the sum of their radii, there's no
  // way they are going collide
  let sumRadiiSquared = sumRadii * sumRadii;
  if (F >= sumRadiiSquared) {
    return false;
  }

  // We now have F and sumRadii, two sides of a right triangle.
  // Use these to find the third side, sqrt(T)
  let T = sumRadiiSquared - F;

  // If there is no such right triangle with sides length of
  // sumRadii and sqrt(f), T will probably be less than 0.
  // Better to check now than perform a square root of a
  // negative number.
  if (T < 0) {
    return false;
  }

  // Therefore the distance the circle has to travel along
  // movevec is D - sqrt(T)
  let distance = D - Math.sqrt(T);

  // Get the magnitude of the movement vector
  let mag = moveVec.norm();

  // Finally, make sure that the distance A has to move
  // to touch B is not greater than the magnitude of the
  // movement vector.
  if (mag < distance) {
    return false;
  }

  // Set the length of the movevec so that the circles will just
  // touch

  moveVec = moveVec.normalize();
  moveVec = moveVec.mult(distance);
  let lengthOriginalMoveVec = entityA.vel.sub(entityB.vel);

  let time = moveVec.norm() / lengthOriginalMoveVec.norm();

  return {time, entityA, entityB};
}

function applyWallBounce (coll) {
  if (coll.wall === 'HORIZONTAL') {
    coll.entity.vel.y = -coll.entity.vel.y;
  } else {
    coll.entity.vel.x = -coll.entity.vel.x;
  }
}

function willCollideWithWall (entity) {
  let nextPos = entity.pos.add(entity.vel);
  let dist;
  let distImpact;
  let wall = '';
  if (nextPos.y - entity.size < 0) {
    dist = entity.pos.y - nextPos.y;
    distImpact = entity.pos.y - entity.size;
    wall = 'HORIZONTAL';
  }

  if (nextPos.y + entity.size > 7501) {
    dist = nextPos.y - entity.pos.y;
    distImpact = entity.y - (7501 - entity.size);
    wall = 'HORIZONTAL';
  }

  if (nextPos.x - entity.size < 0) {
    dist = entity.pos.x - nextPos.x;
    distImpact = entity.pos.x - entity.size;
    wall = 'VERTICAL';
  }

  if (nextPos.y + entity.size > 16001) {
    dist = nextPos.x - entity.pos.x;
    distImpact = entity.pos.x - (16001 - entity.size);
    wall = 'VERTICAL';
  }

  if (!dist || !distImpact) return false;

  let time = Math.abs(distImpact / dist);

  let goal = null;
  if (wall === 'VERTICAL' && entity.type === type.snaffle) {
    let snaffle = entity;
    if (lineIntersect(snaffle.pos.x, snaffle.pos.y, nextPos.x, nextPos.y,
                          goalToProtect.point1.x, goalToProtect.point1.y, goalToProtect.point2.x, goalToProtect.point2.y)) {
      goal = 'goalToProtect';
    }
    if (lineIntersect(snaffle.pos.x, snaffle.pos.y, nextPos.x, nextPos.y,
                          goalToScore.point1.x, goalToScore.point1.y, goalToScore.point2.x, goalToScore.point2.y)) {
      goal = 'goalToScore';
    }
  }

  return {time, entity, wall, goal};
}

// Utils functions
function getclosestEntity (entity1, _entities) {
  let closestEntity = null;
  let minDist = Infinity;

  _entities.forEach(entity => {
    if (entity1.id === entity.id) return;
    let distance = entity1.dist(entity);
    if (distance < minDist) {
      minDist = distance;
      closestEntity = entity;
    }
  });
  return {distance: minDist, entity: closestEntity};
}

function willCollideNextTurn (snaffle_, entities_) {
  // Clone entities to perform simulation (change x and y)
  let snaffle = snaffle_.clone();
  let entitiesCloned = [];
  for (let j = 0; j < entities_.length; j++) {
    if (entities_[j].id === snaffle_.id) { continue; }

    entitiesCloned.push(entities_[j].clone());
  }

  // Divide a Turn into step and check collision
  for (let j = 0; j < entitiesCloned.length; j++) {
    let entity = entitiesCloned[j];
    let nbStep = 10;
    for (let k = 0; k < nbStep; k++) {
      snaffle.pos.x += snaffle.vel.x / nbStep;
      snaffle.pos.y += snaffle.vel.y / nbStep;
      entity.pos.x += entity.vel.x / nbStep;
      entity.pos.y += entity.vel.y / nbStep;

      if (isColliding(snaffle, entity)) {
        return true;
      }
    }
  }
  return false;
}

function isColliding (entity1, entity2) {
  return entity1.dist(entity2) < parseInt(entity1.size) + parseInt(entity2.size);
}
