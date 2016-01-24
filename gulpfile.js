

var entityconvert = require('gulp-entity-convert');
var wiredep = require('wiredep').stream;
var runSequence = require('run-sequence');

var gulp = require('gulp');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var include = require('gulp-include');
var globbing = require('gulp-css-globbing');





var PATH = {};
    PATH.src = {};
    PATH.dest = {},
    PATH.lib = {};

PATH.src.sass = './sass';
PATH.src.html = './public/views';
PATH.src.angular   = './angular';
PATH.src.js = './public/assets/js';

PATH.dest.js = './public/js';
PATH.dest.css = './public/css';
PATH.dest.html = './public/views';


gulp.task('html', function() {
  return gulp.src(PATH.src.html + '/**/*.html')
    .pipe(include())
      .on('error', console.log)
    .pipe(wiredep())
    .pipe(entityconvert())
    .pipe(gulp.dest(PATH.dest.html));
});

gulp.task('js', function() {
  return gulp.src(PATH.src.angular + '/app.js')
    .pipe(include())
      .on('error', console.log)
    .pipe(gulp.dest(PATH.dest.js));
})

gulp.task('sass', function(){
  return gulp.src(PATH.src.sass + '/app.scss')
    .pipe(globbing({
      extensions: ['.scss']
    }))
    .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
    .pipe(autoprefixer({
      browsers: ['last 2 versions'],
      cascade: false
    }))
    .pipe(gulp.dest(PATH.dest.css));
});

gulp.task('watch', function(){
  gulp.watch(PATH.src.sass + '/**/*.scss', ['sass']);
  gulp.watch(PATH.src.html + '/**/*.html', ['html']);
  gulp.watch('bower.json', ['html']);
  gulp.watch([PATH.src.angular + '/**/*.js', PATH.src.js + '/**/*.js'], ['js']);
});

gulp.task('build', function() {
  runSequence(['html', 'sass']);
});

gulp.task('default', ['build']);
