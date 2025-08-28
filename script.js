document.addEventListener('DOMContentLoaded', () => {
  // ========================================
  // 🌗 Theme Toggle
  // ========================================
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

  // ========================================
  // 🧩 Drag-and-Drop Grid
  // ========================================
  const dashboard = document.getElementById('dashboard');
  let draggedItem = null;

  dashboard.addEventListener('dragstart', e => {
    const item = e.target.closest('.grid-item');
    if (!item) return;
    draggedItem = item;
    item.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });

  dashboard.addEventListener('dragend', e => {
    const item = e.target.closest('.grid-item');
    if (!item) return;
    item.classList.remove('dragging');
    Array.from(dashboard.querySelectorAll('.grid-item')).forEach(item => item.style.borderTop = '');
    draggedItem = null;
  });

  dashboard.addEventListener('dragover', e => {
    e.preventDefault();
    const target = e.target.closest('.grid-item');
    if (target && target !== draggedItem) {
      target.style.borderTop = '2px solid #0078d7';
    }
  });

  dashboard.addEventListener('dragleave', e => {
    const target = e.target.closest('.grid-item');
    if (target) target.style.borderTop = '';
  });

  dashboard.addEventListener('drop', e => {
    e.preventDefault();
    const target = e.target.closest('.grid-item');
    if (draggedItem && target && target !== draggedItem) {
      target.style.borderTop = '';
      dashboard.insertBefore(draggedItem, target);
      localStorage.setItem('dashboardOrder', JSON.stringify(getGridOrder()));
    }
    draggedItem = null;
  });

  function getGridOrder() {
    return Array.from(dashboard.children)
      .filter(el => el.classList.contains('grid-item'))
      .map(el => el.getAttribute('data-id'));
  }

  function restoreGridOrder(order) {
    order.forEach(id => {
      const item = dashboard.querySelector(`.grid-item[data-id="${id}"]`);
      if (item) dashboard.appendChild(item);
    });
  }

  const savedOrder = localStorage.getItem('dashboardOrder');
  if (savedOrder) {
    try {
      restoreGridOrder(JSON.parse(savedOrder));
    } catch (e) {}
  }

  // ========================================
  // 🎤 Voice Input
  // ========================================
  function voiceInput(inputId) {
    const input = document.getElementById(inputId);
    let SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Try Chrome or Edge on desktop.');
      return;
    }
    const oldPlaceholder = input.placeholder;
    input.placeholder = 'Listening...';
    input.disabled = true;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = event => {
      input.value = event.results[0][0].transcript;
      input.placeholder = oldPlaceholder;
      input.disabled = false;
    };
    recognition.onerror = event => {
      alert('Speech recognition error: ' + event.error);
      input.placeholder = oldPlaceholder;
      input.disabled = false;
    };
    recognition.onend = () => {
      input.placeholder = oldPlaceholder;
      input.disabled = false;
    };
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => recognition.start())
        .catch(() => {
          alert('Microphone access denied.');
          input.placeholder = oldPlaceholder;
          input.disabled = false;
        });
    } else {
      recognition.start();
    }
  }

  // ========================================
  // 🐶 Dog API
  // ========================================
  document.getElementById('get-dog').addEventListener('click', getDogImage);

  async function loadDogBreeds() {
    const select = document.getElementById('dog-breed-select');
    try {
      const res = await fetch('https://dog.ceo/api/breeds/list/all');
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      Object.keys(data.message).forEach(breed => {
        const option = document.createElement('option');
        option.value = breed;
        option.textContent = breed.charAt(0).toUpperCase() + breed.slice(1);
        select.appendChild(option);
      });
    } catch {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'Failed to load breeds';
      select.appendChild(option);
    }
  }

  async function getDogImage() {
    const breed = document.getElementById('dog-breed-select').value;
    const output = document.getElementById('dog-output');
    output.innerHTML = 'Loading...';
    const url = breed ? `https://dog.ceo/api/breed/${breed}/images/random` : 'https://dog.ceo/api/breeds/image/random';
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      output.innerHTML = `<img src="${data.message}" alt="Dog" />`;
    } catch {
      output.textContent = 'Error fetching dog image.';
    }
  }

  document.getElementById('save-dog').addEventListener('click', () => {
    const img = document.querySelector('#dog-output img');
    if (img) {
      let savedDogs = JSON.parse(localStorage.getItem('savedDogs') || '[]');
      savedDogs.push(img.src);
      localStorage.setItem('savedDogs', JSON.stringify(savedDogs));
    }
  });

  document.getElementById('show-saved-dog').addEventListener('click', () => {
    let savedDogs = JSON.parse(localStorage.getItem('savedDogs') || '[]');
    const html = savedDogs.length
      ? savedDogs.map(src => `<img src="${src}" alt="Saved Dog" style="width:100%;max-width:250px;border-radius:12px;display:block;margin:auto;margin-bottom:1rem;" />`).join('')
      : `<div class="empty-message">No saved dog images.</div>`;
    showSavedContainer(html, 'Saved Dogs', 'savedDogs');
  });

  // ========================================
  // 🐱 Cat API
  // ========================================
  document.getElementById('get-cat').addEventListener('click', getCatImage);

  async function loadCatBreeds() {
    const select = document.getElementById('cat-breed-select');
    try {
      const res = await fetch('https://api.thecatapi.com/v1/breeds');
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      data.forEach(breed => {
        const option = document.createElement('option');
        option.value = breed.id;
        option.textContent = breed.name;
        select.appendChild(option);
      });
    } catch {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'Failed to load breeds';
      select.appendChild(option);
    }
  }

  async function getCatImage() {
    const breedId = document.getElementById('cat-breed-select').value;
    const output = document.getElementById('cat-output');
    output.innerHTML = 'Loading...';
    let url = 'https://api.thecatapi.com/v1/images/search';
    if (breedId) url += `?breed_ids=${breedId}`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      output.innerHTML = `<img src="${data[0].url}" alt="Cat" />`;
    } catch {
      output.textContent = 'Error fetching cat image.';
    }
  }

  document.getElementById('save-cat').addEventListener('click', () => {
    const img = document.querySelector('#cat-output img');
    if (img) {
      let savedCats = JSON.parse(localStorage.getItem('savedCats') || '[]');
      savedCats.push(img.src);
      localStorage.setItem('savedCats', JSON.stringify(savedCats));
    }
  });

  document.getElementById('show-saved-cat').addEventListener('click', () => {
    let savedCats = JSON.parse(localStorage.getItem('savedCats') || '[]');
    const html = savedCats.length
      ? savedCats.map(src => `<img src="${src}" alt="Saved Cat" style="width:100%;max-width:250px;border-radius:12px;display:block;margin:auto;margin-bottom:1rem;" />`).join('')
      : `<div class="empty-message">No saved cat images.</div>`;
    showSavedContainer(html, 'Saved Cats', 'savedCats');
  });

  // ========================================
  // 🧑 Dad Joke
  // ========================================
  document.getElementById('get-dad-joke').addEventListener('click', getDadJoke);

  async function getDadJoke() {
    const output = document.getElementById('dad-joke-output');
    output.innerHTML = 'Loading...';
    try {
      const res = await fetch('https://icanhazdadjoke.com/', {
        headers: {
          'Accept': 'application/json'
        }
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      output.innerHTML = `<strong>${data.joke}</strong>`;
    } catch {
      output.textContent = 'Error fetching dad joke.';
    }
  }

  // ========================================
  // ☀️ Weather API
  // ========================================
  document.getElementById('weather-voice').addEventListener('click', () => voiceInput('weather-city-input'));
  document.getElementById('get-weather').addEventListener('click', getWeather);

  async function getWeather() {
    const rawCity = document.getElementById('weather-city-input').value.trim();
    const city = rawCity.replace(/[.,!?;:]+$/, '');
    const output = document.getElementById('weather-output');
    if (!city) {
      output.textContent = 'Please enter a city name.';
      return;
    }
    output.innerHTML = 'Loading...';
    try {
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}`);
      if (!geoRes.ok) throw new Error('Geocoding API error');
      const geoData = await geoRes.json();
      if (!geoData.results || geoData.results.length === 0) {
        output.textContent = `Hmm... I couldn't find "${city}". Try a nearby major city or check spelling.`;
        return;
      }
      const { latitude, longitude, name, country } = geoData.results[0];
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=fahrenheit&windspeed_unit=mph`
      );
      if (!weatherRes.ok) throw new Error('Weather API error');
      const weatherData = await weatherRes.json();
      const w = weatherData.current_weather;
      output.innerHTML = `<strong>${name}, ${country}</strong><br>Temp: ${w.temperature}°F<br>Wind: ${w.windspeed} mph`;
    } catch {
      output.textContent = 'Error fetching weather data.';
    }
  }

  // ========================================
  // 💱 Currency API
  // ========================================
  document.getElementById('convert-currency').addEventListener('click', getExchangeRates);

  async function getExchangeRates() {
    const amount = parseFloat(document.getElementById('amount').value);
    const target = document.getElementById('currency-select').value;
    const output = document.getElementById('currency-output');
    if (isNaN(amount)) {
      output.textContent = 'Enter a valid amount.';
      return;
    }
    output.innerHTML = 'Loading...';
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      const rate = data.rates[target];
      output.innerHTML = `${amount} USD = ${(amount * rate).toFixed(2)} ${target}`;
    } catch {
      output.textContent = 'Error fetching exchange rates.';
    }
  }

  // ========================================
  // 🪙 Cryptocurrency Prices (CoinGecko)
  // ========================================
  document.getElementById('get-crypto').addEventListener('click', getCryptoPrice);

  async function getCryptoPrice() {
    const coin = document.getElementById('crypto-select').value;
    const output = document.getElementById('crypto-output');
    output.innerHTML = 'Loading...';
    try {
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd`);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      const price = data[coin]?.usd;
      if (price !== undefined) {
        output.innerHTML = `<strong>${coin.charAt(0).toUpperCase() + coin.slice(1)}</strong><br>USD Price: $${price}`;
      } else {
        output.textContent = 'Price not available.';
      }
    } catch {
      output.textContent = 'Error fetching crypto price.';
    }
  }

  // ========================================
  // 🎞️ Giphy GIFs
  // ========================================
  // Replace with your own Giphy API key
  const GIPHY_API_KEY = 'rsDIb0Bf7arjRY0AXDwypNkjM8t1deOP'; // <-- Your key

  document.getElementById('get-giphy-trending').addEventListener('click', getGiphyTrending);
  document.getElementById('get-giphy-search').addEventListener('click', getGiphySearch);

  async function getGiphyTrending() {
    const output = document.getElementById('giphy-output');
    if (!output) return;
    output.innerHTML = 'Loading...';
    try {
      const res = await fetch(`https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=5&rating=pg`);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      if (!data.data || data.data.length === 0) {
        output.textContent = 'No trending GIFs found.';
        return;
      }
      output.innerHTML = data.data.map(gif =>
        `<img src="${gif.images.fixed_height.url}" alt="${gif.title || 'GIF'}" style="max-width:200px;border-radius:8px;margin:0.5rem;" />`
      ).join('');
    } catch (err) {
      output.textContent = 'Error fetching trending GIFs.';
    }
  }

  async function getGiphySearch() {
    const searchInput = document.getElementById('giphy-search-input');
    const output = document.getElementById('giphy-output');
    if (!searchInput || !output) return;
    const query = searchInput.value.trim();
    output.innerHTML = 'Loading...';
    if (!query) {
      output.textContent = 'Please enter a search term for GIFs.';
      return;
    }
    try {
      const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=5&rating=pg`);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      if (!data.data || data.data.length === 0) {
        output.textContent = `No GIFs found for "${query}".`;
        return;
      }
      output.innerHTML = data.data.map(gif =>
        `<img src="${gif.images.fixed_height.url}" alt="${gif.title || 'GIF'}" style="max-width:200px;border-radius:8px;margin:0.5rem;" />`
      ).join('');
    } catch (error) {
      output.textContent = `Failed to fetch GIFs: ${error.message}`;
    }
  }

  // ========================================
  // 🎬 Movies API
  // ========================================
  let moviePage = 1;
  document.getElementById('get-movies').addEventListener('click', () => getMovies(moviePage));
  document.getElementById('prev-movie').addEventListener('click', () => {
    if (moviePage > 1) {
      moviePage--;
      getMovies(moviePage);
    }
  });
  document.getElementById('next-movie').addEventListener('click', () => {
    moviePage++;
    getMovies(moviePage);
  });

  async function getMovies(page = 1) {
    const output = document.getElementById('movies-output');
    output.innerHTML = 'Loading...';
    try {
      const res = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=598792b69853292f72d8abc968c55698&language=en-US&page=${page}`);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      const top = data.results.slice(0, 3);
      output.innerHTML = top.map(m => `
        <div>
          <img src="https://image.tmdb.org/t/p/w200${m.poster_path}" alt="${m.title}" />
          <strong>${m.title}</strong>
        </div>
      `).join('');
    } catch {
      output.textContent = 'Error fetching movies.';
    }
  }

  // ========================================
  // 🧑‍💻 GitHub API
  // ========================================
  document.getElementById('github-voice').addEventListener('click', () => voiceInput('github-user-input'));
  document.getElementById('search-github').addEventListener('click', getGitHubUser);

  async function getGitHubUser() {
    const username = document.getElementById('github-user-input').value.trim();
    const output = document.getElementById('github-output');
    if (!username) {
      output.textContent = 'Enter a username.';
      return;
    }
    output.innerHTML = 'Loading...';
    try {
      const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`);
      if (!res.ok) throw new Error('User not found');
      const data = await res.json();
      output.innerHTML = `
        <img src="${data.avatar_url}" alt="${username}" style="width:80px;border-radius:50%;" /><br>
        Name: ${data.name || 'N/A'}<br>
        Public Repos: ${data.public_repos}
      `;
    } catch {
      output.textContent = 'User not found.';
    }
  }

  // ========================================
  // 🤣 Joke API
  // ========================================
  document.getElementById('get-joke').addEventListener('click', getJoke);
  document.getElementById('save-joke').addEventListener('click', () => {
    const joke = document.getElementById('joke-output').innerText;
    if (joke && joke !== 'Loading...') {
      let savedJokes = JSON.parse(localStorage.getItem('savedJokes') || '[]');
      savedJokes.push(joke);
      localStorage.setItem('savedJokes', JSON.stringify(savedJokes));
    }
  });
  document.getElementById('show-saved-joke').addEventListener('click', () => {
    let savedJokes = JSON.parse(localStorage.getItem('savedJokes') || '[]');
    const html = savedJokes.length
      ? savedJokes.map(j => `<div style="margin-bottom:1rem;">${j}</div>`).join('')
      : `<div class="empty-message">No saved jokes.</div>`;
    showSavedContainer(html, 'Saved Jokes', 'savedJokes');
  });

  async function getJoke() {
    const category = document.getElementById('joke-category-select').value;
    const output = document.getElementById('joke-output');
    output.innerHTML = 'Loading...';
    const url = category ? `https://v2.jokeapi.dev/joke/${category}?type=single` : 'https://v2.jokeapi.dev/joke/Any?type=single';
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      output.innerHTML = data.joke ? `<strong>${data.joke}</strong>` : `${data.setup}<br><strong>${data.delivery}</strong>`;
    } catch {
      output.textContent = 'Error fetching joke.';
    }
  }

  // ========================================
  // 📚 Public APIs
  // ========================================
  document.getElementById('show-public-api').addEventListener('click', getPublicApiInfo);

  async function getPublicApiInfo() {
    const output = document.getElementById('public-api-output');
    output.innerHTML = 'Loading...';
    try {
      // Using a simple list of public APIs since the original API has CORS issues
      const apis = [
        { API: 'JSONPlaceholder', Description: 'Fake REST API for testing', Link: 'https://jsonplaceholder.typicode.com' },
        { API: 'GitHub API', Description: 'REST API for GitHub', Link: 'https://api.github.com' },
        { API: 'OpenWeatherMap', Description: 'Weather API', Link: 'https://openweathermap.org/api' },
        { API: 'The Movie Database', Description: 'Movies and TV shows API', Link: 'https://www.themoviedb.org/documentation/api' },
        { API: 'PokéAPI', Description: 'Pokémon data API', Link: 'https://pokeapi.co' }
      ];
      const api = apis[Math.floor(Math.random() * apis.length)];
      output.innerHTML = `<strong>${api.API}</strong><br>${api.Description}<br><a href="${api.Link}" target="_blank">Visit</a>`;
    } catch {
      output.textContent = 'Error fetching public API.';
    }
  }

  // ========================================
  // 💡 Advice
  // ========================================
  document.getElementById('get-advice').addEventListener('click', getAdvice);

  async function getAdvice() {
    const output = document.getElementById('advice-output');
    output.innerHTML = 'Loading...';
    try {
      const res = await fetch('https://api.adviceslip.com/advice');
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      output.innerHTML = `<strong>${data.slip.advice}</strong>`;
    } catch {
      output.textContent = 'Error fetching advice.';
    }
  }

  // ========================================
  // 🚀 NASA APOD
  // ========================================
  document.getElementById('get-nasa').addEventListener('click', getNasaApod);

  async function getNasaApod() {
    const output = document.getElementById('nasa-output');
    output.innerHTML = 'Loading...';
    try {
      const res = await fetch('https://api.nasa.gov/planetary/apod?api_key=FrUiRHQ1NxpoweJFpWlZc1bp6zNtos59AlV30wYL');
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      output.innerHTML = `<strong>${data.title}</strong><br><img src="${data.url}" alt="NASA APOD" /><br>${data.explanation.slice(0, 100)}...`;
    } catch {
      output.textContent = 'Error fetching NASA APOD.';
    }
  }

  // ========================================
  // ❓ Trivia
  // ========================================
  document.getElementById('get-trivia').addEventListener('click', () => getTrivia('trivia-output'));

  async function getTrivia(outputId) {
    const output = document.getElementById(outputId);
    output.innerHTML = 'Loading...';
    while (true) {
      try {
        const res = await fetch('https://opentdb.com/api.php?amount=1');
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const q = data.results[0];
          let question = q.question;
          let answer = q.correct_answer;
          // Try to decode if encoded
          try {
            question = decodeURIComponent(question);
            answer = decodeURIComponent(answer);
          } catch {
            // If decoding fails, use original
          }
          output.innerHTML = `<strong>${question}</strong><br>Answer: <span style="color:var(--accent)">${answer}</span>`;
          return; // Success, exit the function
        } else {
          // No results, try again immediately
        }
      } catch (err) {
        // Error occurred, try again immediately
      }
    }
  }

  // ========================================
  // ❓ Custom Trivia
  // ========================================
  document.getElementById('get-custom-trivia').addEventListener('click', getCustomTrivia);

  async function getCustomTrivia() {
    const category = document.getElementById('trivia-category-select').value;
    const difficulty = document.getElementById('trivia-difficulty-select').value;
    const output = document.getElementById('custom-trivia-output');
    output.innerHTML = 'Loading...';
    let url = 'https://opentdb.com/api.php?amount=1&type=multiple';
    if (category) url += `&category=${category}`;
    if (difficulty) url += `&difficulty=${difficulty}`;
    while (true) {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const q = data.results[0];
          let question = q.question;
          let answer = q.correct_answer;
          // Try to decode if encoded
          try {
            question = decodeURIComponent(question);
            answer = decodeURIComponent(answer);
          } catch {
            // If decoding fails, use original
          }
          output.innerHTML = `<strong>${question}</strong><br>Answer: <span style="color:var(--accent)">${answer}</span>`;
          return; // Success, exit the function
        } else {
          // No results, try again immediately
        }
      } catch (err) {
        // Error occurred, try again immediately
      }
    }
  }

  // ========================================
  // 🔢 Number Fact
  // ========================================
  document.getElementById('get-number').addEventListener('click', getNumberFact);

  async function getNumberFact() {
    const number = document.getElementById('number-input').value.trim();
    const output = document.getElementById('number-output');
    output.innerHTML = 'Loading...';
    const url = number ? `http://numbersapi.com/${number}` : 'http://numbersapi.com/random/trivia';
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('API error');
      const text = await res.text();
      output.innerHTML = `<strong>${text}</strong>`;
    } catch {
      output.textContent = 'Error fetching number fact.';
    }
  }

  // ========================================
  // 🕹️ Pokémon
  // ========================================
  document.getElementById('get-pokemon').addEventListener('click', getPokemon);

  async function getPokemon() {
    const output = document.getElementById('pokemon-output');
    if (!output) return; // Ensure output element exists
    output.innerHTML = 'Loading...';
    while (true) {
      try {
        const id = Math.floor(Math.random() * 1010) + 1; // Updated range to current max
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        const name = data.name ? data.name : 'Unknown';
        const imgSrc = data.sprites && data.sprites.front_default ? data.sprites.front_default : '';
        output.innerHTML = `<strong>${name}</strong><br>${imgSrc ? `<img src="${imgSrc}" alt="${name}" />` : '<span>No image available.</span>'}`;
        return; // Success, exit the function
      } catch (err) {
        // Error occurred, try again immediately
      }
    }
  }

  // ========================================
  // 🛸 Star Wars Character
  // ========================================
  document.getElementById('get-star-wars').addEventListener('click', getStarWarsCharacter);

  async function getStarWarsCharacter() {
  const output = document.getElementById('star-wars-output');
  if (!output) {
    console.error('Output element with ID "star-wars-output" not found.');
    return;
  }
  output.innerHTML = 'Loading...';

  const maxRetries = 5;
  let attempts = 0;

  while (attempts < maxRetries) {
    try {
      const id = Math.floor(Math.random() * 83) + 1; // SWAPI has characters 1-83
      const res = await fetch(`https://swapi.py4e.com/api/people/${id}/`);
      if (!res.ok) {
        attempts++;
        continue; // Try another ID if not found
      }
      const data = await res.json();
      const name = data.name || 'Unknown';
      const height = data.height || 'Unknown';
      const mass = data.mass || 'Unknown';
      let speciesName = 'Unknown';

      if (data.species && data.species.length > 0) {
        try {
          const speciesRes = await fetch(data.species[0].replace('http://', 'https://')); // Ensure HTTPS
          if (speciesRes.ok) {
            const speciesData = await speciesRes.json();
            speciesName = speciesData.name || 'Unknown';
          }
        } catch (speciesError) {
          console.warn(`Failed to fetch species data: ${speciesError.message}`);
        }
      }

      output.innerHTML = `<strong>${name}</strong><br>Height: ${height} cm<br>Mass: ${mass} kg<br>Species: ${speciesName}`;
      return; // Success, exit function
    } catch (error) {
      console.warn(`Attempt ${attempts + 1} failed: ${error.message}`);
      attempts++;
    }
  }

  output.innerHTML = 'Error: Could not fetch character data after multiple attempts. Please try again later.';
}

  // ========================================
  // 🤠 Chuck Norris Joke
  // ========================================
  document.getElementById('get-chuck').addEventListener('click', getChuckNorrisJoke);

  async function getChuckNorrisJoke() {
    const output = document.getElementById('chuck-output');
    output.innerHTML = 'Loading...';
    try {
      const res = await fetch('https://api.chucknorris.io/jokes/random');
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      output.innerHTML = `<strong>${data.value}</strong>`;
    } catch {
      output.textContent = 'Error fetching Chuck Norris joke.';
    }
  }

  // ========================================
  // 👤 Random User
  // ========================================
  document.getElementById('get-user').addEventListener('click', getRandomUser);

  async function getRandomUser() {
    const output = document.getElementById('user-output');
    output.innerHTML = 'Loading...';
    try {
      const res = await fetch('https://randomuser.me/api/');
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      const u = data.results[0];
      output.innerHTML = `
        <img src="${u.picture.large}" alt="User" style="width:80px;border-radius:50%;" /><br>
        <strong>${u.name.first} ${u.name.last}</strong><br>${u.email}<br>${u.location.city}, ${u.location.country}
      `;
    } catch {
      output.textContent = 'Error fetching user.';
    }
  }

  // ========================================
  // 🌍 IP Geolocation
  // ========================================
  document.getElementById('get-ip').addEventListener('click', getIpGeo);

  async function getIpGeo() {
    const output = document.getElementById('ip-output');
    output.innerHTML = 'Loading...';
    try {
      const res = await fetch('https://ipapi.co/json/');
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      output.innerHTML = `<strong>IP:</strong> ${data.ip}<br><strong>City:</strong> ${data.city}<br><strong>Country:</strong> ${data.country_name}`;
    } catch {
      output.textContent = 'Error fetching IP info.';
    }
  }

  // ========================================
  // 🦊 Random Fox
  // ========================================
  document.getElementById('get-fox').addEventListener('click', getFox);

  async function getFox() {
    const output = document.getElementById('fox-output');
    output.innerHTML = 'Loading...';
    try {
      const res = await fetch('https://randomfox.ca/floof/');
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      output.innerHTML = `<img src="${data.image}" alt="Fox" />`;
    } catch {
      output.textContent = 'Error fetching fox image.';
    }
  }

  // ========================================
  // 🦆 Random Duck
  // ========================================
  document.getElementById('get-duck').addEventListener('click', getDuckImage);

  async function getDuckImage() {
    const output = document.getElementById('duck-output');
    output.innerHTML = 'Loading...';
    try {
      const res = await fetch('https://corsproxy.io/?https://random-d.uk/api/random');
      const data = await res.json();
      output.innerHTML = `<img src="${data.url}" alt="Duck" style="max-width:250px;border-radius:12px;" />`;
    } catch {
      output.textContent = 'Error fetching duck.';
    }
  }

  // ========================================
  // 🐱 Cat Fact
  // ========================================
  document.getElementById('get-cat-fact').addEventListener('click', getCatFact);

  async function getCatFact() {
    const output = document.getElementById('cat-fact-output');
    output.innerHTML = 'Loading...';
    try {
      const res = await fetch('https://catfact.ninja/fact');
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      output.innerHTML = `<strong>${data.fact}</strong>`;
    } catch {
      output.textContent = 'Error fetching cat fact.';
    }
  }

  // ========================================
  // 🐶 Dog Fact
  // ========================================
  document.getElementById('get-dog-fact').addEventListener('click', getDogFact);

  async function getDogFact() {
    const output = document.getElementById('dog-fact-output');
    output.innerHTML = 'Loading...';
    try {
      const res = await fetch('https://dogapi.dog/api/v2/facts');
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      output.innerHTML = `<strong>${data.data[0].attributes.body}</strong>`;
    } catch {
      output.textContent = 'Error fetching dog fact.';
    }
  }

  // ========================================
  // 🍔 Random Food
  // ========================================
  document.getElementById('get-food').addEventListener('click', getFood);

  async function getFood() {
    const output = document.getElementById('food-joke-output');
    output.innerHTML = 'Loading...';
    try {
      const res = await fetch('https://www.themealdb.com/api/json/v1/1/random.php');
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      const meal = data.meals[0];
      output.innerHTML = `<strong>${meal.strMeal}</strong><br><img src="${meal.strMealThumb}" alt="${meal.strMeal}" />`;
    } catch {
      output.textContent = 'Error fetching food.';
    }
  }

  // ========================================
  // � Science Trivia
  // ========================================
  document.getElementById('get-space-fact').addEventListener('click', getSpaceFact);

  async function getSpaceFact() {
    const output = document.getElementById('space-fact-output');
    output.innerHTML = 'Loading...';
    while (true) {
      try {
        const res = await fetch('https://opentdb.com/api.php?amount=1&category=17');
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const q = data.results[0];
          let question = q.question;
          let answer = q.correct_answer;
          // Try to decode if encoded
          try {
            question = decodeURIComponent(question);
            answer = decodeURIComponent(answer);
          } catch {
            // If decoding fails, use original
          }
          output.innerHTML = `<strong>${question}</strong><br>Answer: <span style="color:var(--accent)">${answer}</span>`;
          return; // Success, exit the function
        } else {
          // No results, try again immediately
        }
      } catch (err) {
        // Error occurred, try again immediately
      }
    }
  }

  // ========================================
  // 🍹 Random Cocktail
  // ========================================
  document.getElementById('get-cocktail').addEventListener('click', getCocktail);

  async function getCocktail() {
    const output = document.getElementById('cocktail-output');
    output.innerHTML = 'Loading...';
    try {
      const res = await fetch('https://www.thecocktaildb.com/api/json/v1/1/random.php');
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      const drink = data.drinks[0];
      output.innerHTML = `<strong>${drink.strDrink}</strong><br><img src="${drink.strDrinkThumb}" alt="${drink.strDrink}" />`;
    } catch {
      output.textContent = 'Error fetching cocktail.';
    }
  }

  // ========================================
  // 🎤 Kanye Quote
  // ========================================
  document.getElementById('get-kanye').addEventListener('click', getKanyeQuote);

  async function getKanyeQuote() {
    const output = document.getElementById('kanye-output');
    output.innerHTML = 'Loading...';
    try {
      const res = await fetch('https://api.kanye.rest/');
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      output.innerHTML = `<strong>"${data.quote}"</strong>`;
    } catch {
      output.textContent = 'Error fetching Kanye quote.';
    }
  }

  // ========================================
  // 👶 Age Prediction
  // ========================================
  document.getElementById('get-age').addEventListener('click', getAgePrediction);

  async function getAgePrediction() {
    const name = document.getElementById('age-name-input').value.trim();
    const output = document.getElementById('age-output');
    if (!name) {
      output.textContent = 'Enter a name.';
      return;
    }
    output.innerHTML = 'Loading...';
    try {
      const res = await fetch(`https://api.agify.io?name=${encodeURIComponent(name)}`);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      output.innerHTML = `<strong>${name}</strong><br>Predicted Age: ${data.age || 'Unknown'}`;
    } catch {
      output.textContent = 'Error fetching age prediction.';
    }
  }

  // ========================================
  // 🚻 Gender Prediction
  // ========================================
  document.getElementById('get-gender').addEventListener('click', getGenderPrediction);

  async function getGenderPrediction() {
    const name = document.getElementById('gender-name-input').value.trim();
    const output = document.getElementById('gender-output');
    if (!name) {
      output.textContent = 'Enter a name.';
      return;
    }
    output.innerHTML = 'Loading...';
    try {
      const res = await fetch(`https://api.genderize.io?name=${encodeURIComponent(name)}`);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      const probability = data.probability ? (data.probability * 100).toFixed(1) : 'N/A';
      output.innerHTML = `<strong>${name}</strong><br>Predicted Gender: ${data.gender || 'Unknown'} (${probability}%)`;
    } catch {
      output.textContent = 'Error fetching gender prediction.';
    }
  }

  // ========================================
  // 🌎 Nationalize Prediction
  // ========================================
  document.getElementById('get-nationalize').addEventListener('click', getNationalizePrediction);

  async function getNationalizePrediction() {
    const name = document.getElementById('nationalize-name-input').value.trim();
    const output = document.getElementById('nationalize-output');
    if (!name) {
      output.textContent = 'Enter a name.';
      return;
    }
    output.innerHTML = 'Loading...';
    try {
      const res = await fetch(`https://api.nationalize.io?name=${encodeURIComponent(name)}`);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      if (data.country && data.country.length > 0) {
        const topCountry = data.country[0];
        const countryCode = topCountry.country_id;
        const probability = (topCountry.probability * 100).toFixed(1);
        let countryName = countryCode;
        try {
          const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
          countryName = displayNames.of(countryCode) || countryCode;
        } catch {
          // Fallback to code if Intl not supported
        }
        output.innerHTML = `<strong>${name}</strong><br>Predicted Nationality: ${countryName} (${probability}%)`;
      } else {
        output.innerHTML = `<strong>${name}</strong><br>Predicted Nationality: Unknown`;
      }
    } catch {
      output.textContent = 'Error fetching nationality prediction.';
    }
  }

  // ========================================
  // 🦸 Superhero
  // ========================================
  document.getElementById('get-superhero').addEventListener('click', getSuperhero);

  async function getSuperhero() {
    const output = document.getElementById('superhero-output');
    output.innerHTML = 'Loading...';
    try {
      const res = await fetch('https://akabab.github.io/superhero-api/api/all.json');
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      const pick = data[Math.floor(Math.random() * data.length)];
      output.innerHTML = `<strong>${pick.name}</strong><br>Power: ${pick.powerstats.power}<br><img src="${pick.images.sm}" alt="Superhero" />`;
    } catch {
      output.textContent = 'Error fetching superhero.';
    }
  }

  // ========================================
  // 😂 Random Meme
  // ========================================
  document.getElementById('get-meme').addEventListener('click', getMeme);

  async function getMeme() {
    const output = document.getElementById('meme-output');
    output.innerHTML = 'Loading...';
    try {
      const res = await fetch('https://meme-api.com/gimme');
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      output.innerHTML = `<strong>${data.title}</strong><br><em>r/${data.subreddit}</em><br><img src="${data.url}" alt="Meme" class="meme-img" />`;
    } catch {
      output.textContent = 'Error fetching meme.';
    }
  }

  // ========================================
  // 🤯 Random Fact
  // ========================================
  document.getElementById('get-fact').addEventListener('click', getFact);

  async function getFact() {
    const output = document.getElementById('fact-output');
    output.innerHTML = 'Loading...';
    try {
      const res = await fetch('https://uselessfacts.jsph.pl/random.json?language=en');
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      output.innerHTML = `<strong>${data.text}</strong>`;
    } catch {
      output.textContent = 'Error fetching fact.';
    }
  }

  // ========================================
  // 🐾 Animal Fact
  // ========================================
  document.getElementById('get-animal-fact').addEventListener('click', getAnimalFact);

  async function getAnimalFact() {
    const output = document.getElementById('animal-fact-output');
    output.innerHTML = 'Loading...';
    try {
      const res = await fetch('https://catfact.ninja/fact');
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      output.innerHTML = `<strong>${data.fact}</strong>`;
    } catch {
      output.textContent = 'Error fetching animal fact.';
    }
  }

  // ========================================
  // 🌍 Random Country
  // ========================================
  document.getElementById('get-country').addEventListener('click', getCountry);

  async function getCountry() {
    const output = document.getElementById('country-output');
    output.innerHTML = 'Loading...';
    try {
      const res = await fetch('https://restcountries.com/v3.1/all?fields=name,capital,flags');
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      const country = data[Math.floor(Math.random() * data.length)];
      output.innerHTML = `<img src="${country.flags.png}" alt="Flag of ${country.name.common}" style="width:50px;height:auto;"><br><strong>${country.name.common}</strong><br>Capital: ${country.capital?.[0] || 'N/A'}`;
    } catch {
      output.textContent = 'Error fetching country.';
    }
  }

  // ========================================
  // 📜 Historical Event
  // ========================================
  document.getElementById('get-history').addEventListener('click', getHistory);

  async function getHistory() {
    const output = document.getElementById('history-output');
    output.innerHTML = 'Loading...';
    try {
      const res = await fetch('https://history.muffinlabs.com/date');
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      const event = data.data.Events[Math.floor(Math.random() * data.data.Events.length)];
      output.innerHTML = `<strong>${event.year}</strong><br>${event.text}`;
    } catch {
      output.textContent = 'Error fetching historical event.';
    }
  }

  // ========================================
  // 📚 Random Book
  // ========================================
  document.getElementById('get-book').addEventListener('click', getBook);

  async function getBook() {
    const output = document.getElementById('book-output');
    output.innerHTML = 'Loading...';
    try {
      const res = await fetch('https://openlibrary.org/search.json?q=subject:fiction&limit=10');
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      const book = data.docs[Math.floor(Math.random() * data.docs.length)];
      output.innerHTML = `<strong>${book.title}</strong><br>Author: ${book.author_name?.[0] || 'Unknown'}`;
    } catch {
      output.textContent = 'Error fetching book.';
    }
  }

  // ========================================
  // 🏀 Sports Trivia
  // ========================================
  document.getElementById('get-sports-trivia').addEventListener('click', getSportsTrivia);

  async function getSportsTrivia() {
    const button = document.getElementById('get-sports-trivia');
    const output = document.getElementById('sports-trivia-output');
    button.disabled = true;
    output.innerHTML = 'Loading...';
    while (true) {
      try {
        const res = await fetch('https://opentdb.com/api.php?amount=1&category=21&type=multiple');
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const q = data.results[0];
          let question = q.question;
          let answer = q.correct_answer;
          // Try to decode if encoded
          try {
            question = decodeURIComponent(question);
            answer = decodeURIComponent(answer);
          } catch {
            // If decoding fails, use original
          }
          output.innerHTML = `<strong>${question}</strong><br>Answer: <span style="color:var(--accent)">${answer}</span>`;
          button.disabled = false;
          return; // Success, exit the function
        } else {
          // No results, try again immediately
        }
      } catch (err) {
        // Error occurred, try again immediately
      }
    }
  }

  // ========================================
  // 🎥 Movie Trivia
  // ========================================
  document.getElementById('get-movie-trivia').addEventListener('click', getMovieTrivia);

  async function getMovieTrivia() {
    const button = document.getElementById('get-movie-trivia');
    const output = document.getElementById('movie-trivia-output');
    button.disabled = true;
    output.innerHTML = 'Loading...';
    while (true) {
      try {
        const res = await fetch('https://opentdb.com/api.php?amount=1&category=11&type=multiple');
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const q = data.results[0];
          let question = q.question;
          let answer = q.correct_answer;
          // Try to decode if encoded
          try {
            question = decodeURIComponent(question);
            answer = decodeURIComponent(answer);
          } catch {
            // If decoding fails, use original
          }
          output.innerHTML = `<strong>${question}</strong><br>Answer: <span style="color:var(--accent)">${answer}</span>`;
          button.disabled = false;
          return; // Success, exit the function
        } else {
          // No results, try again immediately
        }
      } catch (err) {
        // Error occurred, try again immediately
      }
    }
  }

  // ========================================
  // ➗ Math Fact
  // ========================================
  document.getElementById('get-math-fact').addEventListener('click', getMathFact);

  async function getMathFact() {
    const output = document.getElementById('math-fact-output');
    output.innerHTML = 'Loading...';
    try {
      const num = Math.floor(Math.random() * 100) + 1;
      const res = await fetch(`http://numbersapi.com/${num}/math`);
      if (!res.ok) throw new Error('API error');
      const text = await res.text();
      output.innerHTML = `<strong>${text}</strong>`;
    } catch {
      output.textContent = 'Error fetching math fact.';
    }
  }

  // ========================================
  // 🍸 Cocktail Ingredient
  // ========================================
  document.getElementById('get-cocktail-ingredient').addEventListener('click', getCocktailIngredient);

  async function getCocktailIngredient() {
    const output = document.getElementById('cocktail-ingredient-output');
    output.innerHTML = 'Loading...';
    try {
      const res = await fetch('https://www.thecocktaildb.com/api/json/v1/1/random.php');
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      const drink = data.drinks[0];
      const ingredients = [];
      for (let i = 1; i <= 15; i++) {
        const ing = drink[`strIngredient${i}`];
        if (ing && ing.trim()) ingredients.push(ing);
      }
      const pick = ingredients[Math.floor(Math.random() * ingredients.length)];
      output.innerHTML = `<strong>${pick}</strong>`;
    } catch {
      output.textContent = 'Error fetching cocktail ingredient.';
    }
  }

  // ========================================
  // 😀 Random Emoji
  // ========================================
  document.getElementById('get-emoji').addEventListener('click', getEmoji);

  async function getEmoji() {
    const output = document.getElementById('emoji-output');
    output.innerHTML = 'Loading...';
    try {
      const res = await fetch('https://api.github.com/emojis');
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      const keys = Object.keys(data);
      const pick = keys[Math.floor(Math.random() * keys.length)];
      output.innerHTML = `<strong>${pick}</strong><br><img src="${data[pick]}" alt="${pick}" style="max-width:50px;" />`;
    } catch {
      output.textContent = 'Error fetching emoji.';
    }
  }

  // ========================================
  // 🌠 Planet Fact
  // ========================================
  document.getElementById('get-planet-fact').addEventListener('click', getPlanetFact);

  async function getPlanetFact() {
    const output = document.getElementById('planet-fact-output');
    output.innerHTML = 'Loading...';
    try {
      const res = await fetch('https://api.le-systeme-solaire.net/rest/bodies/');
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      const bodies = data.bodies.filter(b => b.englishName);
      const pick = bodies[Math.floor(Math.random() * bodies.length)];
      output.innerHTML = `<strong>${pick.englishName}</strong><br>Type: ${pick.bodyType || 'Unknown'}<br>Gravity: ${pick.gravity ? pick.gravity.toFixed(2) : 'N/A'} m/s²<br>Discovered: ${pick.discoveryDate || 'N/A'}<br>Mass: ${pick.mass ? `${pick.mass.massValue.toFixed(2)} × 10^${pick.mass.massExponent} kg` : 'N/A'}`;
    } catch {
      output.textContent = 'Error fetching Planet fact.';
    }
  }


  // ========================================
  // 🖼️ Saved Modal
  // ========================================
  function showSavedContainer(html, title, type) {
    const modal = document.getElementById('saved-modal');
    modal.style.display = 'block';
    modal.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h2 style="margin: 0;">${title}</h2>
        <button style="color: red; background: none; border: 1px solid red; padding: 5px 10px; cursor: pointer;" onclick="window.resetSaved('${type}', '${title}')">Reset</button>
      </div>
      ${html}
      <button onclick="this.parentElement.style.display='none';">Close</button>
    `;
  }

  // Add this global function for resetting
  window.resetSaved = function(type, title) {
    localStorage.removeItem(type);
    showSavedContainer(`<div class="empty-message">No saved ${title.toLowerCase()}.</div>`, title, type);
  };

  // ========================================
  // Initialize
  // ========================================
  loadDogBreeds();
  loadCatBreeds();
});