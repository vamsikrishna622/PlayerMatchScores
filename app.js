const express = require("express");
const app = express();
app.use(express.json());
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

///API 1
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
      SELECT *
      FROM player_details;
    `;
  const dbResponse = await db.all(getPlayersQuery);
  const convertDbObjToResponseObj = (dbResponse) => {
    let playersList = [];
    for (eachPlayer of dbResponse) {
      const player = {
        playerId: eachPlayer.player_id,
        playerName: eachPlayer.player_name,
      };
      playersList.push(player);
    }
    return playersList;
  };
  const playersList = convertDbObjToResponseObj(dbResponse);
  response.send(playersList);
});

///API 2
app.get("/players/:playerId/", async (request, response) => {
  let playerId = request.params;
  playerId = parseInt(playerId.playerId);
  const getPlayerQuery = `
    SELECT *
    FROM player_details
    WHERE player_id = ${playerId};
  `;
  const dbResponse = await db.get(getPlayerQuery);
  const convertDBResponseToResponseObj = (dbResponse) => {
    return {
      playerId: dbResponse.player_id,
      playerName: dbResponse.player_name,
    };
  };
  const result = convertDBResponseToResponseObj(dbResponse);
  response.send(result);
});

//API 3
app.put("/players/:playerId/", async (request, response) => {
  let playerId = request.params;
  playerId = parseInt(playerId.playerId);
  const { playerName } = request.body;

  const updatePlayerQuery = `
    UPDATE player_details
    SET player_name = '${playerName}'
    WHERE player_id = ${playerId};
`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//API 4
app.get("/matches/:matchId/", async (request, response) => {
  let matchId = request.params;
  matchId = parseInt(matchId.matchId);
  const getMatchDetailsQuery = `
    SELECT *
    FROM match_details
    WHERE match_id = ${matchId};
  `;
  const dbResponse = await db.get(getMatchDetailsQuery);
  const convertDBResponseToResponseObj = (dbResponse) => {
    return {
      matchId: dbResponse.match_id,
      match: dbResponse.match,
      year: dbResponse.year,
    };
  };
  const result = convertDBResponseToResponseObj(dbResponse);
  response.send(result);
});

///API 5
app.get("/players/:playerId/matches", async (request, response) => {
  let playerId = request.params;
  playerId = parseInt(playerId.playerId);

  const getMatchesByPlayer = `
    SELECT match_details.match_id,
    match_details.match,
    match_details.year
    FROM match_details INNER JOIN player_match_score
    ON match_details.match_id = player_match_score.match_id
    WHERE player_id = ${playerId};
  `;
  const dbResponse = await db.all(getMatchesByPlayer);

  const convertDBResponseToResponseObj = (dbResponse) => {
    let matchesList = [];
    for (let eachMatch of dbResponse) {
      const match = {
        matchId: eachMatch.match_id,
        match: eachMatch.match,
        year: eachMatch.year,
      };
      matchesList.push(match);
    }
    return matchesList;
  };
  const result = convertDBResponseToResponseObj(dbResponse);
  response.send(result);
});

///API 6
app.get("/matches/:matchId/players", async (request, response) => {
  let matchId = request.params;
  matchId = parseInt(matchId.matchId);

  const getPlayersOfAMatch = `
    SELECT T.player_id,
    T.player_name
    FROM (player_details INNER JOIN player_match_score
    ON player_details.player_id = player_match_score.player_id) AS T
    INNER JOIN match_details ON T.match_id = match_details.match_id
    WHERE match_details.match_id = ${matchId};
  `;

  const dbResponse = await db.all(getPlayersOfAMatch);
  const convertDBResponseToResponseObj = (dbResponse) => {
    let playersList = [];
    for (eachPlayer of dbResponse) {
      const player = {
        playerId: eachPlayer.player_id,
        playerName: eachPlayer.player_name,
      };
      playersList.push(player);
    }
    return playersList;
  };
  const result = convertDBResponseToResponseObj(dbResponse);
  response.send(result);
});

///API 7
app.get("/players/:playerId/playerScores", async (request, response) => {
  let playerId = request.params;
  playerId = parseInt(playerId.playerId);

  const getPlayerStats = `
        SELECT player_details.player_id AS playerId,
        player_details.player_name AS playerName,
        SUM(score) AS totalScore,
        SUM(fours) AS totalFours,
        SUM(sixes) AS totalSixes
        FROM player_details INNER JOIN player_match_score
        ON player_details.player_id = player_match_score.player_id
        WHERE player_details.player_id = ${playerId}; 
    `;
  const dbResponse = await db.get(getPlayerStats);
  response.send(dbResponse);
});

module.exports = app;
