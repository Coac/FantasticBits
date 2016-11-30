# FantasticBits
[Codingame](https://www.codingame.com) FantasticBits AI in javascript

[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat-square)](https://github.com/Flet/semistandard)


## Tags
The repository is organized with tags.  
You can browse them to find the specific commit/code to be promoted to the league.  
For example, the [BronzeLeague tag](https://github.com/Coac/FantasticBits/tree/BronzeLeague) contains the AI that can achieve to the bronze league.

### Bronze League
- Wizards follow the closest snaffle
- If holding, throw the snaffle to the right goal

### Silver League
- Ally wizards do not target the same snaffle
- Use of Accio on the nearest snaffle of the ally goal

## Road to Gold
- Detect if a snaffle will enter into a goal
- Use petrificus to prevent a snaffle to enter inside our goal
- No need to move to the closest snaffle if it will goal
- Don't use Accio when the snaffle is
  - too close or too far from the wizard
  - would be pulled away from goal to score
