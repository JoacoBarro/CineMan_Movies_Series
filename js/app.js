// API Key de TMDB (puedes obtener una gratuita en https://www.themoviedb.org/)
// Para obtener tu API key: https://www.themoviedb.org/settings/api
const API_KEY = '0f7e246b6ca1a95091588be0482572c6'; // Reemplaza con tu API key
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// Estado de la aplicación
let currentPage = 1;
let allMovies = [];
let displayedMovies = [];
let allSeries = []; // Series populares
let topRatedSeries = []; // Series mejor valoradas
let topRatedMovies = []; // Películas mejor valoradas
let genresList = []; // Lista de géneros desde la API
const MOVIES_PER_ROW = 5; // Número de películas/series a mostrar en una fila
const MAX_PAGES_TO_LOAD = 3; // Cargar hasta 3 páginas de contenido popular
let currentMovieIndex = 0; // Índice de la primera película visible
let currentSeriesIndex = 0; // Índice de la primera serie visible
let currentTopRatedSeriesIndex = 0; // Índice de la primera serie mejor valorada visible
let currentTopRatedMoviesIndex = 0; // Índice de la primera película mejor valorada visible
let nextMoviePage = MAX_PAGES_TO_LOAD + 1; // Página siguiente para cargar más películas
let nextSeriesPage = MAX_PAGES_TO_LOAD + 1; // Página siguiente para cargar más series

// Estado de filtros para "Ver Más"
let isFilteredMovies = false;
let isFilteredSeries = false;
let nextFilteredMoviePage = 2; // Página siguiente para películas filtradas
let nextFilteredSeriesPage = 2; // Página siguiente para series filtradas
let currentGenreFilter = '';
let currentYearFilter = '';

// Estado de autenticación
let isLoggedIn = false;
let currentUser = null;

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    // Verificar estado de autenticación
    checkAuthStatus();

    // Asegurar que el sidebar esté cerrado al inicio
    closeSidebar();

    // Cargar géneros primero si hay API key
    if (API_KEY !== 'tu_api_key_aqui' && API_KEY) {
        await loadGenres();
    }
    await loadPopularMovies();
    await loadPopularSeries();
    await loadTopRatedMovies();
    await loadTopRatedSeries();
    setupEventListeners();

    // Si estamos en la página de inicio, mostrar la página principal
    if (window.location.pathname.includes('inicio.html')) {
        switchPage('home');
    }
    // Si estamos en la página de películas, mostrar todas las películas
    if (window.location.pathname.includes('peliculas.html')) {
        switchPage('movies');
    }
    // Si estamos en la página de series, mostrar todas las series
    if (window.location.pathname.includes('series.html')) {
        switchPage('series');
    }
    // Si estamos en la página de favoritos, cargar favoritos
    if (window.location.pathname.includes('favoritos.html')) {
        loadFavorites();
    }
}

// Funciones de autenticación
function checkAuthStatus() {
    const user = localStorage.getItem('currentUser');
    if (user) {
        currentUser = JSON.parse(user);
        isLoggedIn = true;
        updateUIForLoggedInUser();
    } else {
        isLoggedIn = false;
        updateUIForLoggedOutUser();
    }
}

function updateUIForLoggedInUser() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const profileUsername = document.querySelector('.profile-username');
    const profileEmail = document.querySelector('.profile-email');

    if (loginBtn) loginBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'block';

    if (profileUsername && currentUser) {
        profileUsername.textContent = currentUser.username;
    }
    if (profileEmail && currentUser) {
        profileEmail.textContent = currentUser.email;
    }
}

function updateUIForLoggedOutUser() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const profileUsername = document.querySelector('.profile-username');
    const profileEmail = document.querySelector('.profile-email');

    if (loginBtn) loginBtn.style.display = 'block';
    if (logoutBtn) logoutBtn.style.display = 'none';

    if (profileUsername) {
        profileUsername.textContent = 'Joaquin Barro';
    }
    if (profileEmail) {
        profileEmail.textContent = 'IngJoaquinBarro@gmail.com';
    }
}

function showLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.add('show');
    }
}

function hideLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const loginMessage = document.getElementById('loginMessage');

    // Validación básica
    if (!username || !password) {
        showLoginMessage('Por favor, completa todos los campos.', 'error');
        return;
    }

    // Simulación de autenticación (en producción usarías una API real)
    if (username === 'admin' && password === '123456') {
        const user = {
            username: username,
            email: 'admin@cineman.com'
        };

        localStorage.setItem('currentUser', JSON.stringify(user));
        currentUser = user;
        isLoggedIn = true;

        updateUIForLoggedInUser();
        hideLoginModal();
        showLoginMessage('Inicio de sesión exitoso!', 'success');

        // Limpiar formulario
        document.getElementById('loginForm').reset();
    } else {
        showLoginMessage('Usuario o contraseña incorrectos.', 'error');
    }
}

function handleLogout() {
    localStorage.removeItem('currentUser');
    currentUser = null;
    isLoggedIn = false;
    updateUIForLoggedOutUser();
    showNotification('Sesión cerrada exitosamente.', 'info');
}

function showLoginMessage(message, type) {
    const loginMessage = document.getElementById('loginMessage');
    if (loginMessage) {
        loginMessage.textContent = message;
        loginMessage.className = type;
        loginMessage.style.display = 'block';

        // Ocultar mensaje después de 3 segundos
        setTimeout(() => {
            loginMessage.style.display = 'none';
        }, 3000);
    }
}

// Cargar géneros desde la API de TMDB
async function loadGenres() {
    try {
        const response = await fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=es-ES`);
        if (response.ok) {
            const data = await response.json();
            genresList = data.genres || [];
            populateGenreFilter();
        }
    } catch (error) {
        console.warn('Error al cargar géneros:', error);
    }
}

// Poblar el filtro de géneros con datos de la API
function populateGenreFilter() {
    const genreFilter = document.getElementById('genreFilter');
    if (!genreFilter || genresList.length === 0) return;

    // Limpiar opciones existentes excepto "Todos los géneros"
    genreFilter.innerHTML = '<option value="">Todos los géneros</option>';

    // Agregar géneros desde la API
    genresList.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre.id;
        option.textContent = genre.name;
        genreFilter.appendChild(option);
    });

    // Poblar el filtro de años
    populateYearFilter();
}

// Poblar el filtro de años con años disponibles
function populateYearFilter() {
    const yearFilter = document.getElementById('yearFilter');
    if (!yearFilter) return;

    // Limpiar opciones existentes excepto "Todos los años"
    yearFilter.innerHTML = '<option value="">Todos los años</option>';

    // Obtener el año actual
    const currentYear = new Date().getFullYear();
    const startYear = 1950; // Año de inicio para series

    // Agregar años desde el más reciente al más antiguo
    for (let year = currentYear; year >= startYear; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
    }
}

// Cargar películas populares desde la API de TMDB
async function loadPopularMovies() {
    // Verificar si hay API key configurada
    if (API_KEY === 'tu_api_key_aqui' || !API_KEY) {
        console.warn('⚠️ No se ha configurado una API key de TMDB. Usando datos de ejemplo.');
        console.info('💡 Para usar la API real, obtén una API key gratuita en: https://www.themoviedb.org/settings/api');
        loadExampleMovies();
        return;
    }

    try {
        // Mostrar estado de carga
        const moviesGrid = document.getElementById('moviesGrid');
        const allMoviesGrid = document.getElementById('allMoviesGrid');
        if (moviesGrid) {
            moviesGrid.innerHTML = '<div class="loading">Cargando...</div>';
        }
        if (allMoviesGrid) {
            allMoviesGrid.innerHTML = '<div class="loading">Cargando...</div>';
        }

        // Cargar múltiples páginas para tener más películas
        allMovies = [];
        nextMoviePage = MAX_PAGES_TO_LOAD + 1; // Resetear página siguiente

        for (let page = 1; page <= MAX_PAGES_TO_LOAD; page++) {
            try {
                const response = await fetch(
                    `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=es-ES&page=${page}&region=ES`
                );
                
                if (!response.ok) {
                    throw new Error(`Error HTTP: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (data.results && data.results.length > 0) {
                    // Filtrar solo películas con póster
                    const moviesWithPoster = data.results.filter(movie => movie.poster_path);
                    allMovies = allMovies.concat(moviesWithPoster);
                }
                
                // Pequeña pausa entre peticiones para no sobrecargar la API
                if (page < MAX_PAGES_TO_LOAD) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            } catch (pageError) {
                console.warn(`Error al cargar página ${page}:`, pageError);
                // Continuar con las siguientes páginas aunque una falle
            }
        }

        if (allMovies.length > 0) {
            console.log(`✅ Cargadas ${allMovies.length} películas desde la API de TMDB`);
            // Verificar que las películas tengan poster_path
            const moviesWithPoster = allMovies.filter(m => m.poster_path);
            console.log(`📸 Películas con póster: ${moviesWithPoster.length}`);
            if (moviesWithPoster.length > 0) {
                console.log(`🔗 Ejemplo de URL de póster: ${IMAGE_BASE_URL}${moviesWithPoster[0].poster_path}`);
            }
            currentMovieIndex = 0; // Resetear índice al cargar nuevas películas
            if (window.location.pathname.includes('peliculas.html')) {
                displayAllMovies();
            } else {
                displayMovies();
            }
        } else {
            throw new Error('No se pudieron cargar películas desde la API');
        }
    } catch (error) {
        console.error('❌ Error al cargar películas desde la API:', error);
        console.info('💡 Usando datos de ejemplo como respaldo...');
        loadExampleMovies();
    }
}

// Cargar películas de ejemplo (si no hay API key)
function loadExampleMovies() {
    // Crear función para generar placeholders SVG inline (siempre funcionan)
    const createPlaceholderSVG = (title) => {
        const text = (title || 'Sin título').substring(0, 20);
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="750" viewBox="0 0 500 750">
            <rect width="500" height="750" fill="#1a1a1a"/>
            <text x="250" y="350" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#e50914" text-anchor="middle" dominant-baseline="middle">${text}</text>
        </svg>`;
        return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
    };
    
    allMovies = [
        {
            id: 1,
            title: 'The Dark Knight',
            release_date: '2008-07-18',
            vote_average: 9.0,
            poster_path: createPlaceholderSVG('The Dark Knight'),
            overview: 'Batman debe aceptar uno de los mayores desafíos psicológicos y físicos de su capacidad para luchar contra la injusticia.'
        },
        {
            id: 2,
            title: 'Inception',
            release_date: '2010-07-16',
            vote_average: 8.8,
            poster_path: createPlaceholderSVG('Inception'),
            overview: 'Un ladrón que roba secretos a través de la tecnología de compartir sueños.'
        },
        {
            id: 3,
            title: 'Pulp Fiction',
            release_date: '1994-10-14',
            vote_average: 8.9,
            poster_path: createPlaceholderSVG('Pulp Fiction'),
            overview: 'Las vidas de dos asesinos a sueldo, un boxeador, un gángster y su esposa se entrelazan.'
        },
        {
            id: 4,
            title: 'The Matrix',
            release_date: '1999-03-31',
            vote_average: 8.7,
            poster_path: createPlaceholderSVG('The Matrix'),
            overview: 'Un hacker aprende sobre la verdadera naturaleza de su realidad.'
        },
        {
            id: 5,
            title: 'Interstellar',
            release_date: '2014-11-07',
            vote_average: 8.6,
            poster_path: createPlaceholderSVG('Interstellar'),
            overview: 'Un equipo de exploradores viaja a través de un agujero de gusano en el espacio.'
        },
        {
            id: 6,
            title: 'The Godfather',
            release_date: '1972-03-24',
            vote_average: 9.2,
            poster_path: createPlaceholderSVG('The Godfather'),
            overview: 'La historia épica de una familia de la mafia siciliana en Nueva York.'
        },
        {
            id: 7,
            title: 'Fight Club',
            release_date: '1999-10-15',
            vote_average: 8.8,
            poster_path: createPlaceholderSVG('Fight Club'),
            overview: 'Un oficinista insomne y un fabricante de jabón forman un club de lucha.'
        },
        {
            id: 8,
            title: 'Forrest Gump',
            release_date: '1994-07-06',
            vote_average: 8.8,
            poster_path: createPlaceholderSVG('Forrest Gump'),
            overview: 'La historia de un hombre con un coeficiente intelectual bajo.'
        },
        {
            id: 9,
            title: 'The Shawshank Redemption',
            release_date: '1994-09-23',
            vote_average: 9.3,
            poster_path: createPlaceholderSVG('Shawshank'),
            overview: 'Dos hombres encarcelados se unen durante varios años.'
        },
        {
            id: 10,
            title: 'Goodfellas',
            release_date: '1990-09-21',
            vote_average: 8.7,
            poster_path: createPlaceholderSVG('Goodfellas'),
            overview: 'La historia de Henry Hill y su vida en la mafia.'
        },
        {
            id: 11,
            title: 'The Lord of the Rings: The Return of the King',
            release_date: '2003-12-17',
            vote_average: 8.9,
            poster_path: createPlaceholderSVG('LOTR'),
            overview: 'La batalla final por la Tierra Media.'
        },
        {
            id: 12,
            title: 'The Avengers',
            release_date: '2012-05-04',
            vote_average: 8.0,
            poster_path: createPlaceholderSVG('Avengers'),
            overview: 'Los superhéroes más poderosos de la Tierra se unen.'
        },
        {
            id: 13,
            title: 'Titanic',
            release_date: '1997-12-19',
            vote_average: 7.9,
            poster_path: createPlaceholderSVG('Titanic'),
            overview: 'Una historia de amor a bordo del RMS Titanic.'
        },
        {
            id: 14,
            title: 'Avatar',
            release_date: '2009-12-18',
            vote_average: 7.6,
            poster_path: createPlaceholderSVG('Avatar'),
            overview: 'Un marine parapléjico es enviado a la luna Pandora.'
        },
        {
            id: 15,
            title: 'Gladiator',
            release_date: '2000-05-05',
            vote_average: 8.5,
            poster_path: createPlaceholderSVG('Gladiator'),
            overview: 'Un general romano busca venganza contra el emperador.'
        },
        {
            id: 16,
            title: 'The Lion King',
            release_date: '1994-06-24',
            vote_average: 8.5,
            poster_path: createPlaceholderSVG('Lion King'),
            overview: 'Un joven león debe reclamar su lugar como rey.'
        },
        {
            id: 17,
            title: 'Spirited Away',
            release_date: '2001-07-20',
            vote_average: 8.6,
            poster_path: createPlaceholderSVG('Spirited Away'),
            overview: 'Una niña debe trabajar en un mundo de espíritus para salvar a sus padres.'
        },
        {
            id: 18,
            title: 'Parasite',
            release_date: '2019-05-30',
            vote_average: 8.5,
            poster_path: createPlaceholderSVG('Parasite'),
            overview: 'Una familia pobre se infiltra en una familia rica.'
        },
        {
            id: 19,
            title: 'Joker',
            release_date: '2019-10-04',
            vote_average: 8.2,
            poster_path: createPlaceholderSVG('Joker'),
            overview: 'La historia del origen del icónico villano Joker.'
        },
        {
            id: 20,
            title: 'Dune',
            release_date: '2021-10-22',
            vote_average: 8.0,
            poster_path: createPlaceholderSVG('Dune'),
            overview: 'Un joven noble debe proteger el planeta desértico Arrakis.'
        }
    ];

    currentMovieIndex = 0; // Resetear índice al cargar películas de ejemplo
    if (window.location.pathname.includes('peliculas.html')) {
        displayAllMovies();
    } else {
        displayMovies();
    }
}

// Cargar más películas desde la API de TMDB
async function loadMoreMovies() {
    // Verificar si hay API key configurada
    if (API_KEY === 'tu_api_key_aqui' || !API_KEY) {
        console.warn('⚠️ No se ha configurado una API key de TMDB. No se pueden cargar más películas.');
        return;
    }

    try {
        // Mostrar estado de carga
        const loadMoreBtn = document.getElementById('loadMoreMoviesBtn');
        if (loadMoreBtn) {
            loadMoreBtn.textContent = 'Cargando...';
            loadMoreBtn.disabled = true;
        }

        // Determinar qué endpoint usar basado en si hay filtros aplicados
        let apiUrl;
        let pageToLoad;

        if (isFilteredMovies) {
            // Usar discover endpoint con filtros aplicados
            apiUrl = `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=es-ES&sort_by=popularity.desc`;
            if (currentGenreFilter) apiUrl += `&with_genres=${currentGenreFilter}`;
            if (currentYearFilter) apiUrl += `&primary_release_year=${currentYearFilter}`;
            pageToLoad = nextFilteredMoviePage;
        } else {
            // Usar endpoint popular normal
            apiUrl = `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=es-ES&page=${nextMoviePage}&region=ES`;
            pageToLoad = nextMoviePage;
        }

        const response = await fetch(`${apiUrl}&page=${pageToLoad}`);

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();

        if (data.results && data.results.length > 0) {
            // Filtrar solo películas con póster
            const newMovies = data.results.filter(movie => movie.poster_path);
            allMovies = allMovies.concat(newMovies);

            console.log(`✅ Cargadas ${newMovies.length} películas adicionales desde la página ${pageToLoad}`);

            // Actualizar la cuadrícula con las nuevas películas
            const allMoviesGrid = document.getElementById('allMoviesGrid');
            if (allMoviesGrid) {
                newMovies.forEach(movie => {
                    const movieCard = createMovieCard(movie);
                    allMoviesGrid.appendChild(movieCard);
                });
            }

            // Incrementar el contador de página correcto
            if (isFilteredMovies) {
                nextFilteredMoviePage++;
            } else {
                nextMoviePage++;
            }

            // Si se cargaron menos de 20 películas (página completa típica), probablemente no hay más
            if (newMovies.length < 20) {
                if (loadMoreBtn) {
                    loadMoreBtn.style.display = 'none';
                }
            }
        } else {
            // No hay más películas
            if (loadMoreBtn) {
                loadMoreBtn.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('❌ Error al cargar más películas:', error);
    } finally {
        // Restaurar el botón
        const loadMoreBtn = document.getElementById('loadMoreMoviesBtn');
        if (loadMoreBtn) {
            loadMoreBtn.textContent = 'Ver Más';
            loadMoreBtn.disabled = false;
        }
    }
}

// Cargar más series desde la API de TMDB
async function loadMoreSeries() {
    // Verificar si hay API key configurada
    if (API_KEY === 'tu_api_key_aqui' || !API_KEY) {
        console.warn('⚠️ No se ha configurado una API key de TMDB. No se pueden cargar más series.');
        return;
    }

    try {
        // Mostrar estado de carga
        const loadMoreBtn = document.getElementById('loadMoreSeriesBtn');
        if (loadMoreBtn) {
            loadMoreBtn.textContent = 'Cargando...';
            loadMoreBtn.disabled = true;
        }

        // Determinar qué endpoint usar basado en si hay filtros aplicados
        let apiUrl;
        let pageToLoad;

        if (isFilteredSeries) {
            // Usar discover endpoint con filtros aplicados
            apiUrl = `${BASE_URL}/discover/tv?api_key=${API_KEY}&language=es-ES&sort_by=popularity.desc`;
            if (currentGenreFilter) apiUrl += `&with_genres=${currentGenreFilter}`;
            if (currentYearFilter) apiUrl += `&first_air_date_year=${currentYearFilter}`;
            pageToLoad = nextFilteredSeriesPage;
        } else {
            // Usar endpoint popular normal
            apiUrl = `${BASE_URL}/tv/popular?api_key=${API_KEY}&language=es-ES&page=${nextSeriesPage}`;
            pageToLoad = nextSeriesPage;
        }

        const response = await fetch(`${apiUrl}&page=${pageToLoad}`);

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();

        if (data.results && data.results.length > 0) {
            // Filtrar solo series con póster
            const newSeries = data.results.filter(series => series.poster_path);
            allSeries = allSeries.concat(newSeries);

            console.log(`✅ Cargadas ${newSeries.length} series adicionales desde la página ${pageToLoad}`);

            // Actualizar la cuadrícula con las nuevas series
            const allSeriesGrid = document.getElementById('allSeriesGrid');
            if (allSeriesGrid) {
                newSeries.forEach(series => {
                    const seriesCard = createSeriesCard(series);
                    allSeriesGrid.appendChild(seriesCard);
                });
            }

            // Incrementar el contador de página correcto
            if (isFilteredSeries) {
                nextFilteredSeriesPage++;
            } else {
                nextSeriesPage++;
            }

            // Si se cargaron menos de 20 series (página completa típica), probablemente no hay más
            if (newSeries.length < 20) {
                if (loadMoreBtn) {
                    loadMoreBtn.style.display = 'none';
                }
            }
        } else {
            // No hay más series
            if (loadMoreBtn) {
                loadMoreBtn.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('❌ Error al cargar más series:', error);
    } finally {
        // Restaurar el botón
        const loadMoreBtn = document.getElementById('loadMoreSeriesBtn');
        if (loadMoreBtn) {
            loadMoreBtn.textContent = 'Ver Más';
            loadMoreBtn.disabled = false;
        }
    }
}

// Cargar series populares desde la API de TMDB
async function loadPopularSeries() {
    // Verificar si hay API key configurada
    if (API_KEY === 'tu_api_key_aqui' || !API_KEY) {
        console.warn('⚠️ No se ha configurado una API key de TMDB. Usando datos de ejemplo para series.');
        loadExampleSeries();
        return;
    }

    try {
        // Mostrar estado de carga
        const seriesGrid = document.getElementById('seriesGrid');
        const allSeriesGrid = document.getElementById('allSeriesGrid');
        if (seriesGrid) {
            seriesGrid.innerHTML = '<div class="loading">Cargando...</div>';
        }
        if (allSeriesGrid) {
            allSeriesGrid.innerHTML = '<div class="loading">Cargando...</div>';
        }

        // Cargar múltiples páginas para tener más series
        allSeries = [];
        nextSeriesPage = MAX_PAGES_TO_LOAD + 1; // Resetear página siguiente

        for (let page = 1; page <= MAX_PAGES_TO_LOAD; page++) {
            try {
                const response = await fetch(
                    `${BASE_URL}/tv/popular?api_key=${API_KEY}&language=es-ES&page=${page}`
                );
                
                if (!response.ok) {
                    throw new Error(`Error HTTP: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (data.results && data.results.length > 0) {
                    // Filtrar solo series con póster
                    const seriesWithPoster = data.results.filter(series => series.poster_path);
                    allSeries = allSeries.concat(seriesWithPoster);
                }
                
                // Pequeña pausa entre peticiones para no sobrecargar la API
                if (page < MAX_PAGES_TO_LOAD) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            } catch (pageError) {
                console.warn(`Error al cargar página ${page} de series:`, pageError);
                // Continuar con las siguientes páginas aunque una falle
            }
        }

        if (allSeries.length > 0) {
            console.log(`✅ Cargadas ${allSeries.length} series desde la API de TMDB`);
            // Verificar que las series tengan poster_path
            const seriesWithPoster = allSeries.filter(s => s.poster_path);
            console.log(`📸 Series con póster: ${seriesWithPoster.length} de ${allSeries.length}`);
            if (seriesWithPoster.length > 0) {
                const examplePoster = seriesWithPoster[0];
                const exampleUrl = `${IMAGE_BASE_URL}${examplePoster.poster_path}`;
                console.log(`🔗 Ejemplo de URL de póster: ${exampleUrl}`);
            }
            currentSeriesIndex = 0; // Resetear índice al cargar nuevas series
            if (window.location.pathname.includes('series.html')) {
                displayAllSeries();
            } else {
                displaySeries();
            }
        } else {
            throw new Error('No se pudieron cargar series desde la API');
        }
    } catch (error) {
        console.error('❌ Error al cargar series desde la API:', error);
        console.info('💡 Usando datos de ejemplo como respaldo...');
        loadExampleSeries();
    }
}

// Cargar series mejor valoradas desde la API de TMDB
async function loadTopRatedSeries() {
    // Verificar si hay API key configurada
    if (API_KEY === 'tu_api_key_aqui' || !API_KEY) {
        console.warn('⚠️ No se ha configurado una API key de TMDB. Usando datos de ejemplo para series mejor valoradas.');
        loadExampleTopRatedSeries();
        return;
    }

    try {
        // Mostrar estado de carga
        const topRatedSeriesGrid = document.getElementById('topRatedSeriesGrid');
        if (topRatedSeriesGrid) {
            topRatedSeriesGrid.innerHTML = '<div class="loading">Cargando...</div>';
        }

        // Cargar múltiples páginas para tener más series
        topRatedSeries = [];

        for (let page = 1; page <= MAX_PAGES_TO_LOAD; page++) {
            try {
                const response = await fetch(
                    `${BASE_URL}/tv/top_rated?api_key=${API_KEY}&language=es-ES&page=${page}`
                );

                if (!response.ok) {
                    throw new Error(`Error HTTP: ${response.status}`);
                }

                const data = await response.json();

                if (data.results && data.results.length > 0) {
                    // Filtrar solo series con póster
                    const seriesWithPoster = data.results.filter(series => series.poster_path);
                    topRatedSeries = topRatedSeries.concat(seriesWithPoster);
                }

                // Pequeña pausa entre peticiones para no sobrecargar la API
                if (page < MAX_PAGES_TO_LOAD) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            } catch (pageError) {
                console.warn(`Error al cargar página ${page} de series mejor valoradas:`, pageError);
                // Continuar con las siguientes páginas aunque una falle
            }
        }

        if (topRatedSeries.length > 0) {
            console.log(`✅ Cargadas ${topRatedSeries.length} series mejor valoradas desde la API de TMDB`);
            // Verificar que las series tengan poster_path
            const seriesWithPoster = topRatedSeries.filter(s => s.poster_path);
            console.log(`📸 Series mejor valoradas con póster: ${seriesWithPoster.length} de ${topRatedSeries.length}`);
            if (seriesWithPoster.length > 0) {
                const examplePoster = seriesWithPoster[0];
                const exampleUrl = `${IMAGE_BASE_URL}${examplePoster.poster_path}`;
                console.log(`🔗 Ejemplo de URL de póster: ${exampleUrl}`);
            }
            currentTopRatedSeriesIndex = 0; // Resetear índice al cargar nuevas series
            displayTopRatedSeries();
        } else {
            throw new Error('No se pudieron cargar series mejor valoradas desde la API');
        }
    } catch (error) {
        console.error('❌ Error al cargar series mejor valoradas desde la API:', error);
        console.info('💡 Usando datos de ejemplo como respaldo...');
        loadExampleTopRatedSeries();
    }
}

// Cargar películas mejor valoradas desde la API de TMDB
async function loadTopRatedMovies() {
    // Verificar si hay API key configurada
    if (API_KEY === 'tu_api_key_aqui' || !API_KEY) {
        console.warn('⚠️ No se ha configurado una API key de TMDB. Usando datos de ejemplo para películas mejor valoradas.');
        loadExampleTopRatedMovies();
        return;
    }

    try {
        // Mostrar estado de carga
        const topRatedMoviesGrid = document.getElementById('topRatedMoviesGrid');
        if (topRatedMoviesGrid) {
            topRatedMoviesGrid.innerHTML = '<div class="loading">Cargando...</div>';
        }

        // Cargar múltiples páginas para tener más películas
        topRatedMovies = [];

        for (let page = 1; page <= MAX_PAGES_TO_LOAD; page++) {
            try {
                const response = await fetch(
                    `${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=es-ES&page=${page}`
                );

                if (!response.ok) {
                    throw new Error(`Error HTTP: ${response.status}`);
                }

                const data = await response.json();

                if (data.results && data.results.length > 0) {
                    // Filtrar solo películas con póster
                    const moviesWithPoster = data.results.filter(movie => movie.poster_path);
                    topRatedMovies = topRatedMovies.concat(moviesWithPoster);
                }

                // Pequeña pausa entre peticiones para no sobrecargar la API
                if (page < MAX_PAGES_TO_LOAD) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            } catch (pageError) {
                console.warn(`Error al cargar página ${page} de películas mejor valoradas:`, pageError);
                // Continuar con las siguientes páginas aunque una falle
            }
        }

        if (topRatedMovies.length > 0) {
            console.log(`✅ Cargadas ${topRatedMovies.length} películas mejor valoradas desde la API de TMDB`);
            // Verificar que las películas tengan poster_path
            const moviesWithPoster = topRatedMovies.filter(m => m.poster_path);
            console.log(`📸 Películas mejor valoradas con póster: ${moviesWithPoster.length} de ${topRatedMovies.length}`);
            if (moviesWithPoster.length > 0) {
                const examplePoster = moviesWithPoster[0];
                const exampleUrl = `${IMAGE_BASE_URL}${examplePoster.poster_path}`;
                console.log(`🔗 Ejemplo de URL de póster: ${exampleUrl}`);
            }
            currentTopRatedMoviesIndex = 0; // Resetear índice al cargar nuevas películas
            displayTopRatedMovies();
        } else {
            throw new Error('No se pudieron cargar películas mejor valoradas desde la API');
        }
    } catch (error) {
        console.error('❌ Error al cargar películas mejor valoradas desde la API:', error);
        console.info('💡 Usando datos de ejemplo como respaldo...');
        loadExampleTopRatedMovies();
    }
}

// Cargar películas mejor valoradas de ejemplo (si no hay API key)
function loadExampleTopRatedMovies() {
    // Crear función para generar placeholders SVG inline (siempre funcionan)
    const createPlaceholderSVG = (title) => {
        const text = (title || 'Sin título').substring(0, 20);
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="750" viewBox="0 0 500 750">
            <rect width="500" height="750" fill="#1a1a1a"/>
            <text x="250" y="350" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#e50914" text-anchor="middle" dominant-baseline="middle">${text}</text>
        </svg>`;
        return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
    };

    topRatedMovies = [
        {
            id: 238,
            title: 'The Godfather',
            release_date: '1972-03-24',
            vote_average: 9.2,
            poster_path: createPlaceholderSVG('The Godfather'),
            overview: 'La historia épica de una familia de la mafia siciliana en Nueva York.'
        },
        {
            id: 278,
            title: 'The Shawshank Redemption',
            release_date: '1994-09-23',
            vote_average: 9.3,
            poster_path: createPlaceholderSVG('Shawshank'),
            overview: 'Dos hombres encarcelados se unen durante varios años.'
        },
        {
            id: 155,
            title: 'The Dark Knight',
            release_date: '2008-07-18',
            vote_average: 9.0,
            poster_path: createPlaceholderSVG('The Dark Knight'),
            overview: 'Batman debe aceptar uno de los mayores desafíos psicológicos y físicos.'
        },
        {
            id: 550,
            title: 'Fight Club',
            release_date: '1999-10-15',
            vote_average: 8.8,
            poster_path: createPlaceholderSVG('Fight Club'),
            overview: 'Un oficinista insomne y un fabricante de jabón forman un club de lucha.'
        },
        {
            id: 13,
            title: 'Forrest Gump',
            release_date: '1994-07-06',
            vote_average: 8.8,
            poster_path: createPlaceholderSVG('Forrest Gump'),
            overview: 'La historia de un hombre con un coeficiente intelectual bajo.'
        },
        {
            id: 680,
            title: 'Pulp Fiction',
            release_date: '1994-10-14',
            vote_average: 8.9,
            poster_path: createPlaceholderSVG('Pulp Fiction'),
            overview: 'Las vidas de dos asesinos a sueldo, un boxeador, un gángster y su esposa se entrelazan.'
        },
        {
            id: 122,
            title: 'The Lord of the Rings: The Return of the King',
            release_date: '2003-12-17',
            vote_average: 8.9,
            poster_path: createPlaceholderSVG('LOTR'),
            overview: 'La batalla final por la Tierra Media.'
        },
        {
            id: 129,
            title: 'Spirited Away',
            release_date: '2001-07-20',
            vote_average: 8.6,
            poster_path: createPlaceholderSVG('Spirited Away'),
            overview: 'Una niña debe trabajar en un mundo de espíritus para salvar a sus padres.'
        },
        {
            id: 389,
            title: '12 Angry Men',
            release_date: '1957-04-10',
            vote_average: 8.5,
            poster_path: createPlaceholderSVG('12 Angry Men'),
            overview: 'Un jurado debe decidir el veredicto de un juicio.'
        },
        {
            id: 769,
            title: 'Goodfellas',
            release_date: '1990-09-21',
            vote_average: 8.7,
            poster_path: createPlaceholderSVG('Goodfellas'),
            overview: 'La historia de Henry Hill y su vida en la mafia.'
        }
    ];

    currentTopRatedMoviesIndex = 0; // Resetear índice al cargar películas de ejemplo
    displayTopRatedMovies();
}

// Cargar series mejor valoradas de ejemplo (si no hay API key)
function loadExampleTopRatedSeries() {
    // Crear función para generar placeholders SVG inline (siempre funcionan)
    const createPlaceholderSVG = (title) => {
        const text = (title || 'Sin título').substring(0, 20);
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="750" viewBox="0 0 500 750">
            <rect width="500" height="750" fill="#1a1a1a"/>
            <text x="250" y="350" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#e50914" text-anchor="middle" dominant-baseline="middle">${text}</text>
        </svg>`;
        return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
    };

    topRatedSeries = [
        {
            id: 1,
            name: 'Breaking Bad',
            first_air_date: '2008-01-20',
            vote_average: 9.5,
            poster_path: createPlaceholderSVG('Breaking Bad'),
            overview: 'Un profesor de química se convierte en fabricante de metanfetaminas.'
        },
        {
            id: 2,
            name: 'Game of Thrones',
            first_air_date: '2011-04-17',
            vote_average: 9.2,
            poster_path: createPlaceholderSVG('Game of Thrones'),
            overview: 'Familias nobles luchan por el control del Trono de Hierro.'
        },
        {
            id: 3,
            name: 'Chernobyl',
            first_air_date: '2019-05-06',
            vote_average: 9.4,
            poster_path: createPlaceholderSVG('Chernobyl'),
            overview: 'La historia del desastre nuclear de Chernobyl.'
        },
        {
            id: 4,
            name: 'The Boys',
            first_air_date: '2019-07-26',
            vote_average: 8.7,
            poster_path: createPlaceholderSVG('The Boys'),
            overview: 'Un grupo lucha contra superhéroes corruptos.'
        },
        {
            id: 5,
            name: 'House of Cards',
            first_air_date: '2013-02-01',
            vote_average: 8.7,
            poster_path: createPlaceholderSVG('House of Cards'),
            overview: 'Un político sin escrúpulos busca el poder.'
        },
        {
            id: 6,
            name: 'True Detective',
            first_air_date: '2014-01-12',
            vote_average: 9.0,
            poster_path: createPlaceholderSVG('True Detective'),
            overview: 'Detectives investigan crímenes complejos.'
        },
        {
            id: 7,
            name: 'Fargo',
            first_air_date: '2014-04-15',
            vote_average: 9.0,
            poster_path: createPlaceholderSVG('Fargo'),
            overview: 'Historias de crímenes en el medio oeste americano.'
        },
        {
            id: 8,
            name: 'The Wire',
            first_air_date: '2002-06-02',
            vote_average: 9.3,
            poster_path: createPlaceholderSVG('The Wire'),
            overview: 'La vida en Baltimore desde múltiples perspectivas.'
        },
        {
            id: 9,
            name: 'Band of Brothers',
            first_air_date: '2001-09-09',
            vote_average: 9.4,
            poster_path: createPlaceholderSVG('Band of Brothers'),
            overview: 'La historia de la Easy Company durante la Segunda Guerra Mundial.'
        },
        {
            id: 10,
            name: 'Planet Earth II',
            first_air_date: '2016-11-06',
            vote_average: 9.5,
            poster_path: createPlaceholderSVG('Planet Earth II'),
            overview: 'Documental sobre la vida salvaje en la Tierra.'
        }
    ];

    currentTopRatedSeriesIndex = 0; // Resetear índice al cargar series de ejemplo
    displayTopRatedSeries();
}

// Cargar series de ejemplo (si no hay API key)
function loadExampleSeries() {
    // Crear función para generar placeholders SVG inline (siempre funcionan)
    const createPlaceholderSVG = (title) => {
        const text = (title || 'Sin título').substring(0, 20);
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="750" viewBox="0 0 500 750">
            <rect width="500" height="750" fill="#1a1a1a"/>
            <text x="250" y="350" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#e50914" text-anchor="middle" dominant-baseline="middle">${text}</text>
        </svg>`;
        return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
    };
    
    allSeries = [
        {
            id: 1,
            name: 'Breaking Bad',
            first_air_date: '2008-01-20',
            vote_average: 9.5,
            poster_path: createPlaceholderSVG('Breaking Bad'),
            overview: 'Un profesor de química se convierte en fabricante de metanfetaminas.'
        },
        {
            id: 2,
            name: 'Game of Thrones',
            first_air_date: '2011-04-17',
            vote_average: 9.2,
            poster_path: createPlaceholderSVG('Game of Thrones'),
            overview: 'Familias nobles luchan por el control del Trono de Hierro.'
        },
        {
            id: 3,
            name: 'The Office',
            first_air_date: '2005-03-24',
            vote_average: 8.9,
            poster_path: createPlaceholderSVG('The Office'),
            overview: 'La vida diaria de los empleados de una oficina.'
        },
        {
            id: 4,
            name: 'Stranger Things',
            first_air_date: '2016-07-15',
            vote_average: 8.7,
            poster_path: createPlaceholderSVG('Stranger Things'),
            overview: 'Un grupo de niños investiga fenómenos sobrenaturales.'
        },
        {
            id: 5,
            name: 'The Crown',
            first_air_date: '2016-11-04',
            vote_average: 8.6,
            poster_path: createPlaceholderSVG('The Crown'),
            overview: 'La vida de la reina Isabel II de Inglaterra.'
        },
        {
            id: 6,
            name: 'The Mandalorian',
            first_air_date: '2019-11-12',
            vote_average: 8.7,
            poster_path: createPlaceholderSVG('The Mandalorian'),
            overview: 'Las aventuras de un cazarrecompensas en el universo Star Wars.'
        },
        {
            id: 7,
            name: 'The Witcher',
            first_air_date: '2019-12-20',
            vote_average: 8.2,
            poster_path: createPlaceholderSVG('The Witcher'),
            overview: 'Un cazador de monstruos en un mundo de fantasía.'
        },
        {
            id: 8,
            name: 'Chernobyl',
            first_air_date: '2019-05-06',
            vote_average: 9.4,
            poster_path: createPlaceholderSVG('Chernobyl'),
            overview: 'La historia del desastre nuclear de Chernobyl.'
        },
        {
            id: 9,
            name: 'The Boys',
            first_air_date: '2019-07-26',
            vote_average: 8.7,
            poster_path: createPlaceholderSVG('The Boys'),
            overview: 'Un grupo lucha contra superhéroes corruptos.'
        },
        {
            id: 10,
            name: 'House of Cards',
            first_air_date: '2013-02-01',
            vote_average: 8.7,
            poster_path: createPlaceholderSVG('House of Cards'),
            overview: 'Un político sin escrúpulos busca el poder.'
        },
        {
            id: 11,
            name: 'Narcos',
            first_air_date: '2015-08-28',
            vote_average: 8.8,
            poster_path: createPlaceholderSVG('Narcos'),
            overview: 'La historia del narcotráfico en Colombia.'
        },
        {
            id: 12,
            name: 'Peaky Blinders',
            first_air_date: '2013-09-12',
            vote_average: 8.8,
            poster_path: createPlaceholderSVG('Peaky Blinders'),
            overview: 'Una familia de gánsteres en la Inglaterra de los años 20.'
        },
        {
            id: 13,
            name: 'Dark',
            first_air_date: '2017-12-01',
            vote_average: 8.8,
            poster_path: createPlaceholderSVG('Dark'),
            overview: 'Un thriller de ciencia ficción sobre viajes en el tiempo.'
        },
        {
            id: 14,
            name: 'The Walking Dead',
            first_air_date: '2010-10-31',
            vote_average: 8.2,
            poster_path: createPlaceholderSVG('Walking Dead'),
            overview: 'Supervivientes en un mundo post-apocalíptico con zombies.'
        },
        {
            id: 15,
            name: 'Westworld',
            first_air_date: '2016-10-02',
            vote_average: 8.6,
            poster_path: createPlaceholderSVG('Westworld'),
            overview: 'Un parque temático del oeste con androides.'
        },
        {
            id: 16,
            name: 'True Detective',
            first_air_date: '2014-01-12',
            vote_average: 9.0,
            poster_path: createPlaceholderSVG('True Detective'),
            overview: 'Detectives investigan crímenes complejos.'
        },
        {
            id: 17,
            name: 'Fargo',
            first_air_date: '2014-04-15',
            vote_average: 9.0,
            poster_path: createPlaceholderSVG('Fargo'),
            overview: 'Historias de crímenes en el medio oeste americano.'
        },
        {
            id: 18,
            name: 'Better Call Saul',
            first_air_date: '2015-02-08',
            vote_average: 8.8,
            poster_path: createPlaceholderSVG('Better Call Saul'),
            overview: 'La historia de cómo Jimmy McGill se convierte en Saul Goodman.'
        },
        {
            id: 19,
            name: 'The Last of Us',
            first_air_date: '2023-01-15',
            vote_average: 9.1,
            poster_path: createPlaceholderSVG('The Last of Us'),
            overview: 'Un hombre y una niña en un mundo post-apocalíptico.'
        },
        {
            id: 20,
            name: 'Succession',
            first_air_date: '2018-06-03',
            vote_average: 8.8,
            poster_path: createPlaceholderSVG('Succession'),
            overview: 'La lucha por el control de un imperio mediático.'
        }
    ];
    
    currentSeriesIndex = 0; // Resetear índice al cargar series de ejemplo
    if (window.location.pathname.includes('series.html')) {
        displayAllSeries();
    } else {
        displaySeries();
    }
}

// Mostrar películas en la cuadrícula horizontal
function displayMovies() {
    const moviesGrid = document.getElementById('moviesGrid');
    if (!moviesGrid) return;

    // Asegurar que el índice esté dentro del rango válido
    if (currentMovieIndex < 0) {
        currentMovieIndex = 0;
    }
    const maxIndex = Math.max(0, allMovies.length - MOVIES_PER_ROW);
    if (currentMovieIndex > maxIndex) {
        currentMovieIndex = maxIndex;
    }

    // Seleccionar las películas a mostrar (5 películas)
    const endIndex = Math.min(currentMovieIndex + MOVIES_PER_ROW, allMovies.length);
    const moviesToShow = allMovies.slice(currentMovieIndex, endIndex);

    // Añadir transición de fade out
    moviesGrid.style.opacity = '0';
    moviesGrid.style.transition = 'opacity 0.3s ease';

    setTimeout(() => {
        moviesGrid.innerHTML = '';

        moviesToShow.forEach(movie => {
            const movieCard = createMovieCard(movie);
            moviesGrid.appendChild(movieCard);
        });

        // Fade in
        moviesGrid.style.opacity = '1';

        // Actualizar estado de los botones de navegación
        updateNavigationButtons();
    }, 300);
}

// Crear tarjeta de película
function createMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.setAttribute('data-movie-id', movie.id);

    // Crear URL del póster
    let posterUrl = '';
    
    if (movie.poster_path) {
        // La API de TMDB siempre devuelve poster_path que comienza con /
        // Ejemplo: "/abc123.jpg"
        if (movie.poster_path.startsWith('http://') || movie.poster_path.startsWith('https://')) {
            // Si ya es una URL completa, usarla directamente
            posterUrl = movie.poster_path;
        } else {
            // Construir URL completa de TMDB
            // Asegurarse de que poster_path comience con /
            const path = movie.poster_path.startsWith('/') ? movie.poster_path : `/${movie.poster_path}`;
            posterUrl = `${IMAGE_BASE_URL}${path}`;
        }
    }
    
    // Crear placeholder SVG inline como fallback (siempre funciona)
    const createPlaceholderSVG = (title) => {
        const text = (title || 'Sin título').substring(0, 20);
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="750" viewBox="0 0 500 750">
            <rect width="500" height="750" fill="#1a1a1a"/>
            <text x="250" y="350" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#e50914" text-anchor="middle" dominant-baseline="middle">${text}</text>
        </svg>`;
        return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
    };
    
    const fallbackPoster = createPlaceholderSVG(movie.title);
    
    // Si no hay poster_path, usar fallback directamente
    if (!posterUrl) {
        posterUrl = fallbackPoster;
        console.warn(`⚠️ No hay poster_path para "${movie.title}", usando placeholder SVG`);
    } else {
        console.log(`🖼️ ${movie.title}: ${posterUrl}`);
    }

    const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';

    // Crear estructura HTML completa
    card.innerHTML = `
        <div class="movie-poster-container">
            <img src="${posterUrl}"
                 alt="${movie.title || 'Película'}"
                 loading="lazy"
                 class="movie-poster-img"
                 style="width: 100%; height: 300px; object-fit: cover; display: block; background-color: var(--card-background);">
        </div>
        <div class="movie-card-info">
            <div class="movie-card-title">${movie.title || 'Sin título'}</div>
            <div class="movie-card-year">${year}</div>
            <div class="movie-card-rating">★ ${rating}</div>
        </div>
    `;
    
    // Agregar event listeners para manejo de errores
    const img = card.querySelector('.movie-poster-img');
    if (img) {
        let errorCount = 0;
        const maxRetries = 2;
        
        img.addEventListener('load', function() {
            console.log(`✅ Póster cargado: ${movie.title}`);
            this.style.opacity = '1';
        });
        
        img.addEventListener('error', function() {
            errorCount++;
            console.warn(`❌ Error ${errorCount} al cargar póster para "${movie.title}":`, this.src);
            
            // Si falla la carga, usar placeholder SVG inline (siempre funciona)
            if (this.src !== fallbackPoster && !this.src.startsWith('data:image/svg+xml')) {
                console.log(`🔄 Usando placeholder SVG para "${movie.title}"...`);
                this.src = fallbackPoster;
            }
        });
        
        // Mostrar imagen con fade-in
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            if (img.complete && img.naturalHeight !== 0) {
                img.style.opacity = '1';
            }
        }, 100);
    }

    card.addEventListener('click', async () => await showMovieDetails(movie));

    return card;
}

// Navegar a la siguiente página de películas
function nextMovies() {
    const maxIndex = Math.max(0, allMovies.length - MOVIES_PER_ROW);
    if (currentMovieIndex < maxIndex) {
        currentMovieIndex += MOVIES_PER_ROW;
        displayMovies();
    }
}

// Navegar a la página anterior de películas
function prevMovies() {
    if (currentMovieIndex > 0) {
        currentMovieIndex = Math.max(0, currentMovieIndex - MOVIES_PER_ROW);
        displayMovies();
    }
}

// Mostrar series en la cuadrícula horizontal
function displaySeries() {
    const seriesGrid = document.getElementById('seriesGrid');
    if (!seriesGrid) return;

    // Asegurar que el índice esté dentro del rango válido
    if (currentSeriesIndex < 0) {
        currentSeriesIndex = 0;
    }
    const maxIndex = Math.max(0, allSeries.length - MOVIES_PER_ROW);
    if (currentSeriesIndex > maxIndex) {
        currentSeriesIndex = maxIndex;
    }

    // Seleccionar las series a mostrar (5 series)
    const endIndex = Math.min(currentSeriesIndex + MOVIES_PER_ROW, allSeries.length);
    const seriesToShow = allSeries.slice(currentSeriesIndex, endIndex);

    // Añadir transición de fade out
    seriesGrid.style.opacity = '0';
    seriesGrid.style.transition = 'opacity 0.3s ease';

    setTimeout(() => {
        seriesGrid.innerHTML = '';

        seriesToShow.forEach(series => {
            const seriesCard = createSeriesCard(series);
            seriesGrid.appendChild(seriesCard);
        });

        // Fade in
        seriesGrid.style.opacity = '1';

        // Actualizar estado de los botones de navegación
        updateSeriesNavigationButtons();
    }, 300);
}

// Mostrar películas mejor valoradas en la cuadrícula horizontal
function displayTopRatedMovies() {
    const topRatedMoviesGrid = document.getElementById('topRatedMoviesGrid');
    if (!topRatedMoviesGrid) return;

    // Asegurar que el índice esté dentro del rango válido
    if (currentTopRatedMoviesIndex < 0) {
        currentTopRatedMoviesIndex = 0;
    }
    const maxIndex = Math.max(0, topRatedMovies.length - MOVIES_PER_ROW);
    if (currentTopRatedMoviesIndex > maxIndex) {
        currentTopRatedMoviesIndex = maxIndex;
    }

    // Seleccionar las películas a mostrar (5 películas)
    const endIndex = Math.min(currentTopRatedMoviesIndex + MOVIES_PER_ROW, topRatedMovies.length);
    const moviesToShow = topRatedMovies.slice(currentTopRatedMoviesIndex, endIndex);

    // Añadir transición de fade out
    topRatedMoviesGrid.style.opacity = '0';
    topRatedMoviesGrid.style.transition = 'opacity 0.3s ease';

    setTimeout(() => {
        topRatedMoviesGrid.innerHTML = '';

        moviesToShow.forEach(movie => {
            const movieCard = createMovieCard(movie);
            topRatedMoviesGrid.appendChild(movieCard);
        });

        // Fade in
        topRatedMoviesGrid.style.opacity = '1';

        // Actualizar estado de los botones de navegación
        updateTopRatedMoviesNavigationButtons();
    }, 300);
}

// Navegar a la siguiente página de películas mejor valoradas
function nextTopRatedMovies() {
    const maxIndex = Math.max(0, topRatedMovies.length - MOVIES_PER_ROW);
    if (currentTopRatedMoviesIndex < maxIndex) {
        currentTopRatedMoviesIndex += MOVIES_PER_ROW;
        displayTopRatedMovies();
    }
}

// Navegar a la página anterior de películas mejor valoradas
function prevTopRatedMovies() {
    if (currentTopRatedMoviesIndex > 0) {
        currentTopRatedMoviesIndex = Math.max(0, currentTopRatedMoviesIndex - MOVIES_PER_ROW);
        displayTopRatedMovies();
    }
}

// Actualizar estado de los botones de navegación de películas mejor valoradas
function updateTopRatedMoviesNavigationButtons() {
    const prevBtn = document.getElementById('prevBtnTopRatedMovies');
    const nextBtn = document.getElementById('nextBtnTopRatedMovies');
    const maxIndex = Math.max(0, topRatedMovies.length - MOVIES_PER_ROW);

    if (prevBtn) {
        prevBtn.disabled = currentTopRatedMoviesIndex === 0;
    }

    if (nextBtn) {
        nextBtn.disabled = currentTopRatedMoviesIndex >= maxIndex;
    }
}

// Mostrar series mejor valoradas en la cuadrícula horizontal
function displayTopRatedSeries() {
    const topRatedSeriesGrid = document.getElementById('topRatedSeriesGrid');
    if (!topRatedSeriesGrid) return;

    // Asegurar que el índice esté dentro del rango válido
    if (currentTopRatedSeriesIndex < 0) {
        currentTopRatedSeriesIndex = 0;
    }
    const maxIndex = Math.max(0, topRatedSeries.length - MOVIES_PER_ROW);
    if (currentTopRatedSeriesIndex > maxIndex) {
        currentTopRatedSeriesIndex = maxIndex;
    }

    // Seleccionar las series a mostrar (5 series)
    const endIndex = Math.min(currentTopRatedSeriesIndex + MOVIES_PER_ROW, topRatedSeries.length);
    const seriesToShow = topRatedSeries.slice(currentTopRatedSeriesIndex, endIndex);

    // Añadir transición de fade out
    topRatedSeriesGrid.style.opacity = '0';
    topRatedSeriesGrid.style.transition = 'opacity 0.3s ease';

    setTimeout(() => {
        topRatedSeriesGrid.innerHTML = '';

        seriesToShow.forEach(series => {
            const seriesCard = createSeriesCard(series);
            topRatedSeriesGrid.appendChild(seriesCard);
        });

        // Fade in
        topRatedSeriesGrid.style.opacity = '1';

        // Actualizar estado de los botones de navegación
        updateTopRatedSeriesNavigationButtons();
    }, 300);
}

// Navegar a la siguiente página de series mejor valoradas
function nextTopRatedSeries() {
    const maxIndex = Math.max(0, topRatedSeries.length - MOVIES_PER_ROW);
    if (currentTopRatedSeriesIndex < maxIndex) {
        currentTopRatedSeriesIndex += MOVIES_PER_ROW;
        displayTopRatedSeries();
    }
}

// Navegar a la página anterior de series mejor valoradas
function prevTopRatedSeries() {
    if (currentTopRatedSeriesIndex > 0) {
        currentTopRatedSeriesIndex = Math.max(0, currentTopRatedSeriesIndex - MOVIES_PER_ROW);
        displayTopRatedSeries();
    }
}

// Actualizar estado de los botones de navegación de series mejor valoradas
function updateTopRatedSeriesNavigationButtons() {
    const prevBtn = document.getElementById('prevBtnTopRatedSeries');
    const nextBtn = document.getElementById('nextBtnTopRatedSeries');
    const maxIndex = Math.max(0, topRatedSeries.length - MOVIES_PER_ROW);

    if (prevBtn) {
        prevBtn.disabled = currentTopRatedSeriesIndex === 0;
    }

    if (nextBtn) {
        nextBtn.disabled = currentTopRatedSeriesIndex >= maxIndex;
    }
}

// Crear tarjeta de serie (similar a createMovieCard pero adaptado para series)
function createSeriesCard(series) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.setAttribute('data-series-id', series.id);

    // Crear URL del póster
    let posterUrl = '';
    
    if (series.poster_path) {
        if (series.poster_path.startsWith('http://') || series.poster_path.startsWith('https://')) {
            posterUrl = series.poster_path;
        } else {
            const path = series.poster_path.startsWith('/') ? series.poster_path : `/${series.poster_path}`;
            posterUrl = `${IMAGE_BASE_URL}${path}`;
        }
    }
    
    // Crear placeholder SVG inline como fallback
    const createPlaceholderSVG = (title) => {
        const text = (title || 'Sin título').substring(0, 20);
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="750" viewBox="0 0 500 750">
            <rect width="500" height="750" fill="#1a1a1a"/>
            <text x="250" y="350" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#e50914" text-anchor="middle" dominant-baseline="middle">${text}</text>
        </svg>`;
        return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
    };
    
    const fallbackPoster = createPlaceholderSVG(series.name || series.title);
    
    if (!posterUrl) {
        posterUrl = fallbackPoster;
        console.warn(`⚠️ No hay poster_path para "${series.name || series.title}", usando placeholder SVG`);
    } else {
        console.log(`🖼️ ${series.name || series.title}: ${posterUrl}`);
    }

    // Para series, usar first_air_date en lugar de release_date
    const year = (series.first_air_date || series.release_date) ? new Date(series.first_air_date || series.release_date).getFullYear() : 'N/A';
    const rating = series.vote_average ? series.vote_average.toFixed(1) : 'N/A';
    const title = series.name || series.title || 'Sin título';

    // Crear estructura HTML completa
    card.innerHTML = `
        <div class="movie-poster-container">
            <img src="${posterUrl}"
                 alt="${title}"
                 loading="lazy"
                 class="movie-poster-img"
                 style="width: 100%; height: 300px; object-fit: cover; display: block; background-color: var(--card-background);">
        </div>
        <div class="movie-card-info">
            <div class="movie-card-title">${title}</div>
            <div class="movie-card-year">${year}</div>
            <div class="movie-card-rating">★ ${rating}</div>
        </div>
    `;
    
    // Agregar event listeners para manejo de errores
    const img = card.querySelector('.movie-poster-img');
    if (img) {
        let errorCount = 0;
        
        img.addEventListener('load', function() {
            console.log(`✅ Póster cargado: ${title}`);
            this.style.opacity = '1';
        });
        
        img.addEventListener('error', function() {
            errorCount++;
            console.warn(`❌ Error ${errorCount} al cargar póster para "${title}":`, this.src);
            
            if (this.src !== fallbackPoster && !this.src.startsWith('data:image/svg+xml')) {
                console.log(`🔄 Usando placeholder SVG para "${title}"...`);
                this.src = fallbackPoster;
            }
        });
        
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            if (img.complete && img.naturalHeight !== 0) {
                img.style.opacity = '1';
            }
        }, 100);
    }

    card.addEventListener('click', async () => await showSeriesDetails(series));

    return card;
}

// Navegar a la siguiente página de series
function nextSeries() {
    const maxIndex = Math.max(0, allSeries.length - MOVIES_PER_ROW);
    if (currentSeriesIndex < maxIndex) {
        currentSeriesIndex += MOVIES_PER_ROW;
        displaySeries();
    }
}

// Navegar a la página anterior de series
function prevSeries() {
    if (currentSeriesIndex > 0) {
        currentSeriesIndex = Math.max(0, currentSeriesIndex - MOVIES_PER_ROW);
        displaySeries();
    }
}

// Actualizar estado de los botones de navegación de series
function updateSeriesNavigationButtons() {
    const prevBtn = document.getElementById('prevBtnSeries');
    const nextBtn = document.getElementById('nextBtnSeries');
    const maxIndex = Math.max(0, allSeries.length - MOVIES_PER_ROW);

    if (prevBtn) {
        prevBtn.disabled = currentSeriesIndex === 0;
    }

    if (nextBtn) {
        nextBtn.disabled = currentSeriesIndex >= maxIndex;
    }
}

// Actualizar estado de los botones de navegación
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const maxIndex = Math.max(0, allMovies.length - MOVIES_PER_ROW);

    if (prevBtn) {
        prevBtn.disabled = currentMovieIndex === 0;
    }

    if (nextBtn) {
        nextBtn.disabled = currentMovieIndex >= maxIndex;
    }
}

// Mostrar detalles de la serie (similar a showMovieDetails)
async function showSeriesDetails(series) {
    const modal = document.getElementById('movieModal');
    const movieDetails = document.getElementById('movieDetails');

    if (!modal || !movieDetails) return;

    movieDetails.innerHTML = '<div class="loading">Cargando detalles...</div>';
    modal.classList.add('show');

    let seriesData = series;

    // Si tenemos API key, cargar información completa de la serie
    if (API_KEY !== 'tu_api_key_aqui' && API_KEY && series.id) {
        try {
            const response = await fetch(
                `${BASE_URL}/tv/${series.id}?api_key=${API_KEY}&language=es-ES`
            );
            
            if (response.ok) {
                seriesData = await response.json();
            }
        } catch (error) {
            console.warn('Error al cargar detalles completos:', error);
        }
    }

    const fallbackPoster = `https://via.placeholder.com/500x750/1a1a1a/e50914?text=${encodeURIComponent(seriesData.name || seriesData.title || 'Sin título')}`;
    const posterUrl = seriesData.poster_path 
        ? (seriesData.poster_path.startsWith('http') ? seriesData.poster_path : `${IMAGE_BASE_URL}${seriesData.poster_path}`)
        : fallbackPoster;

    const year = (seriesData.first_air_date || seriesData.release_date) ? new Date(seriesData.first_air_date || seriesData.release_date).getFullYear() : 'N/A';
    const rating = seriesData.vote_average ? seriesData.vote_average.toFixed(1) : 'N/A';
    const title = seriesData.name || seriesData.title || 'Sin título';
    const runtime = seriesData.episode_run_time && seriesData.episode_run_time.length > 0 ? `${seriesData.episode_run_time[0]} min` : '';
    const seasons = seriesData.number_of_seasons ? `${seriesData.number_of_seasons} temporadas` : '';
    const episodes = seriesData.number_of_episodes ? `${seriesData.number_of_episodes} episodios` : '';

    // Obtener nombres de géneros
    let genresHTML = '';
    if (seriesData.genres && seriesData.genres.length > 0) {
        genresHTML = seriesData.genres.map(genre => 
            `<span class="genre-tag">${genre.name}</span>`
        ).join('');
    }

    movieDetails.innerHTML = `
        <div class="movie-detail-header">
            <div class="movie-detail-poster">
                <img src="${posterUrl}" alt="${title}" onerror="this.src='${fallbackPoster}'">
            </div>
            <div class="movie-detail-info">
                <h2 class="movie-detail-title">${title}</h2>
                <div class="movie-detail-meta">
                    <span>Año: ${year}</span>
                    <span>⭐ ${rating}</span>
                    ${runtime ? `<span>⏱️ ${runtime}</span>` : ''}
                    ${seasons ? `<span>📺 ${seasons}</span>` : ''}
                    ${episodes ? `<span>🎬 ${episodes}</span>` : ''}
                </div>
                ${genresHTML ? `<div class="movie-detail-genres">${genresHTML}</div>` : ''}
                <p class="movie-detail-overview">${seriesData.overview || 'Sin descripción disponible.'}</p>
                ${seriesData.tagline ? `<p style="font-style: italic; color: var(--text-secondary); margin-bottom: 1rem;">"${seriesData.tagline}"</p>` : ''}
                ${!window.location.pathname.includes('favoritos.html') ? `
                <div class="movie-detail-actions">
                    <button class="btn btn-primary" onclick='addToFavorites(${seriesData.id}, "series", ${JSON.stringify(seriesData)})'>Agregar a Favoritos</button>
                </div>
                ` : ''}
                ${window.location.pathname.includes('favoritos.html') ? `
                <div class="movie-detail-actions">
                    <button class="btn btn-primary" onclick='removeFromFavorites(${seriesData.id}, "series")'>Quitar de Favoritos</button>
                </div>
                ` : ''}
            </div>
        </div>
    `;
}

// Mostrar detalles de la película (mejorado con API)
async function showMovieDetails(movie) {
    const modal = document.getElementById('movieModal');
    const movieDetails = document.getElementById('movieDetails');

    if (!modal || !movieDetails) return;

    // Mostrar loading
    movieDetails.innerHTML = '<div class="loading">Cargando detalles...</div>';
    modal.classList.add('show');

    let movieData = movie;

    // Si tenemos API key, cargar información completa de la película
    if (API_KEY !== 'tu_api_key_aqui' && API_KEY && movie.id) {
        try {
            const response = await fetch(
                `${BASE_URL}/movie/${movie.id}?api_key=${API_KEY}&language=es-ES`
            );
            
            if (response.ok) {
                movieData = await response.json();
            }
        } catch (error) {
            console.warn('Error al cargar detalles completos:', error);
        }
    }

    const fallbackPoster = `https://via.placeholder.com/500x750/1a1a1a/e50914?text=${encodeURIComponent(movieData.title)}`;
    const posterUrl = movieData.poster_path 
        ? (movieData.poster_path.startsWith('http') ? movieData.poster_path : `${IMAGE_BASE_URL}${movieData.poster_path}`)
        : fallbackPoster;

    const year = movieData.release_date ? new Date(movieData.release_date).getFullYear() : 'N/A';
    const rating = movieData.vote_average ? movieData.vote_average.toFixed(1) : 'N/A';
    const runtime = movieData.runtime ? `${movieData.runtime} min` : '';
    const budget = movieData.budget ? `$${movieData.budget.toLocaleString()}` : '';
    const revenue = movieData.revenue ? `$${movieData.revenue.toLocaleString()}` : '';

    // Obtener nombres de géneros
    let genresHTML = '';
    if (movieData.genres && movieData.genres.length > 0) {
        genresHTML = movieData.genres.map(genre => 
            `<span class="genre-tag">${genre.name}</span>`
        ).join('');
    } else if (movieData.genre_ids && genresList.length > 0) {
        genresHTML = movieData.genre_ids.map(genreId => {
            const genre = genresList.find(g => g.id === genreId);
            return genre ? `<span class="genre-tag">${genre.name}</span>` : '';
        }).filter(Boolean).join('');
    }

    movieDetails.innerHTML = `
        <div class="movie-detail-header">
            <div class="movie-detail-poster">
                <img src="${posterUrl}" alt="${movieData.title}" onerror="this.src='${fallbackPoster}'">
            </div>
            <div class="movie-detail-info">
                <h2 class="movie-detail-title">${movieData.title}${movieData.original_title && movieData.original_title !== movieData.title ? ` (${movieData.original_title})` : ''}</h2>
                <div class="movie-detail-meta">
                    <span>Año: ${year}</span>
                    <span>⭐ ${rating}</span>
                    ${runtime ? `<span>⏱️ ${runtime}</span>` : ''}
                </div>
                ${genresHTML ? `<div class="movie-detail-genres">${genresHTML}</div>` : ''}
                <p class="movie-detail-overview">${movieData.overview || 'Sin descripción disponible.'}</p>
                ${movieData.tagline ? `<p style="font-style: italic; color: var(--text-secondary); margin-bottom: 1rem;">"${movieData.tagline}"</p>` : ''}
                ${budget || revenue ? `
                <div class="movie-detail-meta" style="margin-top: 1rem;">
                    ${budget ? `<span>💰 Presupuesto: ${budget}</span>` : ''}
                    ${revenue ? `<span>💵 Recaudación: ${revenue}</span>` : ''}
                </div>
                ` : ''}
                ${!window.location.pathname.includes('favoritos.html') ? `
                <div class="movie-detail-actions">
                    <button class="btn btn-primary" onclick='addToFavorites(${movieData.id}, "movie", ${JSON.stringify(movieData)})'>Agregar a Favoritos</button>
                </div>
                ` : ''}
                ${window.location.pathname.includes('favoritos.html') ? `
                <div class="movie-detail-actions">
                    <button class="btn btn-primary" onclick='removeFromFavorites(${movieData.id}, "movie")'>Quitar de Favoritos</button>
                </div>
                ` : ''}
            </div>
        </div>
    `;
}

// Configurar event listeners
function setupEventListeners() {
    // Cerrar modal
    const closeBtn = document.querySelector('.close');
    const modal = document.getElementById('movieModal');

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (modal) modal.classList.remove('show');
        });
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    }

    // Navegación
    const navLinks = document.querySelectorAll('nav a[data-page], .logo-link[data-page]');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            switchPage(page);
        });
    });

    // Handle regular links without data-page (like in nosotros.html)
    const regularLinks = document.querySelectorAll('a:not([data-page])');
    regularLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // Allow default behavior for regular links
        });
    });

    // Búsqueda
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearBtn');

    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });

        // Mostrar/ocultar botón de limpiar
        searchInput.addEventListener('input', () => {
            if (clearBtn) {
                clearBtn.style.display = searchInput.value.trim() ? 'block' : 'none';
            }
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', async () => {
            await clearSearch();
            if (clearBtn) clearBtn.style.display = 'none';
        });
    }

    // Filtros
    const genreFilter = document.getElementById('genreFilter');
    const yearFilter = document.getElementById('yearFilter');

    if (genreFilter) {
        genreFilter.addEventListener('change', handleFilterChange);
    }

    if (yearFilter) {
        yearFilter.addEventListener('change', handleFilterChange);
    }

    // Botones de navegación de películas
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (prevBtn) {
        prevBtn.addEventListener('click', prevMovies);
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', nextMovies);
    }

    // Botones de navegación de series
    const prevBtnSeries = document.getElementById('prevBtnSeries');
    const nextBtnSeries = document.getElementById('nextBtnSeries');

    if (prevBtnSeries) {
        prevBtnSeries.addEventListener('click', prevSeries);
    }

    if (nextBtnSeries) {
        nextBtnSeries.addEventListener('click', nextSeries);
    }

    // Botones de navegación de películas mejor valoradas
    const prevBtnTopRatedMovies = document.getElementById('prevBtnTopRatedMovies');
    const nextBtnTopRatedMovies = document.getElementById('nextBtnTopRatedMovies');

    if (prevBtnTopRatedMovies) {
        prevBtnTopRatedMovies.addEventListener('click', prevTopRatedMovies);
    }

    if (nextBtnTopRatedMovies) {
        nextBtnTopRatedMovies.addEventListener('click', nextTopRatedMovies);
    }

    // Botones de navegación de series mejor valoradas
    const prevBtnTopRatedSeries = document.getElementById('prevBtnTopRatedSeries');
    const nextBtnTopRatedSeries = document.getElementById('nextBtnTopRatedSeries');

    if (prevBtnTopRatedSeries) {
        prevBtnTopRatedSeries.addEventListener('click', prevTopRatedSeries);
    }

    if (nextBtnTopRatedSeries) {
        nextBtnTopRatedSeries.addEventListener('click', nextTopRatedSeries);
    }

    // Botón "Ver Más" películas
    const loadMoreMoviesBtn = document.getElementById('loadMoreMoviesBtn');

    if (loadMoreMoviesBtn) {
        loadMoreMoviesBtn.addEventListener('click', loadMoreMovies);
    }

    // Botón "Ver Más" series
    const loadMoreSeriesBtn = document.getElementById('loadMoreSeriesBtn');

    if (loadMoreSeriesBtn) {
        loadMoreSeriesBtn.addEventListener('click', loadMoreSeries);
    }

    // Sidebar
    setupSidebarListeners();

    // Login modal
    setupLoginModalListeners();
}

// Configurar acciones de favoritos
function setupFavoritesActions() {
    const clearMoviesBtn = document.getElementById('clearMoviesBtn');
    if (clearMoviesBtn) {
        clearMoviesBtn.addEventListener('click', clearMoviesFavorites);
    }
}

// Función para limpiar películas favoritas
function clearMoviesFavorites() {
    if (confirm('¿Estás seguro de que quieres eliminar todas las películas favoritas? Esta acción no se puede deshacer.')) {
        let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

        // Filtrar solo las series, eliminando las películas
        favorites = favorites.filter(fav => fav.type !== 'movie');

        localStorage.setItem('favorites', JSON.stringify(favorites));
        showNotification('Películas favoritas eliminadas exitosamente.', 'info');

        // Recargar la vista de favoritos
        loadFavorites();
    }
}

// Setup de event listeners para el login modal
function setupLoginModalListeners() {
    // Placeholder function to prevent errors
    console.log('Login modal listeners setup (placeholder)');
}

// Setup de event listeners para el sidebar
function setupSidebarListeners() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebarLinks = document.querySelectorAll('.sidebar-link');

    // Toggle sidebar
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            toggleSidebar();
        });
    }

    // Cerrar sidebar al hacer clic en overlay
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            closeSidebar();
        });
    }

    // Navegación del sidebar
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const page = link.getAttribute('data-page');
            if (page) {
                e.preventDefault();
                switchPage(page);
                closeSidebar();
                updateSidebarActiveLink(link);
            }
            // For links without data-page, allow default navigation
        });
    });

    // Cerrar sidebar al hacer clic fuera (excepto en el botón toggle)
    document.addEventListener('click', (e) => {
        if (sidebar && !sidebar.contains(e.target) && sidebarToggle && !sidebarToggle.contains(e.target)) {
            closeSidebar();
        }
    });
}



// Toggle del sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const body = document.body;

    if (sidebar && sidebarOverlay) {
        const isActive = sidebar.classList.toggle('active');
        sidebarOverlay.classList.toggle('active');
        body.classList.toggle('sidebar-open');

        // Cambiar el icono del botón toggle y su posición
        if (sidebarToggle) {
            sidebarToggle.textContent = isActive ? '×' : '☰';
            sidebarToggle.classList.toggle('active');
        }
    }
}

// Cerrar sidebar
function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const body = document.body;

    if (sidebar && sidebarOverlay) {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        body.classList.remove('sidebar-open');

        // Resetear el botón toggle a su estado cerrado
        if (sidebarToggle) {
            sidebarToggle.textContent = '☰';
            sidebarToggle.classList.remove('active');
        }
    }
}

// Actualizar link activo en sidebar
function updateSidebarActiveLink(currentLink) {
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    sidebarLinks.forEach(link => {
        link.classList.remove('active');
    });
    if (currentLink) {
        currentLink.classList.add('active');
    }
}

// Manejar cambios en los filtros
async function handleFilterChange() {
    const genreFilter = document.getElementById('genreFilter');
    const yearFilter = document.getElementById('yearFilter');
    const searchInput = document.getElementById('searchInput');

    const genreId = genreFilter ? genreFilter.value : '';
    const year = yearFilter ? yearFilter.value : '';
    const searchQuery = searchInput ? searchInput.value.trim() : '';

    // Si hay búsqueda activa, no aplicar filtros
    if (searchQuery) {
        return;
    }

    // Determinar si estamos en página de películas o series
    const isMoviesPage = window.location.pathname.includes('peliculas.html');
    const isSeriesPage = window.location.pathname.includes('series.html');
    const isHomePage = !isMoviesPage && !isSeriesPage;

    // Si no hay filtros aplicados, volver a cargar contenido popular y mejor valorado
    if (!genreId && !year) {
        // Resetear estado de filtros
        isFilteredMovies = false;
        isFilteredSeries = false;
        currentGenreFilter = '';
        currentYearFilter = '';

        if (isMoviesPage || isHomePage) {
            await loadPopularMovies();
        }
        if (isSeriesPage || isHomePage) {
            await loadPopularSeries();
        }
        if (isHomePage) {
            await loadTopRatedMovies();
            await loadTopRatedSeries();
        }
        return;
    }

    // Aplicar filtros usando la API
    if (API_KEY === 'tu_api_key_aqui' || !API_KEY) {
        showNotification('⚠️ Los filtros requieren una API key de TMDB. Por favor, configura tu API key en app.js', 'warning');
        return;
    }

    try {
        // Mostrar loading en las grids apropiadas
        const moviesGrid = document.getElementById('moviesGrid');
        const allMoviesGrid = document.getElementById('allMoviesGrid');
        const seriesGrid = document.getElementById('seriesGrid');
        const allSeriesGrid = document.getElementById('allSeriesGrid');
        const topRatedMoviesGrid = document.getElementById('topRatedMoviesGrid');
        const topRatedSeriesGrid = document.getElementById('topRatedSeriesGrid');

        if (isMoviesPage && allMoviesGrid) {
            allMoviesGrid.innerHTML = '<div class="loading">Aplicando filtros...</div>';
        } else if (isHomePage && moviesGrid) {
            moviesGrid.innerHTML = '<div class="loading">Aplicando filtros...</div>';
        }

        if (isSeriesPage && allSeriesGrid) {
            allSeriesGrid.innerHTML = '<div class="loading">Aplicando filtros...</div>';
        } else if (isHomePage && seriesGrid) {
            seriesGrid.innerHTML = '<div class="loading">Aplicando filtros...</div>';
        }

        if (isHomePage && topRatedMoviesGrid) {
            topRatedMoviesGrid.innerHTML = '<div class="loading">Aplicando filtros...</div>';
        }

        if (isHomePage && topRatedSeriesGrid) {
            topRatedSeriesGrid.innerHTML = '<div class="loading">Aplicando filtros...</div>';
        }

        // Aplicar filtros a películas si corresponde
        if (isMoviesPage || isHomePage) {
            let movieUrl = `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=es-ES&sort_by=popularity.desc`;
            if (genreId) movieUrl += `&with_genres=${genreId}`;
            if (year) movieUrl += `&primary_release_year=${year}`;
            const movieResponse = await fetch(movieUrl);

            // Actualizar estado de filtros para "Ver Más"
            if (genreId || year) {
                isFilteredMovies = true;
                currentGenreFilter = genreId;
                currentYearFilter = year;
                nextFilteredMoviePage = 2; // Resetear página para filtros
            } else {
                isFilteredMovies = false;
                currentGenreFilter = '';
                currentYearFilter = '';
            }

            if (!movieResponse.ok) {
                throw new Error(`Error HTTP películas: ${movieResponse.status}`);
            }

            const movieData = await movieResponse.json();

            if (movieData.results && movieData.results.length > 0) {
                allMovies = movieData.results.filter(movie => movie.poster_path);

                if (allMovies.length > 0) {
                    currentMovieIndex = 0; // Resetear índice al filtrar
                    if (isMoviesPage) {
                        displayAllMovies();
                    } else {
                        displayMovies();
                    }
                    console.log(`✅ Filtradas ${allMovies.length} películas`);
                } else {
                    if (isMoviesPage && allMoviesGrid) {
                        allMoviesGrid.innerHTML = '<div class="empty-state"><h3>No se encontraron películas con estos filtros</h3></div>';
                    } else if (isHomePage && moviesGrid) {
                        moviesGrid.innerHTML = '<div class="empty-state"><h3>No se encontraron películas con estos filtros</h3></div>';
                    }
                }
            } else {
                if (isMoviesPage && allMoviesGrid) {
                    allMoviesGrid.innerHTML = '<div class="empty-state"><h3>No se encontraron películas</h3><p>Intenta con otros filtros</p></div>';
                } else if (isHomePage && moviesGrid) {
                    moviesGrid.innerHTML = '<div class="empty-state"><h3>No se encontraron películas</h3><p>Intenta con otros filtros</p></div>';
                }
            }
        }

        // Aplicar filtros a series si corresponde
        if (isSeriesPage || isHomePage) {
            let seriesUrl = `${BASE_URL}/discover/tv?api_key=${API_KEY}&language=es-ES&sort_by=popularity.desc`;
            if (genreId) seriesUrl += `&with_genres=${genreId}`;
            if (year) seriesUrl += `&first_air_date_year=${year}`;
            const seriesResponse = await fetch(seriesUrl);

            // Actualizar estado de filtros para "Ver Más"
            if (genreId || year) {
                isFilteredSeries = true;
                currentGenreFilter = genreId;
                currentYearFilter = year;
                nextFilteredSeriesPage = 2; // Resetear página para filtros
            } else {
                isFilteredSeries = false;
                currentGenreFilter = '';
                currentYearFilter = '';
            }

            if (!seriesResponse.ok) {
                throw new Error(`Error HTTP series: ${seriesResponse.status}`);
            }

            const seriesData = await seriesResponse.json();

            if (seriesData.results && seriesData.results.length > 0) {
                allSeries = seriesData.results.filter(series => series.poster_path);

                if (allSeries.length > 0) {
                    currentSeriesIndex = 0; // Resetear índice al filtrar
                    if (isSeriesPage) {
                        displayAllSeries();
                    } else {
                        displaySeries();
                    }
                    console.log(`✅ Filtradas ${allSeries.length} series`);
                } else {
                    if (isSeriesPage && allSeriesGrid) {
                        allSeriesGrid.innerHTML = '<div class="empty-state"><h3>No se encontraron series con estos filtros</h3></div>';
                    } else if (isHomePage && seriesGrid) {
                        seriesGrid.innerHTML = '<div class="empty-state"><h3>No se encontraron series con estos filtros</h3></div>';
                    }
                }
            } else {
                if (isSeriesPage && allSeriesGrid) {
                    allSeriesGrid.innerHTML = '<div class="empty-state"><h3>No se encontraron series</h3><p>Intenta con otros filtros</p></div>';
                } else if (isHomePage && seriesGrid) {
                    seriesGrid.innerHTML = '<div class="empty-state"><h3>No se encontraron series</h3><p>Intenta con otros filtros</p></div>';
                }
            }
        }

        // Aplicar filtros a películas mejor valoradas si estamos en la página de inicio
        if (isHomePage) {
            const topRatedMovieUrl = `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=es-ES&sort_by=vote_average.desc&vote_count.gte=1000&with_genres=${genreId}`;
            const topRatedMovieResponse = await fetch(topRatedMovieUrl);

            if (!topRatedMovieResponse.ok) {
                throw new Error(`Error HTTP películas mejor valoradas: ${topRatedMovieResponse.status}`);
            }

            const topRatedMovieData = await topRatedMovieResponse.json();

            if (topRatedMovieData.results && topRatedMovieData.results.length > 0) {
                topRatedMovies = topRatedMovieData.results.filter(movie => movie.poster_path);

                if (topRatedMovies.length > 0) {
                    currentTopRatedMoviesIndex = 0; // Resetear índice al filtrar
                    displayTopRatedMovies();
                    console.log(`✅ Filtradas ${topRatedMovies.length} películas mejor valoradas`);
                } else {
                    if (topRatedMoviesGrid) {
                        topRatedMoviesGrid.innerHTML = '<div class="empty-state"><h3>No se encontraron películas mejor valoradas con estos filtros</h3></div>';
                    }
                }
            } else {
                if (topRatedMoviesGrid) {
                    topRatedMoviesGrid.innerHTML = '<div class="empty-state"><h3>No se encontraron películas mejor valoradas</h3><p>Intenta con otros filtros</p></div>';
                }
            }
        }

        // Aplicar filtros a series mejor valoradas si estamos en la página de inicio
        if (isHomePage) {
            let topRatedSeriesUrl = `${BASE_URL}/discover/tv?api_key=${API_KEY}&language=es-ES&sort_by=vote_average.desc&vote_count.gte=1000`;
            if (genreId) topRatedSeriesUrl += `&with_genres=${genreId}`;
            if (year) topRatedSeriesUrl += `&first_air_date_year=${year}`;
            const topRatedSeriesResponse = await fetch(topRatedSeriesUrl);

            if (!topRatedSeriesResponse.ok) {
                throw new Error(`Error HTTP series mejor valoradas: ${topRatedSeriesResponse.status}`);
            }

            const topRatedSeriesData = await topRatedSeriesResponse.json();

            if (topRatedSeriesData.results && topRatedSeriesData.results.length > 0) {
                topRatedSeries = topRatedSeriesData.results.filter(series => series.poster_path);

                if (topRatedSeries.length > 0) {
                    currentTopRatedSeriesIndex = 0; // Resetear índice al filtrar
                    displayTopRatedSeries();
                    console.log(`✅ Filtradas ${topRatedSeries.length} series mejor valoradas`);
                } else {
                    if (topRatedSeriesGrid) {
                        topRatedSeriesGrid.innerHTML = '<div class="empty-state"><h3>No se encontraron series mejor valoradas con estos filtros</h3></div>';
                    }
                }
            } else {
                if (topRatedSeriesGrid) {
                    topRatedSeriesGrid.innerHTML = '<div class="empty-state"><h3>No se encontraron series mejor valoradas</h3><p>Intenta con otros filtros</p></div>';
                }
            }
        }

    } catch (error) {
        console.error('Error al aplicar filtros:', error);

        // Mostrar error en las grids apropiadas
        const moviesGrid = document.getElementById('moviesGrid');
        const allMoviesGrid = document.getElementById('allMoviesGrid');
        const seriesGrid = document.getElementById('seriesGrid');
        const allSeriesGrid = document.getElementById('allSeriesGrid');
        const topRatedMoviesGrid = document.getElementById('topRatedMoviesGrid');
        const topRatedSeriesGrid = document.getElementById('topRatedSeriesGrid');

        const errorMessage = '<div class="empty-state"><h3>Error al aplicar filtros</h3><p>Por favor, intenta de nuevo más tarde</p></div>';

        if (isMoviesPage && allMoviesGrid) {
            allMoviesGrid.innerHTML = errorMessage;
        } else if (isHomePage && moviesGrid) {
            moviesGrid.innerHTML = errorMessage;
        }

        if (isSeriesPage && allSeriesGrid) {
            allSeriesGrid.innerHTML = errorMessage;
        } else if (isHomePage && seriesGrid) {
            seriesGrid.innerHTML = errorMessage;
        }

        if (isHomePage && topRatedMoviesGrid) {
            topRatedMoviesGrid.innerHTML = errorMessage;
        }

        if (isHomePage && topRatedSeriesGrid) {
            topRatedSeriesGrid.innerHTML = errorMessage;
        }
    }
}

// Cambiar de página
function switchPage(page) {
    // Desplazarse a la parte superior de la página
    window.scrollTo(0, 0);

    const moviesSection = document.getElementById('movies-section');
    const seriesSection = document.getElementById('series-section');
    const favoritesSection = document.getElementById('favorites-section');
    const allMoviesSection = document.getElementById('all-movies-section');
    const allSeriesSection = document.getElementById('all-series-section');
    const settingsSection = document.getElementById('settings-section');
    const aboutSection = document.getElementById('about-section');
    const searchSection = document.getElementById('search-section');
    const navLinks = document.querySelectorAll('nav a');

    // Ocultar todas las secciones
    if (moviesSection) moviesSection.style.display = 'none';
    if (seriesSection) seriesSection.style.display = 'none';
    if (favoritesSection) favoritesSection.style.display = 'none';
    if (allMoviesSection) allMoviesSection.style.display = 'none';
    if (allSeriesSection) allSeriesSection.style.display = 'none';
    if (settingsSection) settingsSection.style.display = 'none';
    if (aboutSection) aboutSection.style.display = 'none';
    if (searchSection) searchSection.style.display = 'none';

    // Actualizar navegación activa
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === page) {
            link.classList.add('active');
        }
    });

    // Actualizar sidebar
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    sidebarLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === page) {
            link.classList.add('active');
        }
    });

    // Mostrar la sección apropiada
    if (page === 'home') {
        if (moviesSection) moviesSection.style.display = 'block';
        const topRatedMoviesSection = document.getElementById('top-rated-movies-section');
        if (topRatedMoviesSection) topRatedMoviesSection.style.display = 'block';
        if (seriesSection) seriesSection.style.display = 'block';
        const topRatedSeriesSection = document.getElementById('top-rated-series-section');
        if (topRatedSeriesSection) topRatedSeriesSection.style.display = 'block';
        if (searchSection) searchSection.style.display = 'block';
    } else if (page === 'about') {
        if (aboutSection) aboutSection.style.display = 'block';
    } else if (page === 'favorites') {
        if (favoritesSection) favoritesSection.style.display = 'block';
        loadFavorites();
    } else if (page === 'movies') {
        if (allMoviesSection) allMoviesSection.style.display = 'block';
        if (searchSection) searchSection.style.display = 'block';
        displayAllMovies();
    } else if (page === 'series') {
        if (allSeriesSection) allSeriesSection.style.display = 'block';
        if (searchSection) searchSection.style.display = 'block';
        displayAllSeries();
    } else if (page === 'settings') {
        if (settingsSection) settingsSection.style.display = 'block';
    } else if (page === 'exit') {
        window.location.href = 'login.html';
    }
}

// Mostrar todas las películas
function displayAllMovies() {
    const allMoviesGrid = document.getElementById('allMoviesGrid');
    if (!allMoviesGrid) return;

    allMoviesGrid.innerHTML = '';
    allMovies.forEach(movie => {
        const card = createMovieCard(movie);
        allMoviesGrid.appendChild(card);
    });

    // Mostrar botón "Ver Más" si estamos en la página de películas y hay API key
    const loadMoreBtn = document.getElementById('loadMoreMoviesBtn');
    if (loadMoreBtn && window.location.pathname.includes('peliculas.html') && API_KEY !== 'tu_api_key_aqui' && API_KEY) {
        loadMoreBtn.style.display = 'block';
    }
}

// Mostrar todas las series
function displayAllSeries() {
    const allSeriesGrid = document.getElementById('allSeriesGrid');
    if (!allSeriesGrid) return;

    allSeriesGrid.innerHTML = '';
    allSeries.forEach(series => {
        const card = createSeriesCard(series);
        allSeriesGrid.appendChild(card);
    });

    // Mostrar botón "Ver Más" si estamos en la página de series y hay API key
    const loadMoreBtn = document.getElementById('loadMoreSeriesBtn');
    if (loadMoreBtn && window.location.pathname.includes('series.html') && API_KEY !== 'tu_api_key_aqui' && API_KEY) {
        loadMoreBtn.style.display = 'block';
    }
}

// Manejar búsqueda usando la API de TMDB con búsqueda específica por página
async function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput ? searchInput.value.trim() : '';

    if (!query) {
        // Si no hay búsqueda, volver a mostrar películas populares
        await clearSearch();
        return;
    }

    // Limpiar filtros durante la búsqueda
    const genreFilter = document.getElementById('genreFilter');
    if (genreFilter) genreFilter.value = '';

    // Verificar si hay API key configurada
    if (API_KEY === 'tu_api_key_aqui' || !API_KEY) {
        console.warn('⚠️ La búsqueda requiere una API key de TMDB. Por favor, configura tu API key en app.js');
        return;
    }

    // Determinar qué tipo de búsqueda realizar según la página actual
    const isMoviesPage = window.location.pathname.includes('peliculas.html');
    const isSeriesPage = window.location.pathname.includes('series.html');
    const isHomePage = !isMoviesPage && !isSeriesPage;

    try {
        // Mostrar loading en las grids apropiadas
        const moviesGrid = document.getElementById('moviesGrid');
        const allMoviesGrid = document.getElementById('allMoviesGrid');
        const seriesGrid = document.getElementById('seriesGrid');
        const allSeriesGrid = document.getElementById('allSeriesGrid');

        if (isMoviesPage && allMoviesGrid) {
            allMoviesGrid.innerHTML = '<div class="loading">Buscando películas...</div>';
        } else if (isHomePage && moviesGrid) {
            moviesGrid.innerHTML = '<div class="loading">Buscando películas...</div>';
        }

        if (isSeriesPage && allSeriesGrid) {
            allSeriesGrid.innerHTML = '<div class="loading">Buscando series...</div>';
        } else if (isHomePage && seriesGrid) {
            seriesGrid.innerHTML = '<div class="loading">Buscando series...</div>';
        }

        let movies = [];
        let series = [];

        // Realizar búsqueda específica según la página
        if (isMoviesPage || isHomePage) {
            // Buscar solo películas
            const movieSearchResponse = await fetch(
                `${BASE_URL}/search/movie?api_key=${API_KEY}&language=es-ES&query=${encodeURIComponent(query)}&page=1`
            );

            if (movieSearchResponse.ok) {
                const movieData = await movieSearchResponse.json();
                movies = movieData.results.filter(movie => movie.poster_path);
            }
        }

        if (isSeriesPage || isHomePage) {
            // Buscar solo series
            const seriesSearchResponse = await fetch(
                `${BASE_URL}/search/tv?api_key=${API_KEY}&language=es-ES&query=${encodeURIComponent(query)}&page=1`
            );

            if (seriesSearchResponse.ok) {
                const seriesData = await seriesSearchResponse.json();
                series = seriesData.results.filter(serie => serie.poster_path);
            }
        }

        // Ocultar secciones de mejor valoradas durante la búsqueda (solo en home)
        if (isHomePage) {
            const topRatedMoviesSection = document.getElementById('top-rated-movies-section');
            if (topRatedMoviesSection) topRatedMoviesSection.style.display = 'none';

            const topRatedSeriesSection = document.getElementById('top-rated-series-section');
            if (topRatedSeriesSection) topRatedSeriesSection.style.display = 'none';
        }

        // Procesar películas
        if ((isMoviesPage || isHomePage) && movies.length > 0) {
            allMovies = movies;
            currentMovieIndex = 0; // Resetear índice al buscar
            if (isMoviesPage) {
                displayAllMovies();
            } else {
                displayMovies();
            }
            console.log(`✅ Encontradas ${movies.length} películas para "${query}"`);
        } else if (isMoviesPage && movies.length === 0) {
            if (allMoviesGrid) {
                allMoviesGrid.innerHTML = '<div class="empty-state"><h3>No se encontraron películas</h3></div>';
            }
        } else if (isHomePage && movies.length === 0) {
            if (moviesGrid) {
                moviesGrid.innerHTML = '<div class="empty-state"><h3>No se encontraron películas</h3></div>';
            }
        }

        // Procesar series
        if ((isSeriesPage || isHomePage) && series.length > 0) {
            allSeries = series;
            currentSeriesIndex = 0; // Resetear índice al buscar
            if (isSeriesPage) {
                displayAllSeries();
            } else {
                displaySeries();
            }
            console.log(`✅ Encontradas ${series.length} series para "${query}"`);
        } else if (isSeriesPage && series.length === 0) {
            if (allSeriesGrid) {
                allSeriesGrid.innerHTML = '<div class="empty-state"><h3>No se encontraron series</h3></div>';
            }
        } else if (isHomePage && series.length === 0) {
            if (seriesGrid) {
                seriesGrid.innerHTML = '<div class="empty-state"><h3>No se encontraron series</h3></div>';
            }
        }
    } catch (error) {
        console.error('Error al buscar:', error);
        const moviesGrid = document.getElementById('moviesGrid');
        const allMoviesGrid = document.getElementById('allMoviesGrid');
        const seriesGrid = document.getElementById('seriesGrid');
        const allSeriesGrid = document.getElementById('allSeriesGrid');

        const errorMessage = '<div class="empty-state"><h3>Error al buscar</h3><p>Por favor, intenta de nuevo más tarde</p></div>';

        if (isMoviesPage && allMoviesGrid) {
            allMoviesGrid.innerHTML = errorMessage;
        } else if (isHomePage && moviesGrid) {
            moviesGrid.innerHTML = errorMessage;
        }

        if (isSeriesPage && allSeriesGrid) {
            allSeriesGrid.innerHTML = errorMessage;
        } else if (isHomePage && seriesGrid) {
            seriesGrid.innerHTML = errorMessage;
        }
    }
}

// Función para mostrar notificaciones personalizadas
function showNotification(message, type = 'info', duration = 3000) {
    const notificationContainer = document.getElementById('notificationContainer');
    if (!notificationContainer) return;

    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `custom-notification ${type}`;

    // Iconos según el tipo
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };

    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${icons[type] || icons.info}</span>
            <span class="notification-message">${message}</span>
            <span class="notification-close" onclick="this.parentElement.parentElement.remove()">×</span>
        </div>
    `;

    // Agregar al contenedor
    notificationContainer.appendChild(notification);

    // Mostrar con animación
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // Auto-remover después de la duración especificada
    if (duration > 0) {
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }, duration);
    }
}

// Agregar a favoritos
function addToFavorites(itemId, type = 'movie', itemData = null) {
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const favoriteKey = `${type}_${itemId}`;

    // Check if already in favorites
    const existingIndex = favorites.findIndex(fav => fav.key === favoriteKey);

    if (existingIndex === -1) {
        // If itemData is provided, store it; otherwise, try to find it in memory
        let dataToStore = itemData;
        if (!dataToStore) {
            if (type === 'series') {
                dataToStore = allSeries.find(s => s.id === itemId);
            } else {
                dataToStore = allMovies.find(m => m.id === itemId);
            }
        }

        if (dataToStore) {
            favorites.push({
                key: favoriteKey,
                type: type,
                id: itemId,
                data: dataToStore
            });
            localStorage.setItem('favorites', JSON.stringify(favorites));

            const itemType = type === 'series' ? 'Serie' : 'Película';
            showNotification(`${itemType} agregada a favoritos`, 'success');

            // Refresh favorites display if on favoritos.html
            if (window.location.pathname.includes('favoritos.html')) {
                loadFavorites();
            }
        } else {
            showNotification('Error: No se pudo agregar a favoritos. Datos no disponibles.', 'error');
        }
    } else {
        const itemType = type === 'series' ? 'La serie' : 'La película';
        showNotification(`${itemType} ya está en favoritos`, 'warning');
    }
}

// Función para quitar de favoritos
function removeFromFavorites(itemId, type = 'movie') {
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

    // Create the favorite key to match
    const favoriteKey = `${type}_${itemId}`;

    // Check if the item exists in favorites
    const itemExists = favorites.some(fav => fav.key === favoriteKey);

    if (itemExists) {
        // Filter out the favorite with matching key
        favorites = favorites.filter(fav => fav.key !== favoriteKey);
        localStorage.setItem('favorites', JSON.stringify(favorites));

        const itemType = type === 'series' ? 'Serie' : 'Película';
        showNotification(`${itemType} removida de favoritos`, 'info');
    } else {
        // Item was already removed
        const itemType = type === 'series' ? 'Serie' : 'Película';
        showNotification(`${itemType} ya removida de favoritos`, 'info');
    }

    // Recargar la vista de favoritos
    loadFavorites();
}

// Cargar favoritos (mejorado para trabajar con la API)
async function loadFavorites() {
    console.log('loadFavorites called');
    const favoritesGrid = document.getElementById('favoritesGrid');
    if (!favoritesGrid) {
        console.log('favoritesGrid not found');
        return;
    }

    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    console.log('Favorites from localStorage:', favorites);

    if (favorites.length === 0) {
        console.log('No favorites found');
        favoritesGrid.innerHTML = '<div class="empty-state"><h3>No tienes favoritos aún</h3></div>';
        return;
    }

    favoritesGrid.innerHTML = '<div class="loading">Cargando...</div>';

    // Check if favorites are in old format (array of strings) and migrate if needed
    if (favorites.length > 0) {
        const hasOldFormat = favorites.some(fav => typeof fav === 'string');
        if (hasOldFormat) {
            console.log('Migrating favorites from old format...');
            const migratedFavorites = [];
            for (const fav of favorites) {
                if (typeof fav === 'string') {
                    // Old format: string like "movie_123"
                    const [type, id] = fav.split('_');
                    const itemId = parseInt(id);

                    // Try to find data in memory first
                    let dataToStore = null;
                    if (type === 'series') {
                        dataToStore = allSeries.find(s => s.id === itemId);
                    } else {
                        dataToStore = allMovies.find(m => m.id === itemId);
                    }

                    if (dataToStore) {
                        migratedFavorites.push({
                            key: fav,
                            type: type,
                            id: itemId,
                            data: dataToStore
                        });
                    }
                } else {
                    // Already in new format
                    migratedFavorites.push(fav);
                }
            }
            localStorage.setItem('favorites', JSON.stringify(migratedFavorites));
            favorites.length = 0;
            favorites.push(...migratedFavorites);
        }
    }

    // Now favorites should be in new format (array of objects)
    const favoriteItems = favorites.map(fav => ({
        ...fav.data,
        _type: fav.type
    }));

    console.log('Favorite items to display:', favoriteItems);

    favoritesGrid.innerHTML = '';

    if (favoriteItems.length === 0) {
        console.log('No favorite items to display');
        favoritesGrid.innerHTML = '<div class="empty-state"><h3>No se pudieron cargar tus favoritos</h3></div>';
        return;
    }

    favoriteItems.forEach(item => {
        const card = item._type === 'series' ? createFavoriteSeriesCard(item) : createFavoriteMovieCard(item);
        console.log('Creating card for:', item.title || item.name);
        favoritesGrid.appendChild(card);
    });

    console.log('Favorites loaded successfully');
}

// Función para limpiar búsqueda y filtros, volver a contenido popular según la página
function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    const genreFilter = document.getElementById('genreFilter');
    const yearFilter = document.getElementById('yearFilter');
    const clearBtn = document.getElementById('clearBtn');

    if (searchInput) {
        searchInput.value = '';
    }

    if (genreFilter) {
        genreFilter.value = '';
    }

    if (yearFilter) {
        yearFilter.value = '';
    }

    if (clearBtn) {
        clearBtn.style.display = 'none';
    }

    // Determinar qué contenido recargar según la página actual
    const isMoviesPage = window.location.pathname.includes('peliculas.html');
    const isSeriesPage = window.location.pathname.includes('series.html');
    const isHomePage = !isMoviesPage && !isSeriesPage;

    // Mostrar secciones de mejor valoradas al limpiar búsqueda (solo en home)
    if (isHomePage) {
        const topRatedMoviesSection = document.getElementById('top-rated-movies-section');
        if (topRatedMoviesSection) topRatedMoviesSection.style.display = 'block';

        const topRatedSeriesSection = document.getElementById('top-rated-series-section');
        if (topRatedSeriesSection) topRatedSeriesSection.style.display = 'block';
    }

    // Immediately clear the grids and show loading según la página
    const moviesGrid = document.getElementById('moviesGrid');
    const allMoviesGrid = document.getElementById('allMoviesGrid');
    const seriesGrid = document.getElementById('seriesGrid');
    const allSeriesGrid = document.getElementById('allSeriesGrid');

    if (isMoviesPage && allMoviesGrid) {
        allMoviesGrid.innerHTML = '<div class="loading">Cargando...</div>';
    } else if (isHomePage && moviesGrid) {
        moviesGrid.innerHTML = '<div class="loading">Cargando...</div>';
    }

    if (isSeriesPage && allSeriesGrid) {
        allSeriesGrid.innerHTML = '<div class="loading">Cargando...</div>';
    } else if (isHomePage && seriesGrid) {
        seriesGrid.innerHTML = '<div class="loading">Cargando...</div>';
    }

    // Reset arrays and indices según la página
    if (isMoviesPage || isHomePage) {
        allMovies = [];
        currentMovieIndex = 0;
    }

    if (isSeriesPage || isHomePage) {
        allSeries = [];
        currentSeriesIndex = 0;
    }

    // Load popular content según la página
    if (isMoviesPage || isHomePage) {
        loadPopularMovies();
    }

    if (isSeriesPage || isHomePage) {
        loadPopularSeries();
    }

    // Recargar top-rated content solo en home
    if (isHomePage) {
        loadTopRatedMovies();
        loadTopRatedSeries();
    }
}



// Crear tarjeta de película con botón para eliminar
function createFavoriteMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.setAttribute('data-movie-id', movie.id);

    let posterUrl = '';
    
    if (movie.poster_path) {
        if (movie.poster_path.startsWith('http://') || movie.poster_path.startsWith('https://')) {
            posterUrl = movie.poster_path;
        } else {
            const path = movie.poster_path.startsWith('/') ? movie.poster_path : `/${movie.poster_path}`;
            posterUrl = `${IMAGE_BASE_URL}${path}`;
        }
    }
    
    const createPlaceholderSVG = (title) => {
        const text = (title || 'Sin título').substring(0, 20);
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="750" viewBox="0 0 500 750">
            <rect width="500" height="750" fill="#1a1a1a"/>
            <text x="250" y="350" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#e50914" text-anchor="middle" dominant-baseline="middle">${text}</text>
        </svg>`;
        return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
    };
    
    const fallbackPoster = createPlaceholderSVG(movie.title);
    
    if (!posterUrl) {
        posterUrl = fallbackPoster;
    }

    const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';

    card.innerHTML = `
        <div class="movie-poster-container">
            <img src="${posterUrl}"
                 alt="${movie.title || 'Película'}"
                 loading="lazy"
                 class="movie-poster-img"
                 style="width: 100%; height: 300px; object-fit: cover; display: block; background-color: var(--card-background);">
        </div>
        <div class="movie-card-info">
            <div class="movie-card-title">${movie.title || 'Sin título'}</div>
            <div class="movie-card-year">${year}</div>
            <div class="movie-card-rating">★ ${rating}</div>
        </div>
    `;

    const img = card.querySelector('.movie-poster-img');
    if (img) {
        img.addEventListener('load', function() {
            this.style.opacity = '1';
        });
        
        img.addEventListener('error', function() {
            if (this.src !== fallbackPoster && !this.src.startsWith('data:image/svg+xml')) {
                this.src = fallbackPoster;
            }
        });
        
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            if (img.complete && img.naturalHeight !== 0) {
                img.style.opacity = '1';
            }
        }, 100);
    }

    card.addEventListener('click', async (e) => {
        if (e.target.classList.contains('btn-danger')) return;
        await showMovieDetails(movie);
    });

    return card;
}

// Crear tarjeta de serie con botón para eliminar
function createFavoriteSeriesCard(series) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.setAttribute('data-series-id', series.id);

    let posterUrl = '';
    
    if (series.poster_path) {
        if (series.poster_path.startsWith('http://') || series.poster_path.startsWith('https://')) {
            posterUrl = series.poster_path;
        } else {
            const path = series.poster_path.startsWith('/') ? series.poster_path : `/${series.poster_path}`;
            posterUrl = `${IMAGE_BASE_URL}${path}`;
        }
    }
    
    const createPlaceholderSVG = (title) => {
        const text = (title || 'Sin título').substring(0, 20);
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="750" viewBox="0 0 500 750">
            <rect width="500" height="750" fill="#1a1a1a"/>
            <text x="250" y="350" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#e50914" text-anchor="middle" dominant-baseline="middle">${text}</text>
        </svg>`;
        return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
    };
    
    const fallbackPoster = createPlaceholderSVG(series.name || series.title);
    
    if (!posterUrl) {
        posterUrl = fallbackPoster;
    }

    const year = (series.first_air_date || series.release_date) ? new Date(series.first_air_date || series.release_date).getFullYear() : 'N/A';
    const rating = series.vote_average ? series.vote_average.toFixed(1) : 'N/A';
    const title = series.name || series.title || 'Sin título';
    
    card.innerHTML = `
        <div class="movie-poster-container">
            <img src="${posterUrl}"
                 alt="${title}"
                 loading="lazy"
                 class="movie-poster-img"
                 style="width: 100%; height: 300px; object-fit: cover; display: block; background-color: var(--card-background);">
        </div>
        <div class="movie-card-info">
            <div class="movie-card-title">${title}</div>
            <div class="movie-card-year">${year}</div>
            <div class="movie-card-rating">⭐ ${rating}</div>
        </div>
    `;

    const img = card.querySelector('.movie-poster-img');
    if (img) {
        img.addEventListener('load', function() {
            this.style.opacity = '1';
        });
        
        img.addEventListener('error', function() {
            if (this.src !== fallbackPoster && !this.src.startsWith('data:image/svg+xml')) {
                this.src = fallbackPoster;
            }
        });
        
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            if (img.complete && img.naturalHeight !== 0) {
                img.style.opacity = '1';
            }
        }, 100);
    }

    card.addEventListener('click', async (e) => {
        if (e.target.classList.contains('btn-danger')) return;
        await showSeriesDetails(series);
    });

    return card;
}

