# FantasticBits
[Codingame](https://www.codingame.com/leaderboards/challenge/fantastic-bits/global) FantasticBits AI in javascript for an 1 week contest

[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat-square)](https://github.com/Flet/semistandard)

I managed to finish ~180th global, and top 30th in Gold League with this bot.  
Not enough time to use properly the simulation part (but it works !)

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

### Gold League
- Detect if a snaffle will enter into a goal
- Use petrificus to prevent a snaffle to enter inside our goal
- No need to move to the closest snaffle if it will goal
- Don't throw the snaffle in goal direction if there is an enemy on it
- Don't use Accio when the snaffle is
  - too close or too far from the wizard
  - would be pulled away from goal to score
- Use Flipendo on snaffle that will goal

### Road to Legend
- Simulate next turn with collision
- Encapsulate the state to clone and simulate easily


![Gif match](match.gif)

## Code Quality
![Pogchamp](https://ih1.redbubble.net/image.139973808.1307/flat,800x800,075,f.u3.jpg)

