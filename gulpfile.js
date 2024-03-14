const { src, dest, watch, parallel, series } = require('gulp');

const scss = require('gulp-sass')(require('sass'));
const concat = require('gulp-concat'); // Объединяет много файлов в один и переименовывает файл
const uglify = require('gulp-uglify-es').default;
const browserSync = require('browser-sync').create();
const autoprefixer = require('gulp-autoprefixer');
const clean = require('gulp-clean');

const avif = require('gulp-avif');
const webp = require('gulp-webp');
const imagemin = require('gulp-imagemin');
const newer = require('gulp-newer');
const fonter = require('gulp-fonter');
const ttf2woff2 = require('gulp-ttf2woff2');
const svgSprite = require('gulp-svg-sprite');
const include = require('gulp-include');

function pages() {
  return src('app/pages/*.html')
  .pipe(include({
    includePaths: './app/components'
  }))
  .pipe(browserSync.stream())
  .pipe(dest('app'))
}

function fonts () {
  return src('app/fonts/src/*.*')
  .pipe(fonter({
    formats: ['woff', 'ttf']
  }))
  .pipe(src('app/fonts/*.ttf'))
  .pipe(ttf2woff2())
  .pipe(dest('app/fonts'))
}

function images() {
  return src(['app/images/src/*.*', '!./app/images/src/*.svg'])
    .pipe(newer('app/images'))
    .pipe(avif({ quality: 50 }))

    .pipe(src('app/images/src/*.*'))
    .pipe(newer('app/images'))
    .pipe(webp())

    .pipe(src('app/images/src/*.*'))
    .pipe(newer('app/images'))
    .pipe(imagemin())

    .pipe(dest('app/images'))
}

function sprite() {
  return src('app/images/*.svg')
    .pipe(svgSprite({
      mode: {
        stack: {
          sprite: '../sprite.svg',
          example: true
        }
      }
    }))
    .pipe(dest('app/images'))
}

function styles() {
  return src('app/scss/style.scss', { sourcemaps: true })
    .pipe(scss({ outputStyle: 'compressed' })) //expanded. Если плагин не раб. - удали эту строку и разкомментируй следующий коммент
    .pipe(autoprefixer({
      cascade: false,
      overrideBrowserslist: ['last 10 version']
    }))
    .pipe(concat('style.min.css')) // Здесь можно вставить style.min.css и будет файл минимизированный
    // .pipe(scss({ outputStyle: 'compressed' }))
    .pipe(dest('app/css'), { sourcemaps: true })
    .pipe(browserSync.stream())
}

function stylesDev() {
  return src('app/scss/style.scss', { sourcemaps: true })
    .pipe(scss({ outputStyle: 'expanded' }))
    .pipe(autoprefixer({
      cascade: false,
      overrideBrowserslist: ['last 10 version']
    }))
    .pipe(concat('style.css'))
    .pipe(dest('app/css'), { sourcemaps: true })
    .pipe(browserSync.stream())
}

function scripts() {
  return src([ 
    'app/js/main.js'
  ])
    .pipe(concat('main.min.js'))
    .pipe(uglify())
    .pipe(dest('app/js'))
    .pipe(browserSync.stream())
}


// *  This script is for understanding the general situation
function scriptsDev() {
  return src([
    'app/js/main.js',
    // * Данная комбинация выберает все файлы с расширением js, кроме файла main.min.js
    // 'app/js/*.js',
    // '!app/js/main.min.js'
  ])
    .pipe(concat('maindev.js'))
    .pipe(dest('app/js'))
    .pipe(browserSync.stream())
}


function watching() {
  browserSync.init({
    server: {
      baseDir: "app"
    }
  });
  watch(['app/scss/style.scss'], styles)
  watch(['app/scss/style.scss'], stylesDev)
  watch(['app/images/src'], images)
  watch(['app/js/main.js'], scripts)
  watch(['app/js/main.js'], scriptsDev)
  watch(['app/components/*', './app/pages/*'], pages)
  watch(['app/*.html']).on('change', browserSync.reload)
}

function cleanDist() {
  return src('dist')
    .pipe(clean())
}

// function building() {
//   return src([
//     './app/css/style.min.css',
//     './app/images/dist/*.{avif,webp,png,jpg}',
//     './app/images/dist/sprite.svg',
//     './app/fonts/*.*',
//     './app/js/main.min.js',
//     './app/*.html'
//   ], { base: './app' }) // Эта строка копирует структуру проэкта в папку dist
//     .pipe(dest('dist'))
// }

// * EXPERIMENT. If problem - delete this func building and init
// * the same name function upper in code.
function building() {
  return src([
    'app/css/style.min.css',
    'app/images/*.*',
    '!app/images/*.svg',
    'app/images/sprite.svg',
    'app/fonts/*.*',
    'app/js/main.min.js',
    'app/*.html'
  ], { base: 'app' }) // Эта строка копирует структуру проэкта
    .pipe(dest('dist')) // Здесь проект вставляется в папку dist
}


// GULP TASKS
// Делаем из функции задачу для Gulp (task)
// Здесь styles, sripts и прочие - это название задач для Gulp
exports.styles = styles;
exports.stylesDev = stylesDev;
exports.images = images; // ! Скорее всего нужно отдельно запускать
exports.fonts = fonts; // ! Скорее всего нужно отдельно запускать
exports.pages = pages;
exports.building = building;
exports.sprite = sprite; // ! Скорее всего нужно отдельно запускать
exports.scripts = scripts;
exports.scriptsDev = scriptsDev;
exports.watching = watching;

// exports.building = building;
exports.build = series(cleanDist, building);

exports.default = parallel(styles, stylesDev, images, scripts, scriptsDev, pages, watching);