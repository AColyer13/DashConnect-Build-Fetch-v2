document.addEventListener('DOMContentLoaded', () => {
  // 🌗 Theme Toggle
  const themeToggle = document.getElementById('theme-toggle');
  const root = document.documentElement;
  const savedTheme = localStorage.getItem('theme') || 'light';
  root.setAttribute('data-theme', savedTheme);

  themeToggle.addEventListener('click', () => {
    const current = root.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });

  // 🧩 Drag-and-Drop Grid
  const dashboard = document.getElementById('dashboard');
  let dragged;

  dashboard.addEventListener('dragstart', e => {
    dragged = e.target;
    e.target.classList.add('dragging');
  });

  dashboard.addEventListener('dragend', e => {
    e.target.classList.remove('dragging');
  });

  dashboard.addEventListener('dragover', e => {
    e.preventDefault();
    const target = e.target.closest('.grid-item');
    if (target && target !== dragged) {
      dashboard.insertBefore(dragged, target.nextSibling);
    }
  });

  // 🎤 Voice Input
  function voiceInput(targetId) {
    const input = document.getElementById(targetId);
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.start();
    recognition.onresult = e => {
      input.value = e.results[0][0].transcript;
    };
  }

  document.querySelector('#weather-api button:nth-of-type(1)').addEventListener('click', () => voiceInput('weather-city-input'));
  document.querySelector('#github-api button:nth-of-type(1)').addEventListener('click', () => voiceInput('github-user-input'));

  // 🐶 Dog API
  async function loadDogBreeds() {
    const select = document.getElementById('dog-breed-select');
    const res = await fetch('https://dog.ceo/api/breeds/list/all');
    const data = await res.json();
    Object.keys(data.message).forEach(breed => {
      const option = document.createElement('option');
      option.value = breed;
      option.textContent = breed;
      select.appendChild(option);
    });
  }

  async function getDogImage() {
    const breed = document.getElementById('dog-breed-select').value;
    const output = document.getElementById('dog-output');
    output.innerHTML = 'Loading...';
    const url = breed ? `https://dog.ceo/api/breed/${breed}/images/random` : 'https://dog.ceo/api/breeds/image/random';
    const res = await fetch(url);
    const data = await res.json();
    output.innerHTML = `<img src="${data.message}" alt="Dog" style="max-height:250px;" />`;
  }

  document.querySelector('#dog-api button:nth-of-type(1)').addEventListener('click', getDogImage);
  document.getElementById('save-dog').addEventListener('click', () => {
    const img = document.querySelector('#dog-output img');
    if (img) localStorage.setItem('savedDog', img.src);
  });
  loadDogBreeds();

  // 🐱 Cat API
  async function getCatImage() {
    const output = document.getElementById('cat-output');
    output.innerHTML = 'Loading...';
    const res = await fetch('https://api.thecatapi.com/v1/images/search');
    const data = await res.json();
    output.innerHTML = `<img src="${data[0].url}" alt="Cat" style="max-height:250px;" />`;
  }

  document.querySelector('#cat-api button:nth-of-type(1)').addEventListener('click', getCatImage);
  document.getElementById('save-cat').addEventListener('click', () => {
    const img = document.querySelector('#cat-output img');
    if (img) localStorage.setItem('savedCat', img.src);
  });

  // ☀️ Weather API
 // ☀️ Weather API with voice cleanup
  async function getWeather() {
    const rawCity = document.getElementById('weather-city-input').value.trim();
    const city = rawCity.replace(/[.,!?;:]+$/, ''); // Remove trailing punctuation
    const output = document.getElementById('weather-output');

    if (!city) {
      output.textContent = 'Please enter a city name.';
      return;
    }

    output.innerHTML = 'Loading...';

    try {
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}`);
      const geoData = await geoRes.json();

      if (!geoData.results || geoData.results.length === 0) {
        output.textContent = `Hmm... I couldn't find "${city}". Try a nearby major city or check spelling.`;
        return;
      }

      const { latitude, longitude, name, country } = geoData.results[0];

      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=fahrenheit&windspeed_unit=mph`
      );
      const weatherData = await weatherRes.json();
      const w = weatherData.current_weather;

      output.innerHTML = `
        <strong>${name}, ${country}</strong><br>
        Temp: ${w.temperature}°F<br>
        Wind: ${w.windspeed} mph
      `;
    } catch {
      output.textContent = 'Error fetching weather data.';
    }
  }



  document.querySelector('#weather-api button:nth-of-type(2)').addEventListener('click', getWeather);

  // 💱 Currency API
  async function getExchangeRates() {
    const amount = parseFloat(document.getElementById('amount').value);
    const target = document.getElementById('currency-select').value;
    const output = document.getElementById('currency-output');
    if (isNaN(amount)) return (output.textContent = 'Enter a valid amount.');
    output.innerHTML = 'Loading...';
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await res.json();
    const rate = data.rates[target];
    output.innerHTML = `${amount} USD = ${(amount * rate).toFixed(2)} ${target}`;
  }

  document.querySelector('#currency-api button').addEventListener('click', getExchangeRates);

  // 🎬 Movies API with Pagination
  let moviePage = 1;
  async function getMovies(page = 1) {
    const output = document.getElementById('movies-output');
    output.innerHTML = 'Loading...';
    const res = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=598792b69853292f72d8abc968c55698&language=en-US&page=${page}`);
    const data = await res.json();
    const top = data.results.slice(0, 3);
    output.innerHTML = top.map(m => `
      <div style="text-align:center;">
        <img src="https://image.tmdb.org/t/p/w200${m.poster_path}" alt="${m.title}" style="width:100px;" />
        <div><strong>${m.title}</strong></div>
      </div>
    `).join('');
  }

  document.querySelector('#movies-api button:nth-of-type(1)').addEventListener('click', () => getMovies(moviePage));
  document.getElementById('next-movie').addEventListener('click', () => getMovies(++moviePage));
  document.getElementById('prev-movie').addEventListener('click', () => {
    if (moviePage > 1) getMovies(--moviePage);
  });

  // 🧑‍💻 GitHub API
  async function getGitHubUser() {
    const username = document.getElementById('github-user-input').value.trim();
    const output = document.getElementById('github-output');
    if (!username) return (output.textContent = 'Enter a username.');
    output.innerHTML = 'Loading...';
    const res = await fetch(`https://api.github.com/users/${username}`);
    if (!res.ok) return (output.textContent = 'User not found.');
    const data = await res.json();
    output.innerHTML = `
      <img src="${data.avatar_url}" alt="${username}" style="width:80px" /><br>
      Name: ${data.name || 'N/A'}<br>
      Public Repos: ${data.public_repos}
    `;
  }

  document.querySelector('#github-api button:nth-of-type(2)').addEventListener('click', getGitHubUser);

  // 🤣 Joke API
  async function getJoke() {
    const category = document.getElementById('joke-category-select').value;
    const output = document.getElementById('joke-output');
    output.innerHTML = 'Loading...';
    const url = category ? `https://v2.jokeapi.dev/joke/${category}?type=single` : 'https://v2.jokeapi.dev/joke/Any?type=single';
    const res = await fetch(url);
    const data = await res.json();
    output.innerHTML = data.joke || `${data.setup}<br><strong>${data.delivery}</strong>`;
  }

  document.querySelector('#joke-api button:nth-of-type(1)').addEventListener('click', getJoke);
  document.getElementById('save-joke').addEventListener('click', () => {
    const joke = document.getElementById('joke-output').innerText;
    if (joke) {
      let savedJokes = JSON.parse(localStorage.getItem('savedJokes') || '[]');
      savedJokes.push(joke);
      localStorage.setItem('savedJokes', JSON.stringify(savedJokes));
    }
  });

  // 📚 Public API
  async function getPublicApiInfo() {
    const output = document.getElementById('publicapi-output');
    output.innerHTML = 'Loading...';
    try {
      const res = await fetch('https://raw.githubusercontent.com/public-apis/public-apis/master/README.md');
      const text = await res.text();
      const matches = [...text.matchAll(/\|\s*\[(.*?)\]\((.*?)\)\s*\|\s*(.*?)\s*\|/g)];
      if (!matches.length) {
        output.textContent = 'No API found.';
        return;
      }
      const pick = matches[Math.floor(Math.random() * matches.length)];
      const name = pick[1];
      const url = pick[2];
      const desc = pick[3];
      output.innerHTML = `<strong><a href="${url}" target="_blank">${name}</a></strong><br>${desc}`;
    } catch {
      output.textContent = 'Error fetching public API info.';
    }
  }

  document.querySelector('#public-api button').addEventListener('click', getPublicApiInfo);
});
