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
}

class Entity {
  constructor (id, type, x, y, vx, vy, size, friction, mass) {
    this.id = id;
    this.pos = new Vector2(x, y);
    this.vel = new Vector2(vx, vy);
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.type = type;
    this.size = size;
    this.friction = friction;
    this.mass = mass;
  }
}

class AbstractWizard extends Entity {
  constructor (id, type, x, y, vx, vy, isHoldingSnaffe) {
    super(id, type, x, y, vx, vy, size.wizard, friction.wizard, mass.wizard);
    this.isHoldingSnaffe = isHoldingSnaffe;
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

let energy = 0;

var lastTargetIdBludger = [];

// game loop
while (true) {
  var wizards = [];
  var enemyWizards = [];
  var snaffles = [];
  var bludgers = [];
  var entities = [];
  var allWizards = [];

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
      wizards.push(wizard);
      entities.push(wizard);
    } else if (entityType === 'OPPONENT_WIZARD') {
      let enemyWizard = new EnemyWizard(entityId, x, y, vx, vy, state === 1);
      enemyWizards.push(enemyWizard);
      entities.push(enemyWizard);
    } else if (entityType === 'SNAFFLE') {
      let snaffle = new Snaffle(entityId, x, y, vx, vy);
      snaffles.push(snaffle);
      entities.push(snaffle);
    } else if (entityType === 'BLUDGER') {
      let bludger = new Bludger(entityId, x, y, vx, vy, lastTargetIdBludger[entityId]);
      bludgers.push(bludger);
      entities.push(bludger);
    }
  }
  wizards.forEach(wizard => {
    allWizards.push(wizard);
  });
  enemyWizards.forEach(wizard => {
    allWizards.push(wizard);
  });

  setSnaffleWillGoal();

  setClosestSnaffleData(wizards);

  computeBludgersThrust();

  computeEnemiesAction();

  //simulateOneTurn(entities);

  for (let i = 0; i < wizards.length; i++) {
    let wizard = wizards[i];

    if (wizard.isHoldingSnaffe) {
      let wizardNextPos = {x: parseInt(wizard.x) + parseInt(wizard.vx), y: parseInt(wizard.y) + parseInt(wizard.vy)};
      let needToHold = false;
      enemyWizards.forEach(function (enemy) {
        let enemyNextPos = {x: parseInt(enemy.x) + parseInt(enemy.vx), y: parseInt(enemy.y) + parseInt(enemy.vy)};
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

    if (checkPetrificus(wizard)) {
      continue;
    }

    if (checkFlipendo(wizard)) {
      continue;
    }

    if (checkAccio(wizard)) {
      continue;
    }

    let closestSnaff = getEntity(wizard.closestSnaffData.entityId);
    wizard.action = move(closestSnaff.x, closestSnaff.y, 150);
  }

  wizards.forEach(function (wizard) {
    print(wizard.action);
  });

  ++energy;
}

// Outputs functions
function move (x, y, trust) {
  return ('MOVE ' + x + ' ' + y + ' ' + trust);
}

function throwSnaffle (x, y, trust) {
  return ('THROW ' + x + ' ' + y + ' ' + trust);
}
function obliviate (entityId) {
  return launchSpell('OBLIVIATE', entityId, 5);
}
function petrificus (entityId) {
  return launchSpell('PETRIFICUS', entityId, 10);
}
function accio (entityId) {
  return launchSpell('ACCIO', entityId, 20);
}
function flipendo (entityId) {
  return launchSpell('FLIPENDO', entityId, 20);
}
function launchSpell (name, entityId, energyCost) {
  energy -= energyCost;
  return (name + ' ' + entityId);
}
// Logs
function debug (input) {
  printErr(JSON.stringify(input));
}

// Maths functions
function getDistance (pos1, pos2) {
  let x1 = pos1.x;
  let y1 = pos1.y;
  let x2 = pos2.x;
  let y2 = pos2.y;
  return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
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

function normalizedVector (v1, v2) {
  let v = {x: v2.x - v1.x, y: v2.y - v1.y};
  let norm = getNorm(v);
  return {x: v.x / norm, y: v.y / norm};
}

function normalizeVector (v) {
  let norm = getNorm(v);
  return {x: v.x / norm, y: v.y / norm};
}

function getNorm (v) {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

function dot (v1, v2) {
  return (v1.x * v2.x + v1.y * v2.y);
}

function bounce (entity1, entity2) {
  // First, find the normalized vector n from the center of
  // circle1 to the center of circle2
  let n = {x: entity2.x - entity1.x, y: entity2.y - entity1.y};

  n = normalizeVector(n);
  // Find the length of the component of each of the movement
  // vectors along n.
  // a1 = v1 . n
  // a2 = v2 . n
  let v1 = {x: entity1.vx, y: entity1.vy};
  let v2 = {x: entity2.vx, y: entity2.vy};
  let a1 = dot(v1, n);
  let a2 = dot(v2, n);

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

  entity1.vx = round(newVelocity1.x);
  entity1.vy = round(newVelocity1.y);
  entity2.vx = round(newVelocity2.x);
  entity2.vy = round(newVelocity2.y);
}

// http://www.gamasutra.com/view/feature/131424/pool_hall_lessons_fast_accurate_.php?page=2
function willCollide (entityA, entityB) {
  // Translate entityA movement to entityB become stationary
  let moveVec = {x: entityA.vx - entityB.vx, y: entityA.vy - entityB.vy};

  // Early Escape test: if the length of the movevec is less
  // than distance between the centers of these circles minus
  // their radii, there's no way they can hit.
  // let moveVec = {x: entityA.vx, y: entityA.vy};
  let dist = getDistance(entityA, entityB);
  let sumRadii = (entityA.size + entityB.size);
  dist -= sumRadii;
  if (getNorm(moveVec) < dist) {
    return false;
  }

  // Normalize the movevec
  let N = normalizeVector(moveVec);

  // Find C, the vector from the center of the moving
  // circle A to the center of B
  let C = {x: entityB.x - entityA.x, y: entityB.y - entityA.y};

  // D = N . C = ||C|| * cos(angle between N and C)
  let D = dot(C, N);

  // Another early escape: Make sure that A is moving
  // towards B! If the dot product between the movevec and
  // B.center - A.center is less that or equal to 0,
  // A isn't isn't moving towards B
  if (D <= 0) {
    return false;
  }
  // Find the length of the vector C
  let lengthC = getNorm(C);

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
  let mag = getNorm(moveVec);

  // Finally, make sure that the distance A has to move
  // to touch B is not greater than the magnitude of the
  // movement vector.
  if (mag < distance) {
    return false;
  }

  // Set the length of the movevec so that the circles will just
  // touch

  moveVec = normalizeVector(moveVec);
  moveVec = {x: moveVec.x * distance, y: moveVec.y * distance};
  let lengthOriginalMoveVec = {x: entityA.vx - entityB.vx, y: entityA.vy - entityB.vy};

  let time = getNorm(moveVec) / getNorm(lengthOriginalMoveVec);

  return {time, entityA, entityB};
}

function applyWallBounce (coll) {
  if (coll.goal === 'goalToScore') {
    debug('GOAL :)');
    return;
  }
  if (coll.goal === 'goalToProtect') {
    debug('GOAL :(');
    return;
  }

  if (coll.wall === 'HORIZONTAL') {
    coll.entity.vy = -coll.entity.vy;
  } else {
    coll.entity.vx = -coll.entity.vx;
  }
}
function willCollideWithWall (entity) {
  let nextPos = {x: entity.x + entity.vx, y: entity.y + entity.vy};
  let dist;
  let distImpact;
  let wall = '';
  if (nextPos.y - entity.size < 0) {
    dist = entity.y - nextPos.y;
    distImpact = entity.y - entity.size;
    wall = 'HORIZONTAL';
  }

  if (nextPos.y + entity.size > 7501) {
    dist = nextPos.y - entity.y;
    distImpact = entity.y - (7501 - entity.size);
    wall = 'HORIZONTAL';
  }

  if (nextPos.x - entity.size < 0) {
    dist = entity.x - nextPos.x;
    distImpact = entity.x - entity.size;
    wall = 'VERTICAL';
  }

  if (nextPos.y + entity.size > 16001) {
    dist = nextPos.x - entity.x;
    distImpact = entity.x - (16001 - entity.size);
    wall = 'VERTICAL';
  }

  if (!dist || !distImpact) return false;

  let time = Math.abs(distImpact / dist);

  let goal = null;
  if (wall === 'VERTICAL' && entity.type === type.snaffle) {
    let snaffle = entity;
    if (lineIntersect(snaffle.x, snaffle.y, nextPos.x, nextPos.y,
                          goalToProtect.point1.x, goalToProtect.point1.y, goalToProtect.point2.x, goalToProtect.point2.y)) {
      goal = 'goalToProtect';
    }
    if (lineIntersect(snaffle.x, snaffle.y, nextPos.x, nextPos.y,
                          goalToScore.point1.x, goalToScore.point1.y, goalToScore.point2.x, goalToScore.point2.y)) {
      goal = 'goalToScore';
    }
  }

  return {time, entity, wall, goal};
}

// Utils functions
function getclosestEntity (pos, _entities) {
  let closestEntity = null;
  let minDist = Infinity;

  _entities.forEach(function (entity) {
    if (pos.id === entity.id) return;
    let distance = getDistance(pos, entity);
    if (distance < minDist) {
      minDist = distance;
      closestEntity = entity;
    }
  });
  return {distance: minDist, entity: closestEntity};
}

function getclosestSnaffNotTargetedAndNotGoal (wizard) {
  let closestSnaff = null;
  let minDist = Infinity;

  snaffles.forEach(function (snaffle) {
    if (!snaffle.targetedBy && !snaffle.willGoal) {
      let distance = getDistance(wizard, snaffle);
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

function getclosestSnaffNotGoal (wizard) {
  let closestSnaff = null;
  let minDist = Infinity;

  snaffles.forEach(function (snaffle) {
    if (!snaffle.willGoal) {
      let distance = getDistance(wizard, snaffle);
      if (distance < minDist) {
        minDist = distance;
        closestSnaff = snaffle;
      }
    }
  });

  return {distance: minDist, entityId: closestSnaff.id};
}

function setClosestSnaffleData (_wizards) {
  // If only one snaffle target it
  if (snaffles.length === 1) {
    for (let i = 0; i < _wizards.length; i++) {
      _wizards[i].closestSnaffData = {distance: getDistance(_wizards[i], snaffles[0]), entityId: snaffles[0].id};
    }
    return;
  }

  // Or only one snaffle with not willGoal target it
  let snaffleWithNotGoalCount = 0;
  let snaffleWithNotGoal = null;
  for (let i = 0; i < snaffles.length; i++) {
    let snaffle = snaffles[i];
    if (!snaffle.willGoal) {
      snaffleWithNotGoal = snaffle;
      ++snaffleWithNotGoalCount;
      if (snaffleWithNotGoalCount > 1) break;
    }
  }
  if (snaffleWithNotGoalCount === 1) {
    for (let i = 0; i < _wizards.length; i++) {
      _wizards[i].closestSnaffData = {distance: getDistance(_wizards[i], snaffleWithNotGoal), entityId: snaffleWithNotGoal.id};
    }
    return;
  }

  for (let i = 0; i < _wizards.length; i++) {
    let wizard = _wizards[i];
    wizard.closestSnaffData = getclosestSnaffNotGoal(wizard);
  }

  if (_wizards[0].closestSnaffData.entityId === _wizards[1].closestSnaffData.entityId) {
    let wizardWithRightTarget = null;
    let wizardNeedChangeTarget = null;
    if (_wizards[0].closestSnaffData.distance > _wizards[1].closestSnaffData.distance) {
      wizardWithRightTarget = _wizards[1];
      wizardNeedChangeTarget = _wizards[0];
    } else {
      wizardWithRightTarget = _wizards[0];
      wizardNeedChangeTarget = _wizards[1];
    }
    getEntity(wizardWithRightTarget.closestSnaffData.entityId).targetedBy = wizardWithRightTarget.id;
    wizardNeedChangeTarget.closestSnaffData = getclosestSnaffNotTargetedAndNotGoal(wizardNeedChangeTarget);
    getEntity(wizardNeedChangeTarget.closestSnaffData.entityId).targetedBy = wizardNeedChangeTarget.id;
  }
}

function checkAccio (wizard) {
  if (energy < 30) {
    return false;
  }

  for (let i = 0; i < snaffles.length; i++) {
    let snaffle = snaffles[i];

    // Don't use Accio when the snaffle would be pulled away from goal to score
    if (goalToScore.center.x === 0) {
      if (snaffle.x < wizard.x) {
        continue;
      }
    } else {
      if (snaffle.x > wizard.x) {
        continue;
      }
    }

    // Don't use Accio when the snaffle is too close or too far from the wizard
    let distance = getDistance(wizard, snaffle);
    if (distance < 1000 || distance > 5000) {
      continue;
    }

    // Don't use Accio on too much velocity
    debug(Math.abs(snaffle.vx) + Math.abs(snaffle.y));
    // if (Math.abs(snaffle.vx) + Math.abs(snaffle.y) > 1000) {
    //   continue;
    // }

    wizard.action = accio(snaffle.id) + ' SnaffleVelocity :' + (Math.abs(snaffle.vx) + Math.abs(snaffle.y));
    return true;
  }

  return false;
}

/*
* Set snaffle.needStop to true if the snaffle will enter
* to goalToProtect according to his velocity
* Set snaffle.willGoal to true if the snaffle will enter
* to goalToScore according to his velocity
*/
function setSnaffleWillGoal () {
  snaffles.forEach(function (snaffle) {
    let newVelocity = {x: snaffle.vx, y: snaffle.vy};
    let newPos = {x: snaffle.x, y: snaffle.y};

    if (lineIntersect(snaffle.x, snaffle.y, parseInt(newPos.x) + parseInt(newVelocity.x), parseInt(newPos.y) + parseInt(newVelocity.y),
                          goalToProtect.point1.x, goalToProtect.point1.y, goalToProtect.point2.x, goalToProtect.point2.y)) {
      debug('Snaffle ' + snaffle.id + ' too fast, cant be stopped with petri');
      return;
    }

    while (Math.abs(newVelocity.x) + Math.abs(newVelocity.y) > 100) {
      newPos = {x: parseInt(newPos.x) + parseInt(newVelocity.x), y: parseInt(newPos.y) + parseInt(newVelocity.y)};
      newVelocity = {x: round(newVelocity.x * friction.snaffle), y: round(newVelocity.y * friction.snaffle)};
    }

    if (lineIntersect(snaffle.x, snaffle.y, newPos.x, newPos.y,
                          goalToProtect.point1.x, goalToProtect.point1.y, goalToProtect.point2.x, goalToProtect.point2.y)) {
      debug('Snaffle ' + snaffle.id + ' risk, need to be stopped');
      snaffle.needStop = true;
    } else if (lineIntersect(snaffle.x, snaffle.y, newPos.x, newPos.y,
                          goalToScore.point1.x, goalToScore.point1.y, goalToScore.point2.x, goalToScore.point2.y)) {
      if (getclosestEntity(snaffle, enemyWizards).distance > 1000) {
        debug('Snaffle ' + snaffle.id + ' will goal :)');
        snaffle.willGoal = true;
      }
    }
  });
}

function checkPetrificus (wizard) {
  if (energy < 10) {
    return false;
  }

  let farestSnaff = null;
  let maxDist = 0;

  // Get the farest snaffle from enemies
  snaffles.forEach(function (snaffle) {
    if (snaffle.needStop) {
      let minDistSnaffleEnemies = Infinity;
      enemyWizards.forEach(function (enemyWizard) {
        let dist = getDistance(enemyWizard, snaffle);
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
    return true;
  }

  return false;
}

function checkFlipendo (wizard) {
  if (energy < 20) {
    return false;
  }

  for (let k = 0; k < snaffles.length; k++) {
    let snaffle = snaffles[k];

    if (getDistance(snaffle, wizard) < size.snaffle + size.wizard + 500) {
      return false;
    }

    if (snaffle.willGoal) {
      return false;
    }

    // -- Flipendo simul--

    // clone entities
    let clonedSnaffle = cloneEntity(snaffle);
    let clonedWizard = cloneEntity(wizard);
    let clonedEntities = [];
    for (let i = 0; i < entities.length; i++) {
      if (entities[i].id === clonedSnaffle.id || entities[i].id === clonedWizard.id) {
        continue;
      }
      clonedEntities.push(cloneEntity(entities[i]));
    }

    // Spell trigger one turn after
    applyMovement(clonedSnaffle);
    applyMovement(clonedWizard);

    applyFriction(clonedSnaffle);
    applyFriction(clonedWizard);
    for (let i = 0; i < clonedEntities.length; i++) {
      applyMovement(clonedEntities[i]);
      applyFriction(clonedEntities[i]);
    }

    // Apply thrust
    let thrust = Math.min(6000 / Math.pow(getDistance(clonedSnaffle, clonedWizard) / 1000, 2), 1000);
    let normalized = normalizedVector(clonedWizard, clonedSnaffle);
    clonedSnaffle.vx = clonedSnaffle.vx + round(normalized.x * (thrust / mass.snaffle));
    clonedSnaffle.vy = clonedSnaffle.vy + round(normalized.y * (thrust / mass.snaffle));

    while (Math.abs(clonedSnaffle.vx) + Math.abs(clonedSnaffle.vy) > 300) {
      if (willCollideNextTurn(clonedSnaffle, clonedEntities)) {
        return false;
      }
      applyMovement(clonedSnaffle);
      applyMovement(clonedWizard);
      applyFriction(clonedSnaffle);
      applyFriction(clonedWizard);
      for (let i = 0; i < clonedEntities.length; i++) {
        applyMovement(clonedEntities[i]);
        applyFriction(clonedEntities[i]);
      }
    }

    if (lineIntersect(snaffle.x, snaffle.y, clonedSnaffle.x, clonedSnaffle.y,
                        goalToScore.point1.x, goalToScore.point1.y, goalToScore.point2.x, goalToScore.point2.y)) {
      debug('Flipendo snaffle target position : ' + clonedSnaffle.x + ' ' + clonedSnaffle.y);
      wizard.action = flipendo(snaffle.id);
      return true;
    }
  }
}

function applyMovement (entity, dt = 1) {
  entity.x = entity.x + round(entity.vx * dt);
  entity.y = entity.y + round(entity.vy * dt);
}
function applyFriction (entity) {
  entity.vx = round(entity.vx * entity.friction);
  entity.vy = round(entity.vy * entity.friction);
}
function applyThrust (entity, target, thrust) {
  let normalized = normalizedVector(entity, target);
  entity.vx = entity.vx + round(normalized.x * (thrust / entity.mass));
  entity.vy = entity.vy + round(normalized.y * (thrust / entity.mass));
}

function willCollideNextTurn (snaffle_, entities_) {
  // Clone entities to perform simulation (change x and y)
  let snaffle = cloneEntity(snaffle_);
  let entitiesCloned = [];
  for (let j = 0; j < entities_.length; j++) {
    if (entities_[j].id === snaffle_.id) { continue; }

    entitiesCloned.push(cloneEntity(entities_[j]));
  }

  // Divide a Turn into step and check collision
  for (let j = 0; j < entitiesCloned.length; j++) {
    let entity = entitiesCloned[j];
    let nbStep = 10;
    for (let k = 0; k < nbStep; k++) {
      snaffle.x += snaffle.vx / nbStep;
      snaffle.y += snaffle.vy / nbStep;
      entity.x += entity.vx / nbStep;
      entity.y += entity.vy / nbStep;

      if (isColliding(snaffle, entity)) {
        return true;
      }
    }
  }
  return false;
}

function cloneEntity (entity) {
  return {id: entity.id, x: entity.x, y: entity.y, vx: entity.vx, vy: entity.vy, size: entity.size, friction: entity.friction, type: entity.type};
}

function isColliding (entity1, entity2) {
  return getDistance(entity1, entity2) < parseInt(entity1.size) + parseInt(entity2.size);
}

function computeBludgersThrust () {
  bludgers.forEach((bludger) => {
    let possibleTargets = [];
    wizards.forEach((wizard) => {
      if (bludger.lastTargetId === wizard.id) return;

      possibleTargets.push(wizard);
    });
    enemyWizards.forEach((wizard) => {
      if (bludger.lastTargetId === wizard.id) return;

      possibleTargets.push(wizard);
    });

    let target = getclosestEntity(bludger, possibleTargets).entity;

    // Apply Bludger thrust
    applyThrust(bludger, target, 1000);
  });
}

function computeEnemiesAction () {
  for (let i = 0; i < enemyWizards.length; i++) {
    let enemy = enemyWizards[i];
    let snaffle = getclosestEntity(enemy, snaffles).entity;

    if (enemy.isHoldingSnaffe) {
      enemy.action = throwSnaffle(goalToProtect.center.x, goalToProtect.center.y, 500);
      applyThrust(snaffle, goalToProtect.center, 500);
    } else {
      applyThrust(enemy, snaffle, 150);
    }
  }
}

function getEntitiesByType (_entities) {
  let wizards = [];
  let enemyWizards = [];
  let snaffles = [];
  let bludgers = [];
  let allWizards = [];
  _entities.forEach(entity => {
    if (entity.type === type.wizard) {
      enemyWizards.push(entity);
      allWizards.push(entity);
    } else if (entity.type === type.enemyWizard) {
      wizards.push(entity);
      allWizards.push(entity);
    } else if (entity.type === type.snaffle) {
      snaffles.push(entity);
    } else if (entity.type === type.bludger) {
      bludgers.push(entity);
    }
  });

  return {wizards, enemyWizards, snaffles, bludgers, allWizards};
}

function simulateOneTurn (_entities) {
  let datas = getEntitiesByType(_entities);
  let wizards = datas.wizards;
  let enemyWizards = datas.enemyWizards;
  let snaffles = datas.snaffles;
  let bludgers = datas.bludgers;
  let allWizards = datas.allWizards;

  let time = 0.0;
  while (time < 1.0) {
    let firstCollision = {time: Infinity};

    for (let i = 0; i < bludgers.length; i++) {
      let bludger1 = bludgers[i];

      let collision = willCollideWithWall(bludger1);
      if (collision && collision.time < firstCollision.time && collision.time + time < 1.0) {
        firstCollision = collision;
      }

      for (let j = i + 1; j < bludgers.length; j++) {
        let bludger2 = bludgers[j];
        let collision = willCollide(bludger1, bludger2);
        if (collision && collision.time < firstCollision.time && collision.time + time < 1.0) {
          firstCollision = collision;
        }
      }

      allWizards.forEach(wizard => {
        let collision = willCollide(bludger1, wizard);
        if (collision && collision.time < firstCollision.time && collision.time + time < 1.0) {
          firstCollision = collision;
        }
      });

      snaffles.forEach(snaffle => {
        let collision = willCollide(bludger1, snaffle);
        if (collision && collision.time < firstCollision.time && collision.time + time < 1.0) {
          firstCollision = collision;
        }
      });
    }

    for (let i = 0; i < allWizards.length; i++) {
      let wizard = allWizards[i];

      let collision = willCollideWithWall(wizard);
      if (collision && collision.time < firstCollision.time && collision.time + time < 1.0) {
        firstCollision = collision;
      }

      for (let j = i + 1; j < allWizards.length; j++) {
        let wizard2 = allWizards[j];
        let collision = willCollide(wizard, wizard2);
        if (collision && collision.time < firstCollision.time && collision.time + time < 1.0) {
          firstCollision = collision;
        }
      }
      snaffles.forEach(snaffle => {
        let collision = willCollide(wizard, snaffle);
        if (collision && collision.time < firstCollision.time && collision.time + time < 1.0) {
          firstCollision = collision;
        }
      });
    }

    for (let i = 0; i < snaffles.length; i++) {
      let snaffle = snaffles[i];

      let collision = willCollideWithWall(snaffle);
      if (collision && collision.time < firstCollision.time && collision.time + time < 1.0) {
        firstCollision = collision;
      }

      for (let j = i + 1; j < snaffles.length; j++) {
        let snaffle2 = snaffles[j];
        let collision = willCollide(snaffle, snaffle2);
        if (collision && collision.time < firstCollision.time && collision.time + time < 1.0) {
          firstCollision = collision;
        }
      }
    }

    // No more collision
    if (firstCollision.time === Infinity) {
      entities.forEach(entity => {
        applyMovement(entity, 1.0 - time);
      });
      time = 1.0;
    } else {
      entities.forEach(entity => {
        applyMovement(entity, firstCollision.time);
      });

      if (firstCollision.wall) {
        applyWallBounce(firstCollision);
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

  // snaffles.forEach(snaffle => {
  //   debug(snaffle.id + ' ' + snaffle.x + ' ' + snaffle.y);
  // });
}

function getEntity (id) {
  for (var i = 0; i < entities.length; i++) {
    if (entities[i].id === id) {
      return entities[i];
    }
  }
}
