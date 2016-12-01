/**
 * Grab Snaffles and try to throw them through the opponent's goal!
 * Move towards a Snaffle and use your team id to determine where you need to throw it.
 **/

const myTeamId = parseInt(readline()); // if 0 you need to score on the right of the map, if 1 you need to score on the left
const poleSize = 150;
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

const friction = {
  snaffle: 0.75,
  bludger: 0.9,
  wizard: 0.75
};

let energy = 0;

// game loop
while (true) {
  var wizards = [];
  var enemyWizards = [];
  var snaffles = [];
  var bludgers = [];

  var entities = parseInt(readline()); // number of entities still in game
  for (let i = 0; i < entities; i++) {
    var inputs = readline().split(' ');
    var entityId = parseInt(inputs[0]); // entity identifier
    var entityType = inputs[1]; // "WIZARD", "OPPONENT_WIZARD" or "SNAFFLE" (or "BLUDGER" after first league)
    var x = parseInt(inputs[2]); // position
    var y = parseInt(inputs[3]); // position
    var vx = parseInt(inputs[4]); // velocity
    var vy = parseInt(inputs[5]); // velocity
    var state = parseInt(inputs[6]); // 1 if the wizard is holding a Snaffle, 0 otherwise

    if (entityType === 'WIZARD') {
      wizards.push({
        id: entityId,
        x,
        y,
        vx,
        vy,
        isHoldingSnaffe: state === 1
      });
    } else if (entityType === 'OPPONENT_WIZARD') {
      enemyWizards.push({
        id: entityId,
        x,
        y,
        vx,
        vy,
        isHoldingSnaffe: state === 1
      });
    } else if (entityType === 'SNAFFLE') {
      snaffles.push({
        id: entityId,
        x,
        y,
        vx,
        vy
      });
    } else if (entityType === 'BLUDGER') {
      bludgers.push({
        id: entityId,
        x,
        y,
        vx,
        vy
      });
    }
  }

  setSnaffleWillGoal();

  setClosestSnaffleData();

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

    if (checkAccio(wizard)) {
      continue;
    }

    let closestSnaff = wizard.closestSnaffData.entity;
    let distanceWizSnaf = wizard.closestSnaffData.distance;
    wizard.action = move(closestSnaff.x, closestSnaff.y, Math.min(Math.round(distanceWizSnaf / 10), 150));
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

  var p3 = {x: p1.x - c.x, y: p1.y - c.y}; // shifted line points
  var p4 = {x: p2.x - c.x, y: p2.y - c.y};

  var m = (p4.y - p3.y) / (p4.x - p3.x); // slope of the line
  var b = p3.y - m * p3.x; // y-intercept of line

  var underRadical = Math.pow(r, 2) * Math.pow(m, 2) + Math.pow(r, 2) - Math.pow(b, 2); // the value under the square root sign

  if (underRadical < 0) {
        // line completely missed
    return false;
  } else {
    var t1 = (-m * b + Math.sqrt(underRadical)) / (Math.pow(m, 2) + 1); // one of the intercept x's
    var t2 = (-m * b - Math.sqrt(underRadical)) / (Math.pow(m, 2) + 1); // other intercept's x
    var i1 = {x: t1 + c.x, y: m * t1 + b + c.y}; // intercept point 1
    var i2 = {x: t2 + c.x, y: m * t2 + b + c.y}; // intercept point 2
    return [i1, i2];
  }
}

// Round half away from zero
function round (nb) {
  return nb.toFixed(0);
}

// Utils functions
function getclosestEntity (pos, entities) {
  let closestEntity = null;
  let minDist = Infinity;

  entities.forEach(function (entity) {
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
    closestSnaff.targetedBy = wizard;
  }
  return {distance: minDist, entity: closestSnaff};
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
  if (closestSnaff !== null) {
    closestSnaff.targetedBy = wizard;
  }
  return {distance: minDist, entity: closestSnaff};
}

function setClosestSnaffleData () {
  // If only one snaffle target it
  if (snaffles.length === 1) {
    for (let i = 0; i < wizards.length; i++) {
      wizards[i].closestSnaffData = {distance: getDistance(wizards[i], snaffles[0]), entity: snaffles[0]};
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
    for (let i = 0; i < wizards.length; i++) {
      wizards[i].closestSnaffData = {distance: getDistance(wizards[i], snaffleWithNotGoal), entity: snaffleWithNotGoal};
    }
    return;
  }

  for (let i = 0; i < wizards.length; i++) {
    let wizard = wizards[i];
    wizard.closestSnaffData = getclosestSnaffNotGoal(wizard);
  }

  if (wizards[0].closestSnaffData.entity === wizards[1].closestSnaffData.entity) {
    let wizardWithRightTarget = null;
    let wizardNeedChangeTarget = null;
    if (wizards[0].closestSnaffData.distance > wizards[1].closestSnaffData.distance) {
      wizardWithRightTarget = wizards[1];
      wizardNeedChangeTarget = wizards[0];
    } else {
      wizardWithRightTarget = wizards[0];
      wizardNeedChangeTarget = wizards[1];
    }
    wizardWithRightTarget.closestSnaffData.entity.targetedBy = wizardWithRightTarget;
    wizardNeedChangeTarget.closestSnaffData = getclosestSnaffNotTargetedAndNotGoal(wizardNeedChangeTarget);
    wizardNeedChangeTarget.closestSnaffData.entity.targetedBy = wizardNeedChangeTarget;
  }
}

function checkAccio (wizard) {
  if (energy < 20) {
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

    if (lineIntersect(snaffle.x, snaffle.y, parseFloat(newPos.x) + parseFloat(newVelocity.x), parseFloat(newPos.y) + parseFloat(newVelocity.y),
                          goalToProtect.point1.x, goalToProtect.point1.y, goalToProtect.point2.x, goalToProtect.point2.y)) {
      debug('Snaffle ' + snaffle.id + ' too fast, cant be stopped with petri');
      return;
    }

    while (Math.abs(newVelocity.x) + Math.abs(newVelocity.y) > 100) {
      newPos = {x: parseFloat(newPos.x) + parseFloat(newVelocity.x), y: parseFloat(newPos.y) + parseFloat(newVelocity.y)};
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
