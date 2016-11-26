/**
 * Grab Snaffles and try to throw them through the opponent's goal!
 * Move towards a Snaffle and use your team id to determine where you need to throw it.
 **/

var myTeamId = parseInt(readline()); // if 0 you need to score on the right of the map, if 1 you need to score on the left
var xToScore = myTeamId === 1 ? 0 : 15975;
var energy = 0;
// game loop
while (true) {
  var wizards = [];
  var enemyWizards = [];
  var snaffles = [];
  var bludgers = [];

  ++energy;

  var entities = parseInt(readline()); // number of entities still in game
  for (var i = 0; i < entities; i++) {
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

  for (var i = 0; i < wizards.length; i++) {
    // Write an action using print()
    // To debug: printErr('Debug messages...');

    // Edit this line to indicate the action for each wizard (0 ≤ thrust ≤ 150, 0 ≤ power ≤ 500)
    // i.e.: "MOVE x y thrust" or "THROW x y power"

    var wizard = wizards[i];

    if (wizard.isHoldingSnaffe) {
      throwSnaffle(xToScore, 3650, 500);
    } else {
      if (energy >= 10) {
        petrificus(getclosestEntity(wizard.x, wizard.y, enemyWizards).id);
      } else {
        var closestSnaff = getclosestEntity(wizard.x, wizard.y, snaffles);
        move(closestSnaff.x, closestSnaff.y, 150);
      }
    }
  }
}

// Outputs functions
function move (x, y, trust) {
  print('MOVE ' + x + ' ' + y + ' ' + trust);
}

function throwSnaffle (x, y, trust) {
  print('THROW ' + x + ' ' + y + ' ' + trust);
}
function obliviate (entityId) {
  launchSpell('OBLIVIATE', entityId, 5);
}
function petrificus (entityId) {
  launchSpell('PETRIFICUS', entityId, 10);
}
function accio (entityId) {
  launchSpell('ACCIO', entityId, 20);
}
function flipendo (entityId) {
  launchSpell('FLIPENDO', entityId, 20);
}
function launchSpell (name, entityId, energyCost) {
  print(name + ' ' + entityId);
  energy -= energyCost;
}
// Logs
function debug (input) {
  printErr(JSON.stringify(input));
}

// Maths functions
function getDistance (x1, y1, x2, y2) {
  return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
}

// Utils functions
function getclosestEntity (x, y, entities) {
  var closestEntity = null;
  var minDist = Infinity;

  entities.forEach(function (entity) {
    var distance = getDistance(x, y, entity.x, entity.y);
    if (distance < minDist) {
      minDist = distance;
      closestEntity = entity;
    }
  });
  return closestEntity;
}
