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
  document.getElementById('weather-voice').addEventListener('click', () => voiceInput('weather-city-input'));
  document.getElementById('github-voice').addEventListener('click', () => voiceInput('github-user-input'));

  // 🐶 Dog API
  document.getElementById('get-dog').addEventListener('click', getDogImage);

  // 🐱 Cat API
  document.getElementById('get-cat').addEventListener('click', getCatImage);

  // ☀️ Weather API
  document.getElementById('get-weather').addEventListener('click', getWeather);

  // 💱 Currency API
  document.getElementById('convert-currency').addEventListener('click', getExchangeRates);

  // 🎬 Movies API
  document.getElementById('get-movies').addEventListener('click', () => getMovies(moviePage));
  document.getElementById('next-movie').addEventListener('click', () => getMovies(++moviePage));
  document.getElementById('prev-movie').addEventListener('click', () => {
    if (moviePage > 1) getMovies(--moviePage);
  });

  // 🧑‍💻 GitHub API
  document.getElementById('search-github').addEventListener('click', getGitHubUser);

  // 🤣 Joke API
  document.getElementById('get-joke').addEventListener('click', getJoke);

  // 📚 Public API
  document.getElementById('show-public-api').addEventListener('click', getPublicApiInfo);

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
    output.innerHTML = `<img src="${data.message}" alt="Dog" />`;
  }

  // Save Dog (store array)
  document.getElementById('save-dog').addEventListener('click', () => {
    const img = document.querySelector('#dog-output img');
    if (img) {
      let savedDogs = JSON.parse(localStorage.getItem('savedDogs') || '[]');
      savedDogs.push(img.src);
      localStorage.setItem('savedDogs', JSON.stringify(savedDogs));
    }
  });

  // Show Saved Dog (list + reset)
  document.getElementById('show-saved-dog').addEventListener('click', () => {
    let savedDogs = JSON.parse(localStorage.getItem('savedDogs') || '[]');
    const html = savedDogs.length
      ? savedDogs.map(src => `<img src="${src}" alt="Saved Dog" style="width:100%;max-width:250px;border-radius:12px;display:block;margin:auto;margin-bottom:1rem;" />`).join('')
      : `<div class="empty-message">No saved dog images.</div>`;
    showSavedContainer(
      html,
      'Saved Dogs',
      () => {
        localStorage.removeItem('savedDogs');
        showSavedContainer(`<div class="empty-message">No saved dog images.</div>`, 'Saved Dogs');
      }
    );
  });

  // 🐱 Cat API
  async function loadCatBreeds() {
    const select = document.getElementById('cat-breed-select');
    const res = await fetch('https://api.thecatapi.com/v1/breeds');
    const data = await res.json();
    data.forEach(breed => {
      const option = document.createElement('option');
      option.value = breed.id;
      option.textContent = breed.name;
      select.appendChild(option);
    });
  }

  async function getCatImage() {
    const breedId = document.getElementById('cat-breed-select').value;
    const output = document.getElementById('cat-output');
    output.innerHTML = 'Loading...';
    let url = 'https://api.thecatapi.com/v1/images/search';
    if (breedId) {
      url += `?breed_ids=${breedId}`;
    }
    const res = await fetch(url);
    const data = await res.json();
    output.innerHTML = `<img src="${data[0].url}" alt="Cat" />`;
  }

  // Save Cat (store array)
  document.getElementById('save-cat').addEventListener('click', () => {
    const img = document.querySelector('#cat-output img');
    if (img) {
      let savedCats = JSON.parse(localStorage.getItem('savedCats') || '[]');
      savedCats.push(img.src);
      localStorage.setItem('savedCats', JSON.stringify(savedCats));
    }
  });

  // Show Saved Cat (list + reset)
  document.getElementById('show-saved-cat').addEventListener('click', () => {
    let savedCats = JSON.parse(localStorage.getItem('savedCats') || '[]');
    const html = savedCats.length
      ? savedCats.map(src => `<img src="${src}" alt="Saved Cat" style="width:100%;max-width:250px;border-radius:12px;display:block;margin:auto;margin-bottom:1rem;" />`).join('')
      : `<div class="empty-message">No saved cat images.</div>`;
    showSavedContainer(
      html,
      'Saved Cats',
      () => {
        localStorage.removeItem('savedCats');
        showSavedContainer(`<div class="empty-message">No saved cat images.</div>`, 'Saved Cats');
      }
    );
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

  // 🎬 Movies API with Pagination
  let moviePage = 1;
  async function getMovies(page = 1) {
    const output = document.getElementById('movies-output');
    output.innerHTML = 'Loading...';
    const res = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=598792b69853292f72d8abc968c55698&language=en-US&page=${page}`);
    const data = await res.json();
    const top = data.results.slice(0, 3);
    output.innerHTML = top.map(m => `
      <div>
        <img src="https://image.tmdb.org/t/p/w200${m.poster_path}" alt="${m.title}" />
        <strong>${m.title}</strong>
      </div>
    `).join('');
  }

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

  // Save Joke
  document.getElementById('save-joke').addEventListener('click', () => {
    const joke = document.getElementById('joke-output').innerText;
    if (joke) {
      let savedJokes = JSON.parse(localStorage.getItem('savedJokes') || '[]');
      savedJokes.push(joke);
      localStorage.setItem('savedJokes', JSON.stringify(savedJokes));
    }
  });

  // Show Saved Jokes (list + reset)
  document.getElementById('show-saved-joke').addEventListener('click', () => {
    let savedJokes = JSON.parse(localStorage.getItem('savedJokes') || '[]');
    const html = savedJokes.length
      ? savedJokes.map(j => `<div style="margin-bottom:1rem;">${j}</div>`).join('')
      : `<div class="empty-message">No saved jokes.</div>`;
    showSavedContainer(
      html,
      'Saved Jokes',
      () => {
        localStorage.removeItem('savedJokes');
        showSavedContainer(`<div class="empty-message">No saved jokes.</div>`, 'Saved Jokes');
      }
    );
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

  function showSavedContainer(contentHtml, title = 'Saved', onReset) {
    const old = document.getElementById('saved-modal');
    if (old) old.remove();

    const container = document.createElement('div');
    container.id = 'saved-modal';
    // Remove vertical centering, use top center
    container.style.position = 'fixed';
    container.style.top = '40px';
    container.style.left = '50%';
    container.style.transform = 'translateX(-50%)';
    container.style.background = 'var(--card)';
    container.style.color = 'var(--text)';
    container.style.boxShadow = '0 4px 24px rgba(0,0,0,0.2)';
    container.style.borderRadius = '12px';
    container.style.padding = '2rem 1.5rem 1.5rem 1.5rem';
    container.style.zIndex = '9999';
    container.style.minWidth = '340px';
    container.style.maxWidth = '600px';
    container.style.width = '90vw';
    container.style.maxHeight = '80vh';
    container.style.overflowY = 'auto';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;width:100%;margin-bottom:1rem;">
        <strong style="font-size:1.2rem;">${title}</strong>
        <div>
          ${onReset ? `<button id="reset-saved-modal" style="background:#e74c3c;color:white;border:none;border-radius:4px;padding:0.3rem 0.8rem;cursor:pointer;margin-right:0.5rem;">Reset</button>` : ''}
          <button id="close-saved-modal" style="background:var(--accent);color:white;border:none;border-radius:4px;padding:0.3rem 0.8rem;cursor:pointer;">Close</button>
        </div>
      </div>
      <div style="width:100%;display:flex;flex-direction:column;align-items:center;margin-top:0.5rem;">
        ${contentHtml}
      </div>
    `;
    document.body.appendChild(container);
    document.getElementById('close-saved-modal').onclick = () => container.remove();
    if (onReset) document.getElementById('reset-saved-modal').onclick = onReset;
  }

  // On page load, populate breed dropdowns
  loadDogBreeds();
  loadCatBreeds();
});
