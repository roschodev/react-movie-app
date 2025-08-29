import { useEffect, useState } from 'react'
import './App.css'
import Search from "./components/Search.jsx";
import Spinner from "./components/Spinner.jsx";
import MovieCard from "./components/MovieCard.jsx";
import { useDebounce } from "react-use";
import { getTrendingMovies, updateSearchCount } from "./appwrite.js";
import SideBar from './components/SideBar.jsx';
import { FaBuffer, FaBrain, FaCalendar, FaAddressBook, FaAddressCard } from 'react-icons/fa';

// ======== API SETTINGS ========
const API_BASE_URL = 'https://api.themoviedb.org/3'
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const API_OPTIONS = {
  method: "GET",
  apiKey: API_KEY,
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_KEY}`
  }
}

// ======== DAILY LIMITS  ========
const DAILY_TMDB_LIMIT = 200;
const DAILY_APPWRITE_LIMIT = 200;
const LS_KEYS = {
  tmdb: 'quota:tmdb',
  appwrite: 'quota:appwrite',
  countedQueries: 'counted:queries',
};

// ======== TIME HELPER  ========
function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ======== QUOTA HELPERS  ========
function readBucket(key) {
  const t = todayStr();
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      const fresh = { date: t, count: 0 };
      localStorage.setItem(key, JSON.stringify(fresh));
      return fresh;
    }
    const parsed = JSON.parse(raw);
    if (parsed.date !== t) {
      const fresh = { date: t, count: 0 };
      localStorage.setItem(key, JSON.stringify(fresh));
      return fresh;
    }
    return parsed;
  } catch {
    const fresh = { date: t, count: 0 };
    localStorage.setItem(key, JSON.stringify(fresh));
    return fresh;
  }
}

function canSpend(key, limit) {
  const bucket = readBucket(key);
  return bucket.count < limit;
}

function spend(key) {
  const bucket = readBucket(key);
  const next = { ...bucket, count: bucket.count + 1 };
  localStorage.setItem(key, JSON.stringify(next));
}

function callsLeft(key, limit) {
  const bucket = readBucket(key);
  return Math.max(limit - bucket.count, 0);
}

function wasQueryCountedToday(q) {
  const t = todayStr();
  try {
    const raw = localStorage.getItem(LS_KEYS.countedQueries);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || parsed.date !== t) return false;
    return parsed.items.includes(q.toLowerCase());
  } catch {
    return false;
  }
}

function markQueryCountedToday(q) {
  const t = todayStr();
  try {
    const raw = localStorage.getItem(LS_KEYS.countedQueries);
    let parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || parsed.date !== t) parsed = { date: t, items: [] };
    const set = new Set(parsed.items);
    set.add(q.toLowerCase());
    parsed.items = Array.from(set);
    localStorage.setItem(LS_KEYS.countedQueries, JSON.stringify(parsed));
  } catch {
    // ignore
  }
}

// =========== ICONS/STYLE ============
const globalIconBgColor = "bg-gray-900";
const globalHoverColor = "hover:bg-gray-800";
const globalIconColor = "text-purple-400";
const barColor = "bg-gray-900";
const iconSpacing = "mt-0";

const iconSize = "w-12 h-12";
const sizeMatch = iconSize.match(/w-(\d+)/);
const baseSize = sizeMatch ? parseInt(sizeMatch[1], 10) : 6;
const dividedSize = baseSize / 3;
const dividedSizeRem = `${dividedSize * 0.25}rem`;

const sidebarItems = [
  { icon: <FaBuffer size={dividedSizeRem} />, tooltip: 'Bottom Icon', iconColor: globalIconColor, index: 0, groupIndex: 0, iconBgColor: globalIconBgColor, hoverColor: globalHoverColor, iconSize: iconSize },
  { icon: <FaBrain size={dividedSizeRem}/>, tooltip: 'Bottom Icon', iconColor: globalIconColor, index: 1, groupIndex: 0, iconBgColor: globalIconBgColor, hoverColor: globalHoverColor, iconSize: iconSize },
  { icon: <FaCalendar size={dividedSizeRem} />, tooltip: 'Bottom Icon', iconColor: globalIconColor, index: 2, groupIndex: 0, iconBgColor: globalIconBgColor, hoverColor: globalHoverColor, iconSize: iconSize },
  { icon: <FaAddressBook size={dividedSizeRem} />, tooltip: 'Bottom Icon', iconColor: globalIconColor, index: 0, groupIndex: 1, iconBgColor: globalIconBgColor, hoverColor: globalHoverColor, iconSize: iconSize },
  { icon: <FaAddressCard size={dividedSizeRem}/>, tooltip: 'Bottom Icon', iconColor: globalIconColor, index: 1, groupIndex: 1, iconBgColor: globalIconBgColor, hoverColor: globalHoverColor, iconSize: iconSize },
];

const App = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [movieList, setMovieList] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [trendingMovies, setTrendingMovies] = useState([])

  // quota counters
  const [tmdbLeft, setTmdbLeft] = useState(() => callsLeft(LS_KEYS.tmdb, DAILY_TMDB_LIMIT));
  const [appwriteLeft, setAppwriteLeft] = useState(() => callsLeft(LS_KEYS.appwrite, DAILY_APPWRITE_LIMIT));

  useDebounce(() => setDebouncedSearchTerm(searchTerm), 500, [searchTerm])

  const fetchMovies = async ({ query = '' }) => {
    if (!canSpend(LS_KEYS.tmdb, DAILY_TMDB_LIMIT)) {
      setErrorMessage(`Daily TMDB request limit reached. Please try again tomorrow.`);
      return;
    }

    if (query && query.trim().length < 3) return;

    setIsLoading(true);
    setErrorMessage("");

    try {
      const endpoint = query
        ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
        : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;

      const response = await fetch(endpoint, API_OPTIONS)
      if (!response.ok) throw new Error("Error");

      spend(LS_KEYS.tmdb);
      setTmdbLeft(callsLeft(LS_KEYS.tmdb, DAILY_TMDB_LIMIT));

      const data = await response.json()
      const results = data.results || [];
      setMovieList(results);

      if (query && results.length > 0 && canSpend(LS_KEYS.appwrite, DAILY_APPWRITE_LIMIT) && !wasQueryCountedToday(query)) {
        try {
          await updateSearchCount(query, results[0]);
          spend(LS_KEYS.appwrite);
          markQueryCountedToday(query);
          setAppwriteLeft(callsLeft(LS_KEYS.appwrite, DAILY_APPWRITE_LIMIT));
        } catch (e) {
          console.warn('Appwrite updateSearchCount failed:', e);
        }
      }
    } catch (error) {
      setErrorMessage(`Error Fetching movies: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const loadTrendingMovies = async () => {
    try {
      const movies = await getTrendingMovies();
      setTrendingMovies(movies);
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    fetchMovies({ query: debouncedSearchTerm });
  }, [debouncedSearchTerm]);

  useEffect(() => {
    loadTrendingMovies()
  }, []);

  return (
    <main>
      <div className="pattern"/>
      <div className="wrapper">
        <header>
          <img src="./hero-img.png" alt="Hero Banner" />
          <h1>
            Find <span className="text-gradient">Movies</span> You'll Enjoy Without the Hassle
          </h1>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

          {/* ✅ Show quota counters */}
          <p className="mt-2 text-sm text-gray-400">
            TMDB calls left today: {tmdbLeft} / {DAILY_TMDB_LIMIT} <br />
            Appwrite writes left today: {appwriteLeft} / {DAILY_APPWRITE_LIMIT}
          </p>
        </header>

        {trendingMovies.length > 0 && (
          <section className="trending">
            <h2>Trending Movies</h2>
            <ul>
              {trendingMovies.map((movie, index) => (
                <li key={movie.$id}>
                  <p>{index + 1}</p>
                  <img src={movie.poster_url} alt={movie.title} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="all-movies">
          <h2>All Movies</h2>
          {isLoading ? (
            <Spinner />
          ) : errorMessage ? (
            <p className="text-red-500">{errorMessage}</p>
          ) : (
            <ul>
              {movieList.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}

export default App
