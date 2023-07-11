
'use strict';


// google map link: -https://www.google.co.in/maps/@19.0101132,73.9248119,13.39z
// embeed google map <iframe src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d15088.824852098047!2d73.94773805!3d19.0106328!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sin!4v1679811773781!5m2!1sen!2sin" width="800" height="600" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>

class Workout {
	date = new Date();
	id = (Date.now() + '').slice(-10);

	constructor(coords, distance, duration) {
		this.coords = coords; // [lat lan]
		this.distance = distance;
		this.duration = duration;
	};

	_getCurrentPosition() {
		// prettier-ignore
		const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
		this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`
	};
};


class Running extends Workout {
	constructor(coords, distance, duration, cadence) {
		super(coords, distance, duration)
		this.type = 'running';
		this.cadence = cadence;
		this.calcPace();
		this._getCurrentPosition();
	}

	calcPace() {
		this.pace = this.duration / this.distance;
		return this.pace
	}

};


class Cycling extends Workout {
	constructor(coords, distance, duration, elevationGain) {
		super(coords, distance, duration);
		this.type = 'cycling';
		this.elevationGain = elevationGain;
		this.calcSpeed();
		this._getCurrentPosition();
	};

	calcSpeed() {
		this.speed = this.distance / (this.duration / 60);
		return this.speed;
	}


}

// const run = new Running([39, -12], 5.3, 24, 178);
// const cycle = new Cycling([39, -12], 26, 34, 158);
// console.log(run, `\n`, cycle)

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {

	#zoomLevel = 16;
	#map;
	#mapEv;
	#workout = [];
	constructor() {
		// user position
		this._getPosition();

		//get data from local storage
		this._getLocalStorage();

		// event handeler
		form.addEventListener('submit', this._newWorkout.bind(this));

		inputType.addEventListener('change', this._toggleElevationField);

		containerWorkouts.addEventListener('click', this._getZoomPosition.bind(this))

	};

	_getPosition() {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(this._loadMap.bind(this)
				// console.log(position);
				// console.log(`https:www.google.co.in/maps/@${latitude},${longitude}`)
				// console.log(latitude, longitude);
				// console.log(coords);
				, function (err) {
					console.error(err);
				})
		}
	};

	_loadMap(position) {
		const { latitude } = position.coords;
		const { longitude } = position.coords;
		const coords = [latitude, longitude];

		this.#map = L.map('map').setView(coords, this.#zoomLevel);
		L.tileLayer('https://{s}.google.com/vt?lyrs=m&x={x}&y={y}&z={z}', {
			// maxZoom: 20,
			subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
		}).addTo(this.#map);
		this.#map.on('click', this._showForm.bind(this));


		this.#workout.forEach(wok => {
			this._renderWorkoutMarker(wok);
		})
	}

	_showForm(mapE) {
		this.#mapEv = mapE;
		form.classList.remove('hidden');
		inputDistance.focus();
	}

	_hideForm() {
		inputDistance.value = inputCadence.value = inputDuration.value = inputElevation.value = '';
		form.style.display = 'none';
		form.classList.add('hidden');
		setTimeout(() => (form.style.display = 'grid'), 1000);
	}

	_toggleElevationField() {
		inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
		inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
	}

	_newWorkout(ev) {

		// helper function
		const validInput = (...input) => input.every(inp => Number.isFinite(inp));
		const numberPositive = (...input) => input.every(inp => inp > 0);
		ev.preventDefault();


		// Get data from form
		const type = inputType.value;
		const distance = +inputDistance.value;
		const duration = +inputDuration.value;
		const { lat, lng } = this.#mapEv.latlng;
		let workout;

		// if workout running ,create running object
		if (type === 'running') {
			const cadence = +inputCadence.value;
			// 	if (!Number.isFinite(distance) || !Number.isFinite(duration) || !Number.isFinite(cadence))
			// 		return alert('Input have to be positive')};
			if (!validInput(distance, duration, cadence) || !numberPositive(distance, duration, cadence)) {
				return alert('Input have to be positive');
			};

			workout = new Running([lat, lng], distance, duration, cadence);

		};


		//if workout cycling ,create cycling object
		if (type === 'cycling') {
			const elevation = +inputElevation.value;

			if (!validInput(distance, duration, elevation) || !numberPositive(distance, duration)) {
				return alert('Input have to be positive');
			};

			workout = new Cycling([lat, lng], distance, duration, elevation);

		};

		this.#workout.push(workout);
		console.log(workout);

		// clear input field
		inputDistance.value = inputCadence.value = inputDuration.value = inputElevation.value = '';

		//display marker
		this._renderWorkoutMarker(workout)

		// render workout
		this._renderWorkout(workout);

		// close form
		this._hideForm();

		//set local storage
		this._setLocalStorage();
	};

	_renderWorkoutMarker(workout) {

		//display market
		L.marker(workout.coords).addTo(this.#map)
			.bindPopup(L.popup({
				maxWidth: 250,
				minWidth: 100,
				autoClose: false,
				closeOnClick: false,
				className: `${workout.type}-popup`,

			}))
			.setPopupContent(`${workout.type === 'cycling' ? '🚴‍♀️' : '🏃‍♂️'} ${workout.description}`)
			.openPopup();

	};

	_renderWorkout(workout) {
		let html =
			`<li class="workout workout--${workout.type}" data-id="${workout.id}">
		<h2 class="workout__title">${workout.description}</h2>
		<div class="workout__details">
		     <span class="workout__icon">${workout.type === 'cycling' ? '🚴‍♀️' : '🏃‍♂️'}</span>
		     <span class="workout__value">${workout.distance}</span>
		     <span class="workout__unit">km</span>
		 </div>
	        <div class="workout__details">
	        	<span class="workout__icon">⏱</span>
	        	<span class="workout__value">${workout.duration}</span>
	        	<span class="workout__unit">min</span>
	        </div>`;
		if (workout.type === 'cycling')
			html += `
			<div class="workout__details">
			   <span class="workout__icon">⚡️</span>
			   <span class="workout__value">${workout.speed.toFixed(1)}</span>
			   <span class="workout__unit">km/h</span>
		        </div>
		        <div class="workout__details">
			   <span class="workout__icon">⛰</span>
			   <span class="workout__value">${workout.elevationGain}</span>
			   <span class="workout__unit">m</span>
		        </div>
		        </li>`;

		if (workout.type === 'running')
			html += `
		        <div class="workout__details">
			   <span class="workout__icon">⚡️</span>
			   <span class="workout__value">${workout.pace.toFixed(1)}</span>
			   <span class="workout__unit">min/km</span>
		        </div>
		        <div class="workout__details">
			   <span class="workout__icon">🦶🏼</span>
			   <span class="workout__value">${workout.cadence}</span>
			   <span class="workout__unit">spm</span>
		        </div>
		        </li>
		    `;


		form.insertAdjacentHTML('afterend', html);

	};

	_getZoomPosition(e) {
		const position = e.target.closest('.workout');
		console.log(position);
		//Guard class
		if (!position) return;

		const workout = this.#workout.find(wok => wok.id === position.dataset.id);

		this.#map.setView(workout.coords, this.#zoomLevel, {
			animate: true,
			pan: {
				duration: 1,
			},
		});

	};

	_setLocalStorage() {
		localStorage.setItem('workouts', JSON.stringify(this.#workout));
	};

	_getLocalStorage() {
		const data = JSON.parse(localStorage.getItem('workouts'));
		if (!data) return;

		this.#workout = data;

		this.#workout.forEach(wok => {
			this._renderWorkout(wok);
		})
	};

	resrt() {
		localStorage.removeItem('workouts');
		location.reload();
	}

};



const app = new App();
// app._getPosition();



// echo "# MrOmkarSonavale" >> README.md
// git init
// git add README.md
// git commit -m "first commit"
// git branch -M main
// git remote add origin https://github.com/MrOmkarSonavale/MrOmkarSonavale.git
// git push -u origin main