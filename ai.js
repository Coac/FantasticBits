/**
 * Grab Snaffles and try to throw them through the opponent's goal!
 * Move towards a Snaffle and use your team id to determine where you need to throw it.
 **/

const myTeamId = parseInt(readline()); // if 0 you need to score on the right of the map, if 1 you need to score on the left

const leftGoal = {
  center: {x: 0, y: 3750},
  point1: {x: 0, y: 1750},
  point2: {x: 0, y: 5750}
};
const rightGoal = {
  center: {x: 16000, y: 3750},
  point1: {x: 16000, y: 1750},
  point2: {x: 16000, y: 5750}
};
const goalToScore = myTeamId === 1 ? leftGoal : rightGoal;
const goalToProtect = myTeamId === 1 ? rightGoal : leftGoal;

var energy = 0;
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

  // Logging info
  snaffles.forEach(function (snaffle) {
    debug(snaffle);
    if (lineIntersect(snaffle.x, snaffle.y, snaffle.x + snaffle.vx * 4, snaffle.y + snaffle.vy * 4,
                          goalToProtect.point1.x, goalToProtect.point1.y, goalToProtect.point2.x, goalToProtect.point2.y)) {
      debug('Snaffle ' + snaffle.id + ' risk to goal');
    }
  });

  setClosestSnaffleData();

  for (let i = 0; i < wizards.length; i++) {
    let wizard = wizards[i];

    if (wizard.isHoldingSnaffe) {
      wizard.action = throwSnaffle(goalToScore.center.x, goalToScore.center.y, 500);
      continue;
    }

/*
    if (energy >= 10) {
      let hasAction = false;
      snaffles.forEach((snaffle) => {
        if (lineIntersect(snaffle.x, snaffle.y, snaffle.x + snaffle.vx * 4, snaffle.y + snaffle.vy * 4,
                              goalToProtect.point1.x, goalToProtect.point1.y, goalToProtect.point2.x, goalToProtect.point2.y)) {
          wizard.action = petrificus(snaffle.id);
          hasAction = true;
          return false;
        }
      });
      if (hasAction) continue;
    }
*/
    if (checkAccio(wizard)) {
      continue;
    }

    let closestSnaff = wizard.closestSnaffData.entity;
    let distanceWizSnaf = wizard.closestSnaffData.distance;
    if (closestSnaff) {
      wizard.action = move(closestSnaff.x, closestSnaff.y, Math.min(Math.round(distanceWizSnaf / 10), 150));
      continue;
    }

    wizard.action = move(0, 0, 150); // TODO : PLACEHOLDER
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

function getclosestSnaffNotTargeted (wizard) {
  let closestSnaff = null;
  let minDist = Infinity;

  snaffles.forEach(function (snaffle) {
    if (!snaffle.targetedBy) {
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
  for (let i = 0; i < wizards.length; i++) {
    let wizard = wizards[i];
    wizard.closestSnaffData = getclosestSnaffNotTargeted(wizard);
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
    wizardNeedChangeTarget.closestSnaffData = getclosestSnaffNotTargeted(wizardNeedChangeTarget);
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
    if (distance < 1000 || distance > 6000) {
      continue;
    }

    wizard.action = accio(snaffle.id);
    return true;
  }
}
