const songIcon = document.getElementById("song-icon");
const wallpaper = document.getElementById("wrapper");

const songAuthor = document.getElementById("song-author");
const songTitle = document.getElementById("song-title");

const progressBar = document.getElementById("progressBar");
const progressThumb = document.getElementById("progressCurrentTime");

const playButton = document.getElementById("play");
const pauseButton = document.getElementById("pause");
const nextButton = document.getElementById("next");
const prevButton = document.getElementById("prev");
const timeStamp = document.getElementById("time-stamp");

let userData = {
  songs: [],
  currentSong: null,
  songCurrentTime: null,
};

let counter = 0;

let intervalId;

const audio = new Audio();

const playAudio = () => {
  audio.src = userData.currentSong.src;
  if (userData?.currentSong === null) {
    audio.currentTime = 0;
  } else {
    audio.currentTime = userData.songCurrentTime;
  }
  audio.play();
  updateProgressBar();
  buttonsEffectsOnPlay();
};

const pauseAudio = () => {
  userData.songCurrentTime = audio.currentTime;
  audio.pause();
  buttonsEffectsOnPause();
};

const nextSong = () => {
  // clearInterval(intervalId);
  audio.autoplay = true;
  counter === userData.songs.length - 1 ? (counter = 0) : (counter += 1);
  userData.songCurrentTime = 0;
  updateCurrentSong();
  buttonsEffectsOnPlay();
};

const prevSong = () => {
  audio.autoplay = true;
  counter === 0 ? (counter = userData.songs.length - 1) : (counter -= 1);
  userData.songCurrentTime = 0;
  updateCurrentSong();
  buttonsEffectsOnPlay();
};

const getSongs = async () => {
  try {
    const response = await fetch("./songs.json");
    const res = await response.json();
    userData.songs = [...res];
    return userData.songs;
  } catch (error) {
    console.error("Что-то сломалось", error);
  }
};

const updateCurrentSong = async () => {
  try {
    const songList = await getSongs();
    userData.currentSong = songList[counter];
    audio.src = userData.currentSong.src;
    console.log(
      "Сейчас играет песня:",
      userData.currentSong.title,
      userData.currentSong.id
    );
    renderSong(userData.currentSong);
  } catch (error) {
    console.error("Что то пошло не так", error);
  }
};

const renderSong = (song) => {
  wallpaper.style.background = `url(${song.wallpaper}) no-repeat center`;
  wallpaper.style.backgroundSize = "cover";
  songIcon.src = `${song.icon}`;
  songAuthor.textContent = `${song.artist}`;
  songTitle.textContent = `${song.title} ${song.duration}`;
};

const buttonsEffectsOnPlay = () => {
  playButton.classList.add("active");
  pauseButton.classList.remove("active");
};

const buttonsEffectsOnPause = () => {
  playButton.classList.remove("active");
  pauseButton.classList.add("active");
};

const updateProgressBar = () => {
  const duration = userData.currentSong.duration;

  if (!intervalId) {
    intervalId = setInterval(() => {
      if (!audio.paused && !audio.ended) {
        const currentTime = audio.currentTime;
        const songDurationInSeconds = totalTime(duration);
        const progressPercent = (currentTime / songDurationInSeconds) * 100;
        progressThumb.style.width = progressPercent + "%";
        const songDurationToShow = secondsConverter(audio.currentTime);
        timeStamp.textContent = `${songDurationToShow}`;
      }
    }, 100);
  } else {
    console.log("уже запущен");
  }
};

const stopInterval = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("Interval stopped");
  }
};

const totalTime = (time) => {
  const [minutes, seconds] = time.split(":").map(Number);
  return minutes * 60 + seconds;
};

const secondsConverter = (sec) => {
  const allSeconds = Math.floor(sec);
  const minutes = Math.floor(allSeconds / 60);
  const seconds = allSeconds % 60;
  const resultingMinutes = String(minutes).padStart(2, "0");
  const resultingSeconds = String(seconds).padStart(2, "0");
  return `${resultingMinutes}:${resultingSeconds}`;
};

playButton.addEventListener("click", playAudio);
pauseButton.addEventListener("click", pauseAudio);
nextButton.addEventListener("click", nextSong);
prevButton.addEventListener("click", prevSong);

audio.addEventListener("ended", nextSong);

audio.addEventListener("pause", () => {
  songIcon.classList.add("paused");
});
audio.addEventListener("play", () => {
  songIcon.classList.remove("paused");
});

progressBar.addEventListener("click", (e) => {
  const progressBarWidth = progressBar.offsetWidth;

  const clickPosition = e.clientX - progressBar.getBoundingClientRect().left;
  const percentage = (clickPosition * 100) / progressBarWidth;

  // Получаем длительность текущего трека в секундах
  const duration = totalTime(userData.currentSong.duration);

  // Вычисляем новое время
  const newSongTime = (duration * percentage) / 100;

  // Сохраняем новое время
  userData.songCurrentTime = newSongTime;

  if (audio.paused) {
    playAudio();
  } else {
    // Устанавливаем новое время воспроизведения
    audio.currentTime = newSongTime;
  }
});

window.addEventListener("load", function () {
  getSongs();
  updateCurrentSong();
});
