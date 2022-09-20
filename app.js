const express = require("express");
const app = express();
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "cricketMatchDetails");
let db = null;

const initializeDbAndServer = async () => {
   try{
     db = await open({
        fileName:dbPath,
        driver:sqlite3.Database
     });
     app.listen(3000, () => {
        console.log("Server running at https://localhost:3000/")
     });
   }
   catch(e){
      console.log(`DB Error: ${e.message}`)
      process.exit(1);
   }
}
initializeDbAndServer();

///API 1
app.get("/players/", async (request, response) => {
    const getPlayersQuery = `
      SELECT *
      FROM player_details;
    `;
    const dbResponse = await db.all(getPlayersQuery);
    const convertDbObjToResponseObj = (dbResponse) => {
        let playersList = [];
        for(eachPlayer of dbResponse){
            const player = {
                playerId:eachPlayer.player_id,
                playerName:eachPlayer.player_name
            }
          playersList.push(player)
        };
      return playersList;
    }
    const playersList = convertDbObjToResponseObj(dbResponse);
    response.send(playersList);
});
