const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "covid19India.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running");
    });
  } catch (e) {
    console.log("DBError:${e.message}");
    process.exit(1);
  }
};
initializeDBAndServer();

//API 1
const convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};
app.get("/states/", async (request, response) => {
  const getCovidQuery = `SELECT *
                            FROM state`;
  const result = await db.all(getCovidQuery);
  response.send(
    result.map((eachPlayer) => convertDbObjectToResponseObject(eachPlayer))
  );
});

//API 2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getCovidQuery = `SELECT *
                             FROM state
                             WHERE state_id = ${stateId}`;
  const result = await db.get(getCovidQuery);
  response.send(convertDbObjectToResponseObject(result));
});

//API 3
app.post("/districts/", async (request, response) => {
  const districtsDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtsDetails;
  const addCovidQuery = `INSERT INTO
                              district( district_name,state_id,cases,cured,active,deaths)
                              VALUES('${districtName}',
                                ${stateId},
                                ${cases},
                                ${cured},
                                ${active},
                                ${deaths})`;
  const dbResponse = await db.run(addCovidQuery);
  response.send("District Successfully Added");
});

//API 4

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistricts = `SELECT *
                            FROM  district
                            WHERE  district_id = ${districtId}`;
  const result = await db.get(getDistricts);
  const convertDbObjectToResponseObjects = (dbObject) => {
    return {
      districtId: dbObject.district_id,
      districtName: dbObject.district_name,
      stateId: dbObject.state_id,
      cases: dbObject.cases,
      cured: dbObject.cured,
      active: dbObject.active,
      deaths: dbObject.deaths,
    };
  };
  response.send(convertDbObjectToResponseObjects(result));
});

//API 5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrict = `DELETE FROM district
                              WHERE district_id = ${districtId}`;
  await db.run(deleteDistrict);
  response.send("District Removed");
});

//API 6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrict = `UPDATE district
                            SET  
                            district_name = '${districtName}',
                            state_id = ${stateId},
                            cases = ${cases},
                            cured = ${cured},
                            active = ${active},
                            deaths = ${deaths}
                            WHERE district_id = ${districtId}`;
  await db.run(updateDistrict);
  response.send("District Details Updated");
});

//API 7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getTotalQuery = `SELECT
                             SUM(cases),
                             SUM(cured),
                             SUM(active),
                             SUM(deaths)
                             FROM district
                             WHERE state_id = ${stateId}`;
  const stats = await db.get(getTotalQuery);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

//API 8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrict = `SELECT state_id
                             FROM district
                            WHERE district_id = ${districtId}`;
  const getDistrictResponse = await db.get(getDistrict);

  const getState = `SELECT state_name AS stateName
                        FROM state
                        WHERE state_id = ${getDistrictResponse.state_id}`;
  const getStateResponse = await db.get(getState);
  response.send(getStateResponse);
});

module.exports = app;
