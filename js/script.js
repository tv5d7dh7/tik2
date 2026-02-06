(function () {
  window.addEventListener('popstate', function () {
    for (i = 0; i < 10; i++) {
      window.history.pushState('target', '', location.href);
    }
  });
  window.history.pushState('target', '', location.href);
})();

document.querySelectorAll('.review__text').forEach((elem) => {
  elem.addEventListener('click', () => {
    elem.classList.toggle('webkit');
  });
});

function convertNumbersToBengali(inputString) {
  const arabicToBengaliMap = {
    0: '০',
    1: '১',
    2: '২',
    3: '৩',
    4: '৪',
    5: '৫',
    6: '৬',
    7: '৭',
    8: '৮',
    9: '৯',
  };

  return inputString.replace(/[0-9]/g, function (match) {
    return arabicToBengaliMap[+match];
  });
}
const locale = document.documentElement.getAttribute('lang');
if (locale === 'bn') {
  const elementsWithNumbers = document.querySelectorAll('[data-number]');

  elementsWithNumbers.forEach((elem) => {
    elem.innerHTML = convertNumbersToBengali(elem.getAttribute('data-number'));
  });
}

const helpers = {
  decode: (value) => {
    const decode = document.createElement('textarea');
    decode.innerHTML = value;
    return decode.innerText;
  },
};
class ExpandButton {
  constructor(buttonId, textId, shadowSelector) {
    this.button = document.getElementById(buttonId);
    this.text = document.getElementById(textId);
    this.shadow = document.querySelector(shadowSelector);
    this.showText = this.button.getAttribute('data-show');
    this.hideText = this.button.getAttribute('data-hide');

    this.init();
  }

  init() {
    this.button.innerText = this.showText;
    this.button.addEventListener('click', () => this.toggle());
  }

  toggle() {
    if (this.button.innerText === this.showText) {
      this.button.innerText = this.hideText;
      this.text.classList.remove('collapsed');
      this.shadow.style.display = 'none';
    } else {
      this.button.innerText = this.showText;
      this.text.classList.add('collapsed');
      this.shadow.style.display = 'block';
    }
  }
}

class ThemeManager {
  constructor() {
    this.darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  }

  applyTheme() {
    if (window.matchMedia && this.darkQuery.matches) {
      document.body.classList.add('theme-dark');
    } else {
      document.body.classList.add('theme-light');
    }
    this.darkQuery.addEventListener('change', this.handleChange.bind(this));
  }

  handleChange(event) {
    if (event.matches) {
      document.body.classList.remove('theme-light');
      document.body.classList.add('theme-dark');
    } else {
      document.body.classList.remove('theme-dark');
      document.body.classList.add('theme-light');
    }
  }
}
class CommentManager {
  constructor() {
    this.STORAGE_KEY = 'commentDates';
    this.ONE_WEEK = 7 * 24 * 60 * 60 * 1000; // тиждень у мілісекундах
    this.lastAppliedCount = 0;
    this.observer = null;
  }

  getSortedCommentDates(count) {
    const today = new Date();
    let dates = [];
    dates.push(today);
    let usedDays = new Set([1]);

    while (dates.length < count) {
      let daysAgo = Math.floor(Math.random() * 30) + 1;

      // Якщо унікальні дати закінчилися, просто додаємо повтори
      if (usedDays.size >= 30) {
        daysAgo = Math.floor(Math.random() * 30) + 1;
      } else {
        while (usedDays.has(daysAgo)) {
          daysAgo = Math.floor(Math.random() * 30) + 1;
        }
        usedDays.add(daysAgo);
      }

      let commentDate = new Date();
      commentDate.setUTCDate(today.getUTCDate() - daysAgo);
      dates.push(commentDate);
    }

    dates.sort((a, b) => b - a);
    return dates.map((date) => {
      const day = String(date.getUTCDate()).padStart(2, '0');
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const year = String(date.getUTCFullYear()).slice(-2);
      return `${day}.${month}.${year}`;
    });
  }

  getNextDay(dateStr) {
    const [day, month, year] = dateStr.split('.').map(Number);
    const inputDate = new Date(2000 + year, month - 1, day);
    const today = new Date();

    if (
      inputDate.getDate() === today.getDate() &&
      inputDate.getMonth() === today.getMonth() &&
      inputDate.getFullYear() === today.getFullYear()
    ) {
      return dateStr;
    }

    inputDate.setDate(inputDate.getDate() + 1);

    const newDay = String(inputDate.getDate()).padStart(2, '0');
    const newMonth = String(inputDate.getMonth() + 1).padStart(2, '0');
    const newYear = String(inputDate.getFullYear()).slice(-2);

    return `${newDay}.${newMonth}.${newYear}`;
  }

  getStoredDates() {
    const storedData = localStorage.getItem(this.STORAGE_KEY);
    if (storedData) {
      const { dates, timestamp } = JSON.parse(storedData);
      if (Date.now() - timestamp < this.ONE_WEEK) {
        return dates;
      }
    }
    return null;
  }

  saveDates(dates) {
    localStorage.setItem(
      this.STORAGE_KEY,
      JSON.stringify({ dates, timestamp: Date.now() }),
    );
  }

  applyAutoComments() {
    const commentElements = document.querySelectorAll('.commentWrapper');
    if (commentElements.length > 0) {
      const neededCount = commentElements.length;
      let sortedDates = this.getStoredDates();
      if (!sortedDates || sortedDates.length < neededCount) {
        sortedDates = this.getSortedCommentDates(neededCount);
        this.saveDates(sortedDates);
      }

      commentElements.forEach((element, index) => {
        const commentDate = element.querySelector('.commentDate');
        if (commentDate) {
          commentDate.setAttribute('data-number', sortedDates[index]);
          commentDate.textContent = sortedDates[index];
        }
        const answer = element.querySelector('.commentAnswerDate');
        if (answer) {
          answer.textContent = this.getNextDay(sortedDates[index]);
        }
      });
      this.lastAppliedCount = neededCount;
    }
  }

  observeAutoComments() {
    if (this.observer) {
      return;
    }

    this.observer = new MutationObserver(() => {
      const currentCount = document.querySelectorAll('.commentWrapper').length;
      if (currentCount > this.lastAppliedCount) {
        this.applyAutoComments();
      }
    });

    this.observer.observe(document.body, { childList: true, subtree: true });
  }
}

class LogoLoaderAnimator {
  constructor(installTime = 5000) {
    this.installTime = installTime;
    this.interval = null;
    this.percent = 0;
    this.loadingStep = Math.trunc(100 / ((installTime / 1000) * 2));

    const mainHeader = document.querySelector('.main-header');
    this.elements = {
      buttons: document.querySelectorAll('.install-button'),
      mainHeader,
      programLogoImg: mainHeader.querySelector('.program-logo img'),
      showbox: mainHeader.querySelector('.showbox'),
      donut: mainHeader.querySelector('.donut'),
      programInfoFirst: mainHeader.querySelector('.program-info-first'),
      programInfoInstal: mainHeader.querySelector('.program-info-instal'),
      wait: mainHeader.querySelector('.wait'),
      waitPercent: mainHeader.querySelector('.wait-percent'),
      waitPercentValue: mainHeader.querySelector('.wait-percent__value'),
      donutSegment2: mainHeader.querySelector('.donut .donut-segment-2'),
      waitInstall: mainHeader.querySelector('.wait-install'),
      loader: mainHeader.querySelector('.showbox .loader'),
      svgItem: mainHeader.querySelector('.svg-item'),
      circularPath: mainHeader.querySelector('.circular > .path'),
    };
  }

  async start() {
    const el = this.elements;
    this.percent = 0;

    el.buttons.forEach((btn) => {
      btn.classList.add('click-none');
      btn.style.background = '#e3e3e3';
    });

    el.programLogoImg.classList.add('transform');
    el.showbox.style.opacity = '1';
    el.donut.style.opacity = '0';
    el.donut.classList.add('rotate');
    el.mainHeader.classList.add('collumn');
    el.programInfoFirst.classList.add('none');
    el.programInfoInstal.classList.add('open');

    await this._asyncTimeout(() => {
      el.wait.style.display = 'none';
      el.waitPercent.style.display = 'block';
      el.svgItem.classList.remove('none');
      el.loader.style.opacity = '0';
      el.donut.style.opacity = '1';

      this.interval = setInterval(async () => {
        this.percent += this.loadingStep;
        el.waitPercentValue.innerHTML = `${this.percent}`;
        el.donutSegment2.style.strokeDasharray = `${this.percent}, ${100 - this.percent}`;

        if (
          this.percent >= 100 ||
          (typeof installerEntity !== 'undefined' &&
            installerEntity.status === 'ready')
        ) {
          clearInterval(this.interval);
          this.interval = null;

          await this._asyncTimeout(() => {
            el.waitPercent.style.display = 'none';
            el.waitInstall.style.display = 'block';
            el.svgItem.classList.add('none');
            el.loader.style.opacity = '1';
            el.circularPath.style.stroke = '#00a173';
          }, 1000);

          const timeout =
            typeof installerEntity !== 'undefined' &&
            installerEntity.status === 'ready'
              ? 500
              : 5000;

          await this._asyncTimeout(() => this.stop(), timeout);
        }
      }, 500);
    }, 5000);
  }

  stop() {
    const el = this.elements;

    el.buttons.forEach((btn) => {
      btn.classList.remove('click-none');
      btn.style.background = 'var(--c-grean)';
    });

    el.waitInstall.style.display = 'none';
    el.programInfoFirst.classList.remove('none');
    el.programInfoInstal.classList.remove('open');
    el.loader.style.opacity = '0';
    el.showbox.style.opacity = '0';
    el.programLogoImg.classList.remove('transform');

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  _asyncTimeout(fn, delay) {
    return new Promise((resolve) => {
      setTimeout(() => {
        fn();
        resolve();
      }, delay);
    });
  }
}

class ButtonInstallLoaderManager {
  constructor() {
    this.buttonInstallLoader = document.querySelectorAll(
      '.install-button__loader',
    );
    this.buttonInstallText = document.querySelectorAll('.install-button__text');
    this.fakeButtonLoaders = document.querySelectorAll(
      '.loader-percent__value',
    );
    this.fakeInterval = null;
  }

  show() {
    this.buttonInstallLoader.forEach((elem) => (elem.style.display = 'block'));
    this.buttonInstallText.forEach((elem) => (elem.style.display = 'none'));
    this.startFakeLoading();
  }

  hide() {
    this.buttonInstallLoader.forEach((elem) => (elem.style.display = 'none'));
    this.buttonInstallText.forEach((elem) => (elem.style.display = 'block'));
    this.stopFakeLoading();
  }

  startFakeLoading() {
    const progressNumbers = [
      4, 4, 2, 4, 1, 2, 0, 3, 3, 5, 1, 4, 2, 3, 3, 2, 3, 5, 7, 3, 5, 6, 3, 6, 4,
      4, 2, 5, 0, 4,
    ];
    let sum = 0;
    let index = 0;
    if (this.fakeButtonLoaders.length) {
      this.fakeInterval = setInterval(() => {
        sum += progressNumbers[index];
        this.fakeButtonLoaders.forEach((elem) => {
          elem.innerHTML = `${sum}%`;
        });

        if (sum >= 100 || index >= progressNumbers.length - 1) {
          clearInterval(this.fakeInterval);
        }
        index++;
      }, 1000);
    }
  }

  stopFakeLoading() {
    if (this.fakeInterval) {
      clearInterval(this.fakeInterval);
      this.fakeInterval = null;
    }
    this.fakeButtonLoaders.forEach((elem) => {
      elem.innerHTML = '';
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const installButtonType = document.body.getAttribute('data-button-type');
  const isAutoComments = document.body.getAttribute('data-auto-comments');
  const matchTheme = JSON.parse(document.body.getAttribute('data-match-theme'));
  const logoLoader = new LogoLoaderAnimator(20000);
  const buttonInstallLoaderManager = new ButtonInstallLoaderManager();

  new ExpandButton(
    'expand-button',
    'text',
    '.app-description__content .shadow',
  );

  if (matchTheme) {
    const themeManager = new ThemeManager();
    themeManager.applyTheme();
  }

  document.querySelectorAll('[helpers-decode]').forEach((value) => {
    value.innerText = helpers.decode(value.innerText);
  });

  if (isAutoComments === 'true') {
    const commentManager = new CommentManager();
    commentManager.applyAutoComments();
    commentManager.observeAutoComments();
  }

  if (installButtonType && installButtonType === 'logoLoader') {
    logoLoader.start();
  } else if (installButtonType) {
    buttonInstallLoaderManager.show();

    setTimeout(() => {
      buttonInstallLoaderManager.hide();
    }, 10000);
  }

  function hideLoaders() {
    if (installButtonType && installButtonType === 'logoLoader') {
      logoLoader.stop();
    } else if (installButtonType) {
      buttonInstallLoaderManager.hide();
    }
  }
  // ПВА готово до установки - точніше beforeinstallprompt існує
  window.addEventListener('pwaIsReadyToInstallEvent', () => {
    hideLoaders();
  });
  // підписуємось на подію pwaIsInstalledEvent - момент коли ПВА дійсно установлене
  window.addEventListener('pwaIsInstalledEvent', () => {
    hideLoaders();
  });
});
