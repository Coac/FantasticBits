/**
 * Grab Snaffles and try to throw them through the opponent's goal!
 * Move towards a Snaffle and use your team id to determine where you need to throw it.
 **/

var myTeamId = parseInt(readline()); // if 0 you need to score on the right of the map, if 1 you need to score on the left

// game loop
while (true) {
  var wizards = [];
  var enemyWizards = [];
  var snaffles = [];

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
    }
  }
  printErr(JSON.stringify(snaffles));

  for (var i = 0; i < 2; i++) {
    // Write an action using print()
    // To debug: printErr('Debug messages...');

    // Edit this line to indicate the action for each wizard (0 ≤ thrust ≤ 150, 0 ≤ power ≤ 500)
    // i.e.: "MOVE x y thrust" or "THROW x y power"

    move(8000, 3750, 100);
  }
}

function move(x, y, trust) {
  print('MOVE ' + x + ' ' + y + ' ' + trust);
}

function throw(x, y, trust) {
  print('THROW ' + x + ' ' + y + ' ' + trust);
}
