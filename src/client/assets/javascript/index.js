// PROVIDED CODE BELOW (LINES 1 - 80) DO NOT REMOVE

// The store will hold all information needed globally
const store = {
  track_id: undefined,
  player_id: undefined,
  race_id: undefined,
};

// We need our javascript to wait until the DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  onPageLoad();
  setupClickHandlers();
});

async function onPageLoad() {
  try {
    await getTracks().then((tracks) => {
      const html = renderTrackCards(tracks);
      renderAt("#tracks", html);
    });

    await getRacers().then((racers) => {
      console.log("racers", racers);
      const html = renderRacerCars(racers);
      renderAt("#racers", html);
    });
  } catch (error) {
    console.log("Problem getting tracks and racers ::", error.message);
    console.error(error);
  }
}

function setupClickHandlers() {
  document.addEventListener(
    "click",
    function (event) {
      const { target } = event;

      // Race track form field
      if (target.matches(".card.track")) {
        handleSelect(target, "#tracks", "track_id");
      }

      // Podracer form field
      if (target.matches(".card.podracer")) {
        handleSelect(target, "#racers", "player_id");
      }

      // Submit create race form
      if (target.matches("#submit-create-race")) {
        event.preventDefault();
        handleCreateRace();
      }

      // Handle acceleration click
      if (target.matches("#gas-peddle")) {
        handleAccelerate(target);
      }
    },
    false
  );
}

async function delay(ms) {
  try {
    return await new Promise((resolve) => setTimeout(resolve, ms));
  } catch (error) {
    console.log("an error shouldn't be possible here");
    console.log(error);
  }
}
// ^ PROVIDED CODE ^ DO NOT REMOVE

// This async function controls the flow of the race, add the logic and error handling
async function handleCreateRace() {
  // render starting UI

  try {
    // Get player_id and track_id from the store
    const player_id = store.player_id;
    const track_id = store.track_id;
    // invoke the API call to create the race, then save the result
    const race = await createRace(player_id, track_id);
    // update the store with the race id
    store.player_id = race.PlayerID;
    store.race_id = parseInt(race.ID) - 1;

    renderAt("#race", renderRaceStartView(race.Track, race.Cars));
    // The race has been created, now start the countdown
    // call the async function runCountdown
    await runCountdown();
    // call the async function startRace
    await startRace(store.race_id);
    // call the async function runRace
    await runRace(store.race_id);
  } catch (err) {
    console.log(err);
  }
}

async function runRace(raceID) {
  try {
    return new Promise((resolve) => {
      // use Javascript's built in setInterval method to get race info every 500ms
      const raceInterval = setInterval(() => {
        getRace(raceID)
          .then((data) => {
            console.log("data", data);
            /* 
              if the race info status property is "in-progress", update the leaderboard by calling:
              renderAt('#leaderBoard', raceProgress(res.positions))
            */
            if (data.status === "in-progress") {
              console.log("st", store);
              renderAt("#leaderBoard", raceProgress(data.positions));
            } else if (data.status === "finished") {
              /* 
                if the race info status property is "finished", run the following:
                clearInterval(raceInterval) // to stop the interval from repeating
                renderAt('#race', resultsView(res.positions)) // to render the results view
                reslove(res) // resolve the promise
              */
              clearInterval(raceInterval); // to stop the interval from repeating
              renderAt("#race", resultsView(data.positions)); // to render the results view
              resolve(data); // resolve the promise
            }
          })
          .catch((err) => console.log(err));
      }, 500);
    });
  } catch (err) {
    console.log(err);
  }
  // remember to add error handling for the Promise
}

async function runCountdown() {
  try {
    // wait for the DOM to load
    await delay(1000);
    let timer = 3;
    return new Promise((resolve) => {
      // use Javascript's built in setInterval method to count down once per second
      const countDown = setInterval(() => {
        if (timer > 0) {
          // run this DOM manipulation to decrement the countdown for the user
          document.getElementById("big-numbers").innerHTML = --timer;
        } else {
          // if the countdown is done, clear the interval, resolve the promise, and return
          clearInterval(countDown);
          resolve();
        }
      }, 1000);
    });
  } catch (error) {
    console.log(error);
  }
}

/* make common function for handleSelect for track and podRacer */
function handleSelect(target, domID, id) {
  console.log(`select ${domID}`, target.id);

  // remove class selected from all racer options
  const selected = document.querySelector(`${domID} .selected`);
  if (selected) {
    selected.classList.remove("selected");
  }

  // add class selected to current target
  target.classList.add("selected");

  // save the selected racer to the store
  store[id] = parseInt(target.id);
}

function handleAccelerate() {
  console.log("accelerate button clicked");
  // Invoke the API call to accelerate
  accelerate(store.race_id);
}

// HTML VIEWS ------------------------------------------------

function renderRacerCars(racers) {
  if (!racers.length) {
    return `
			<h4>Loading Racers...</4>
		`;
  }

  const results = racers.map(renderRacerCard).join("");

  return `
		<ul id="racers">
			${results}
		</ul>
	`;
}

function renderRacerCard(racer) {
  const { id, driver_name, top_speed, acceleration, handling } = racer;

  return `
		<li class="card podracer" id="${id}">
			<h3>${driver_name}</h3>
			<p>${top_speed}</p>
			<p>${acceleration}</p>
			<p>${handling}</p>
		</li>
	`;
}

function renderTrackCards(tracks) {
  if (!tracks.length) {
    return `
			<h4>Loading Tracks...</4>
		`;
  }

  const results = tracks.map(renderTrackCard).join("");

  return `
		<ul id="tracks">
			${results}
		</ul>
	`;
}

function renderTrackCard(track) {
  const { id, name } = track;

  return `
		<li id="${id}" class="card track">
			<h3>${name}</h3>
		</li>
	`;
}

function renderCountdown(count) {
  return `
		<h2>Race Starts In...</h2>
		<p id="big-numbers">${count}</p>
	`;
}

function renderRaceStartView(track, racers) {
  return `
		<header>
			<h1>Race: ${track.name}</h1>
		</header>
		<main id="two-columns">
			<section id="leaderBoard">
				${renderCountdown(3)}
			</section>

			<section id="accelerate">
				<h2>Directions</h2>
				<p>Click the button as fast as you can to make your racer go faster!</p>
				<button id="gas-peddle">Click Me To Win!</button>
			</section>
		</main>
		<footer></footer>
	`;
}

function resultsView(positions) {
  positions.sort((a, b) => (a.final_position > b.final_position ? 1 : -1));

  return `
		<header>
			<h1>Race Results</h1>
		</header>
		<main>
			${raceProgress(positions)}
			<a class="button" href="/race">Start a new race</a>
		</main>
	`;
}

function raceProgress(positions) {
  let userPlayer = positions.find((e) => e.id === store.player_id);
  console.log("player", store.player_id);
  console.log(positions);
  userPlayer.driver_name += " (you)";

  positions = positions.sort((a, b) => (a.segment > b.segment ? -1 : 1));
  let count = 1;

  const results = positions.map((p) => {
    return `
			<tr>
				<td>
					<h3>${count++} - ${p.driver_name}</h3>
				</td>
			</tr>
		`;
  });

  return `
		<main>
			<h3>Leaderboard</h3>
			<section id="leaderBoard">
				${results}
			</section>
		</main>
	`;
}

function renderAt(element, html) {
  const node = document.querySelector(element);

  node.innerHTML = html;
}

// ^ Provided code ^ do not remove

// API CALLS ------------------------------------------------

const SERVER = "http://localhost:8000";

function defaultFetchOpts() {
  return {
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": SERVER,
    },
  };
}

// Make a fetch call (with error handling!) to each of the following API endpoints

async function getTracks() {
  // GET request to `${SERVER}/api/tracks`
  return await fetch(`${SERVER}/api/tracks`)
    .then((res) => res.json())
    .catch((err) => console.log(err));
}

async function getRacers() {
  // GET request to `${SERVER}/api/cars`
  return await fetch(`${SERVER}/api/cars`)
    .then((res) => res.json())
    .catch((err) => console.log(err));
}

async function createRace(player_id, track_id) {
  player_id = parseInt(store.player_id);
  track_id = parseInt(store.track_id);
  const data = { player_id, track_id };
  return await fetch(`${SERVER}/api/races`, {
    method: "POST",
    ...defaultFetchOpts(),
    dataType: "jsonp",
    body: JSON.stringify(data),
  })
    .then((res) => res.json())
    .catch((err) => console.log("Problem with createRace request::", err));
}

function getRace(id) {
  // GET request to `${SERVER}/api/races/${id}`
  return fetch(`${SERVER}/api/races/${id}`)
    .then((res) => res.json())
    .catch((err) => console.log(err));
}

function startRace(id) {
  return fetch(`${SERVER}/api/races/${id}/start`, {
    method: "POST",
    ...defaultFetchOpts(),
  }).catch((err) => console.log("Problem with getRace request::", err));
}

function accelerate(id) {
  // POST request to `${SERVER}/api/races/${id}/accelerate`
  return fetch(`${SERVER}/api/races/${id}/accelerate`, {
    method: "POST",
    // options parameter provided as defaultFetchOpts
    ...defaultFetchOpts(),
    // no body or datatype needed for this request
  }).catch((err) => console.log(err));
}
