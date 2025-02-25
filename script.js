/**
 * App State Management
 * Хранит глобальное состояние плеера: список песен, текущую песню и её позицию
 */

let playerState = {
  songs: [],
  currentSong: null,
  songCurrentTime: null,
  currentIndex: 0,

  //Массив индексов перемешанных треков
  shuffledIndices: [],
};

/**
 * Main Application Class
 * Отвечает за инициализацию всех компонентов и их взаимодействие
 */

class App {
  /**
   * Создает экземпляры контроллеров и делает их доступными глобально
   */
  constructor() {
    this.uiController = new UIController();
    this.audioController = new AudioController();

    window.uiController = this.uiController;
    window.audioController = this.audioController;
  }

  /**
   * Инициализирует приложение и загружает начальные данные
   */
  async init() {
    // Здесь запускаем инициализацию
    await this.audioController.init();
  }
}

window.addEventListener("load", async () => {
  const app = new App();
  await app.init();
});

/**
 * Audio Controller
 * Управляет логикой воспроизведения:
 * - воспроизведение/пауза
 * - переключение треков
 * - управление прогрессом
 * - загрузка данных
 */

class AudioController {
  /**
   * Инициализирует аудио элемент и устанавливает начальные настройки
   */
  constructor() {
    this.audio = new Audio();
    this.progressTimer = null;
    this.audio.autoplay = false;
    this.audio.loop = false;

    // Добавление свойства для режима воспроизведения
    this.playMode = "repeat-all"; // Возможные значения: 'repeat-all', 'repeat-one', 'shuffle'

    this.setupAudioEventListeners();
  }

  /**
   * Загружает список песен и устанавливает начальный трек
   */
  async init() {
    await this.getSongs();
    await this.updateCurrentSong();

    // Предварительно перемешиваем плейлист в фоне
    this.shuffleSongs();
  }

  /**
   * Запускает воспроизведение текущего трека
   * Устанавливает src и currentTime, запускает обновление прогресса
   */
  async play() {
    try {
      this.audio.src = playerState.currentSong.src;
      if (playerState?.currentSong === null) {
        this.audio.currentTime = 0;
      } else {
        this.audio.currentTime = playerState.songCurrentTime;
      }
      await this.audio.play(); // ждем завершения операции
      this.startProgressUpdate();
      uiController.buttonsEffectsOnPlay();
    } catch (error) {
      console.error("Ошибка воспроизведения:", error);
    }
  }

  /**
   * Ставит воспроизведение на паузу
   * Сохраняет текущую позицию и останавливает обновление прогресса
   */
  pause() {
    playerState.songCurrentTime = this.audio.currentTime;
    this.audio.pause();
    this.stopProgressUpdate();
    uiController.buttonsEffectsOnPause();
  }

  /**
   * Переключает на следующий трек в плейлисте
   * Останавливает текущий прогресс, обновляет индекс и запускает новый трек
   */
  nextSong() {
    this.stopProgressUpdate(); // останавливаем перед сменой трека
    uiController.updateProgress(0, 0);
    this.audio.autoplay = true;

    //Случай работы в shuffle моде
    if (this.playMode === "shuffle") {
      // Находим текущий индекс в перемешанном массиве
      const currentShuffleIndex = playerState.shuffledIndices.indexOf(
        playerState.currentIndex
      );

      // Переходим к следующему в перемешанном списке или возвращаемся к началу
      const nextShuffleIndex =
        (currentShuffleIndex + 1) % playerState.shuffledIndices.length;

      // Обновляем текущий индекс
      playerState.currentIndex = playerState.shuffledIndices[nextShuffleIndex];
    } else {
      // Циклическое переключение треков
      playerState.currentIndex === playerState.songs.length - 1
        ? (playerState.currentIndex = 0)
        : (playerState.currentIndex += 1);
    }

    playerState.songCurrentTime = 0;
    this.updateCurrentSong();
    this.startProgressUpdate();
    uiController.buttonsEffectsOnPlay();
  }

  /**
   * Переключает на предыдущий трек в плейлисте
   * Логика аналогична nextSong, но в обратном направлении
   */
  prevSong() {
    this.stopProgressUpdate(); // останавливаем перед сменой трека
    this.audio.autoplay = true;

    if (this.playMode === "shuffle") {
      // Находим текущий индекс в перемешанном массиве
      const currentShuffleIndex = playerState.shuffledIndices.indexOf(
        playerState.currentIndex
      );

      // Переходим к предыдущему в перемешанном списке или к последнему, если в начале
      const prevShuffleIndex =
        (currentShuffleIndex - 1 + playerState.shuffledIndices.length) %
        playerState.shuffledIndices.length;

      // Обновляем текущий индекс
      playerState.currentIndex = playerState.shuffledIndices[prevShuffleIndex];
    } else {
      // Циклическое переключение треков
      playerState.currentIndex === 0
        ? (playerState.currentIndex = playerState.songs.length - 1)
        : (playerState.currentIndex -= 1);
    }

    playerState.songCurrentTime = 0;
    this.updateCurrentSong();
    this.startProgressUpdate();
    uiController.buttonsEffectsOnPlay();
  }

  /**
   * Включает/выключает режим повтора текущего трека (в работе)
   */
  togglePlayMode() {
    switch (this.playMode) {
      case "repeat-all":
        this.playMode = "repeat-one";
        this.audio.loop = true;
        break;
      case "repeat-one":
        this.playMode = "shuffle";
        this.audio.loop = false;
        // Если перемешанный массив не создан, создаем его
        if (!playerState.shuffledIndices.length) {
          this.shuffleSongs();
        }
        break;
      case "shuffle":
        this.playMode = "repeat-all";
        this.audio.loop = false;
        break;
      default:
        this.playMode = "repeat-all"; // На случай некорректного значения
        this.audio.loop = false;
    }

    // Обновляем UI
    uiController.updatePlayModeUI(this.playMode);
    console.log(`Режим воспроизведения изменен на: ${this.playMode}`);
  }

  /**
   * Запускает интервал для обновления прогресс-бара
   * Каждые 100мс вычисляет текущий прогресс и передает данные в UI
   */
  startProgressUpdate() {
    if (!this.progressTimer) {
      this.progressTimer = setInterval(() => {
        if (!this.audio.paused && !this.audio.ended) {
          // Получаем текущее время воспроизведения
          const currentTime = this.audio.currentTime;
          const duration = playerState.currentSong.duration;
          const songDurationInSeconds = TimeManagement.totalTime(duration);

          // Вычисляем процент прогресса
          const progressPercent = (currentTime / songDurationInSeconds) * 100;

          // Обновляем UI с актуальными данными
          uiController.updateProgress(progressPercent, currentTime);
        }
      }, 100);
    } else {
      console.log("уже запущен");
    }
  }

  /**
   * Останавливает обновление прогресс-бара
   * Очищает интервал и сбрасывает таймер
   */
  stopProgressUpdate() {
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
  }

  /**
   * Обновляет текущую песню в плеере
   * Загружает список песен, устанавливает текущий трек и обновляет UI
   */
  async updateCurrentSong() {
    try {
      const songList = await this.getSongs();
      playerState.currentSong = songList[playerState.currentIndex];
      this.audio.src = playerState.currentSong.src;
      console.log(
        "Сейчас играет песня:",
        playerState.currentSong.title,
        playerState.currentSong.id
      );
      uiController.renderSong(playerState.currentSong);
    } catch (error) {
      console.error("Ошибка обновления трека:", error);
    }
  }

  /**
   * Загружает список песен из JSON файла
   * @returns {Promise<Array>} Массив песен
   */
  async getSongs() {
    try {
      const response = await fetch("./songs.json");
      const res = await response.json();
      const previousLength = playerState.songs.length;
      playerState.songs = [...res];
      return playerState.songs;
    } catch (error) {
      console.error("Ошибка загрузки списка песен:", error);
    }
  }

  /**
   * Устанавливает позицию воспроизведения на указанный процент
   * @param {number} percentage - Процент от общей длительности трека
   */
  seekTo(percentage) {
    const duration = TimeManagement.totalTime(playerState.currentSong.duration);
    const newTime = (duration * percentage) / 100;
    playerState.songCurrentTime = newTime;

    if (this.audio.paused) {
      this.play();
    } else {
      this.audio.currentTime = newTime;
    }
    const progressPercent = (newTime / duration) * 100;
    uiController.updateProgress(progressPercent, newTime);
  }

  /**
   * Перемешивает порядок воспроизведения треков
   * Создает новый массив индексов в случайном порядке
   */
  shuffleSongs() {
    const totalTracks = playerState.songs.length;

    // Создаем массив с индексами всех треков [0, 1, 2, ..., n-1]
    const indices = Array.from({ length: totalTracks }, (_, i) => i);

    // Перемешиваем массив используя алгоритм Фишера-Йейтса
    for (let i = indices.length - 1; i > 0; i--) {
      // Выбираем случайный индекс от 0 до i
      const j = Math.floor(Math.random() * (i + 1));

      // Меняем местами элементы i и j
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    // Сохраняем перемешанный массив индексов
    playerState.shuffledIndices = indices;

    console.log("Плейлист перемешан:", playerState.shuffledIndices);
  }

  /**
   * Устанавливает позицию воспроизведения на указанный процент
   * @param {number} percentage - Процент от общей длительности трека
   */
  setupAudioEventListeners() {
    // При окончании трека переключаем на следующий
    this.audio.addEventListener("ended", () => {
      if (this.playMode === "repeat-one") {
        // В режиме repeat-one трек автоматически повторяется благодаря audio.loop = true
      } else if (
        this.playMode === "shuffle" ||
        this.playMode === "repeat-all"
      ) {
        this.nextSong(); // Используем обновленный nextSong
      }
    });

    // При постановке на паузу обновляем UI
    this.audio.addEventListener("pause", () => {
      uiController.onTrackPause();
    });

    // При начале воспроизведения обновляем UI
    this.audio.addEventListener("play", () => {
      uiController.onTrackPlay();
    });
  }
}

/**
 * UI Controller
 * Отвечает за отображение и обновление интерфейса:
 * - рендеринг информации о треке
 * - обновление прогресс-бара
 * - обработка пользовательских действий
 */

class UIController {
  /**
   * Инициализирует ссылки на DOM элементы и устанавливает обработчики событий
   */
  constructor() {
    // Элементы отображения информации о треке
    this.wallpaper = document.getElementById("wrapper");
    this.songIcon = document.getElementById("song-icon");
    this.songAuthor = document.getElementById("song-author");
    this.songTitle = document.getElementById("song-title");

    // Кнопки управления
    this.playButton = document.getElementById("play");
    this.pauseButton = document.getElementById("pause");
    this.nextButton = document.getElementById("next");
    this.prevButton = document.getElementById("prev");
    this.playModeButton = document.getElementById("play-mode");

    // Элементы прогресс-бара
    this.progressBar = document.getElementById("progressBar");
    this.progressThumb = document.getElementById("progressCurrentTime");
    this.timeStamp = document.getElementById("time-stamp");

    // Обработчики событий UI
    this.setupUIEventListeners();
  }

  /**
   * Обновляет отображение информации о текущем треке
   * @param {Object} song - Объект с данными о песне
   */
  renderSong(song) {
    this.wallpaper.style.background = `url(${song.wallpaper}) no-repeat center`;
    this.wallpaper.style.backgroundSize = "cover";
    this.songIcon.src = `${song.icon}`;
    this.songAuthor.textContent = `${song.artist}`;
    this.songTitle.textContent = `${song.title} ${song.duration}`;
  }

  /**
   * Обновляет состояние кнопок при воспроизведении
   */
  buttonsEffectsOnPlay() {
    this.playButton.classList.add("active");
    this.pauseButton.classList.remove("active");
  }

  /**
   * Обновляет состояние кнопок при паузе
   */
  buttonsEffectsOnPause() {
    this.playButton.classList.remove("active");
    this.pauseButton.classList.add("active");
  }

  /**
   * Обновляет прогресс-бар и отображение времени
   * @param {number} progress - Процент прогресса (0-100)
   * @param {number} currentTime - Текущее время в секундах
   */
  updateProgress(progress, currentTime) {
    this.progressThumb.style.width = progress + "%";
    this.timeStamp.textContent = TimeManagement.secondsConverter(currentTime);
  }

  /**
   * Обработчик события паузы трека
   * Добавляет визуальный эффект паузы для иконки
   */
  onTrackPause() {
    this.songIcon.classList.add("paused");
  }

  /**
   * Обработчик события воспроизведения трека
   * Убирает визуальный эффект паузы
   */
  onTrackPlay() {
    this.songIcon.classList.remove("paused");
  }

  /**
   * Обновляет отображение кнопки режима воспроизведения
   * @param {string} mode - Текущий режим ('repeat-all', 'repeat-one', 'shuffle')
   */

  updatePlayModeUI(mode) {
    // Резет всех классов
    this.playModeButton.classList.remove("repeat-all", "repeat-one", "shuffle");

    this.playModeButton.classList.add(mode);

    let modeText = "Repeat all tracks";
    if (mode === "repeat-one") {
      modeText = "Repeat current track";
    } else if (mode === "shuffle") {
      modeText = "Shuffle play";
    }

    this.playModeButton.setAttribute("aria-label", modeText);
    this.playModeButton.setAttribute("title", modeText);
  }

  /**
   * Устанавливает обработчики событий для элементов UI
   */
  setupUIEventListeners() {
    // Обработчики кнопок управления
    this.playButton.addEventListener("click", () => audioController.play());
    this.pauseButton.addEventListener("click", () => audioController.pause());
    this.nextButton.addEventListener("click", () => audioController.nextSong());
    this.prevButton.addEventListener("click", () => audioController.prevSong());
    this.playModeButton.addEventListener("click", () =>
      audioController.togglePlayMode()
    );

    // Обработчик клика по прогресс-бару для перемотки
    this.progressBar.addEventListener("click", (e) => {
      const progressBarWidth = this.progressBar.offsetWidth;
      const clickPosition =
        e.clientX - this.progressBar.getBoundingClientRect().left;
      const percentage = (clickPosition * 100) / progressBarWidth;

      // Передаем обработку в AudioController
      audioController.seekTo(percentage);
    });
  }
}

/**
 * Time Management Utility Class
 * Статические методы для работы со временем:
 * - конвертация времени из формата MM:SS в секунды
 * - форматирование секунд в MM:SS
 */

class TimeManagement {
  /**
   * Конвертирует время из формата "MM:SS" в секунды
   * @param {string} time - Время в формате "MM:SS"
   * @returns {number} Общее количество секунд
   */
  static totalTime(time) {
    const [minutes, seconds] = time.split(":").map(Number);
    return minutes * 60 + seconds;
  }

  /**
   * Конвертирует секунды в формат "MM:SS"
   * @param {number} sec - Время в секундах
   * @returns {string} Отформатированное время в виде "MM:SS"
   */
  static secondsConverter(sec) {
    const allSeconds = Math.floor(sec);
    const minutes = Math.floor(allSeconds / 60);
    const seconds = allSeconds % 60;
    const resultingMinutes = String(minutes).padStart(2, "0");
    const resultingSeconds = String(seconds).padStart(2, "0");
    return `${resultingMinutes}:${resultingSeconds}`;
  }
}
